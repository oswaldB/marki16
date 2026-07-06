<template>
  <div class="p-6 space-y-4">

    <!-- ── Barre du haut ── -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <h1 class="text-2xl font-semibold text-gray-900">Relances</h1>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Toggle vue -->
        <div class="flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
            :class="vue === 'tableau' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="vue = 'tableau'"
          >
            <UIcon name="i-heroicons-table-cells" class="size-4" />
            Tableau
          </button>
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
            :class="vue === 'calendrier' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="vue = 'calendrier'"
          >
            <UIcon name="i-heroicons-calendar-days" class="size-4" />
            Calendrier
          </button>
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
            :class="vue === 'validation' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="vue = 'validation'"
          >
            <UIcon name="i-heroicons-check-circle" class="size-4" />
            Validation
          </button>
        </div>

        <!-- Filtres -->
        <USelect
          v-model="filtreStatut"
          :items="statutOptions"
          class="w-36"
          @change="charger"
        />
        <USelect
          v-model="filtreSequence"
          :items="sequenceOptions"
          class="w-44"
          @change="charger"
        />
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher..."
          class="w-52"
        />

        <!-- Bouton pour créer des relances -->
        <UButton
          icon="i-heroicons-plus-circle"
          color="primary"
          :loading="creatingRelances"
          @click="createRelancesForAllActiveSequences"
        >
          Créer des relances
        </UButton>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">Chargement…</div>

    <template v-else>

      <!-- ══════════════════════════════════════
           VUE TABLEAU
      ══════════════════════════════════════ -->
      <div v-if="vue === 'tableau'" class="space-y-3">
        <UCard :ui="{ body: { padding: 'p-0' } }">
          <UTable
            v-model:sorting="sorting"
            :data="relancesFiltrees"
            :columns="colonnes"
          >
            <!-- Date -->
            <template #dateEnvoi-cell="{ row }">
              <span class="text-sm tabular-nums">{{ formatDate(row.original.dateEnvoi) }}</span>
            </template>

            <!-- Objet + badges -->
            <template #objet-cell="{ row }">
              <div class="flex items-center gap-2">
                <span class="text-sm truncate max-w-xs">{{ row.original.objet || '(sans objet)' }}</span>
                <span v-if="row.original.manuelle" title="Relance manuelle" class="text-xs">✋</span>
                <span v-if="!row.original.valide" title="Relance non validée" class="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium">non validé</span>
              </div>
            </template>

            <!-- Destinataire -->
            <template #to-cell="{ row }">
              <span class="text-sm text-gray-600 truncate max-w-40">{{ row.original.to }}</span>
            </template>

            <!-- Facture → lien -->
            <template #nfacture-cell="{ row }">
              <div v-if="row.original.impayes && row.original.impayes.length > 1" class="flex flex-wrap gap-1 text-sm font-mono">
                <span v-for="(imp, index) in row.original.impayes" :key="imp.id">
                  <NuxtLink
                    :to="`/impayes/${imp.id}`"
                    class="text-sky-700 hover:underline"
                  >
                    {{ imp.nfacture }}
                  </NuxtLink>
                  <span v-if="index < row.original.impayes.length - 1">, </span>
                </span>
              </div>
              <NuxtLink
                v-else-if="row.original.impayelId"
                :to="`/impayes/${row.original.impayelId}`"
                class="text-sky-700 hover:underline text-sm font-mono"
              >
                {{ row.original.nfacture }}
              </NuxtLink>
              <span v-else class="text-sm text-gray-400">{{ row.original.nfacture }}</span>
            </template>

            <!-- Statut -->
            <template #statut-cell="{ row }">
              <div class="flex items-center gap-2">
                <UBadge :color="!row.original.valide ? 'orange' : (STATUT_CONFIG[row.original.statut]?.color ?? 'neutral')" variant="subtle" size="xs">
                  {{ STATUT_CONFIG[row.original.statut]?.label ?? row.original.statut }}
                </UBadge>
                <UButton
                  v-if="row.original.statut === 'pending' || row.original.statut === 'échec' || row.original.statut === 'optimisee'"
                  icon="i-heroicons-pencil-square"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="ouvrirDrawer(row, false)"
                />
              </div>
            </template>

          </UTable>
        </UCard>

        <!-- Barre sélection groupée -->
        <div v-if="selection.length > 0" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div class="flex items-center gap-3 bg-gray-900 text-white rounded-xl px-5 py-3 shadow-xl">
            <span class="text-sm font-medium">{{ selection.length }} relance(s) sélectionnée(s)</span>
            <UButton color="red" size="sm" :loading="annulantGroupe" @click="annulerGroupe">
              🗑 Annuler
            </UButton>
            <UButton color="green" size="sm" :loading="validantGroupe" @click="validerGroupe" v-if="selection.some(r => !r.valide)">
              ✓ Valider
            </UButton>
            <UButton color="neutral" variant="ghost" size="sm" class="text-white" @click="selection = []">
              Désélectionner
            </UButton>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════
           VUE CALENDRIER
      ══════════════════════════════════════ -->
      <div v-else-if="vue === 'calendrier'" class="flex gap-4">
        <UCard class="flex-1">
          <!-- Légende des couleurs -->
          <div class="flex flex-wrap gap-3 mb-4 px-4 pt-4">
            <div v-for="(stat, key) in STATUT_CONFIG" :key="key" class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: statutCalColor(key) }" />
              <span class="text-xs text-gray-600">{{ stat.label }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" style="background-color: #f97316;" />
              <span class="text-xs text-gray-600">Non validée</span>
            </div>
          </div>
          <ClientOnly>
            <FullCalendar :options="calendarOptions" />
            <template #fallback>
              <div class="py-8 text-center text-gray-400 text-sm">Chargement du calendrier…</div>
            </template>
          </ClientOnly>
        </UCard>

        <!-- Panneau latéral jour sélectionné -->
        <div v-if="jourSelectionne" class="w-80 shrink-0">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold text-sm">{{ formatDate(jourSelectionne) }}</span>
                <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="xs" @click="jourSelectionne = null" />
              </div>
            </template>
            <div class="space-y-2">
              <div
                v-for="row in relancesJour"
                :key="row.id"
                class="border border-gray-100 rounded-lg p-2 space-y-1"
              >
                <div class="flex items-center justify-between gap-2">
                  <UBadge :color="!row.valide ? 'orange' : (STATUT_CONFIG[row.statut]?.color ?? 'neutral')" variant="subtle" size="xs">
                    {{ STATUT_CONFIG[row.statut]?.label ?? row.statut }}
                  </UBadge>
                  <div class="flex items-center gap-1">
                    <span v-if="!row.valide" title="Relance non validée" class="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium">non validé</span>
                    <span v-if="row.manuelle" class="text-xs">✋</span>
                  </div>
                </div>
                <p class="text-sm font-medium truncate">{{ row.objet || '(sans objet)' }}</p>
                <p class="text-xs text-gray-500 truncate">{{ row.to }}</p>
                <div class="flex gap-1 pt-1">
                  <UButton
                    v-if="row.statut === 'pending' || row.statut === 'échec' || row.statut === 'optimisee'"
                    icon="i-heroicons-pencil-square"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="ouvrirDrawer(row, false)"
                  />
                  <UButton
                    v-if="row.statut === 'envoyé'"
                    icon="i-heroicons-eye"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="ouvrirDrawer(row, true)"
                  />
                  <UButton
                    v-if="row.statut === 'échec'"
                    icon="i-heroicons-arrow-path"
                    color="sky"
                    variant="ghost"
                    size="xs"
                    @click="reessayerRelance(row)"
                  />
                </div>
              </div>
              <p v-if="relancesJour.length === 0" class="text-sm text-gray-400 italic">Aucune relance ce jour.</p>
            </div>
          </UCard>
        </div>
      </div>

      <!-- ══════════════════════════════════════
           VUE VALIDATION
      ══════════════════════════════════════ -->
      <div v-else-if="vue === 'validation'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Colonne de gauche - Liste des relances à valider -->
        <div class="lg:col-span-1 space-y-4">
          <UCard class="max-w-full">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold">Relances à valider</span>
                <div class="flex items-center gap-2">
                  <UInput
                    v-model="validationSearch"
                    icon="i-heroicons-magnifying-glass"
                    placeholder="Rechercher..."
                    size="xs"
                    class="w-40"
                  />
                  <USelect
                    v-model="modeTriValidation"
                    :items="[
                      { value: 'chronologique', label: 'Tri chronologique' },
                      { value: 'destinataire', label: 'Tri par destinataire' }
                    ]"
                    size="xs"
                    class="w-40"
                  />
                  <span class="text-sm text-gray-500">{{ relancesAValider.length }} relance(s)</span>
                </div>
              </div>
              <div class="mt-2 flex items-center gap-2" v-if="selectedRelancesForBulk.length > 0">
                <span class="text-sm text-gray-600">{{ selectedRelancesForBulk.length }} sélectionnée(s)</span>
                <UButton
                  color="primary"
                  size="sm"
                  :loading="bulkValidating"
                  @click="validateAllSelected"
                >
                  Valider tout
                </UButton>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="selectedRelancesForBulk = []"
                >
                  Désélectionner
                </UButton>
              </div>
            </template>
            <div class="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div
                v-for="(relance, index) in relancesAValider"
                :key="relance.id"
                class="p-3 border border-gray-100 rounded-lg transition-colors"
                :class="{
                  'bg-blue-50 border-blue-200': relance.id === relanceCourante?.id,
                  'hover:bg-gray-50': relance.id !== relanceCourante?.id
                }"
              >
                <div class="flex items-start gap-3" @click="selectionnerRelancePourValidation(relance)" style="cursor: pointer;">
                  <div class="flex-1">
                    <p class="font-medium text-sm truncate">{{ relance.objet || '(sans objet)' }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ relance.to }}</p>
                    <p class="text-xs text-gray-400">{{ formatDate(relance.dateEnvoi) }}</p>
                  </div>
                </div>
                <div class="mt-2 flex justify-end">
                  <UCheckbox
                    :model-value="isSelectedBulk(relance.id)"
                    @update:model-value="(checked) => toggleBulkSelection(relance.id, checked)"
                    @click.stop
                  />
                </div>
              </div>
              <div v-if="relancesAValider.length === 0" class="p-6 text-center text-gray-400">
                <UIcon name="i-heroicons-check-circle" class="size-8 mx-auto mb-2 text-green-500" />
                <p class="text-sm">Toutes les relances ont été validées !</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Colonne du milieu et droite - Détails de la relance (équivalent du drawer) -->
        <div class="lg:col-span-2" v-if="relanceCourante">
          <UCard class="max-w-full">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold">Validation de la relance</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">
                    {{ positionRelanceCourante }} / {{ relancesAValider.length }}
                  </span>
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-heroicons-document-arrow-down"
                    :loading="saving"
                    :disabled="!hasUnsavedChanges"
                    @click="enregistrerRelance"
                  >
                    Enregistrer
                  </UButton>
                  <UButton
                    color="primary"
                    :loading="validantWorkflow"
                    @click="validerRelanceWorkflow"
                    :disabled="!relanceCourante"
                  >
                    Valider
                  </UButton>
                  <UDropdownMenu
                    :items="[
                      [
                        { label: 'Passer', icon: 'i-heroicons-forward', click: passerRelanceWorkflow, disabled: !peutPasser },
                        { label: 'Blacklister et supprimer relances', icon: 'i-heroicons-no-symbol', click: blacklistEtSupprimerRelances, disabled: !relanceCourante || blacklistStore.loading },
                        { label: 'Supprimer relance', icon: 'i-heroicons-trash', click: supprimerRelance, disabled: !relanceCourante || supprimantRelance }
                      ]
                    ]"
                  >
                    <UButton
                      color="neutral"
                      variant="outline"
                      trailing-icon="i-heroicons-chevron-down"
                      :loading="blacklistStore.loading || supprimantRelance"
                    >
                      Actions
                    </UButton>
                  </UDropdownMenu>
                </div>
              </div>
            </template>

            <div class="space-y-6">
              <!-- Infos de base -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">Date d'envoi</label>
                  <UInput
                    :model-value="dateEnvoiInput"
                    @update:model-value="updateDateEnvoi"
                    type="date"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">À</label>
                  <UInput
                    :model-value="relanceCourante.to"
                    readonly
                    class="w-full"
                  />
                </div>
              </div>

              <div>
                <label class="text-xs text-gray-500 mb-1 block">CC</label>
                <UInput
                  v-model="relanceCourante.cc"
                  class="w-full"
                />
              </div>

              <div>
                <label class="text-xs text-gray-500 mb-1 block">Objet</label>
                <UInput
                  v-model="relanceCourante.objet"
                  class="w-full"
                />
              </div>

              <!-- Corps de l'email -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Corps de l'email</label>
                <div class="border border-gray-200 rounded-md overflow-hidden bg-white">
                  <ToastuiEditor
                    ref="editorValidationRef"
                    :key="relanceCourante?.id"
                    :initial-value="relanceCourante.corps"
                    :options="{
                      height: '400px',
                      usageStatistics: false,
                      hideModeSwitch: true,
                    }"
                    @change="(html) => { relanceCourante.corps = html; markAsModified() }"
                  />
                </div>
              </div>

              <!-- Callout pièce jointe -->
              <UAlert
                icon="i-heroicons-paper-clip"
                color="info"
                variant="subtle"
                description="La facture sera automatiquement jointe en pièce jointe lors de l'envoi de cet email."
              />

              <!-- Factures liées -->
              <div
                v-for="imp in relanceCourante.impayes"
                :key="imp.id"
                class="rounded-lg border border-gray-200 overflow-hidden"
              >
                <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <div class="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <UIcon name="i-heroicons-document-text" class="size-4 text-gray-400" />
                    <span>Facture {{ imp.nfacture }}</span>
                    <span v-if="imp.payeurNom" class="text-gray-400">· {{ imp.payeurNom }}</span>
                  </div>
                  <a v-if="pdfLinks[imp.id]" :href="pdfLinks[imp.id]" target="_blank">
                    <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="ghost" size="xs">Télécharger</UButton>
                  </a>
                </div>
                <div class="relative" style="height: 300px">
                  <PdfIframe v-if="pdfLinks[imp.id]" :src="pdfLinks[imp.id]" />
                </div>
              </div>


            </div>
          </UCard>
        </div>

        <div v-else class="lg:col-span-2 flex items-center justify-center py-12">
          <div class="text-center text-gray-400">
            <UIcon name="i-heroicons-inbox" class="size-12 mx-auto mb-4" />
            <p class="text-sm">Sélectionnez une relance à valider</p>
          </div>
        </div>
      </div>

      <!-- F-009: Modal de confirmation pour modifications non sauvegardées -->
      <UModal v-model:open="showUnsavedChangesModal" :ui="{ width: 'sm' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="size-5 text-yellow-500" />
            <span class="font-semibold">Modifications non enregistrées</span>
          </div>
        </template>
        <template #body>
          <p class="text-sm text-gray-600">
            Vous avez des modifications non sauvegardées sur cette relance. 
            Voulez-vous les enregistrer avant de continuer ?
          </p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="handleUnsavedChangesAction('cancel')">
              Annuler
            </UButton>
            <UButton color="red" variant="outline" @click="handleUnsavedChangesAction('discard')">
              Abandonner
            </UButton>
            <UButton color="primary" @click="handleUnsavedChangesAction('save')">
              Enregistrer
            </UButton>
          </div>
        </template>
      </UModal>

    </template>



    <!-- ══════════════════════════════════════
         SLIDEOVER — Modifier / Voir une relance
    ══════════════════════════════════════ -->
    <USlideover
      v-model:open="showDrawer"
      side="right"
      :ui="{ content: 'w-1/2 max-w-none' }"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <span class="font-semibold text-lg">{{ drawerReadonly ? 'Voir la relance' : 'Modifier la relance' }}</span>
          <UButton v-if="!drawerReadonly && !relanceDrawer?.valide" color="primary" :loading="validantDrawer" @click="validerRelanceDrawer" size="sm">
            Valider
          </UButton>
        </div>
      </template>
      <template v-if="relanceDrawer" #body>
        <div class="space-y-4 py-2">

          <!-- 1 — Partie email -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Date d'envoi</label>
              <UInput
                v-model="drawerDateEnvoi"
                type="date"
                :disabled="drawerReadonly"
                class="w-full"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">À</label>
              <UInput v-model="drawerTo" :disabled="drawerReadonly" class="w-full" />
            </div>
          </div>

          <!-- Case à cocher pour appliquer à tous les emails suivants -->
          <div v-if="!drawerReadonly" class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <UCheckbox v-model="applyToAllFollowing.value" />
            <span class="text-sm text-gray-600">Appliquer ce destinataire à tous les emails suivants</span>
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">CC</label>
            <UInput v-model="drawerCc" :disabled="drawerReadonly" class="w-full" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Objet</label>
            <UInput v-model="drawerObjet" :disabled="drawerReadonly" class="w-full" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Corps</label>
            <div class="border border-gray-200 rounded-md overflow-hidden">
              <ClientOnly>
                <ToastuiEditor
                  v-if="editorVisible"
                  ref="editorDrawerRef"
                  :initial-value="drawerCorps"
                  :options="{ minHeight: '600px', usageStatistics: false, hideModeSwitch: true }"
                  initial-edit-type="wysiwyg"
                />
                <template #fallback>
                  <div class="p-3 text-gray-400 text-sm">Chargement de l'éditeur…</div>
                </template>
              </ClientOnly>
            </div>
          </div>

          <!-- 2 — Callout pièce jointe -->
          <UAlert
            icon="i-heroicons-paper-clip"
            color="info"
            variant="subtle"
            description="La facture sera automatiquement jointe en pièce jointe lors de l'envoi de cet email."
          />

          <!-- 3 — PDFs des factures liées -->
          <div
            v-for="imp in relanceDrawer?.impayes"
            :key="imp.id"
            class="rounded-lg border border-gray-200 overflow-hidden"
          >
            <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div class="flex items-center gap-2 text-xs font-medium text-gray-600">
                <UIcon name="i-heroicons-document-text" class="size-4 text-gray-400" />
                <span>Facture {{ imp.nfacture }}</span>
                <span v-if="imp.payeurNom" class="text-gray-400">· {{ imp.payeurNom }}</span>
              </div>
              <a v-if="pdfLinks[imp.id]" :href="pdfLinks[imp.id]" target="_blank">
                <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="ghost" size="xs">Télécharger</UButton>
              </a>
            </div>
            <div class="relative" style="height: 420px">
              <PdfIframe v-if="pdfLinks[imp.id]" :src="pdfLinks[imp.id]" />
            </div>
          </div>
          <div v-if="!relanceDrawer?.impayes || relanceDrawer?.impayes.length === 0" class="text-center py-4 text-gray-400 text-sm">
            Aucun PDF disponible pour cette relance
          </div>

        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showDrawer = false">Annuler</UButton>
          <UButton v-if="!drawerReadonly" :loading="savingDrawer" @click="enregistrerDrawer">
            Enregistrer
          </UButton>
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup>
import { h } from 'vue'
import { UButton, UCheckbox, UDropdownMenu } from '#components'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import ToastuiEditor from '~/components/ToastuiEditor.vue'
import PdfIframe from '~/components/PdfIframe.vue'
import { useBlacklistStore } from '~/stores/blacklistStore'
import { useImpayesStore } from '~/stores/impayesStore'

