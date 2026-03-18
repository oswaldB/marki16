import { useDynamicOptions } from '~/composables/useDynamicOptions'
import { useRoute } from '#vue-router'

export function useSequenceRules(parse) {
  const toast = useToast()
  const route = useRoute()
  const { getOptions } = useDynamicOptions()

  // ── State ────────────────────────────────────────────────────
  const groupesRegles = ref([])
  const attributionAutomatique = ref(false)
  const validationObligatoire = ref(false)

  const apercuConcernes = ref(0)
  const apercuExclus = ref(0)
  const apercuSansEmail = ref(0)
  const impayesConcernes = ref([])
  const showImpayesTable = ref(false)

  const optionsPourChamps = ref({
    payeur_type: [],
    statut: [],
    statut_dossier: [],
    ville: [],
    code_postal: []
  })

  // ── Options dynamiques ────────────────────────────────────────
  async function loadOptionsForChamp(champ, regle) {
    try {
      const numericFields = ['reste_a_payer']
      if (numericFields.includes(champ)) {
        regle.options = []
        return
      }
      const options = await getOptions(champ, false)
      regle.options = options
    } catch (error) {
      console.error(`Failed to load options for ${champ}:`, error)
      regle.options = []
    }
  }

  async function loadAllOptions() {
    for (const groupe of groupesRegles.value) {
      for (const regle of groupe.regles) {
        await loadOptionsForChamp(regle.champ, regle)
      }
    }
  }

  async function chargerOptionsPourChamp(regle) {
    await loadOptionsForChamp(regle.champ, regle)
  }

  // ── Construction de requête Parse (comme le backend) ────────────────────────
  function buildImpayeQueryFromBackendRegles(regles) {
    const queries = []
    
    for (const regle of regles) {
      if (!regle.champ || regle.valeur === '' || !regle.valeur) continue
      
      const q = new parse.Query('Impaye')
      
      switch (regle.operateur) {
        case 'egal':
          Array.isArray(regle.valeur)
            ? q.containedIn(regle.champ, regle.valeur)
            : q.equalTo(regle.champ, regle.valeur)
          break
        case 'different':
          Array.isArray(regle.valeur)
            ? q.notContainedIn(regle.champ, regle.valeur)
            : q.notEqualTo(regle.champ, regle.valeur)
          break
        case 'superieur':
          q.greaterThan(regle.champ, Number(regle.valeur))
          break
        case 'inferieur':
          q.lessThan(regle.champ, Number(regle.valeur))
          break
        case 'contient':
          q.contains(regle.champ, regle.valeur)
          break
        default:
          continue
      }
      
      queries.push(q)
    }
    
    if (queries.length === 0) return null
    
    // Combiner avec AND (comme le backend)
    let finalQuery = queries[0]
    for (let i = 1; i < queries.length; i++) {
      finalQuery = parse.Query.and(finalQuery, queries[i])
    }
    return finalQuery
  }
  
  //─── Construction de requête Parse (ancienne version pour compatibilité) ────────────
  function buildImpayeQuery(groupes) {
    const queriesParGroupe = []

    for (const groupe of groupes) {
      const conditions = []

      for (const regle of groupe.regles) {
        if (!regle.champ || regle.valeur === '' || !regle.valeur) continue

        const q = new parse.Query('Impaye')

        switch (regle.operateur) {
          case 'egal':
            Array.isArray(regle.valeur)
              ? q.containedIn(regle.champ, regle.valeur)
              : q.equalTo(regle.champ, regle.valeur)
            break
          case 'different':
            Array.isArray(regle.valeur)
              ? q.notContainedIn(regle.champ, regle.valeur)
              : q.notEqualTo(regle.champ, regle.valeur)
            break
          case 'superieur':
            q.greaterThan(regle.champ, Number(regle.valeur))
            break
          case 'inferieur':
            q.lessThan(regle.champ, Number(regle.valeur))
            break
          case 'contient':
            q.contains(regle.champ, regle.valeur)
            break
          case 'ne_contient_pas':
            q.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new parse.Query('Impaye').contains(regle.champ, regle.valeur))
            break
          case 'commence_par':
            q.startsWith(regle.champ, regle.valeur)
            break
          case 'ne_commence_pas_par':
            q.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new parse.Query('Impaye').startsWith(regle.champ, regle.valeur))
            break
          case 'se_termine_par':
            q.endsWith(regle.champ, regle.valeur)
            break
          case 'ne_se_termine_pas_par':
            q.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new parse.Query('Impaye').endsWith(regle.champ, regle.valeur))
            break
        }

        conditions.push(q)
      }

      if (conditions.length > 0) {
        let groupeFinalQuery = conditions[0]
        for (let i = 1; i < conditions.length; i++) {
          groupeFinalQuery = parse.Query.and(groupeFinalQuery, conditions[i])
        }
        queriesParGroupe.push(groupeFinalQuery)
      }
    }

    if (queriesParGroupe.length === 0) return null

    let finalQuery = queriesParGroupe[0]
    for (let i = 1; i < queriesParGroupe.length; i++) {
      finalQuery = parse.Query.or(finalQuery, queriesParGroupe[i])
    }
    return finalQuery
  }

  // ── Aperçu ────────────────────────────────────────────────────
  async function calculerApercu() {
    try {
      // Utiliser groupes_regles (comme le backend maintenant)
      const finalQuery = buildImpayeQuery(groupesRegles.value)
      
      console.log('Groupes de règles utilisés:', JSON.stringify(groupesRegles.value, null, 2))
      
      if (!finalQuery) {
        apercuConcernes.value = 0
        apercuExclus.value = 0
        impayesConcernes.value = []
        return
      }
      
      // Étape 2: Appliquer les filtres comme le backend
      finalQuery.equalTo('facture_soldee', false)
      finalQuery.doesNotExist('sequence')
      
      // Debug: compter le total éligible
      const totalEligible = await new parse.Query('Impaye')
        .equalTo('facture_soldee', false)
        .doesNotExist('sequence')
        .count()
      console.log('Total éligible (non soldés sans séquence):', totalEligible)
      
      // Étape 3: Compter les résultats de la requête finale
      const totalAvecRegles = await finalQuery.count()
      console.log('Avec règles appliquées:', totalAvecRegles)
      
      // Étape 4: Charger les impayés et vérifier les emails (exactement comme le backend)
      const impayesTrouves = await finalQuery.find()
      console.log(`Impayés trouvés pour vérification email: ${impayesTrouves.length}`)
      
      let hasEmailCount = 0
      let sansEmailCount = 0
      const idsSansEmail = []
      
      for (const impaye of impayesTrouves) {
        // Logique exacte du backend
        let hasEmail = !!impaye.get('payeur_email')
        
        if (!hasEmail) {
          const emailRelancePtr = impaye.get('email_relance')
          if (emailRelancePtr) {
            try {
              const rc = await new parse.Query('Contact').get(emailRelancePtr.id)
              if (rc.get('email')) {
                hasEmail = true
              }
            } catch (_) {}
          }
        }
        
        if (!hasEmail) {
          const relanceContactPtr = impaye.get('relanceContact')
          if (relanceContactPtr) {
            try {
              const rc = await new parse.Query('Contact').get(relanceContactPtr.id)
              if (rc.get('email')) {
                hasEmail = true
              }
            } catch (_) {}
          }
        }
        
        if (hasEmail) {
          hasEmailCount++
        } else {
          sansEmailCount++
          idsSansEmail.push(impaye.id)
        }
      }
      
      console.log(`Vérification emails: ${hasEmailCount} avec email, ${sansEmailCount} sans email`)
      console.log(`IDs sans email: ${idsSansEmail.join(', ')}`)
      
      // Résultats finaux (comme le backend)
      apercuConcernes.value = hasEmailCount
      apercuExclus.value = totalEligible - totalAvecRegles
      apercuSansEmail.value = sansEmailCount
      
      console.log(`Résultats finaux: ${hasEmailCount} avec email, ${sansEmailCount} sans email`)

      if (showImpayesTable.value && hasEmailCount > 0) {
        await _chargerImpayesConcernes(finalQuery)
      }
    } catch (err) {
      console.error('Erreur calcul aperçu:', err)
      toast.add({ title: 'Erreur', description: "Impossible de calculer l'aperçu", color: 'red' })
    }
  }

  async function _chargerImpayesConcernes(query) {
    try {
      query.limit(100)
      query.include(['payeur', 'dossier'])
      query.ascending('nfacture')
      query.equalTo('facture_soldee', false)
      query.doesNotExist('sequence')
      const results = await query.find()
      impayesConcernes.value = results.map(impaye => ({
        id: impaye.id,
        nfacture: impaye.get('nfacture') || 'N/A',
        payeur_nom: impaye.get('payeur_nom') || 'Inconnu',
        reste_a_payer: impaye.get('reste_a_payer') || '0',
        date_echeance: impaye.get('date_echeance') || 'N/A',
        statut: impaye.get('statut') || 'inconnu',
        dejaDansSequence: false
      }))
    } catch (err) {
      console.error('Erreur chargement impayés concernés:', err)
      toast.add({ title: 'Erreur', description: 'Impossible de charger les impayés concernés', color: 'red' })
    }
  }

  // ── Watcher unique sur showImpayesTable ───────────────────────
  watch(showImpayesTable, async (newVal) => {
    if (!newVal || apercuConcernes.value === 0) return
    const finalQuery = buildImpayeQuery(groupesRegles.value)
    if (finalQuery) await _chargerImpayesConcernes(finalQuery)
  })

  // ── Debounce sur les règles ───────────────────────────────────
  let debounceTimer = null
  watch(groupesRegles, () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(calculerApercu, 600)
  }, { deep: true })

  onUnmounted(() => clearTimeout(debounceTimer))

  // ── Manipulation des groupes ──────────────────────────────────
  async function ajouterGroupeRegles() {
    const newRegle = { champ: 'payeur_type', operateur: 'egal', valeur: [], options: [] }
    await loadOptionsForChamp('payeur_type', newRegle)
    groupesRegles.value.push({ logique: 'ET', regles: [newRegle] })
  }

  function supprimerGroupe(groupeIdx) {
    if (groupesRegles.value.length > 1) {
      groupesRegles.value.splice(groupeIdx, 1)
    } else {
      toast.add({ title: 'Avertissement', description: 'Une séquence doit avoir au moins un groupe de règles', color: 'amber' })
    }
  }

  async function ajouterRegleAuGroupe(groupeIdx) {
    const newRegle = { champ: 'payeur_type', operateur: 'egal', valeur: [], options: [] }
    await loadOptionsForChamp('payeur_type', newRegle)
    groupesRegles.value[groupeIdx].regles.push(newRegle)
  }

  function supprimerRegle(groupeIdx, regleIdx) {
    const groupe = groupesRegles.value[groupeIdx]
    if (groupe.regles.length > 1) {
      groupe.regles.splice(regleIdx, 1)
    } else {
      toast.add({ title: 'Avertissement', description: 'Un groupe doit avoir au moins une règle', color: 'amber' })
    }
  }

  return {
    groupesRegles,
    attributionAutomatique,
    validationObligatoire,
    apercuConcernes,
    apercuExclus,
    apercuSansEmail,
    impayesConcernes,
    showImpayesTable,
    calculerApercu,
    buildImpayeQuery,
    loadAllOptions,
    chargerOptionsPourChamp,
    ajouterGroupeRegles,
    supprimerGroupe,
    ajouterRegleAuGroupe,
    supprimerRegle,
  }
}
