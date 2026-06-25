<template>
  <div class="w-full">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <!-- Infos facture -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-100 rounded-lg">
            <UIcon name="i-heroicons-document-text" class="size-5 text-blue-600" />
          </div>
          <div>
            <h3 class="font-medium text-gray-900">Facture n°{{ impaye.nfacture || impaye.ref_piece || impaye.id }}</h3>
            <p class="text-sm text-gray-500">
              {{ formatDate(impaye.date_piece) }}
              <span v-if="impaye.date_echeance" class="text-red-500">
                - Échéance : {{ formatDate(impaye.date_echeance) }}
              </span>
            </p>
          </div>
        </div>

        <!-- Adresses / Dossiers -->
        <div v-if="hasAdresses" class="mt-3">
          <!-- Sous-tableau si plusieurs adresses -->
          <div v-if="adressesList.length > 1" class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100 text-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">Dossier</th>
                  <th class="px-3 py-2 text-left font-medium">Adresse</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="(adr, idx) in adressesList" :key="idx" class="hover:bg-gray-100">
                  <td class="px-3 py-2 text-gray-900 font-medium">{{ adr.dossier || 'N/A' }}</td>
                  <td class="px-3 py-2 text-gray-600">{{ adr.adresse }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Affichage simple si une seule adresse -->
          <p v-else class="text-sm text-gray-600">
            {{ adressesList[0]?.adresse }}
          </p>
        </div>

      </div>

      <!-- Montants -->
      <div class="flex flex-col items-end gap-2 md:min-w-[200px]">
        <div class="text-right">
          <p class="text-sm text-gray-500">Montant TTC</p>
          <p class="text-xl font-bold text-gray-900">{{ formatCurrency(impaye.montant_total || impaye.reste_a_payer || 0) }}</p>
        </div>
        <div v-if="impaye.reste_a_payer" class="text-right">
          <p class="text-sm text-gray-500">Reste à payer</p>
          <p class="text-lg font-semibold text-red-600">{{ formatCurrency(impaye.reste_a_payer) }}</p>
        </div>
      </div>
    </div>

    <!-- Actions (PDF + Paiement) -->
    <div v-if="showPdfLink || showPaymentLink" class="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
      <!-- Lien PDF -->
      <a
        v-if="showPdfLink && impaye.id"
        :href="`/redirect-pdf/${impaye.id}`"
        target="_blank"
        class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <UIcon name="i-heroicons-arrow-down-tray" class="size-4" />
        Télécharger facture
      </a>

      <!-- Lien de paiement -->
      <a
        v-if="showPaymentLink && getPaymentLink(impaye)"
        :href="getPaymentLink(impaye)"
        target="_blank"
        class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
      >
        <UIcon name="i-heroicons-credit-card" class="size-4" />
        Payer en ligne
      </a>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  impaye: {
    type: Object,
    required: true
  },
  showPdfLink: {
    type: Boolean,
    default: true
  },
  showPaymentLink: {
    type: Boolean,
    default: true
  }
})

// Computed pour gérer la liste des adresses
const adressesList = computed(() => {
  const list = []

  // Si on a un tableau de dossiers
  if (props.impaye.dossiers && Array.isArray(props.impaye.dossiers)) {
    props.impaye.dossiers.forEach(d => {
      const adresse = formatAdresse(d.adresse_bien || d.adresse, d.code_postal, d.ville)
      if (adresse) {
        list.push({
          dossier: d.numero_dossier || d.code || d.id || 'N/A',
          adresse: adresse
        })
      }
    })
  }
  // Si on a un tableau d'adresses direct
  else if (props.impaye.adresses && Array.isArray(props.impaye.adresses)) {
    props.impaye.adresses.forEach(a => {
      const adresse = formatAdresse(a.adresse_bien || a.adresse, a.code_postal, a.ville)
      if (adresse) {
        list.push({
          dossier: a.numero_dossier || a.dossier || a.code || 'N/A',
          adresse: adresse
        })
      }
    })
  }
  // Fallback sur l'adresse unique
  else if (props.impaye.adresse_bien) {
    const adresse = formatAdresse(props.impaye.adresse_bien, props.impaye.code_postal, props.impaye.ville)
    if (adresse) {
      list.push({
        dossier: props.impaye.numero_dossier || 'N/A',
        adresse: adresse
      })
    }
  }

  return list
})

const hasAdresses = computed(() => adressesList.value.length > 0)

// Formatter une adresse complète
function formatAdresse(adresse, cp, ville) {
  if (!adresse) return ''
  let result = adresse
  if (cp) result += `, ${cp}`
  if (ville) result += ` ${ville}`
  return result.trim()
}

// Formater une date au format DD/MM/YYYY
function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

// Formater un montant en euros
function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '0 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Tronquer un texte
function truncate(text, length) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Récupérer le lien de paiement
function getPaymentLink(impaye) {
  // Priorité 1: lien_paiement direct sur l'impayé
  if (impaye.lien_paiement) {
    return impaye.lien_paiement
  }

  // Priorité 2: liens_paiement (array)
  if (impaye.liens_paiement && impaye.liens_paiement.length > 0) {
    return impaye.liens_paiement[0].url
  }

  // Priorité 3: lien de paiement par défaut (SystemPay)
  if (impaye.reste_a_payer && impaye.nfacture) {
    return `https://paiement.systempay.fr/vads-site/EXIM?vads_amount=${Math.round((impaye.reste_a_payer || 0) * 100)}&vads_order_id=${impaye.nfacture || impaye.id}&vads_cust_id=${impaye.numero_dossier || ''}`
  }

  return null
}
</script>
