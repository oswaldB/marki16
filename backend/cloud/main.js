// backend/cloud/main.js

const syncImpayes = require('./jobs/syncImpayes');
const envoyerRelancesJob = require('./jobs/envoyerRelances');

// ─── Gestion des liens de paiement ────────────────────────────────────────────

// Créer un nouveau lien de paiement
Parse.Cloud.define('createLienPaiement', async (request) => {
  await isCallerAdmin(request);
  const { nom, url } = request.params;
  if (!nom || !url) throw new Error('Nom et URL requis');

  const LienPaiement = Parse.Object.extend('LienPaiement');
  const lien = new LienPaiement();
  lien.set('nom', nom);
  lien.set('url', url);
  await lien.save(null, { useMasterKey: true });

  return { id: lien.id };
});

// Lister tous les liens de paiement
Parse.Cloud.define('listLiensPaiement', async (request) => {
  await isCallerAdmin(request);

  const LienPaiement = Parse.Object.extend('LienPaiement');
  const query = new Parse.Query(LienPaiement);
  const liens = await query.find({ useMasterKey: true });

  return liens.map(lien => ({
    id: lien.id,
    nom: lien.get('nom'),
    url: lien.get('url'),
  }));
});

// Supprimer un lien de paiement
Parse.Cloud.define('deleteLienPaiement', async (request) => {
  await isCallerAdmin(request);
  const { lienId } = request.params;
  if (!lienId) throw new Error('lienId requis');

  const LienPaiement = Parse.Object.extend('LienPaiement');
  const query = new Parse.Query(LienPaiement);
  const lien = await query.get(lienId, { useMasterKey: true });
  await lien.destroy({ useMasterKey: true });

  return { ok: true };
});

// ─── Gestion des utilisateurs ─────────────────────────────────────────────────

/**
 * Vérifie que l'utilisateur de la requête est membre du rôle Parse "admin".
 * Lève une erreur si non authentifié ou non admin.
 */
async function isCallerAdmin(request) {
  if (!request.user) throw new Error('Authentification requise');
  const adminRole = await new Parse.Query(Parse.Role)
    .equalTo('name', 'admin')
    .first({ useMasterKey: true });
  if (!adminRole) throw new Error('Rôle admin introuvable');
  const match = await adminRole.getUsers().query()
    .equalTo('objectId', request.user.id)
    .first({ useMasterKey: true });
  if (!match) throw new Error('Accès réservé aux administrateurs');
}

// Retourne true/false selon si l'appelant est admin (utilisé par le middleware frontend)
Parse.Cloud.define('checkAdminRole', async (request) => {
  if (!request.user) return false;
  try {
    await isCallerAdmin(request);
    return true;
  } catch {
    return false;
  }
});

// Liste tous les utilisateurs Parse avec leur statut admin
Parse.Cloud.define('listUsers', async (request) => {
  await isCallerAdmin(request);

  const users = await new Parse.Query(Parse.User)
    .limit(500)
    .ascending('email')
    .find({ useMasterKey: true });

  // Récupérer les membres du rôle admin
  const adminRole = await new Parse.Query(Parse.Role)
    .equalTo('name', 'admin')
    .first({ useMasterKey: true });
  const adminIds = new Set();
  if (adminRole) {
    const adminUsers = await adminRole.getUsers().query().find({ useMasterKey: true });
    adminUsers.forEach(u => adminIds.add(u.id));
  }

  return users.map(u => ({
    id:        u.id,
    email:     u.get('email') || u.get('username') || '—',
    username:  u.get('username') || '',
    createdAt: u.createdAt,
    isAdmin:   adminIds.has(u.id),
  }));
});

// Crée un utilisateur (email + mot de passe) avec option makeAdmin
Parse.Cloud.define('createUser', async (request) => {
  await isCallerAdmin(request);
  const { email, password, makeAdmin } = request.params;
  if (!email || !password) throw new Error('Email et mot de passe requis');

  const user = new Parse.User();
  user.set('username', email);
  user.set('email', email);
  user.set('password', password);
  await user.signUp(null, { useMasterKey: true });

  if (makeAdmin) {
    let adminRole = await new Parse.Query(Parse.Role)
      .equalTo('name', 'admin')
      .first({ useMasterKey: true });
    if (!adminRole) {
      const acl = new Parse.ACL();
      acl.setPublicReadAccess(false);
      adminRole = new Parse.Role('admin', acl);
    }
    adminRole.getUsers().add(user);
    await adminRole.save(null, { useMasterKey: true });
  }

  return { id: user.id };
});

