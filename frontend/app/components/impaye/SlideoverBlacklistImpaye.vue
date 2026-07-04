<template>
    <UModal
        :model-value="isOpen"
        @update:model-value="$emit('close')"
        :title="title"
        class="max-w-lg"
    >
        <div class="p-4 space-y-6">
            <!-- Info impayé -->
            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                <div class="text-sm text-gray-500">Facture</div>
                <div class="font-medium text-gray-900">{{ impaye?.get?.('nfacture') || impaye?.nfacture || '—' }}</div>
                
                <div class="text-sm text-gray-500 mt-2">Montant restant</div>
                <div class="font-medium text-gray-900">
                    {{ formatMontant(impaye?.get?.('reste_a_payer') || impaye?.reste_a_payer) }}
                </div>
                
                <div class="text-sm text-gray-500 mt-2">Client</div>
                <div class="font-medium text-gray-900">{{ payeurNom }}</div>
            </div>

            <!-- Mode blacklist -->
            <template v-if="mode === 'blacklist'">
                <!-- Motif Type -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">
                        Motif de suspension
                        <span class="text-red-500">*</span>
                    </label>
                    
                    <USelect
                        v-model="form.motifType"
                        :options="motifOptions"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Choisir un motif..."
                        class="w-full"
                    />
                    
                    <p v-if="selectedMotif?.description" class="text-xs text-gray-500">
                        {{ selectedMotif.description }}
                    </p>
                </div>

                <!-- Détail -->
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Détail (optionnel)</label>
                    
                    <UTextarea
                        v-model="form.motifDetail"
                        rows="3"
                        placeholder="Précisez si nécessaire..."
                        class="w-full"
                    />
                </div>
            </template>

            <!-- Mode unblacklist -->
            <template v-else>
                <UAlert
                    color="amber"
                    icon="heroicons:exclamation-triangle"
                    title="Confirmation"
                    description="Les relances automatiques vont être réactivées pour cet impayé."
                />
            </template>

            <!-- Actions -->
            <div class="flex gap-3 pt-4 border-t">
                <UButton
                    color="gray"
                    variant="ghost"
                    @click="$emit('close')"
                    :disabled="store.saving"
                >
                    Annuler
                </UButton>
                
                <UButton
                    :color="mode === 'blacklist' ? 'red' : 'green'"
                    :loading="store.saving"
                    :disabled="!canSubmit"
                    @click="handleSubmit"
                    class="flex-1"
                >
                    <template v-if="store.saving">
                        <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin mr-2" />
                        {{ loadingText }}
                    </template>
                    
                    <template v-else>
                        {{ submitText }}
                    </template>
                </UButton>
            </div>

            <!-- Message d'erreur -->
            <UAlert
                v-if="error"
                color="red"
                icon="heroicons:exclamation-circle"
                :title="error"
                class="mt-4"
            />
        </div>
    </UModal>
</template>

<script setup>
/**
 * SlideoverBlacklistImpaye - Slideover pour blacklister/déblacklister un impayé
 * 
 * Props:
 *   - impaye: Object - L'impayé à blacklister (Parse Object ou plain object)
 *   - isOpen: Boolean - État d'ouverture
 *   - mode: 'blacklist' | 'unblacklist' - Mode d'affichage
 * 
 * Emits:
 *   - close: Fermeture du slideover
 *   - success: Action réussie (avec { impaye, mode })
 * 
 * F-008: Blacklist des Impayés
 */

import { useBlacklistImpayeStore, BLACKLIST_MOTIF_TYPES } from '~/stores/blacklistImpayeStore'

const props = defineProps({
    impaye: {
        type: Object,
        default: null
    },
    isOpen: {
        type: Boolean,
        default: false
    },
    mode: {
        type: String,
        default: 'blacklist', // 'blacklist' | 'unblacklist'
        validator: (value) => ['blacklist', 'unblacklist'].includes(value)
    }
})

const emit = defineEmits(['close', 'success'])

const store = useBlacklistImpayeStore()

// État local
const error = ref(null)
const form = reactive({
    motifType: '',
    motifDetail: ''
})

// Options de motifs
const motifOptions = BLACKLIST_MOTIF_TYPES

// Titre du slideover
const title = computed(() => {
    return props.mode === 'blacklist' 
        ? 'Suspendre les relances' 
        : 'Réactiver les relances'
})

// Texte du bouton submit
const submitText = computed(() => {
    return props.mode === 'blacklist' ? 'Confirmer la suspension' : 'Réactiver les relances'
})

// Texte de chargement
const loadingText = computed(() => {
    return props.mode === 'blacklist' 
        ? 'Suspension en cours...' 
        : 'Réactivation en cours...'
})

// Motif sélectionné
const selectedMotif = computed(() => {
    return motifOptions.find(m => m.value === form.motifType)
})

// Nom du payeur
const payeurNom = computed(() => {
    if (!props.impaye) return '—'
    
    // Parse Object
    if (typeof props.impaye.get === 'function') {
        return props.impaye.get('payeur_nom') || props.impaye.get('payeur')?.get('nom') || '—'
    }
    
    // Plain object
    return props.impaye.payeur_nom || '—'
})

// Peut-on soumettre ?
const canSubmit = computed(() => {
    if (props.mode === 'unblacklist') return true
    // En mode blacklist, le motifType est obligatoire (ou motifDetail)
    return !!(form.motifType || form.motifDetail?.trim())
})

// Formatage montant
function formatMontant(value) {
    if (value == null) return '—'
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(value)
}

// Réinitialisation du formulaire à l'ouverture
watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        error.value = null
        form.motifType = ''
        form.motifDetail = ''
    }
})

// Soumission
async function handleSubmit() {
    error.value = null

    if (!props.impaye) {
        error.value = 'Aucun impayé sélectionné'
        return
    }

    const impayeId = typeof props.impaye.get === 'function' 
        ? props.impaye.id 
        : props.impaye.objectId || props.impaye.id

    // Récupérer le contactId
    let contactId = null
    if (typeof props.impaye.get === 'function') {
        const contact = props.impaye.get('contact_relance') || props.impaye.get('payeur')
        contactId = contact?.id
    } else {
        contactId = props.impaye.contactId || props.impaye.contact_relance?.id
    }

    try {
        if (props.mode === 'blacklist') {
            await store.blacklistImpaye(
                impayeId,
                form.motifType,
                form.motifDetail,
                contactId
            )
        } else {
            await store.unblacklistImpaye(impayeId, contactId)
        }

        emit('success', { impaye: props.impaye, mode: props.mode })
        emit('close')
    } catch (err) {
        error.value = err.message || 'Une erreur est survenue'
    }
}
</script>