const FullCalendar = defineAsyncComponent(() => import('@fullcalendar/vue3').then(m => m.default ?? m))

const { $parse } = useNuxtApp()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const blacklistStore = useBlacklistStore()
const impayesStore = useImpayesStore()

// ── State ──────────────────────────────────────────────────────
const vue = ref(route.query.vue || 'tableau')

// Synchroniser la vue avec l'URL
watch(vue, async (newVue) => {
  await router.replace({
    query: {
      ...route.query,
      vue: newVue === 'tableau' ? undefined : newVue,
    },
  })
})

// Synchroniser avec les changements d'URL (retour arrière/avant)
watch(
  () => route.query.vue,
  (newVue) => {
    const targetView = newVue || 'tableau'
    if (targetView !== vue.value) {
      vue.value = targetView
    }
  },
  { immediate: true },
)

const loading = ref(false)
const relances = ref([])
const sequences = ref([])
const selection = ref([])
const pdfLinks = ref({}) // { impayeId: signedUrl }
const annulantGroupe = ref(false)
const validantGroupe = ref(false)
const creatingRelances = ref(false)


// Filtres
const filtreStatut = ref('tous')
const filtreSequence = ref('tous')
const search = ref('')

// Calendrier
const jourSelectionne = ref(null)

// Drawer
const showDrawer = ref(false)
const drawerReadonly = ref(false)
const drawerRow = ref(null)
const drawerDateEnvoi = ref('')
const drawerTo = ref('')
const drawerCc = ref('')
const drawerObjet = ref('')
const drawerCorps = ref('')
const savingDrawer = ref(false)
const validantDrawer = ref(false)
const editorDrawerRef = ref(null)
const editorVisible = ref(false)
const applyToAllFollowing = ref(false) // État de la case à cocher
const originalToValue = ref('') // Valeur originale du champ To pour détecter les changements

