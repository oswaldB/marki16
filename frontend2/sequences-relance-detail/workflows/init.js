const SCENARIO_FORMATS = ["single", "multiple", "both", "broker"];

export async function execute(ctx, params) {
  const id = params?.sequenceId || new URLSearchParams(window.location.search).get('id');
  if (!id) return { success: false, error: 'ID de séquence manquant' };

  try {
    const parse = Parse;
    const seq = await new parse.Query('Sequence').get(id);

    const nom = seq.get('nom') || '';
    const publiee = seq.get('publiee') || false;
    const validationObligatoire = seq.get('validation_obligatoire') || false;
    const attributionAutomatique = seq.get('attribution_automatique') || false;

    // Emails
    const rawEmails = seq.get('emails') || [];
    const emails = rawEmails.map((e, i) => {
      let scenarios;
      if (Array.isArray(e.scenarios)) {
        scenarios = SCENARIO_FORMATS.map(fmt => {
          const existing = e.scenarios.find(s => s.format === fmt) || {};
          return {
            format: fmt,
            active: existing.active !== false,
            smtp: existing.smtp ?? e.smtp ?? '',
            cc: existing.cc ?? e.cc ?? '',
            objet: existing.objet ?? '',
            corps: existing.corps ?? '',
          };
        });
      } else if (e.corps && typeof e.corps === 'object') {
        scenarios = SCENARIO_FORMATS.map(fmt => ({
          format: fmt,
          active: true,
          smtp: e.smtp || '',
          cc: e.cc || '',
          objet: e.objet || '',
          corps: e.corps[fmt] || '',
        }));
      } else {
        scenarios = SCENARIO_FORMATS.map(fmt => ({
          format: fmt,
          active: true,
          smtp: e.smtp || '',
          cc: e.cc || '',
          objet: e.objet || '',
          corps: fmt === 'single' ? (e.corps || '') : '',
        }));
      }
      return {
        _key: `email_${i}_${seq.id}`,
        email_index: i + 1,
        delai: e.delai || 0,
        smtp: e.smtp || '',
        to: e.to || '[[payeur_email]]',
        cc: e.cc || '',
        frequence: e.frequence || 'hebdomadaire',
        activeScenario: e.activeScenario || 'single',
        scenarios,
      };
    });

    // Groupes regles
    const anciennesRegles = seq.get('regles') || [];
    const nouveauxGroupes = seq.get('groupes_regles') || [];
    let groupesRegles;
    if (nouveauxGroupes.length > 0) {
      groupesRegles = nouveauxGroupes.map(g => ({
        logique: g.logique || 'ET',
        regles: g.regles.map(r => ({
          champ: r.champ || 'payeur_type',
          operateur: r.operateur || 'egal',
          valeur: ((r.operateur === 'egal' || r.operateur === 'different') && !Array.isArray(r.valeur)) ? (r.valeur ? [r.valeur] : []) : (Array.isArray(r.valeur) ? r.valeur : (r.valeur || '')),
          options: [],
        })),
      }));
    } else if (anciennesRegles.length > 0) {
      groupesRegles = [{
        logique: 'ET',
        regles: anciennesRegles.map(r => ({
          champ: r.champ || 'payeur_type',
          operateur: r.operateur || 'egal',
          valeur: (r.operateur === 'egal' || r.operateur === 'different') ? (r.valeur ? [r.valeur] : []) : (r.valeur || ''),
          options: [],
        })),
      }];
    } else {
      groupesRegles = [{
        logique: 'ET',
        regles: [{ champ: 'payeur_type', operateur: 'egal', valeur: [], options: [] }],
      }];
    }

    // SMTP profiles
    const sq = new parse.Query('SmtpProfile');
    sq.ascending('nom');
    sq.limit(50);
    const smtpProfiles = await sq.find();

    // Liens paiement
    const lq = new parse.Query('LienPaiement');
    lq.ascending('nom');
    const liens = await lq.find();
    const liensPaiement = liens.map(l => ({ id: l.id, nom: l.get('nom'), url: l.get('url') }));

    // Calcul apercu (simplifié)
    const apercuData = await calculerApercu(parse, groupesRegles);

    return {
      success: true,
      data: {
        sequence: seq,
        nom,
        publiee,
        validationObligatoire,
        attributionAutomatique,
        emails,
        groupesRegles,
        smtpProfiles,
        liensPaiement,
        apercuConcernes: apercuData.concernes,
        apercuExclus: apercuData.exclus,
        apercuSansEmail: apercuData.sansEmail,
        impayesConcernes: apercuData.impayes,
      },
    };
  } catch (err) {
    return { success: false, error: err.message || 'Erreur de chargement' };
  }
}

