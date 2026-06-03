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

        <!-- Description -->
        <div v-if="impaye.commentaire_piece || impaye.adresse_bien" class="mt-2 text-sm text-gray-600">
          <p v-if="impaye.adresse_bien">
            {{ impaye.adresse_bien }}, {{ impaye.code_postal }} {{ impaye.ville }}
          </p>
          <p v-if="impaye.commentaire_piece" class="mt-1">{{ truncate(impaye.commentaire_piece, 100) }}</p>
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