// Supprime un utilisateur (impossible de se supprimer soi-même)
Parse.Cloud.define('deleteUser', async (request) => {
  await isCallerAdmin(request);
  const { userId } = request.params;
  if (!userId) throw new Error('userId requis');
  if (userId === request.user.id) throw new Error('Impossible de supprimer son propre compte');

  const user = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
  await user.destroy({ useMasterKey: true });
  return { ok: true };
});

// Change le mot de passe d'un utilisateur (masterKey — pas besoin de l'ancien)
Parse.Cloud.define('updateUserPassword', async (request) => {
  await isCallerAdmin(request);
  const { userId, newPassword } = request.params;
  if (!userId || !newPassword) throw new Error('userId et newPassword requis');

  const user = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
  user.setPassword(newPassword);
  await user.save(null, { useMasterKey: true });
  return { ok: true };
});

// Ajoute ou retire un utilisateur du rôle admin
Parse.Cloud.define('setAdminRole', async (request) => {
  await isCallerAdmin(request);
  const { userId, makeAdmin } = request.params;
  if (!userId || makeAdmin === undefined) throw new Error('userId et makeAdmin requis');
  if (userId === request.user.id && !makeAdmin) {
    throw new Error('Impossible de se rétrograder soi-même');
  }

  let adminRole = await new Parse.Query(Parse.Role)
    .equalTo('name', 'admin')
    .first({ useMasterKey: true });
  if (!adminRole) {
    if (!makeAdmin) return { ok: true }; // Rôle inexistant, rien à faire
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    adminRole = new Parse.Role('admin', acl);
  }

  const user = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true });
  if (makeAdmin) {
    adminRole.getUsers().add(user);
  } else {
    adminRole.getUsers().remove(user);
  }
  await adminRole.save(null, { useMasterKey: true });
  return { ok: true };
});

// NOTE : Premier déploiement — créer le rôle "admin" manuellement :
// Dans le Parse Dashboard → Access Control → Roles → "admin" → ajouter le premier utilisateur.
// Ou via script : new Parse.Role('admin', acl).save(null, { useMasterKey: true })

// ─────────────────────────────────────────────────────────────────────────────

// ─── syncNow — déclenchement manuel depuis le frontend ────────────────────────

let isSyncing = false;

Parse.Cloud.define('syncNow', async (request) => {
  if (!request.user) throw new Error('Authentification requise');
  if (isSyncing) throw new Error('Une synchronisation est déjà en cours');

  isSyncing = true;
  try {
    const stats = await syncImpayes({ trigger: 'manual' });
    return stats;
  } finally {
    isSyncing = false;
  }
});

// ─── verifyPaidInvoicesNow — vérification manuelle des paiements ────────────

let isVerifying = false;

Parse.Cloud.define('verifyPaidInvoicesNow', async (request) => {
  if (!request.user) throw new Error('Authentification requise');
  if (isVerifying) throw new Error('Une vérification est déjà en cours');

  isVerifying = true;
  try {
    const verifyPaidInvoices = require('./jobs/verifyPaidInvoices');
    const stats = await verifyPaidInvoices({ trigger: 'manual' });
    return stats;
  } finally {
    isVerifying = false;
  }
});

// ─── construireDestinataires ──────────────────────────────────────────────────
// Remplace [[payeur_email]] et [[apporteur_email]] en concaténant l'email
// de la personne morale et celui du contact personne physique si présent.
// Si un email_relance est défini sur l'impayé, son email prime sur relanceContact et payeur_email.