// Validation workflow
const relanceCourante = ref(null)
const validantWorkflow = ref(false)
const saving = ref(false) // F-009: état de sauvegarde
const modeTriValidation = ref('chronologique') // 'chronologique' ou 'destinataire'
const validationSearch = ref('')
const editorValidationRef = ref(null) // F-009: référence vers l'éditeur ToastUI
const originalRelanceData = ref(null) // F-009: données originales pour comparaison
const showUnsavedChangesModal = ref(false) // F-009: modal de confirmation
const pendingRelanceSelection = ref(null) // F-009: relance en attente de sélection

// Validation en masse
const selectedRelancesForBulk = ref([])
const bulkValidating = ref(false)

// Suppression de relance
const supprimantRelance = ref(false)

function isSelectedBulk(relanceId) {
  const id = String(relanceId)
  return selectedRelancesForBulk.value?.some(existingId => String(existingId) === id) ?? false
}

function toggleBulkSelection(relanceId, checked) {
  // S'assurer que checked est bien un booléen
  const isChecked = checked === true || checked === 'true' || (checked && checked !== false)
  
  // S'assurer que relanceId est une chaîne
  const id = String(relanceId)
  
  if (isChecked) {
    // Vérifier si l'ID est déjà présent (comparaison en tant que chaînes)
    const alreadyExists = selectedRelancesForBulk.value.some(existingId => String(existingId) === id)
    if (!alreadyExists) {
      selectedRelancesForBulk.value = [...selectedRelancesForBulk.value, id]
    }
  } else {
    selectedRelancesForBulk.value = selectedRelancesForBulk.value.filter(existingId => String(existingId) !== id)
  }
}

