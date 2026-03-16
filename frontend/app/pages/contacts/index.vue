<template>
  <div class="p-6 space-y-4">

    <!-- ── Header ── -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <h1 class="text-2xl font-semibold text-gray-900">Contacts</h1>
      <UButton
        :loading="syncing"
        :disabled="syncing"
        color="neutral"
        variant="outline"
        icon="i-heroicons-arrow-path"
        @click="lancerSync"
      >
        {{ syncing ? 'Sync...' : 'Synchroniser' }}
      </UButton>
    </div>

    <!-- ── Onglets ── -->
    <UTabs
      v-model="ongletActif"
      :items="onglets"
      class="mb-6"
      :ui="{
        base: 'relative w-full',
        container: 'relative w-full',
        list: {
          base: 'relative flex w-full items-center justify-start gap-1 overflow-x-auto scrollbar-hide',
          background: 'bg-gray-50 dark:bg-gray-900/50 rounded-lg p-1',
          shadow: 'shadow-sm',
          padding: 'px-1 py-1',
          rounded: 'rounded-lg',
          divider: 'hidden'
        },
        item: {
          base: 'relative flex-1 flex min-w-0 items-center gap-2 whitespace-nowrap py-2 px-3 text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          active: 'text-primary-600 dark:text-primary-400',
          inactive: 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
        },
        marker: {
          base: 'absolute inset-0 z-[-1] rounded-md transition-all duration-200 ease-in-out',
          background: 'bg-white dark:bg-gray-900 shadow-sm'
        }
      }"
      size="md"
      variant="pill"
      color="primary"
    >
      <template #default="{ item }">
        <div class="flex items-center gap-2 truncate">
          <UIcon v-if="item.value === 'tous'" name="i-heroicons-users" class="flex-shrink-0 size-4" />
          <UIcon v-else-if="item.value === 'sans-email'" name="i-heroicons-envelope-open" class="flex-shrink-0 size-4" />
          <UIcon v-else-if="item.value === 'par-entite'" name="i-heroicons-building-office-2" class="flex-shrink-0 size-4" />
          <UIcon v-else-if="item.value === 'par-groupe-particuliers'" name="i-heroicons-users" class="flex-shrink-0 size-4" />
          <span class="truncate">{{ item.label }}</span>
          <UBadge v-if="item._badge" color="neutral" variant="subtle" size="xs">{{ item._badge }}</UBadge>
        </div>
      </template>
    </UTabs>

    <!-- Résultat sync -->
    <UAlert
      v-if="syncResult"
      :color="syncResult.errors?.length ? 'orange' : 'green'"
      :title="syncResult.errors?.length ? 'Sync terminée avec erreurs' : 'Sync réussie'"
      :description="syncResultMessage"
    />

    <!-- Slideover pour la sélection d'email -->
    <EmailSelectionSlideover
      v-model="showEmailSlideover"
      :contact-id="selectedContactId"
      @emailSelected="handleEmailSelected"
    />

    <!-- ── Vue tous / sans-email ── -->
    <div v-if="ongletActif === 'tous' || ongletActif === 'sans-email'">
      <div class="flex items-center gap-3 flex-wrap mb-4">
        <UInput
          v-model="globalFilter"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher par nom, email..."
          class="w-64"
        />
        <USelect v-model="filtreSource" :items="sourceOptions" class="w-40" @change="() => filtreSource" />
      </div>

      <UCard :ui="{ body: { padding: 'p-0' } }">
        <UTable
          :data="rows"
          :columns="colonnes"
          :loading="loading"
          v-model:sorting="sorting"
          :global-filter="globalFilter"
          :empty="{ label: ongletActif === 'sans-email' ? 'Aucun contact sans email' : 'Aucun contact trouvé' }"
          sticky="header"
        >
          <template #email-cell="{ row }">
            <span v-if="row.original.email" class="text-gray-700">{{ row.original.email }}</span>
            <UBadge v-else color="red" variant="subtle">Manquant</UBadge>
          </template>

          <template #source-cell="{ row }">
            <UBadge :color="row.original.source === 'db_externe' ? 'blue' : 'violet'" variant="subtle">
              {{ row.original.source === 'db_externe' ? 'BD externe' : 'Upload' }}
            </UBadge>
          </template>

          <template #nb_impayes-cell="{ row }">
            <span :class="row.original.nb_impayes > 0 ? 'font-semibold text-gray-900' : 'text-gray-400'">
              {{ row.original.nb_impayes }}
            </span>
          </template>

          <template #email-relance-cell="{ row }">
            <span v-if="row.original.email_relance" class="text-gray-700">
              {{ getEmailFromPointer(row.original.email_relance) }}
            </span>
            <span v-else class="text-gray-400 italic">—</span>
          </template>

          <template #actions-cell="{ row }">
            <UButton
              color="primary"
              icon="i-heroicons-envelope"
              size="xs"
              variant="ghost"
              @click="() => ouvrirSlideoverEmailPourContact(row.original.id)"
              title="Définir un email de relance"
            >
              Définir un email de relance
            </UButton>
          </template>
        </UTable>
      </UCard>
    </div>

    <!-- ── Vue par entité ── -->
    <div v-if="ongletActif === 'par-entite'">
      <div class="flex items-center gap-3 flex-wrap mb-4">
        <UInput
          v-model="globalFilter"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher par nom..."
          class="w-64"
        />
      </div>

      <UCard :ui="{ body: { padding: 'p-0' } }">
        <ContactsEntitesTable
          :entites="entitesFiltrees"
          :colonnes="colonnesEntites"
          :loading="loadingEntites"
          @relance-email="ouvrirSlideoverEmailPourContact"
        />
      </UCard>
    </div>

    <!-- ── Vue par groupe de particuliers ── -->
    <div v-if="ongletActif === 'par-groupe-particuliers'">
      <div class="flex items-center gap-3 flex-wrap mb-4">
        <UInput
          v-model="globalFilter"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher par nom..."
          class="w-64"
        />
      </div>

      <UCard :ui="{ body: { padding: 'p-0' } }">
        <UTable
          :data="particuliersFiltres"
          :columns="colonnesParticuliers"
          :loading="loadingParticuliers"
          :global-filter="globalFilter"
          :get-sub-rows="(row) => row.subRows"
          :expanded="expandedParticuliers"
          :empty="{ label: 'Aucun groupe de particuliers trouvé' }"
          sticky="header"
          @update:expanded="expandedParticuliers = $event"
        >
          <template #nom-cell="{ row }">
            <div class="flex items-center gap-2" :style="{ paddingLeft: `${row.depth * 1.5}rem` }">
              <UButton
                v-if="row.getCanExpand()"
                :icon="row.getIsExpanded() ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                color="neutral" variant="ghost" size="xs"
                @click.stop="row.toggleExpanded()"
              />
              <UIcon
                v-if="row.original.isParticulier"
                name="i-heroicons-user-group"
                class="size-4 text-green-600 flex-shrink-0"
              />
              <UIcon v-else name="i-heroicons-user-circle" class="size-4 text-gray-400 flex-shrink-0" />
              <span :class="row.original.isParticulier ? 'font-semibold text-gray-900' : 'text-gray-700'">
                {{ row.original.nom }}
              </span>
              <UBadge v-if="row.original.isParticulier" color="neutral" variant="subtle">
                {{ row.original.subRows.length }} membre(s)
              </UBadge>
            </div>
          </template>

          <template #email-cell="{ row }">
            <span v-if="row.original.email" class="text-gray-700">{{ row.original.email }}</span>
            <span v-else class="text-gray-400 italic">—</span>
          </template>

          <template #email-relance-cell="{ row }">
            <span v-if="row.original.email_relance" class="text-gray-700">
              {{ getEmailFromPointer(row.original.email_relance) }}
            </span>
            <span v-else class="text-gray-400 italic">—</span>
          </template>

          <template #actions-cell="{ row }">
            <UButton
              color="primary"
              icon="i-heroicons-envelope"
              size="xs"
              variant="ghost"
              @click="() => ouvrirSlideoverEmailPourContact(row.original.id)"
              title="Définir un email de relance"
            >
              Définir un email de relance
            </UButton>
          </template>
        </UTable>
      </UCard>
    </div>

  </div>