async function construireDestinataires(template, impaye) {
  if (!template) return '';
  const joindre = (...emails) => emails.filter(Boolean).join(', ');

  // Résoudre l'email de relances : email_relance en priorité, puis relanceContact, puis payeur_email
  let payeurEmail;
  
  // 1. D'abord vérifier email_relance (nouveau champ pointer)
  const emailRelance = impaye.get('email_relance');
  if (emailRelance) {
    let email = emailRelance.get('email');
    if (!email && emailRelance.id) {
      try {
        const fetched = await new Parse.Query('Contact').get(emailRelance.id, { useMasterKey: true });
        email = fetched.get('email');
      } catch (_) {}
    }
    if (email) payeurEmail = email;
  }
  
  // 2. Sinon vérifier relanceContact (ancien champ pour compatibilité)
  if (!payeurEmail) {
    const relanceContact = impaye.get('relanceContact');
    if (relanceContact) {
      let email = relanceContact.get('email');
      if (!email && relanceContact.id) {
        try {
          const fetched = await new Parse.Query('Contact').get(relanceContact.id, { useMasterKey: true });
          email = fetched.get('email');
        } catch (_) {}
      }
      if (email) payeurEmail = email;
    }
  }
  
  // 3. Enfin, utiliser payeur_email par défaut
  if (!payeurEmail) {
    payeurEmail = joindre(impaye.get('payeur_email'), impaye.get('payeur_contact_email'));
  }

  return template
    .replace(/\[\[payeur_email\]\]/g, () => payeurEmail)
    .replace(/\[\[apporteur_email\]\]/g, () =>
      joindre(impaye.get('apporteur_email'), impaye.get('apporteur_contact_email'))
    );
}

// ─── getEmailScenario ─────────────────────────────────────────────────────────

function getEmailScenario(email, format = 'single') {
  const scenarios = email.scenarios || [];
  return scenarios.find(s => s.format === format) || scenarios[0] || {};
}

// ─── substituerVariables ──────────────────────────────────────────────────────

function substituerVariables(template, impaye) {
  if (!template) return '';
  const d = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '';
  const vars = {
    nfacture:             impaye.get('nfacture')             || '',
    ref_piece:            impaye.get('ref_piece')            || '',
    date_piece:           d(impaye.get('date_piece')),
    reste_a_payer:        impaye.get('reste_a_payer')        ?? '',
    montant_total:        impaye.get('total_ttc')            ?? '',
    date_echeance:        d(impaye.get('date_echeance')),
    payeur_nom:           impaye.get('payeur_nom')           || '',
    payeur_email:         impaye.get('payeur_email')         || '',
    payeur_telephone:     impaye.get('payeur_telephone')     || '',
    payeur_type:          impaye.get('payeur_type')          || '',
    adresse_bien:         impaye.get('adresse_bien')         || '',
    code_postal:          impaye.get('code_postal')          || '',
    ville:                impaye.get('ville')                || '',
    numero_lot:           impaye.get('numero_lot')           || '',
    numero_dossier:       impaye.get('numero_dossier')       || '',
    employe_intervention: impaye.get('employe_intervention') || '',
    date_debut_mission:   d(impaye.get('date_debut_mission')),
  };
  return template.replace(/\[\[(\w+)\]\]/g, (_, key) => String(vars[key] ?? ''));
}

// ─── assignerSequence ─────────────────────────────────────────────────────────