// Computed ref pour le drawer
const relanceDrawer = computed(() => drawerRow.value)

// Computed pour filtrer les relances liées aux impayés suspendus
const relancesFiltrees = computed(() => {
  return relances.value.filter(relance => {
    // Exclure les relances liées à des impayés suspendus
    if (relance.impayelId) {
      const impaye = impayesStore.allImpayes.find(i => i.objectId === relance.impayelId);
      if (impaye && impaye.isBlacklisted) return false;
    }
    if (relance.impayes && Array.isArray(relance.impayes)) {
      const hasSuspended = relance.impayes.some(imp => {
        const impaye = impayesStore.allImpayes.find(i => i.objectId === imp.id);
        return impaye && impaye.isBlacklisted;
      });
      if (hasSuspended) return false;
    }
    return true;
  });
});

// Computed pour le workflow de validation
const relancesAValider = computed(() => {
  let relancesNonValidees = relancesFiltrees.value.filter(r => !r.valide && !r.manuelle)

  // Filtre de recherche
  if (validationSearch.value) {
    const s = validationSearch.value.toLowerCase()
    relancesNonValidees = relancesNonValidees.filter(r =>
      (r.objet?.toLowerCase() || '').includes(s) ||
      (r.to?.toLowerCase() || '').includes(s)
    )
  }

  if (modeTriValidation.value === 'chronologique') {
    return relancesNonValidees.sort((a, b) => {
      return new Date(a.dateEnvoi) - new Date(b.dateEnvoi)
    })
  } else { // 'destinataire'
    return relancesNonValidees.sort((a, b) => {
      // 1. Grouper par destinataire (tri alphabétique)
      const destinataireA = a.to?.toLowerCase() || ''
      const destinataireB = b.to?.toLowerCase() || ''
      if (destinataireA !== destinataireB) {
        return destinataireA.localeCompare(destinataireB)
      }
      // 2. Dans chaque groupe, trier par date d'envoi croissante (du plus ancien au plus récent)
      return new Date(a.dateEnvoi) - new Date(b.dateEnvoi)
    })
  }
})

