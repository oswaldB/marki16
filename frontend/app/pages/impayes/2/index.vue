<template>
  <div class="p-6 space-y-4">

    <!-- Barre du haut -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
          <button
            v-for="vue in vues"
            :key="vue.key"
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            :class="activeView === vue.key
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'"
            @click="activeView = vue.key"
          >
            {{ vue.label }}
          </button>
        </div>
      </div>
      <SyncButton :onSuccess="charger" />
    </div>

    <!-- Barre de filtres -->
    <div class="flex items-center gap-3 flex-wrap">
      <UInput
        v-model="globalFilter"
        icon="i-heroicons-magnifying-glass"
        placeholder="Rechercher (payeur, facture, référence, adresse...)"
        class="w-72"
      />
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700">Séquence :</span>
        <USelect
          v-model="filtreSequence"
          :items="sequenceOptions"
          class="w-44"
          :loading="sequencesLoading"
          placeholder="Toutes les séquences"
          @change="charger()"
        />
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="space-y-4">
      <!-- Message de chargement -->
      <div v-if="loading" class="text-center py-8 text-gray-400">
        <UIcon name="i-heroicons-arrow-path-20-solid" class="animate-spin h-6 w-6 mx-auto mb-2" />
        Chargement...
      </div>

      <!-- Message vide -->
      <div v-else-if="filteredImpayes.length === 0" class="text-center py-8 text-gray-400">
        Aucun impayé trouvé
      </div>

      <!-- Vue unitaire - CARDS -->
      <div v-else-if="activeView === 'unitaire'" class="space-y-4">
        <div class="flex justify-end text-sm text-gray-500">
          {{ filteredImpayesGroupes.length }} impayés affichés ({{ impayes.length }} chargés)
        </div>

        <div class="space-y-2">
          <UCard
            v-for="impaye in filteredImpayesGroupes"
            :key="impaye.objectId"
            :class="{
              'border-2 border-sky-500': isSelected(impaye),
              'hover:shadow-md transition-shadow cursor-pointer': true
            }"
            @click="toggleSelection(impaye)"
          >
            <!-- Header -->
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <UCheckbox
                    :model-value="isSelected(impaye)"
                    @click.stop
                    @change="toggleSelection(impaye)"
                  />
                  <span class="font-mono font-semibold text-sky-700">{{ impaye.nfacture }}</span>
                  <span v-if="impaye.reference" class="text-xs text-gray-400">| {{ impaye.reference }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <UBadge
                    :color="impaye.retard > 30 ? 'red' : impaye.retard > 7 ? 'orange' : 'gray'"
                    variant="solid"
                    class="text-xs"
                  >
                    {{ impaye.retard }}j
                  </UBadge>
                  <UBadge v-if="impaye.sequenceNom" color="sky" variant="subtle" class="text-xs">
                    {{ impaye.sequenceNom }}
                  </UBadge>
                </div>
              </div>
            </template>

            <!-- Corps -->
            <div class="space-y-2">
              <!-- Ligne 1 : Payeur + Reste à payer -->
              <div class="flex flex-wrap items-center gap-4">
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 truncate">{{ impaye.payeur_nom || '(Inconnu)' }}</h3>
                  <p v-if="impaye.apporteur_nom && impaye.apporteur_nom !== impaye.payeur_nom" class="text-xs text-gray-500 truncate">
                    Apporteur: {{ impaye.apporteur_nom }}
                  </p>
                </div>
                <div class="flex items-baseline gap-4">
                  <div class="text-right">
                    <p class="text-xs text-gray-400 uppercase tracking-wider">Reste à payer</p>
                    <p class="font-bold text-lg text-red-600">{{ formatMontant(impaye.reste_a_payer) }}</p>
                  </div>
                  <div v-if="impaye.total_ttc" class="text-right">
                    <p class="text-xs text-gray-400 uppercase tracking-wider">Total TTC</p>
                    <p class="font-medium text-sm">{{ formatMontant(impaye.total_ttc) }}</p>
                  </div>
                </div>
              </div>

              <!-- Ligne 2 : Adresse + Dates -->
              <div class="flex flex-wrap items-center gap-4 text-sm">
                <div class="flex-1 min-w-0">
                  <p class="text-gray-600 truncate">{{ impaye.adresse_bien || '—' }}</p>
                </div>
                <div class="flex items-center gap-4">
                  <span v-if="impaye.date_piece" class="text-gray-500">
                    <UIcon name="i-heroicons-calendar" class="w-4 h-4 inline -mt-1 mr-1" />
                    {{ formatDate(impaye.date_piece) }}
                  </span>
                  <span v-if="impaye.date_debut_mission" class="text-gray-500">
                    <UIcon name="i-heroicons-wrench" class="w-4 h-4 inline -mt-1 mr-1" />
                    {{ formatDate(impaye.date_debut_mission) }}
                  </span>
                  <span v-if="impaye.numero_dossier" class="font-mono text-gray-500">
                    {{ impaye.numero_dossier }}
                  </span>
                </div>
              </div>

              <!-- Commentaire -->
              <p v-if="impaye.commentaire_piece" class="text-sm text-gray-500 italic pt-1 border-t border-gray-100">
                "{{ impaye.commentaire_piece }}"
              </p>
            </div>

            <!-- Footer -->
            <template #footer>
              <div class="flex items-center justify-end gap-1">
                <UButton
                  icon="i-heroicons-document"
                  color="neutral"
                  variant="ghost"
                  size="2xs"
                  title="Voir PDF"
                  @click.stop="ouvrirPdf(impaye)"
                />
                <UButton
                  icon="i-heroicons-eye"
                  color="neutral"
                  variant="ghost"
                  size="2xs"
                  title="Voir détail"
                  @click.stop="router.push(`/impayes/${impaye.objectId}`)"
                />
                <UDropdownMenu :items="cardMenuItems(impaye)">
                  <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="2xs" />
                </UDropdownMenu>
              </div>
            </template>
          </UCard>
        </div>
      </div>

      <!-- Vue par payeur - LISTE + DRAWER -->
      <div v-else-if="activeView === 'payeur'" class="space-y-4">
        <div class="flex justify-end text-sm text-gray-500">
          {{ groupesPayeur.length }} payeurs · {{ impayes.length }} impayés
        </div>

        <!-- Liste des payeurs -->
        <div class="space-y-1">
          <UCard
            v-for="payeur in groupesPayeur"
            :key="payeur"
            class="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            :class="{ 'border-2 border-sky-500 bg-sky-50/50': selectedPayeur === payeur }"
            @click="openPayeurDrawer(payeur)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900">{{ payeur || '(Inconnu)' }}</h3>
                <UBadge color="neutral" variant="subtle">
                  {{ countImpayesForPayeur(payeur) }} facture{{ countImpayesForPayeur(payeur) > 1 ? 's' : '' }}
                </UBadge>
                <span class="text-xs text-gray-500">
                  Total: {{ formatMontant(totalForPayeur(payeur)) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <UBadge
                  :color="maxRetardForPayeur(payeur) > 30 ? 'red' : maxRetardForPayeur(payeur) > 7 ? 'orange' : 'gray'"
                  variant="solid"
                  class="text-xs"
                >
                  {{ maxRetardForPayeur(payeur) }}j max
                </UBadge>
                <UButton
                  size="2xs"
                  variant="soft"
                  color="sky"
                  icon="i-heroicons-queue-list"
                  @click.stop="ouvrirDrawerAssignationForPayeur(payeur)"
                />
              </div>
            </div>
          </UCard>
        </div>

        <!-- Drawer des impayés du payeur -->
        <USlideover v-model:open="payeurDrawerOpen" side="right" class="w-full max-w-2xl">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h2 class="font-semibold text-lg">{{ selectedPayeur || '(Inconnu)' }}</h2>
                <UBadge color="neutral" variant="subtle">
                  {{ impayesForPayeur(selectedPayeur).length }} facture{{ impayesForPayeur(selectedPayeur).length > 1 ? 's' : '' }}
                </UBadge>
              </div>
              <UButton
                size="sm"
                variant="soft"
                color="sky"
                icon="i-heroicons-queue-list"
                @click="ouvrirDrawerAssignationForPayeur(selectedPayeur)"
              >
                Attribuer séquence
              </UButton>
            </div>
          </template>
          
          <div class="space-y-2 p-4">
            <UCard
              v-for="impaye in impayesForPayeur(selectedPayeur)"
              :key="impaye.objectId"
              class="text-sm"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-medium">{{ impaye.nfacture }}</span>
                  <span v-if="impaye.reference" class="text-xs text-gray-400">| {{ impaye.reference }}</span>
                </div>
                <UBadge
                  :color="impaye.retard > 30 ? 'red' : impaye.retard > 7 ? 'orange' : 'gray'"
                  variant="solid"
                  class="text-xs"
                >
                  {{ impaye.retard }}j
                </UBadge>
              </div>

              <div class="flex flex-wrap items-center gap-4">
                <div class="flex-1 min-w-0">
                  <p v-if="impaye.adresse_bien" class="text-gray-600 truncate text-sm">{{ impaye.adresse_bien }}</p>
                </div>
                <div class="flex items-baseline gap-3">
                  <span class="font-bold text-red-600">{{ formatMontant(impaye.reste_a_payer) }}</span>
                  <span v-if="impaye.date_piece" class="text-xs text-gray-500">
                    <UIcon name="i-heroicons-calendar" class="w-3 h-3 inline -mt-0.5 mr-0.5" />
                    {{ formatDate(impaye.date_piece) }}
                  </span>
                  <UBadge v-if="impaye.sequenceNom" color="sky" variant="subtle" class="text-xs">
                    {{ impaye.sequenceNom }}
                  </UBadge>
                </div>
              </div>

              <template #footer>
                <div class="flex items-center justify-end gap-1 pt-2">
                  <UButton
                    icon="i-heroicons-document"
                    color="neutral"
                    variant="ghost"
                    size="2xs"
                    @click="ouvrirPdf(impaye)"
                  />
                  <UButton
                    icon="i-heroicons-eye"
                    color="neutral"
                    variant="ghost"
                    size="2xs"
                    @click="router.push(`/impayes/${impaye.objectId}`)"
                  />
                  <UDropdownMenu :items="cardMenuItems(impaye)">
                    <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="2xs" />
                  </UDropdownMenu>
                </div>
              </template>
            </UCard>
          </div>
        </USlideover>
      </div>

      <!-- Vue par contact - LISTE + DRAWER -->
      <div v-else-if="activeView === 'contact'" class="space-y-4">
        <div class="flex justify-end text-sm text-gray-500">
          {{ groupesContact.length }} contacts
        </div>

        <!-- Liste des contacts -->
        <div class="space-y-1">
          <UCard
            v-for="contact in groupesContact"
            :key="contact"
            class="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            :class="{ 'border-2 border-sky-500 bg-sky-50/50': selectedContact === contact }"
            @click="openContactDrawer(contact)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900">{{ contact }}</h3>
                <UBadge color="neutral" variant="subtle">
                  {{ countImpayesForContact(contact) }} facture{{ countImpayesForContact(contact) > 1 ? 's' : '' }}
                </UBadge>
                <span class="text-xs text-gray-500">
                  Total: {{ formatMontant(totalForContact(contact)) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <UBadge
                  :color="maxRetardForContact(contact) > 30 ? 'red' : maxRetardForContact(contact) > 7 ? 'orange' : 'gray'"
                  variant="solid"
                  class="text-xs"
                >
                  {{ maxRetardForContact(contact) }}j max
                </UBadge>
                <UButton
                  size="2xs"
                  variant="soft"
                  color="sky"
                  icon="i-heroicons-queue-list"
                  @click.stop="ouvrirDrawerAssignationForContact(contact)"
                />
              </div>
            </div>
          </UCard>
        </div>

        <!-- Drawer des impayés du contact -->
        <USlideover v-model:open="contactDrawerOpen" side="right" class="w-full max-w-2xl">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h2 class="font-semibold text-lg">{{ selectedContact || '(Inconnu)' }}</h2>
                <UBadge color="neutral" variant="subtle">
                  {{ impayesForContact(selectedContact).length }} facture{{ impayesForContact(selectedContact).length > 1 ? 's' : '' }}
                </UBadge>
              </div>
              <UButton
                size="sm"
                variant="soft"
                color="sky"
                icon="i-heroicons-queue-list"
                @click="ouvrirDrawerAssignationForContact(selectedContact)"
              >
                Attribuer séquence
              </UButton>
            </div>
          </template>
          
          <div class="space-y-2 p-4">
            <UCard
              v-for="impaye in impayesForContact(selectedContact)"
              :key="impaye.objectId"
              class="text-sm"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-medium">{{ impaye.nfacture }}</span>
                  <span v-if="impaye.reference" class="text-xs text-gray-400">| {{ impaye.reference }}</span>
                </div>
                <UBadge
                  :color="impaye.retard > 30 ? 'red' : impaye.retard > 7 ? 'orange' : 'gray'"
                  variant="solid"
                  class="text-xs"
                >
                  {{ impaye.retard }}j
                </UBadge>
              </div>

              <div class="flex flex-wrap items-center gap-4">
                <div class="flex-1 min-w-0">
                  <p class="text-gray-600 truncate text-sm">{{ impaye.adresse_bien || '—' }}</p>
                </div>
                <div class="flex items-baseline gap-3">
                  <span class="font-bold text-red-600">{{ formatMontant(impaye.reste_a_payer) }}</span>
                  <span v-if="impaye.date_piece" class="text-xs text-gray-500">
                    <UIcon name="i-heroicons-calendar" class="w-3 h-3 inline -mt-0.5 mr-0.5" />
                    {{ formatDate(impaye.date_piece) }}
                  </span>
                  <span v-if="impaye.payeur_nom && impaye.payeur_nom !== selectedContact" class="text-xs text-gray-400">
                    Payeur: {{ impaye.payeur_nom }}
                  </span>
                  <UBadge v-if="impaye.sequenceNom" color="sky" variant="subtle" class="text-xs">
                    {{ impaye.sequenceNom }}
                  </UBadge>
                </div>
              </div>

              <template #footer>
                <div class="flex items-center justify-end gap-1 pt-2">
                  <UButton
                    icon="i-heroicons-document"
                    color="neutral"
                    variant="ghost"
                    size="2xs"
                    @click="ouvrirPdf(impaye)"
                  />
                  <UButton
                    icon="i-heroicons-eye"
                    color="neutral"
                    variant="ghost"
                    size="2xs"
                    @click="router.push(`/impayes/${impaye.objectId}`)"
                  />
                  <UDropdownMenu :items="cardMenuItems(impaye)">
                    <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="2xs" />
                  </UDropdownMenu>
                </div>
              </template>
            </UCard>
          </div>
        </USlideover>
      </div>

      <!-- Vue sans séquence -->
      <div v-else class="space-y-4">
        <div class="flex justify-end text-sm text-gray-500">
          {{ filteredImpayes.length }} impayés sans séquence
        </div>

        <div class="space-y-2">
          <UCard
            v-for="impaye in filteredImpayes"
            :key="impaye.objectId"
            :class="{
              'border-2 border-sky-500': isSelected(impaye),
              'hover:shadow-md transition-shadow cursor-pointer': true
            }"
            @click="toggleSelection(impaye)"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <UCheckbox
                    :model-value="isSelected(impaye)"
                    @click.stop
                    @change="toggleSelection(impaye)"
                  />
                  <span class="font-mono font-semibold text-sky-700">{{ impaye.nfacture }}</span>
                  <span v-if="impaye.reference" class="text-xs text-gray-400">| {{ impaye.reference }}</span>
                </div>
                <UBadge
                  :color="impaye.retard > 30 ? 'red' : impaye.retard > 7 ? 'orange' : 'gray'"
                  variant="solid"
                  class="text-xs"
                >
                  {{ impaye.retard }}j
                </UBadge>
              </div>
            </template>

            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-4">
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 truncate">{{ impaye.payeur_nom || '(Inconnu)' }}</h3>
                  <p v-if="impaye.apporteur_nom && impaye.apporteur_nom !== impaye.payeur_nom" class="text-xs text-gray-500 truncate">
                    Apporteur: {{ impaye.apporteur_nom }}
                  </p>
                </div>
                <div class="flex items-baseline gap-4">
                  <div class="text-right">
                    <p class="text-xs text-gray-400 uppercase tracking-wider">Reste à payer</p>
                    <p class="font-bold text-lg text-red-600">{{ formatMontant(impaye.reste_a_payer) }}</p>
                  </div>
                  <div v-if="impaye.total_ttc" class="text-right">
                    <p class="text-xs text-gray-400 uppercase tracking-wider">Total TTC</p>
                    <p class="font-medium text-sm">{{ formatMontant(impaye.total_ttc) }}</p>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-4 text-sm">
                <div class="flex-1 min-w-0">
                  <p class="text-gray-600 truncate">{{ impaye.adresse_bien || '—' }}</p>
                </div>
                <div class="flex items-center gap-4">
                  <span v-if="impaye.date_piece" class="text-gray-500">
                    <UIcon name="i-heroicons-calendar" class="w-4 h-4 inline -mt-1 mr-1" />
                    {{ formatDate(impaye.date_piece) }}
                  </span>
                  <span v-if="impaye.date_debut_mission" class="text-gray-500">
                    <UIcon name="i-heroicons-wrench" class="w-4 h-4 inline -mt-1 mr-1" />
                    {{ formatDate(impaye.date_debut_mission) }}
                  </span>
                  <span v-if="impaye.numero_dossier" class="font-mono text-gray-500">
                    {{ impaye.numero_dossier }}
                  </span>
                </div>
              </div>

              <p v-if="impaye.commentaire_piece" class="text-sm text-gray-500 italic pt-1 border-t border-gray-100">
                "{{ impaye.commentaire_piece }}"
              </p>
            </div>

            <template #footer>
              <div class="flex items-center justify-end gap-1">
                <UButton
                  icon="i-heroicons-document"
                  color="neutral"
                  variant="ghost"
                  size="2xs"
                  title="Voir PDF"
                  @click.stop="ouvrirPdf(impaye)"
                />
                <UDropdownMenu :items="cardMenuItems(impaye)">
                  <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="2xs" />
                </UDropdownMenu>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Barre de sélection groupée -->
    <Teleport to="body">
      <div
        v-if="selection.length > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl"
      >
        <span class="text-sm font-medium">{{ selection.length }} sélectionné{{ selection.length > 1 ? 's' : '' }}</span>
        <UButton size="sm" color="primary" variant="solid" @click="modalAssignerOuvert = true">
          Assigner une séquence
        </UButton>
        <UButton size="sm" color="neutral" variant="ghost" @click="selection = []">
          Annuler
        </UButton>
      </div>
    </Teleport>

    <!-- Modal PDF -->
    <ImpayeDrawerPdf v-model="pdfOuvert" :impayelId="pdfImpayelId" />

    <!-- Drawer assignation séquence par groupe -->
    <DrawerAssignSequence
      v-model:open="drawerAssignOpen"
      :payeur="drawerAssignPayeur"
      :impayes="drawerAssignImpayes"
      :sequences="sequences"
      @assigned="charger"
    />

    <!-- Modal assigner séquence -->
    <UModal v-model:open="modalAssignerOuvert" title="Assigner une séquence">
      <template #body>
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-gray-700">Sélectionnez une séquence</h3>

          <UAlert
            v-if="sequences.length === 0"
            icon="i-heroicons-information-circle"
            color="primary"
            variant="subtle"
            class="mt-4"
          >
            <template #description>
              Aucune séquence disponible.
              <NuxtLink to="/sequences" class="font-medium text-primary-600 hover:text-primary-700 underline">
                Créer une séquence
              </NuxtLink>
            </template>
          </UAlert>
        </div>

        <!-- Affichage des séquences sous forme de cards -->
        <div v-if="sequences.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <UCard
            v-for="sequence in sequences"
            :key="sequence.id"
            :class="{
              'border-2 border-primary-500': sequenceChoisie === sequence.id,
              'cursor-pointer hover:border-gray-300': true
            }"
            @click="sequenceChoisie = sequence.id"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900">{{ sequence.get('nom') }}</h3>
                <p class="text-sm text-gray-500 mt-1">
                  {{ sequence.get('description') || 'Aucune description' }}
                </p>
              </div>
              <UBadge
                :color="sequence.get('publiee') ? 'green' : 'gray'"
                variant="subtle"
              >
                {{ sequence.get('publiee') ? 'Publiée' : 'Non publiée' }}
              </UBadge>
            </div>
          </UCard>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="modalAssignerOuvert = false">Annuler</UButton>
          <UButton :loading="assignant" :disabled="!sequenceChoisie" @click="assignerSequenceWrapper">
            Assigner la séquence sélectionnée
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
import { useImpayesStoreComposable } from '~/composables/useImpayesStore'
import ImpayeDrawerPdf from '~/components/ImpayeDrawerPdf.vue'
import DrawerAssignSequence from '~/components/DrawerAssignSequence.vue'
import SyncButton from '~/components/SyncButton.vue'

const { $parse } = useNuxtApp()
const toast = useToast()
const router = useRouter()

const {
  activeView,
  filtreSequence,
  impayes,
  loading,
  sequences,
  sequencesLoading,
  charger,
  chargerSequences,
  assignerSequence,
  sequenceOptions,
  vues,
} = useImpayesStoreComposable()

// État local
const selection = ref([])
const globalFilter = ref('')

// PDF
const pdfOuvert = ref(false)
const pdfImpayelId = ref(null)

// Drawer assignation
const drawerAssignOpen = ref(false)
const drawerAssignPayeur = ref('')
const drawerAssignImpayes = ref([])

// Modal assigner séquence
const modalAssignerOuvert = ref(false)
const sequenceChoisie = ref(null)
const assignant = ref(false)
const impayesCibles = ref([])

// Drawer payeur
const payeurDrawerOpen = ref(false)
const selectedPayeur = ref(null)

// Drawer contact
const contactDrawerOpen = ref(false)
const selectedContact = ref(null)

// Filtrer les impayés localement
const filteredImpayes = computed(() => {
  if (!globalFilter.value) return impayes.value
  const query = globalFilter.value.toLowerCase()
  return impayes.value.filter(i =>
    (i.payeur_nom && i.payeur_nom.toLowerCase().includes(query)) ||
    (i.nfacture && i.nfacture.toLowerCase().includes(query)) ||
    (i.reference && i.reference.toLowerCase().includes(query)) ||
    (i.adresse_bien && i.adresse_bien.toLowerCase().includes(query)) ||
    (i.numero_dossier && i.numero_dossier.toLowerCase().includes(query)) ||
    (i.reference_externe && i.reference_externe.toLowerCase().includes(query)) ||
    (i.apporteur_nom && i.apporteur_nom.toLowerCase().includes(query))
  )
})

// ── Données regroupées par nfacture pour la vue unitaire ──
const filteredImpayesGroupes = computed(() => {
  if (activeView.value !== 'unitaire') return filteredImpayes.value

  const grouped = new Map()

  for (const impaye of filteredImpayes.value) {
    const key = impaye.nfacture
    if (!grouped.has(key)) {
      grouped.set(key, {
        ...impaye,
        numero_dossier_list: [impaye.numero_dossier],
        _groupedOriginals: [impaye]
      })
    } else {
      const existing = grouped.get(key)
      if (!existing.numero_dossier_list.includes(impaye.numero_dossier)) {
        existing.numero_dossier_list.push(impaye.numero_dossier)
      }
      existing._groupedOriginals.push(impaye)
    }
  }

  return [...grouped.values()].map(item => ({
    ...item,
    numero_dossier: item.numero_dossier_list.filter(d => d && d !== '—').length > 0
      ? item.numero_dossier_list.filter(d => d && d !== '—').join(', ')
      : '—',
    objectId: item._groupedOriginals[0].objectId,
    _parse: item._groupedOriginals[0]._parse
  }))
})

// Sélection
function isSelected(item) {
  if (item._groupedOriginals) {
    return item._groupedOriginals.some(orig => selection.value.some(s => s.objectId === orig.objectId))
  }
  return selection.value.some(s => s.objectId === item.objectId)
}

function toggleSelection(item) {
  if (item._groupedOriginals) {
    const allOriginals = item._groupedOriginals
    const firstOriginalId = allOriginals[0].objectId
    const isFirstSelected = selection.value.some(s => s.objectId === firstOriginalId)

    if (isFirstSelected) {
      selection.value = selection.value.filter(s =>
        !allOriginals.some(orig => orig.objectId === s.objectId)
      )
    } else {
      for (const orig of allOriginals) {
        if (!selection.value.some(s => s.objectId === orig.objectId)) {
          selection.value.push(orig)
        }
      }
    }
  } else {
    const idx = selection.value.findIndex(s => s.objectId === item.objectId)
    if (idx === -1) selection.value.push(item)
    else selection.value.splice(idx, 1)
  }
}

// Vue par payeur - helpers
const groupesPayeur = computed(() => {
  const map = new Map()
  for (const item of impayes.value) {
    const key = item.payeur_nom || '(Inconnu)'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return [...map.keys()]
})

function countImpayesForPayeur(payeur) {
  return impayes.value.filter(i => (i.payeur_nom || '(Inconnu)') === payeur).length
}

function impayesForPayeur(payeur) {
  return impayes.value.filter(i => (i.payeur_nom || '(Inconnu)') === payeur)
}

function totalForPayeur(payeur) {
  const payeurImpayes = impayes.value.filter(i => (i.payeur_nom || '(Inconnu)') === payeur)
  return payeurImpayes.reduce((sum, i) => sum + (Number(i.reste_a_payer) || 0), 0)
}

function maxRetardForPayeur(payeur) {
  const payeurImpayes = impayes.value.filter(i => (i.payeur_nom || '(Inconnu)') === payeur)
  if (payeurImpayes.length === 0) return 0
  return Math.max(...payeurImpayes.map(i => i.retard || 0))
}

function openPayeurDrawer(payeur) {
  selectedPayeur.value = payeur
  payeurDrawerOpen.value = true
}

// Vue par contact - helpers
const groupesContact = computed(() => {
  const noms = new Set()
  for (const item of impayes.value) {
    if (item.payeur_nom) noms.add(item.payeur_nom)
    if (item.apporteur_nom && item.apporteur_nom !== item.payeur_nom) noms.add(item.apporteur_nom)
  }
  return [...noms]
})

function countImpayesForContact(contact) {
  const filtered = impayes.value.filter(i =>
    (i.payeur_nom === contact) ||
    (i.apporteur_nom === contact && i.apporteur_nom !== i.payeur_nom)
  )
  return filtered.length
}

function impayesForContact(contact) {
  return impayes.value.filter(i =>
    (i.payeur_nom === contact) ||
    (i.apporteur_nom === contact && i.apporteur_nom !== i.payeur_nom)
  )
}

function totalForContact(contact) {
  const contactImpayes = impayes.value.filter(i =>
    (i.payeur_nom === contact) ||
    (i.apporteur_nom === contact && i.apporteur_nom !== i.payeur_nom)
  )
  return contactImpayes.reduce((sum, i) => sum + (Number(i.reste_a_payer) || 0), 0)
}

function maxRetardForContact(contact) {
  const contactImpayes = impayes.value.filter(i =>
    (i.payeur_nom === contact) ||
    (i.apporteur_nom === contact && i.apporteur_nom !== i.payeur_nom)
  )
  if (contactImpayes.length === 0) return 0
  return Math.max(...contactImpayes.map(i => i.retard || 0))
}

function openContactDrawer(contact) {
  selectedContact.value = contact
  contactDrawerOpen.value = true
}

// Format helpers
function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return d.toLocaleDateString('fr-FR', { dateStyle: 'short' })
}

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

// Actions
function ouvrirPdf(row) {
  pdfImpayelId.value = row.objectId
  pdfOuvert.value = true
}

function cardMenuItems(row) {
  return [
    {
      label: 'Voir le détail',
      icon: 'i-heroicons-eye',
      onSelect: () => router.push(`/impayes/${row.objectId}`),
    },
    {
      label: 'Assigner une séquence',
      icon: 'i-heroicons-queue-list',
      onSelect: () => {
        impayesCibles.value = [row._parse]
        sequenceChoisie.value = null
        modalAssignerOuvert.value = true
      },
    },
  ]
}

function ouvrirDrawerAssignationForPayeur(payeur) {
  drawerAssignPayeur.value = payeur
  drawerAssignImpayes.value = impayesForPayeur(payeur)
  drawerAssignOpen.value = true
}

function ouvrirDrawerAssignationForContact(contact) {
  drawerAssignPayeur.value = contact
  drawerAssignImpayes.value = impayesForContact(contact)
  drawerAssignOpen.value = true
}

async function assignerSequenceWrapper() {
  if (!sequenceChoisie.value) return
  assignant.value = true
  try {
    await assignerSequence(impayesCibles.value, sequenceChoisie.value)
    selection.value = []
    impayesCibles.value = []
    modalAssignerOuvert.value = false
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    assignant.value = false
  }
}

// Charger les données au montage
onMounted(() => {
  charger()
  chargerSequences()
})

// Réagir aux changements
watch(activeView, () => {
  charger()
})

watch(filtreSequence, () => {
  charger()
})
</script>
