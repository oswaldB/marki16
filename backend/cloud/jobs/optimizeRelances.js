// backend/cloud/jobs/optimizeRelances.js
// Job d'optimisation des relances pour éviter le spam
// Regroupe les relances multiples pour un même contact/email/sequence

module.exports = async function optimizeRelances() {
  if (typeof Parse === 'undefined') {
    throw new Error('Parse SDK not initialized. This job must run in a Parse Cloud environment.');
  }

  console.log('[optimizeRelances] Début optimisation (anti-spam)...');

  const startedAt = new Date();
  const stats = {
    contactsProcessed: 0,
    relancesConsolidated: 0,
    relancesOptimized: 0,
    errors: 0
  };

  try {
    // 1. Trouver toutes les relances pending non encore optimisées
    const qNotOptimized = new Parse.Query('Relance');
    qNotOptimized.equalTo('statut', 'pending');
    qNotOptimized.equalTo('optimisee', false);

    const qNoField = new Parse.Query('Relance');
    qNoField.equalTo('statut', 'pending');
    qNoField.doesNotExist('optimisee');

    const relanceQuery = Parse.Query.or(qNotOptimized, qNoField);
    relanceQuery.select(['to', 'email_index', 'sequence', 'impaye', 'contact_id', 'dateEnvoi']);
    relanceQuery.include('sequence');
    relanceQuery.limit(1000);

    const relances = await relanceQuery.find({ useMasterKey: true });

    const emailAddresses = [...new Set(relances.map(r => r.get('to')))].filter(Boolean);
    console.log(`[optimizeRelances] ${relances.length} relances pending trouvées pour ${emailAddresses.length} emails`);
    console.log(`[optimizeRelances] Adresses email uniques:`, emailAddresses);

    // Log détaillé par groupe (to + email_index + sequence)
    const debugByGroup = {};
    relances.forEach(r => {
      const seq = r.get('sequence');
      const key = `${r.get('to')}_${r.get('email_index') ?? 0}_${seq ? seq.id : 'no-seq'}`;
      if (!debugByGroup[key]) debugByGroup[key] = [];
      debugByGroup[key].push(r.id);
    });
    console.log(`[optimizeRelances] Répartition détaillée des relances:`);
    Object.entries(debugByGroup).forEach(([key, ids]) => {
      console.log(`[optimizeRelances]   ${key}: ${ids.length} relance(s) - IDs: ${ids.join(', ')}`);
    });

    // 2. Traiter chaque adresse email
    for (const emailAddress of emailAddresses) {
      stats.contactsProcessed++;
      try {
        const emailRelances = relances.filter(r => r.get('to') === emailAddress);
        if (emailRelances.length === 0) continue;

        // Groupement par : to + sequence_id + email_index
        const groupes = groupRelances(emailRelances);

        console.log(`[optimizeRelances] ${Object.keys(groupes).length} groupe(s) pour ${emailAddress}`);
        for (const [key, groupe] of Object.entries(groupes)) {
          console.log(`[optimizeRelances] Groupe ${key}: ${groupe.length} relance(s)`);
          if (groupe.length > 1) {
            console.log(`[optimizeRelances] → Consolidation de ${groupe.length} relances`);
            await createConsolidatedRelance(groupe);
            stats.relancesConsolidated++;
            stats.relancesOptimized += groupe.length;
          } else {
            console.log(`[optimizeRelances] → 1 seule relance, pas de consolidation`);
          }
        }
      } catch (error) {
        stats.errors++;
        console.error(`[optimizeRelances] Erreur email ${emailAddress}:`, error.message);
      }
    }

    console.log(`[optimizeRelances] Optimisation terminée:`, stats);

    try {
      const finishedAt = new Date();
      const log = new Parse.Object('OptimizeLog');
      log.set('startedAt', startedAt);
      log.set('finishedAt', finishedAt);
      log.set('durationMs', finishedAt - startedAt);
      log.set('trigger', 'cron');
      log.set('status', stats.errors === 0 ? 'success' : (stats.relancesOptimized > 0 ? 'partial' : 'error'));
      log.set('relances_consolidated', stats.relancesConsolidated);
      log.set('relances_optimized', stats.relancesOptimized);
      log.set('contacts_processed', stats.contactsProcessed);
      log.set('errors', stats.errors);
      await log.save(null, { useMasterKey: true });
    } catch (logErr) {
      console.error('[optimizeRelances] Impossible d\'écrire le OptimizeLog:', logErr.message);
    }

    return stats;

  } catch (error) {
    console.error('[optimizeRelances] Erreur critique:', error);
    try {
      const log = new Parse.Object('OptimizeLog');
      log.set('startedAt', startedAt);
      log.set('finishedAt', new Date());
      log.set('trigger', 'cron');
      log.set('status', 'error');
      log.set('error', error.message);
      await log.save(null, { useMasterKey: true });
    } catch (logErr) {
      console.error('[optimizeRelances] Impossible d\'écrire le OptimizeLog d\'erreur:', logErr.message);
    }
    throw error;
  }
};