</template>

<script setup>
import { h, resolveComponent } from 'vue'
import { useContactsStoreComposable, useContactsEntitesComposable, useContactsParticuliersComposable, useContactsSyncComposable } from '~/composables/useContactsStore'
import EmailSelectionSlideover from '~/components/EmailSelectionSlideover.vue'

const { $parse } = useNuxtApp()

const ongletActif = ref('tous')
const globalFilter = ref('')
const sorting = ref([])

// Helper sort — appelé ici dans <script setup> pour garantir le bon contexte
const UButton = resolveComponent('UButton')
function sortHeader(label) {
  return ({ column }) => {
    const isSorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label,
      icon: isSorted === 'asc'
        ? 'i-lucide-arrow-up-narrow-wide'
        : isSorted === 'desc'
          ? 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
      class: '-mx-2.5',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    })
  }
}

async function refresh() {
  await Promise.all([charger(), chargerSansEmailCount()])
}

// Helper function to get email from pointer or string
function getEmailFromPointer(emailRelance) {
  if (!emailRelance) return null
  
  // If it's a Parse Object/Pointer, get the email from it
  if (emailRelance.id && typeof emailRelance.get === 'function') {
    return emailRelance.get('email')
  }
  
  // If it's already a string (backward compatibility)
  if (typeof emailRelance === 'string') {
    return emailRelance
  }
  
  // If it's an object with email property
  if (emailRelance.email) {
    return emailRelance.email
  }
  
  return null
}