const positionRelanceCourante = computed(() => {
  if (!relanceCourante.value) return 0
  const index = relancesAValider.value.findIndex(r => r.id === relanceCourante.value.id)
  return index + 1
})

const peutPasser = computed(() => {
  return relancesAValider.value.length > 1
})

// F-009: Computed pour détecter les modifications non sauvegardées
const hasUnsavedChanges = computed(() => {
  if (!relanceCourante.value || !originalRelanceData.value) return false
  
  const currentCorps = relanceCourante.value.corps || ''
  const originalCorps = originalRelanceData.value.corps || ''
  const currentDate = relanceCourante.value.dateEnvoi || ''
  const originalDate = originalRelanceData.value.dateEnvoi || ''
  
  return relanceCourante.value.objet !== originalRelanceData.value.objet ||
         currentCorps !== originalCorps ||
         relanceCourante.value.cc !== originalRelanceData.value.cc ||
         String(currentDate) !== String(originalDate)
})

// F-009: Marquer comme modifié (appelé par l'éditeur)
function markAsModified() {
  // Le computed hasUnsavedChanges se met à jour automatiquement
}

// Computed pour le champ date d'envoi (conversion Date <-> string YYYY-MM-DD)
const dateEnvoiInput = computed({
  get: () => {
    if (!relanceCourante.value?.dateEnvoi) return ''
    const d = new Date(relanceCourante.value.dateEnvoi)
    return d.toISOString().split('T')[0]
  },
  set: (val) => {
    if (!relanceCourante.value) return
    relanceCourante.value.dateEnvoi = val
  }
})