Parse.Cloud.define('assignerSequence', async (request) => {
  const { impayelId, sequenceId } = request.params;
  if (!impayelId) throw new Error('impayelId requis');

  const impaye = await new Parse.Query('Impaye').get(impayelId, { useMasterKey: true });

  // Annuler les relances pending non manuelles
  const qOld = new Parse.Query('Relance');
  qOld.equalTo('impaye', impaye);
  qOld.equalTo('statut', 'pending');
  qOld.equalTo('manuelle', false);
  const oldRelances = await qOld.find({ useMasterKey: true });
  for (const r of oldRelances) r.set('statut', 'annulé');
  if (oldRelances.length) await Parse.Object.saveAll(oldRelances, { useMasterKey: true });

  // Retirer la séquence si sequenceId est null
  if (!sequenceId) {
    impaye.unset('sequence');
    await impaye.save(null, { useMasterKey: true });
    return { created: 0 };
  }

  // Vérifier qu'un email de relances est disponible (payeur_email, email_relance ou relanceContact.email)
  let hasEmail = !!impaye.get('payeur_email');
  if (!hasEmail) {
    const emailRelancePtr = impaye.get('email_relance');
    if (emailRelancePtr) {
      try {
        const rc = await new Parse.Query('Contact').get(emailRelancePtr.id, { useMasterKey: true });
        if (rc.get('email')) {
          hasEmail = true;
          impaye.set('email_relance', rc); // version résolue pour construireDestinataires
        }
      } catch (_) {}
    }
  }
  if (!hasEmail) {
    const relanceContactPtr = impaye.get('relanceContact');
    if (relanceContactPtr) {
      try {
        const rc = await new Parse.Query('Contact').get(relanceContactPtr.id, { useMasterKey: true });
        if (rc.get('email')) {
          hasEmail = true;
          impaye.set('relanceContact', rc); // version résolue pour construireDestinataires
        }
      } catch (_) {}
    }
  }
  if (!hasEmail) {
    throw new Error('Ce contact n\'a pas d\'adresse email. Veuillez l\'ajouter ou attribuer un email de relances par défaut avant d\'assigner une séquence.');
  }

  const sequence = await new Parse.Query('Sequence').get(sequenceId, { useMasterKey: true });
  const emailsSeq = sequence.get('emails') || [];
  const baseDate = new Date();

  // Pré-charger les profils SMTP uniques (stockés dans scenario.smtp)
  const smtpIds = [...new Set(
    emailsSeq.map(e => getEmailScenario(e, 'single').smtp).filter(Boolean)
  )];
  const smtpMap = {};
  for (const id of smtpIds) {
    try {
      smtpMap[id] = await new Parse.Query('SmtpProfile').get(id, { useMasterKey: true });
    } catch (_) {}
  }

  const relances = await Promise.all(emailsSeq.map(async (email, idx) => {
    const dateEnvoi = new Date(baseDate);
    dateEnvoi.setDate(dateEnvoi.getDate() + (email.delai || 0));
    const scenario = getEmailScenario(email, 'single');
    const r = new Parse.Object('Relance');
    r.set('impaye',      impaye);
    r.set('sequence',    sequence);
    r.set('email_index', idx);
    r.set('statut',      'pending');
    r.set('dateEnvoi',   dateEnvoi);
    r.set('to',          await construireDestinataires(email.to || '', impaye));
    r.set('cc',          substituerVariables(scenario.cc || email.cc || '', impaye));
    r.set('objet',       substituerVariables(scenario.objet || '', impaye));
    r.set('corps',       substituerVariables(scenario.corps || '', impaye));
    if (smtpMap[scenario.smtp]) r.set('smtpProfil', smtpMap[scenario.smtp]);
    r.set('manuelle',    false);
    // Ajouter le champ valide - par défaut true, mais false si la séquence nécessite une validation
    r.set('valide',      !sequence.get('validation_obligatoire'));
    return r;
  }));
  if (relances.length) await Parse.Object.saveAll(relances, { useMasterKey: true });

  impaye.set('sequence', sequence);
  await impaye.save(null, { useMasterKey: true });

  return { created: relances.length };
});

// ─── Hook : annuler les relances si séquence supprimée ───────────────────────

Parse.Cloud.beforeDelete('Sequence', async (request) => {
  const q = new Parse.Query('Relance');
  q.equalTo('sequence', request.object);
  q.equalTo('statut', 'pending');
  const relances = await q.find({ useMasterKey: true });
  for (const r of relances) r.set('statut', 'annulé');
  if (relances.length) await Parse.Object.saveAll(relances, { useMasterKey: true });
});

/// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOIS_FR = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

/**
 * Construit l'URL FTP du PDF selon le format :
 * /ADN/Reporting/Gco/Piece/{year}/{month_fr}/{ref_clean}/standard/{ref_piece} (GCO PI FA).pdf
 *
 * - month_fr  : mois en français minuscules sans accents
 * - ref_clean : ref_piece avec espaces remplacés par _
 * - Le nom de fichier conserve les espaces d'origine
 */
function buildUrlPdf(refPiece, datePiece) {
  if (!refPiece || !datePiece) return null;
  const d = new Date(datePiece);
  if (isNaN(d.getTime())) return null;
  const year  = d.getFullYear();
  const month = MOIS_FR[d.getMonth()];
  const refClean = String(refPiece).replace(/\s+/g, '_');
  return `/ADN/Reporting/Gco/Piece/${year}/${month}/${refClean}/standard/${refPiece} (GCO PI FA).pdf`;
}