const {
  loading, total, sansEmailCount,
  filtreSource, filtreSansEmail,
  rows, sourceOptions,
  charger, chargerSansEmailCount, resetEtCharger,
} = useContactsStoreComposable()

// Colonnes avec sort défini ici (contexte setup garanti)
const colonnes = [
  { accessorKey: 'nom',        header: sortHeader('Nom') },
  { accessorKey: 'email',      header: 'Email' },
  { accessorKey: 'telephone',  header: 'Téléphone' },
  { accessorKey: 'source',     header: 'Source' },
  { accessorKey: 'nb_impayes', header: sortHeader('Impayés') },
  { 
    id: 'email_relance', 
    header: 'Email de relance',
    cell: ({ row }) => row.original.email_relance ? 'email-relance-cell' : '',
    enableSorting: false,
  },
  { 
    id: 'actions', 
    header: 'Actions',
    cell: ({ row }) => 'actions-cell',
    enableSorting: false,
  },
]

const {
  entitesFiltrees, colonnesEntites: colonnesEntitesBase,
  expandedEntites, loadingEntites,
  chargerEntitesGroupes,
} = useContactsEntitesComposable()

// Ajouter les colonnes email_relance et actions aux colonnes des entités
const colonnesEntites = computed(() => [
  ...colonnesEntitesBase.value,
  { 
    id: 'email_relance', 
    header: 'Email de relance',
    cell: ({ row }) => row.original.email_relance ? 'email-relance-cell' : '',
    enableSorting: false,
  },
  { 
    id: 'actions', 
    header: 'Actions',
    cell: ({ row }) => 'actions-cell',
    enableSorting: false,
  },
])

const {
  particuliersFiltres, colonnesParticuliers: colonnesParticuliersBase,
  expandedParticuliers, loadingParticuliers,
  chargerParticuliersGroupes,
} = useContactsParticuliersComposable()

// Ajouter les colonnes email_relance et actions aux colonnes des particuliers
const colonnesParticuliers = computed(() => [
  ...colonnesParticuliersBase.value,
  { 
    id: 'email_relance', 
    header: 'Email de relance',
    cell: ({ row }) => row.original.email_relance ? 'email-relance-cell' : '',
    enableSorting: false,
  },
  { 
    id: 'actions', 
    header: 'Actions',
    cell: ({ row }) => 'actions-cell',
    enableSorting: false,
  },
])

const {
  syncing, syncResult, syncResultMessage, lancerSync,
} = useContactsSyncComposable($parse, refresh)

// État pour le slideover d'email
const showEmailSlideover = ref(false)
const selectedContactId = ref(null)

const onglets = computed(() => [
  { label: 'Tous les contacts', value: 'tous',       _badge: ongletActif.value === 'tous' && total.value > 0 ? total.value : undefined },
  { label: 'Sans email',        value: 'sans-email', _badge: sansEmailCount.value > 0 ? sansEmailCount.value : undefined },
  { label: 'Par entité',        value: 'par-entite' },
  { label: 'Par groupe de particuliers', value: 'par-groupe-particuliers' },
])

watch(ongletActif, (val) => {
  globalFilter.value = ''
  sorting.value = []
  if (val === 'sans-email') {
    filtreSansEmail.value = true
    resetEtCharger()
  } else {
    filtreSansEmail.value = false
    if (val === 'par-entite') {
      chargerEntitesGroupes()
    } else if (val === 'par-groupe-particuliers') {
      chargerParticuliersGroupes()
    } else {
      resetEtCharger()
    }
  }
})

// Fonctions pour le slideover d'email
function ouvrirSlideoverEmailPourContact(contactId) {
  selectedContactId.value = contactId
  showEmailSlideover.value = true
}

function ouvrirSlideoverEmail() {
  // Fonction de compatibilité pour l'ancien appel
  selectedContactId.value = null
  showEmailSlideover.value = true
}