function updateDateEnvoi(val) {
  dateEnvoiInput.value = val
}

// Relances du jour sélectionné (pour le panneau latéral du calendrier)
const relancesJour = computed(() => {
  if (!jourSelectionne.value) return []
  return relancesFiltrees.value.filter(r => {
    const date = new Date(r.dateEnvoi)
    const selectedDate = new Date(jourSelectionne.value)
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  })
})

// Charger les relances depuis Parse
async function charger() {
  loading.value = true
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    const query = new $parse.Query(Relance)
    query.limit(1000)
    query.descending('dateEnvoi')
    query.include('impaye')
    
    // Filtrer par statut si nécessaire
    if (filtreStatut.value !== 'tous') {
      query.equalTo('statut', filtreStatut.value)
    }
    
    // Filtrer par séquence si nécessaire
    if (filtreSequence.value !== 'tous') {
      query.equalTo('sequenceId', filtreSequence.value)
    }
    
    // Recherche
    if (search.value) {
      const searchLower = search.value.toLowerCase()
      query.contains('objet', searchLower)
    }
    
    const results = await query.find()
    relances.value = results.map(r => ({
      id: r.id,
      dateEnvoi: r.get('dateEnvoi'),
      objet: r.get('objet'),
      to: r.get('to'),
      cc: r.get('cc'),
      corps: r.get('corps'),
      statut: r.get('statut'),
      valide: r.get('valide'),
      manuelle: r.get('manuelle'),
      impayelId: r.get('impaye')?.id,
      impayes: r.get('impayes') || [],
      nfacture: r.get('impaye')?.get('nfacture') || r.get('nfacture') || '—',
      sequenceId: r.get('sequenceId'),
      _parse: r
    }))
  } catch (error) {
    console.error('Erreur chargement relances:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de charger les relances', color: 'red' })
  } finally {
    loading.value = false
  }
}

// Charger les séquences
async function chargerSequences() {
  try {
    const { $parse } = useNuxtApp()
    const Sequence = $parse.Object.extend('Sequence')
    const query = new $parse.Query(Sequence)
    query.limit(200)
    const results = await query.find()
    sequences.value = results.map(s => ({
      id: s.id,
      nom: s.get('nom'),
      _parse: s
    }))
  } catch (error) {
    console.error('Erreur chargement séquences:', error)
  }
}

// Options de filtres
const statutOptions = [
  { value: 'tous', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'envoyé', label: 'Envoyé' },
  { value: 'échec', label: 'Échec' },
  { value: 'optimisee', label: 'Optimisée' }
]

const sequenceOptions = computed(() => [
  { value: 'tous', label: 'Toutes les séquences' },
  ...sequences.value.map(s => ({ value: s.id, label: s.nom }))
])

// Configuration des statuts pour le calendrier
const STATUT_CONFIG = {
  'pending': { label: 'En attente', color: 'gray' },
  'envoyé': { label: 'Envoyé', color: 'green' },
  'échec': { label: 'Échec', color: 'red' },
  'optimisee': { label: 'Optimisée', color: 'blue' }
}

function statutCalColor(statut) {
  return STATUT_CONFIG[statut]?.color === 'gray' ? '#9ca3af' :
         STATUT_CONFIG[statut]?.color === 'green' ? '#22c55e' :
         STATUT_CONFIG[statut]?.color === 'red' ? '#ef4444' :
         STATUT_CONFIG[statut]?.color === 'blue' ? '#3b82f6' :
         '#9ca3af'
}

// Options du calendrier
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek,dayGridDay'
  },
  events: relancesFiltrees.value.map(r => ({
    id: r.id,
    title: r.objet || '(sans objet)',
    start: r.dateEnvoi,
    color: !r.valide ? '#f97316' : statutCalColor(r.statut),
    textColor: '#ffffff',
    borderColor: !r.valide ? '#f97316' : statutCalColor(r.statut),
    className: !r.valide ? 'bg-orange-500' : ''
  })),
  dateClick: (info) => {
    jourSelectionne.value = info.dateStr
  },
  eventClick: (info) => {
    jourSelectionne.value = info.event.startStr
    info.jsEvent.preventDefault()
  },
  locale: 'fr',
  buttonText: {
    today: "Aujourd'hui",
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour'
  },
  height: 'auto'
}))

// Chargement initial
onMounted(async () => {
  await charger()
  await chargerSequences()
  await impayesStore.fetchAllImpayes()
})

// Rafraîchir les données
function refresh() {
  charger()
  chargerSequences()
  impayesStore.fetchAllImpayes()
}

// Ouvrir le drawer pour modifier/voir une relance
function ouvrirDrawer(row, readonly = false) {
  drawerRow.value = row
  drawerReadonly.value = readonly
  drawerDateEnvoi.value = row.dateEnvoi ? new Date(row.dateEnvoi).toISOString().split('T')[0] : ''
  drawerTo.value = row.to || ''
  drawerCc.value = row.cc || ''
  drawerObjet.value = row.objet || ''
  drawerCorps.value = row.corps || ''
  editorVisible.value = true
  showDrawer.value = true
}