// ─────────────────────────────────────────────────────────────────────────────

// Cloud Function pour déclenchement via cron node
Parse.Cloud.define('envoyerRelances', async (request) => {
  if (!request.master) throw new Error('Master key requise');
  return await envoyerRelancesJob();
});

// Cloud Function pour optimisation des relances (anti-spam)
Parse.Cloud.define('optimizeRelances', async (request) => {
  if (!request.master) throw new Error('Master key requise');
  const optimizeRelances = require('./jobs/optimizeRelances');
  return await optimizeRelances();
});

// Cloud Function pour valider une relance
Parse.Cloud.define('validerRelance', async (request) => {
  if (!request.user) throw new Error('Authentification requise');
  const { relanceId } = request.params;
  if (!relanceId) throw new Error('relanceId requis');

  const relance = await new Parse.Query('Relance').get(relanceId, { useMasterKey: true });
  relance.set('valide', true);
  await relance.save(null, { useMasterKey: true });
  return { success: true };
});

// ─── attribuerRelanceContact ──────────────────────────────────────────────────
// Attribue un contact de relances par défaut à un impayé.
// Params : impayelId + (contactId OU { nom, email })
// Met à jour toutes les relances pending de l'impayé avec le nouvel email.
// Sauvegarde le contact dans le champ email_relance (pointer vers Contact).

Parse.Cloud.define('attribuerRelanceContact', async (request) => {
  if (!request.user) throw new Error('Authentification requise');
  const { impayelId, contactId, nom, email } = request.params;
  if (!impayelId) throw new Error('impayelId requis');
  if (!contactId && (!nom || !email)) throw new Error('contactId ou { nom, email } requis');

  const impaye = await new Parse.Query('Impaye').get(impayelId, { useMasterKey: true });

  let contact;
  if (contactId) {
    contact = await new Parse.Query('Contact').get(contactId, { useMasterKey: true });
  } else {
    contact = new Parse.Object('Contact');
    contact.set('nom', nom);
    contact.set('email', email);
    contact.set('source', 'relance');
    await contact.save(null, { useMasterKey: true });
  }

  impaye.set('email_relance', contact);
  await impaye.save(null, { useMasterKey: true });

  // Mettre à jour le champ `to` de toutes les relances pending
  const qRelances = new Parse.Query('Relance');
  qRelances.equalTo('impaye', impaye);
  qRelances.equalTo('statut', 'pending');
  const pendingRelances = await qRelances.find({ useMasterKey: true });

  // Reconstruire le champ `to` via construireDestinataires (qui utilise désormais email_relance)
  const nouveauTo = await construireDestinataires('[[payeur_email]]', impaye);
  for (const relance of pendingRelances) {
    relance.set('to', nouveauTo);
  }
  if (pendingRelances.length) await Parse.Object.saveAll(pendingRelances, { useMasterKey: true });

  return {
    id: contact.id,
    nom: contact.get('nom'),
    email: contact.get('email'),
    relancesMisesAJour: pendingRelances.length,
  };
});

// Cloud Job pour mettre à jour les options dynamiques (planifié toutes les heures à HH:03)
const updateDynamicOptions = require('./jobs/updateDynamicOptions');
Parse.Cloud.job('updateDynamicOptions', async (request) => {
  return await updateDynamicOptions();
});

// Planifier le job pour s'exécuter toutes les heures à la 3ème minute (HH:03)
// Parse.Cloud.startJob('updateDynamicOptions', { schedule: '0 3 * * * *' });

// Cloud Function pour déclenchement manuel des options dynamiques
Parse.Cloud.define('updateDynamicOptions', async (request) => {
  // Autoriser soit un utilisateur authentifié, soit la Master Key
  if (!request.user && !request.master) {
    throw new Error('Authentification requise');
  }
  return await updateDynamicOptions();
});

Parse.Cloud.define('hello', () => {
  return 'Hello from Parse Cloud Code!';
});

Parse.Cloud.define('ping', async () => {
  return { ok: true, ts: new Date() };
});