// Groupement par : to + sequence_id + email_index
function groupRelances(relances) {
  const groupes = {};
  relances.forEach(r => {
    const seq = r.get('sequence');
    const sequenceId = seq ? seq.id : 'no-sequence';
    const emailIndex = r.get('email_index') ?? 0;
    const key = `${r.get('to') || ''}_${sequenceId}_${emailIndex}`;
    if (!groupes[key]) groupes[key] = [];
    groupes[key].push(r);
  });
  return groupes;
}

// Création d'une relance consolidée pour un groupe (même to + sequence + email_index)
async function createConsolidatedRelance(groupe) {
  const firstRelance = groupe[0];
  const sequenceObj = firstRelance.get('sequence');
  const emailIndex = firstRelance.get('email_index') ?? 0;

  // Charger la séquence complète
  const sequence = await new Parse.Query('Sequence').get(sequenceObj.id, { useMasterKey: true });
  const emails = sequence.get('emails') || [];
  const emailDef = emails[emailIndex] || emails[0] || {};

  // Chercher le scénario format=multiple (fallback sur single puis premier)
  const scenarios = emailDef.scenarios || [];
  const scenario =
    scenarios.find(s => s.format === 'multiple') ||
    scenarios.find(s => s.format === 'single') ||
    scenarios[0] ||
    {};

  console.log(`[optimizeRelances] Scénario utilisé pour email_index=${emailIndex}: format=${scenario.format}, smtp=${scenario.smtp}`);

  // Charger le profil SMTP du scénario
  let smtpProfil = null;
  if (scenario.smtp) {
    try {
      smtpProfil = await new Parse.Query('SmtpProfile').get(scenario.smtp, { useMasterKey: true });
    } catch (e) {
      console.warn(`[optimizeRelances] SmtpProfile ${scenario.smtp} introuvable:`, e.message);
    }
  }

  // Garder la dateEnvoi la plus proche parmi les relances du groupe
  const dateEnvoi = groupe
    .map(r => r.get('dateEnvoi'))
    .filter(Boolean)
    .sort((a, b) => a - b)[0] || firstRelance.get('dateEnvoi');

  // Construire la relance consolidée
  const consolidated = new Parse.Object('Relance');
  consolidated.set('contact_id',  firstRelance.get('contact_id'));
  consolidated.set('sequence',    sequenceObj);
  consolidated.set('email_index', emailIndex);
  consolidated.set('to',          firstRelance.get('to'));
  consolidated.set('cc',          scenario.cc || emailDef.cc || '');
  consolidated.set('objet',       scenario.objet || '');
  consolidated.set('corps',       scenario.corps || '');
  consolidated.set('statut',      'pending');
  consolidated.set('dateEnvoi',   dateEnvoi);
  consolidated.set('manuelle',    false);
  consolidated.set('optimisee',   true);
  if (smtpProfil) consolidated.set('smtpProfil', smtpProfil);

  // Tableau de pointers vers les impayés
  consolidated.set('impayes', groupe.map(r => {
    const impaye = r.get('impaye');
    if (!impaye) throw new Error(`Relance ${r.id} n'a pas de champ impaye`);
    return { __type: 'Pointer', className: 'Impaye', objectId: impaye.id };
  }));

  // Métadonnées de traçabilité
  consolidated.set('metadata', {
    source_relances: groupe.map(r => r.id),
  });

  await consolidated.save(null, { useMasterKey: true });

  // Marquer les originales comme remplacées
  await Parse.Object.saveAll(
    groupe.map(r => {
      r.set('statut',      'optimisee');
      r.set('optimisee',   true);
      r.set('replaced_by', consolidated.id);
      return r;
    }),
    { useMasterKey: true }
  );

  console.log(`[optimizeRelances] Relance consolidée ${consolidated.id} créée (${groupe.length} relances, email_index=${emailIndex}, smtp=${scenario.smtp})`);
}