// Enregistrer les modifications du drawer
async function enregistrerDrawer() {
  if (!relanceDrawer.value) return
  
  savingDrawer.value = true
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    const relance = await new $parse.Query(Relance).get(relanceDrawer.value.id)
    
    relance.set('dateEnvoi', drawerDateEnvoi.value)
    relance.set('to', drawerTo.value)
    relance.set('cc', drawerCc.value)
    relance.set('objet', drawerObjet.value)
    relance.set('corps', drawerCorps.value)
    
    await relance.save()
    toast.add({ title: 'Succès', description: 'Relance enregistrée', color: 'green' })
    await charger()
    showDrawer.value = false
  } catch (error) {
    console.error('Erreur enregistrement relance:', error)
    toast.add({ title: 'Erreur', description: 'Impossible d\'enregistrer la relance', color: 'red' })
  } finally {
    savingDrawer.value = false
  }
}

// Valider une relance depuis le drawer
async function validerRelanceDrawer() {
  if (!relanceDrawer.value) return
  
  validantDrawer.value = true
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    const relance = await new $parse.Query(Relance).get(relanceDrawer.value.id)
    
    relance.set('valide', true)
    await relance.save()
    toast.add({ title: 'Succès', description: 'Relance validée', color: 'green' })
    await charger()
    showDrawer.value = false
  } catch (error) {
    console.error('Erreur validation relance:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de valider la relance', color: 'red' })
  } finally {
    validantDrawer.value = false
  }
}

// Sélectionner une relance pour validation
function selectionnerRelancePourValidation(relance) {
  if (hasUnsavedChanges.value) {
    pendingRelanceSelection.value = relance
    showUnsavedChangesModal.value = true
    return
  }
  
  relanceCourante.value = { ...relance }
  originalRelanceData.value = { ...relance }
}

// Gérer les modifications non sauvegardées
function handleUnsavedChangesAction(action) {
  showUnsavedChangesModal.value = false
  
  if (action === 'save') {
    enregistrerRelance()
    return
  }
  
  if (action === 'discard') {
    if (pendingRelanceSelection.value) {
      relanceCourante.value = { ...pendingRelanceSelection.value }
      originalRelanceData.value = { ...pendingRelanceSelection.value }
      pendingRelanceSelection.value = null
    }
    return
  }
  
  // Cancel - ne rien faire
  pendingRelanceSelection.value = null
}

// Enregistrer la relance courante (workflow de validation)
async function enregistrerRelance() {
  if (!relanceCourante.value) return
  
  saving.value = true
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    const relance = await new $parse.Query(Relance).get(relanceCourante.value.id)
    
    relance.set('dateEnvoi', dateEnvoiInput.value)
    relance.set('cc', relanceCourante.value.cc)
    relance.set('objet', relanceCourante.value.objet)
    relance.set('corps', relanceCourante.value.corps)
    
    await relance.save()
    toast.add({ title: 'Succès', description: 'Relance enregistrée', color: 'green' })
    originalRelanceData.value = { ...relanceCourante.value }
  } catch (error) {
    console.error('Erreur enregistrement relance:', error)
    toast.add({ title: 'Erreur', description: 'Impossible d\'enregistrer la relance', color: 'red' })
  } finally {
    saving.value = false
  }
}

// Valider la relance courante (workflow de validation)
async function validerRelanceWorkflow() {
  if (!relanceCourante.value) return
  
  validantWorkflow.value = true
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    const relance = await new $parse.Query(Relance).get(relanceCourante.value.id)
    
    relance.set('valide', true)
    await relance.save()
    
    toast.add({ title: 'Succès', description: 'Relance validée', color: 'green' })
    
    // Passer à la relance suivante
    const currentIndex = relancesAValider.value.findIndex(r => r.id === relanceCourante.value.id)
    if (currentIndex < relancesAValider.value.length - 1) {
      relanceCourante.value = { ...relancesAValider.value[currentIndex + 1] }
      originalRelanceData.value = { ...relancesAValider.value[currentIndex + 1] }
    } else {
      relanceCourante.value = null
      originalRelanceData.value = null
    }
    
    await charger()
  } catch (error) {
    console.error('Erreur validation relance:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de valider la relance', color: 'red' })
  } finally {
    validantWorkflow.value = false
  }
}

// Passer à la relance suivante
function passerRelanceWorkflow() {
  if (!relanceCourante.value) return
  
  const currentIndex = relancesAValider.value.findIndex(r => r.id === relanceCourante.value.id)
  if (currentIndex < relancesAValider.value.length - 1) {
    if (hasUnsavedChanges.value) {
      pendingRelanceSelection.value = relancesAValider.value[currentIndex + 1]
      showUnsavedChangesModal.value = true
      return
    }
    relanceCourante.value = { ...relancesAValider.value[currentIndex + 1] }
    originalRelanceData.value = { ...relancesAValider.value[currentIndex + 1] }
  }
}

// Blacklister et supprimer les relances
async function blacklistEtSupprimerRelances() {
  if (!relanceCourante.value) return
  
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    const relance = await new $parse.Query(Relance).get(relanceCourante.value.id)
    
    // Supprimer la relance
    await relance.destroy()
    
    toast.add({ title: 'Succès', description: 'Relance supprimée', color: 'green' })
    await charger()
    relanceCourante.value = null
    originalRelanceData.value = null
  } catch (error) {
    console.error('Erreur suppression relance:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de supprimer la relance', color: 'red' })
  }
}

