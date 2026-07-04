<template>
    <div 
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
        :class="badgeClasses"
        :title="tooltipText"
    >
        <template v-if="isBlacklisted">
            <Icon name="heroicons:shield-exclamation" class="w-3.5 h-3.5" />
            <span>Relances suspendues</span>
        </template>
        <template v-else>
            <Icon name="heroicons:shield-check" class="w-3.5 h-3.5" />
            <span>Relances actives</span>
        </template>
    </div>
</template>

<script setup>
/**
 * BadgeBlacklist - Composant de badge pour afficher le statut de blacklist d'un impayé
 * 
 * Props:
 *   - impaye: Object (Parse Object ou plain object avec isBlacklisted, blacklistedAt, blacklistMotifType, blacklistMotif)
 * 
 * F-008: Blacklist des Impayés
 */

const props = defineProps({
    impaye: {
        type: Object,
        required: true
    }
})

// Détecte si l'impayé est blacklisté (supporte Parse Object ou plain object)
const isBlacklisted = computed(() => {
    if (!props.impaye) return false
    // Parse Object
    if (typeof props.impaye.get === 'function') {
        return props.impaye.get('isBlacklisted') === true
    }
    // Plain object
    return props.impaye.isBlacklisted === true
})

// Récupère les détails du motif
const motifDetails = computed(() => {
    if (!isBlacklisted.value || !props.impaye) return null

    // Parse Object
    if (typeof props.impaye.get === 'function') {
        return {
            type: props.impaye.get('blacklistMotifType'),
            detail: props.impaye.get('blacklistMotif'),
            date: props.impaye.get('blacklistedAt')
        }
    }

    // Plain object
    return {
        type: props.impaye.blacklistMotifType,
        detail: props.impaye.blacklistMotif,
        date: props.impaye.blacklistedAt
    }
})

// Classes CSS du badge
const badgeClasses = computed(() => {
    if (isBlacklisted.value) {
        return 'bg-red-100 text-red-700 border border-red-200'
    }
    return 'bg-green-100 text-green-700 border border-green-200'
})

// Texte du tooltip
const tooltipText = computed(() => {
    if (!isBlacklisted.value) {
        return 'Les relances automatiques sont activées pour cet impayé'
    }

    const details = motifDetails.value
    if (!details) return 'Impayé blacklisté'

    const lines = ['Relances automatiques suspendues']
    
    if (details.type) {
        lines.push(`Motif: ${getMotifLabel(details.type)}`)
    }
    
    if (details.detail) {
        lines.push(`Détail: ${details.detail}`)
    }
    
    if (details.date) {
        const dateStr = formatDate(details.date)
        lines.push(`Depuis: ${dateStr}`)
    }

    return lines.join('\n')
})

// Formatage de date
function formatDate(date) {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

// Libellé du motif
function getMotifLabel(type) {
    const labels = {
        'litige': 'Litige commercial',
        'reglement_en_cours': 'Règlement en cours',
        'erreur_facturation': 'Erreur de facturation',
        'procedure_judiciaire': 'Procédure judiciaire',
        'accord_special': 'Accord spécial',
        'autre': 'Autre'
    }
    return labels[type] || type
}
</script>