async function handleEmailSelected(email, emailRelanceId) {
  // 1. Mettre à jour le contact avec un pointeur vers le contact de relance
  if (selectedContactId.value) {
    try {
      const Contact = $parse.Object.extend('Contact')
      const contact = Contact.createWithoutData(selectedContactId.value)
      
      // Stocker un pointeur vers le contact de relance au lieu de l'email string
      if (emailRelanceId) {
        const contactRelancePtr = Contact.createWithoutData(emailRelanceId)
        contact.set('email_relance', contactRelancePtr)
      } else {
        // Si pas d'emailRelanceId, créer un nouveau contact de relance
        const newContactRelance = new Contact()
        newContactRelance.set('email', email)
        newContactRelance.set('nom', email) // ou un nom approprié
        newContactRelance.set('estActif', true)
        newContactRelance.set('nombreUtilisations', 1)
        await newContactRelance.save()
        
        const contactRelancePtr = Contact.createWithoutData(newContactRelance.id)
        contact.set('email_relance', contactRelancePtr)
      }
      
      await contact.save()
      
      // Recharger les données pour mettre à jour l'affichage
      if (ongletActif.value === 'tous' || ongletActif.value === 'sans-email') {
        await charger()
      } else if (ongletActif.value === 'par-entite') {
        await chargerEntitesGroupes()
      } else if (ongletActif.value === 'par-groupe-particuliers') {
        await chargerParticuliersGroupes()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contact:', error)
      const toast = useToast()
      toast.add({ 
        title: 'Erreur', 
        description: 'Impossible de mettre à jour l\'email de relance', 
        color: 'red' 
      })
      return
    }
  }
  
  // 2. Afficher une notification de succès
  const toast = useToast()
  toast.add({ 
    title: 'Email de relance défini', 
    description: `L\'email de relance a été défini: ${email}`, 
    color: 'green' 
  })
  
  // 3. Si un emailRelanceId est fourni, mettre à jour les relances existantes
  if (emailRelanceId) {
    try {
      await mettreAJourRelancesAvecEmailRelance(emailRelanceId, email)
    } catch (error) {
      console.error('Erreur lors de la mise à jour des relances:', error)
      toast.add({ 
        title: 'Attention', 
        description: 'L\'email a été enregistré mais certaines relances n\'ont pas pu être mises à jour', 
        color: 'yellow' 
      })
    }
  }
}

async function mettreAJourRelancesAvecEmailRelance(contactRelanceId, email) {
  try {
    // 1. Récupérer le contact de relance
    const Contact = $parse.Object.extend('Contact')
    const contactRelanceQuery = new $parse.Query(Contact)
    const contactRelance = await contactRelanceQuery.get(contactRelanceId)
    
    // 2. Trouver les relances en attente qui pourraient être concernées
    // Note: Dans une implémentation complète, il faudrait avoir une logique
    // pour déterminer quelles relances doivent être mises à jour
    const Relance = $parse.Object.extend('Relance')
    const relanceQuery = new $parse.Query(Relance)
    relanceQuery.equalTo('statut', 'pending')
    // relanceQuery.equalTo('contact', contactPtr) // À décommenter quand on a le contact
    
    const relances = await relanceQuery.find()
    
    // 3. Mettre à jour les relances avec le nouvel email
    const relancesAMettreAJour = []
    const activites = []
    
    for (const relance of relances) {
      // Sauvegarder l'ancien email pour l'activité
      const ancienEmail = relance.get('to')
      
      if (ancienEmail && ancienEmail !== email) {
        // Créer une activité pour tracer le changement
        const Activite = $parse.Object.extend('Activite')
        const activite = new Activite()
        activite.set('type', 'email_relance_remplace')
        activite.set('details', `Email de relance remplacé: ${ancienEmail} → ${email}`)
        activite.set('contactRelance', contactRelance)
        activite.set('relance', relance)
        activites.push(activite)
        
        // Mettre à jour l'email de la relance
        relance.set('to', email)
        relance.set('contactRelance', contactRelance)
        relancesAMettreAJour.push(relance)
      }
    }
    
    if (relancesAMettreAJour.length > 0) {
      // Sauvegarder les activités
      if (activites.length > 0) {
        await $parse.Object.saveAll(activites)
      }
      
      // Sauvegarder les relances
      await $parse.Object.saveAll(relancesAMettreAJour)
      
      // Mettre à jour les statistiques du contact de relance
      contactRelance.set('nombreUtilisations', (contactRelance.get('nombreUtilisations') || 0) + relancesAMettreAJour.length)
      contactRelance.set('dateDerniereUtilisation', new Date())
      await contactRelance.save()
      
      toast.add({ 
        title: 'Relances mises à jour', 
        description: `${relancesAMettreAJour.length} relance(s) mise(s) à jour avec le nouvel email`, 
        color: 'blue' 
      })
    }
    
  } catch (error) {
    console.error('Erreur dans mettreAJourRelancesAvecEmailRelance:', error)
    throw error
  }
}

onMounted(() => {
  charger()
  chargerSansEmailCount()
})
</script>