// Supprimer une relance
async function supprimerRelance() {
  if (!relanceCourante.value) return
  
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    const relance = await new $parse.Query(Relance).get(relanceCourante.value.id)
    
    await relance.destroy()
    
    toast.add({ title: 'Succès', description: 'Relance supprimée', color: 'green' })
    await charger()
    relanceCourante.value = null
    originalRelanceData.value = null
  } catch (error) {
    console.error('Erreur suppression relance:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de supprimer la relance', color: 'red' })
  }
}

// Réessayer une relance en échec
async function reessayerRelance(row) {
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    const relance = await new $parse.Query(Relance).get(row.id)
    
    relance.set('statut', 'pending')
    await relance.save()
    
    toast.add({ title: 'Succès', description: 'Relance réessayée', color: 'green' })
    await charger()
  } catch (error) {
    console.error('Erreur réessayer relance:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de réessayer la relance', color: 'red' })
  }
}

// Valider un groupe de relances
async function validerGroupe() {
  if (selection.value.length === 0) return
  
  validantGroupe.value = true
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    
    await $parse.Object.saveAll(
      selection.value.map(r => {
        const relance = Relance.createWithoutData(r.id)
        relance.set('valide', true)
        return relance
      })
    )
    
    toast.add({ title: 'Succès', description: `${selection.value.length} relance(s) validée(s)`, color: 'green' })
    selection.value = []
    await charger()
  } catch (error) {
    console.error('Erreur validation groupe:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de valider les relances', color: 'red' })
  } finally {
    validantGroupe.value = false
  }
}

// Annuler un groupe de relances
async function annulerGroupe() {
  if (selection.value.length === 0) return
  
  annulantGroupe.value = true
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    
    await $parse.Object.destroyAll(
      selection.value.map(r => Relance.createWithoutData(r.id))
    )
    
    toast.add({ title: 'Succès', description: `${selection.value.length} relance(s) annulée(s)`, color: 'green' })
    selection.value = []
    await charger()
  } catch (error) {
    console.error('Erreur annulation groupe:', error)
    toast.add({ title: 'Erreur', description: 'Impossible d\'annuler les relances', color: 'red' })
  } finally {
    annulantGroupe.value = false
  }
}

// Créer des relances pour toutes les séquences actives
async function createRelancesForAllActiveSequences() {
  creatingRelances.value = true
  try {
    const { $parse } = useNuxtApp()
    const result = await $parse.Cloud.run('createRelancesForAllActiveSequences')
    
    toast.add({ title: 'Succès', description: `Relances créées: ${result.created} nouvelle(s) relance(s)`, color: 'green' })
    await charger()
  } catch (error) {
    console.error('Erreur création relances:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de créer les relances', color: 'red' })
  } finally {
    creatingRelances.value = false
  }
}

// Valider toutes les relances sélectionnées en masse
async function validateAllSelected() {
  if (selectedRelancesForBulk.value.length === 0) return
  
  bulkValidating.value = true
  try {
    const { $parse } = useNuxtApp()
    const Relance = $parse.Object.extend('Relance')
    
    await $parse.Object.saveAll(
      selectedRelancesForBulk.value.map(relanceId => {
        const relance = Relance.createWithoutData(relanceId)
        relance.set('valide', true)
        return relance
      })
    )
    
    toast.add({ title: 'Succès', description: `${selectedRelancesForBulk.value.length} relance(s) validée(s)`, color: 'green' })
    selectedRelancesForBulk.value = []
    await charger()
  } catch (error) {
    console.error('Erreur validation en masse:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de valider les relances', color: 'red' })
  } finally {
    bulkValidating.value = false
  }
}

// Formater une date
function formatDate(date) {
  if (!date) return '—'
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Colonnes du tableau
const colonnes = [
  { accessorKey: 'dateEnvoi', header: 'Date', enableSorting: true },
  { accessorKey: 'objet', header: 'Objet' },
  { accessorKey: 'to', header: 'Destinataire' },
  { accessorKey: 'nfacture', header: 'Facture' },
  { accessorKey: 'statut', header: 'Statut' }
]

// Tri initial
const sorting = ref([
  { id: 'dateEnvoi', desc: true }
])

// Charger les liens PDF pour les impayés
async function chargerPdfLinks() {
  try {
    const { $parse } = useNuxtApp()
    const impayes = impayesStore.allImpayes
    
    for (const impaye of impayes) {
      if (impaye.url_pdf && !pdfLinks.value[impaye.objectId]) {
        try {
          const result = await $parse.Cloud.run('generateSignedPdfLink', { impayeId: impaye.objectId })
          pdfLinks.value[impaye.objectId] = result.url
        } catch (error) {
          console.error(`Erreur génération lien PDF pour ${impaye.nfacture}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('Erreur chargement liens PDF:', error)
  }
}

// Charger les liens PDF après le chargement initial
watch(() => impayesStore.allImpayes, (newImpayes) => {
  if (newImpayes.length > 0) {
    chargerPdfLinks()
  }
}, { immediate: true })

// Rafraîchir les données quand on revient à la page
onActivated(() => {
  charger()
  chargerSequences()
  impayesStore.fetchAllImpayes()
})
</script>