Parse.Cloud.beforeSave('TestObject', (request) => {
  console.log('Before save triggered');
});

// ─── appliquerReglesAttributionAutomatique ──────────────────────────────────
// Applique les règles d'attribution automatique aux impayés importés
async function appliquerReglesAttributionAutomatique(impaye) {
  const Sequence = Parse.Object.extend('Sequence');
  const qSeq = new Parse.Query(Sequence);
  qSeq.equalTo('attribution_automatique', true); // Seulement les séquences avec attribution automatique activée
  qSeq.equalTo('regles_type', 'incluant'); // Pour l'instant, seulement les règles incluant
  
  const sequences = await qSeq.find({ useMasterKey: true });
  
  for (const sequence of sequences) {
    const regles = sequence.get('regles') || [];
    if (regles.length === 0) continue;
    
    let correspond = true;
    for (const regle of regles) {
      if (!regle.champ || regle.valeur === '') continue;
      
      const valeurImpaye = impaye.get(regle.champ);
      if (valeurImpaye === undefined) {
        correspond = false;
        break;
      }
      
      switch (regle.operateur) {
        case 'egal':
          if (String(valeurImpaye) !== String(regle.valeur)) {
            correspond = false;
          }
          break;
        case 'superieur':
          if (typeof valeurImpaye !== 'number' || valeurImpaye <= Number(regle.valeur)) {
            correspond = false;
          }
          break;
        case 'inferieur':
          if (typeof valeurImpaye !== 'number' || valeurImpaye >= Number(regle.valeur)) {
            correspond = false;
          }
          break;
        case 'contient':
          if (typeof valeurImpaye !== 'string' || !valeurImpaye.includes(regle.valeur)) {
            correspond = false;
          }
          break;
        default:
          correspond = false;
      }
      
      if (!correspond) break;
    }
    
    if (correspond) {
      // Vérifier qu'un email de relances est disponible
      let hasEmail = !!impaye.get('payeur_email');
      if (!hasEmail) {
        const emailRelancePtr = impaye.get('email_relance');
        if (emailRelancePtr) {
          try {
            const rc = await new Parse.Query('Contact').get(emailRelancePtr.id, { useMasterKey: true });
            if (rc.get('email')) {
              hasEmail = true;
              impaye.set('email_relance', rc);
            }
          } catch (_) {}
        }
      }
      if (!hasEmail) {
        const relanceContactPtr = impaye.get('relanceContact');
        if (relanceContactPtr) {
          try {
            const rc = await new Parse.Query('Contact').get(relanceContactPtr.id, { useMasterKey: true });
            if (rc.get('email')) {
              hasEmail = true;
              impaye.set('relanceContact', rc);
            }
          } catch (_) {}
        }
      }
      if (!hasEmail) continue; // Pas d'email, pas de séquence pour cet impayé

      // Assigner cette séquence à l'impayé
      impaye.set('sequence', sequence);
      await impaye.save(null, { useMasterKey: true });

      // Créer les relances associées
      const emailsSeq = sequence.get('emails') || [];
      const baseDate = new Date();

      // Pré-charger les profils SMTP uniques
      const smtpIds = [...new Set(
        emailsSeq.map(e => getEmailScenario(e, 'single').smtp).filter(Boolean)
      )];
      const smtpMap = {};
      for (const id of smtpIds) {
        try { smtpMap[id] = await new Parse.Query('SmtpProfile').get(id, { useMasterKey: true }); } catch (_) {}
      }

      const relances = await Promise.all(emailsSeq.map(async (email, idx) => {
        const dateEnvoi = new Date(baseDate);
        dateEnvoi.setDate(dateEnvoi.getDate() + (email.delai || 0));
        const scenario = getEmailScenario(email, 'single');
        const r = new Parse.Object('Relance');
        r.set('impaye',      impaye);
        r.set('sequence',    sequence);
        r.set('email_index', idx);
        r.set('statut',      'pending');
        r.set('dateEnvoi',   dateEnvoi);
        r.set('to',          await construireDestinataires(email.to || '', impaye));
        r.set('cc',          substituerVariables(scenario.cc || email.cc || '', impaye));
        r.set('objet',       substituerVariables(scenario.objet || '', impaye));
        r.set('corps',       substituerVariables(scenario.corps || '', impaye));
        if (smtpMap[scenario.smtp]) r.set('smtpProfil', smtpMap[scenario.smtp]);
        r.set('manuelle',    false);
        return r;
      }));
      
      if (relances.length) {
        await Parse.Object.saveAll(relances, { useMasterKey: true });
      }
      
      return true; // Séquence assignée, on s'arrête
    }
  }
  
  return false; // Aucune séquence assignée
}