function buildImpayeQuery(parse, groupes) {
  const queriesParGroupe = [];
  for (const groupe of groupes) {
    const conditions = [];
    for (const regle of groupe.regles) {
      if (!regle.champ || regle.valeur === '' || !regle.valeur) continue;
      const q = new parse.Query('Impaye');
      switch (regle.operateur) {
        case 'egal':
          Array.isArray(regle.valeur) ? q.containedIn(regle.champ, regle.valeur) : q.equalTo(regle.champ, regle.valeur);
          break;
        case 'different':
          Array.isArray(regle.valeur) ? q.notContainedIn(regle.champ, regle.valeur) : q.notEqualTo(regle.champ, regle.valeur);
          break;
        case 'superieur':
          q.greaterThan(regle.champ, Number(regle.valeur));
          break;
        case 'inferieur':
          q.lessThan(regle.champ, Number(regle.valeur));
          break;
        case 'contient':
          q.contains(regle.champ, regle.valeur);
          break;
        case 'ne_contient_pas':
          q.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new parse.Query('Impaye').contains(regle.champ, regle.valeur));
          break;
        case 'commence_par':
          q.startsWith(regle.champ, regle.valeur);
          break;
        case 'ne_commence_pas_par':
          q.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new parse.Query('Impaye').startsWith(regle.champ, regle.valeur));
          break;
        case 'se_termine_par':
          q.endsWith(regle.champ, regle.valeur);
          break;
        case 'ne_se_termine_pas_par':
          q.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new parse.Query('Impaye').endsWith(regle.champ, regle.valeur));
          break;
      }
      conditions.push(q);
    }
    if (conditions.length > 0) {
      let gq = conditions[0];
      for (let i = 1; i < conditions.length; i++) {
        gq = parse.Query.and(gq, conditions[i]);
      }
      queriesParGroupe.push(gq);
    }
  }
  if (queriesParGroupe.length === 0) return null;
  let final = queriesParGroupe[0];
  for (let i = 1; i < queriesParGroupe.length; i++) {
    final = parse.Query.or(final, queriesParGroupe[i]);
  }
  return final;
}

async function calculerApercu(parse, groupesRegles) {
  try {
    const finalQuery = buildImpayeQuery(parse, groupesRegles);
    if (!finalQuery) {
      return { concernes: 0, exclus: 0, sansEmail: 0, impayes: [] };
    }
    finalQuery.equalTo('facture_soldee', false);
    finalQuery.doesNotExist('sequence');

    const totalEligible = await new parse.Query('Impaye').equalTo('facture_soldee', false).doesNotExist('sequence').count();
    const totalAvecRegles = await finalQuery.count();
    const impayesTrouves = await finalQuery.find();

    let hasEmailCount = 0;
    let sansEmailCount = 0;
    const impayes = [];

    for (const impaye of impayesTrouves) {
      let hasEmail = !!impaye.get('payeur_email');
      if (!hasEmail) {
        const ptr = impaye.get('email_relance');
        if (ptr) {
          try { const rc = await new parse.Query('Contact').get(ptr.id); if (rc.get('email')) hasEmail = true; } catch (_) {}
        }
      }
      if (!hasEmail) {
        const ptr = impaye.get('relanceContact');
        if (ptr) {
          try { const rc = await new parse.Query('Contact').get(ptr.id); if (rc.get('email')) hasEmail = true; } catch (_) {}
        }
      }
      if (hasEmail) {
        hasEmailCount++;
        impayes.push({
          id: impaye.id,
          nfacture: impaye.get('nfacture') || 'N/A',
          payeur_nom: impaye.get('payeur_nom') || 'Inconnu',
          reste_a_payer: impaye.get('reste_a_payer') || '0',
          date_echeance: impaye.get('date_echeance') || 'N/A',
          statut: impaye.get('statut') || 'inconnu',
        });
      } else {
        sansEmailCount++;
      }
    }

    return {
      concernes: hasEmailCount,
      exclus: totalEligible - totalAvecRegles,
      sansEmail: sansEmailCount,
      impayes: impayes.slice(0, 100),
    };
  } catch (err) {
    console.error('Erreur calcul apercu:', err);
    return { concernes: 0, exclus: 0, sansEmail: 0, impayes: [] };
  }
}