// ─── importImpayes ────────────────────────────────────────────────────────────
// Params : { impayes: Array<ImportedImpaye> }
// Retourne un résumé { imported, contactsCreated, contactsUpdated, noSequence, noEmail, errors }
Parse.Cloud.define('importImpayes', async (request) => {
  const { impayes } = request.params;
  if (!Array.isArray(impayes) || impayes.length === 0) {
    throw new Error('Aucune donnée à importer');
  }

  const Contact = Parse.Object.extend('Contact');
  const Impaye = Parse.Object.extend('Impaye');

  const stats = {
    imported: 0,
    contactsCreated: 0,
    contactsUpdated: 0,
    noSequence: 0,
    noEmail: 0,
    errors: [],
    sequencesAssignees: 0, // Nouveau champ pour suivre les séquences assignées automatiquement
  };

  for (const data of impayes) {
    try {
      // ── Contact payeur ──────────────────────────────────────────────────────
      let contact = null;
      if (data.payeur_nom) {
        const q = new Parse.Query(Contact);
        q.equalTo('nom', data.payeur_nom);
        q.equalTo('source', 'upload');
        contact = await q.first({ useMasterKey: true });

        if (!contact) {
          contact = new Contact();
          contact.set('source', 'upload');
          stats.contactsCreated++;
        } else {
          stats.contactsUpdated++;
        }

        contact.set('nom', data.payeur_nom);
        if (data.payeur_email)     contact.set('email', data.payeur_email);
        if (data.payeur_telephone) contact.set('telephone', data.payeur_telephone);
        if (data.payeur_type)      contact.set('type', data.payeur_type);
        await contact.save(null, { useMasterKey: true });

        if (!data.payeur_email) stats.noEmail++;
      }

      // ── Impayé ──────────────────────────────────────────────────────────────
      const impaye = new Impaye();
      impaye.set('nfacture',          data.nfacture || null);
      impaye.set('ndossier',          data.ndossier || null);
      impaye.set('ref_piece',         data.ref_piece || null);
      impaye.set('adresse_bien',      data.adresse || null);
      impaye.set('numero_lot',        data.lot || null);
      impaye.set('etage',             data.etage || null);
      impaye.set('porte',             data.porte || null);
      impaye.set('total_ht',          typeof data.montant_ht === 'number' ? data.montant_ht : null);
      impaye.set('total_ttc',         typeof data.montant_ttc === 'number' ? data.montant_ttc : null);
      impaye.set('reste_a_payer',     typeof data.reste_a_payer === 'number' ? data.reste_a_payer : (data.montant_ttc || null));
      impaye.set('date_piece',        data.date_piece ? new Date(data.date_piece) : null);
      impaye.set('date_debut_mission',data.date_intervention ? new Date(data.date_intervention) : null);
      impaye.set('statut',            'impaye');
      impaye.set('employe_intervention', data.employe || null);
      impaye.set('commentaire_piece', data.commentaire || null);
      impaye.set('source',            'upload');
      impaye.set('pdf_filename',      data.pdf_filename || null);
      impaye.set('pdf_local_path',    data.pdf_path || null);
      // URL FTP construite selon le format du README
      impaye.set('url_pdf', buildUrlPdf(data.ref_piece, data.date_piece));
      if (contact) impaye.set('payeur', contact);

      await impaye.save(null, { useMasterKey: true });
      stats.imported++;

      // Appliquer les règles d'attribution automatique
      const sequenceAssignee = await appliquerReglesAttributionAutomatique(impaye);
      if (sequenceAssignee) {
        stats.sequencesAssignees++;
      } else {
        stats.noSequence++;
      }
    } catch (err) {
      stats.errors.push({ file: data.pdf_filename, error: err.message });
    }
  }

  return stats;
});
