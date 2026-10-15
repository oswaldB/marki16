<template>
  <USlideover
    v-model:open="localOpen"
    side="right"
    :ui="{ content: 'w-full md:w-1/2 max-w-none' }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-lg">Email de suivi</span>
          <UBadge v-if="suivi" :color="statutColor(suivi.statut)" variant="subtle" size="xs">
            {{ statutLabel(suivi.statut) }}
          </UBadge>
        </div>
      </div>
    </template>

    <template v-if="suivi" #body>
      <div class="space-y-4 py-2">
        <UAlert
          v-if="suivi.lastError"
          color="red"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle"
          title="Dernière erreur d'envoi"
          :description="suivi.lastError"
        />

        <div>
          <label class="text-xs text-gray-500 mb-1 block">Destinataire (contact)</label>
          <UInput :model-value="suivi.email" disabled class="w-full" />
        </div>

        <div>
          <label class="text-xs text-gray-500 mb-1 block">CC</label>
          <UInput v-model="cc" placeholder="emails séparés par des virgules" class="w-full" />
        </div>

        <div>
          <label class="text-xs text-gray-500 mb-1 block">Objet</label>
          <UInput v-model="objet" class="w-full" />
        </div>

        <div>
          <label class="text-xs text-gray-500 mb-1 block">Corps</label>
          <div class="border border-gray-200 rounded-md overflow-hidden">
            <ClientOnly>
              <ToastuiEditor
                v-if="editorVisible"
                ref="editorRef"
                :initial-value="corps"
                :options="{ minHeight: '420px', usageStatistics: false, hideModeSwitch: true }"
                initial-edit-type="wysiwyg"
              />
              <template #fallback>
                <div class="p-3 text-gray-400 text-sm">Chargement de l'éditeur…</div>
              </template>
            </ClientOnly>
          </div>
        </div>

        <!-- Factures concernées -->
        <div v-if="suivi.impayes?.length" class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
            Factures concernées ({{ suivi.impayes.length }})
          </div>
          <div
            v-for="imp in suivi.impayes"
            :key="imp.id"
            class="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-b-0"
          >
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-document-text" class="size-4 text-gray-400" />
              <NuxtLink :to="`/impayes/${imp.id}`" class="font-mono text-sky-700 hover:underline">
                {{ imp.nfacture }}
              </NuxtLink>
            </div>
            <span class="text-sm text-gray-600">{{ formatMontant(imp.reste_a_payer) }}</span>
          </div>
        </div>

        <UAlert
          icon="i-heroicons-information-circle"
          color="info"
          variant="subtle"
          description="Le corps de l'email contient les liens vers les factures et l'espace client. Aucune pièce jointe PDF n'est ajoutée automatiquement pour les suivis."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="localOpen = false">Annuler</UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-heroicons-check"
          :loading="saving"
          @click="enregistrer()"
        >
          Enregistrer
        </UButton>
        <UButton
          icon="i-heroicons-paper-airplane"
          color="primary"
          :loading="sending"
          :disabled="saving"
          @click="envoyer"
        >
          Envoyer l'email
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup>
import ToastuiEditor from '~/components/ToastuiEditor.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  suivi: { type: Object, default: null },
})

const emit = defineEmits(['update:open', 'saved', 'sent'])

const { $parse } = useNuxtApp()
const toast = useToast()

const localOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const cc = ref('')
const objet = ref('')
const corps = ref('')
const editorVisible = ref(false)
const editorRef = ref(null)
const saving = ref(false)
const sending = ref(false)

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function statutColor(statut) {
  if (statut === 'Envoyée') return 'green'
  if (statut === "Erreur d'envoi") return 'red'
  if (statut === 'pret pour envoi') return 'blue'
  if (statut === 'brouillon') return 'orange'
  return 'neutral'
}

function statutLabel(statut) {
  if (statut === 'brouillon') return 'À envoyer'
  if (statut === 'pret pour envoi') return 'Planifié'
  return statut
}

watch(
  () => [props.open, props.suivi?.id],
  () => {
    if (!props.open || !props.suivi) return
    cc.value = props.suivi.cc || ''
    objet.value = props.suivi.objet || ''
    corps.value = props.suivi.corps || ''
    editorVisible.value = false
    setTimeout(() => { editorVisible.value = true }, 250)
  },
  { immediate: true },
)

async function enregistrer({ silent = false } = {}) {
  if (!props.suivi?._parse) return false
  saving.value = true
  try {
    const s = props.suivi._parse
    const html = editorRef.value?.getInstance?.().getHTML?.()
    s.set('cc', cc.value)
    s.set('objet', objet.value)
    if (html != null) s.set('corps', html)

    await s.save()

    props.suivi.cc = cc.value
    props.suivi.objet = objet.value
    if (html != null) props.suivi.corps = html

    if (!silent) {
      toast.add({ title: 'Suivi enregistré', color: 'green' })
    }
    emit('saved')
    return true
  } catch (err) {
    toast.add({ title: 'Erreur enregistrement', description: err.message, color: 'red' })
    return false
  } finally {
    saving.value = false
  }
}

async function envoyer() {
  if (!props.suivi?.id) return
  const ok = await enregistrer({ silent: true })
  if (!ok) return

  sending.value = true
  try {
    const res = await $parse.Cloud.run('sendSuivis', { suiviIds: [props.suivi.id] })
    const stats = res?.stats || res?.result || {}
    const erreurs = stats?.suivisErreurs ?? res?.errors?.length ?? 0

    if (erreurs > 0) {
      const detail = res?.errors?.[0]?.erreur || 'Voir la dernière erreur du suivi.'
      toast.add({
        title: "L'email n'a pas pu être envoyé",
        description: detail,
        color: 'red',
      })
    } else {
      toast.add({ title: 'Email envoyé', color: 'green' })
    }
    emit('sent')
    localOpen.value = false
  } catch (err) {
    toast.add({ title: "Erreur d'envoi", description: err.message, color: 'red' })
  } finally {
    sending.value = false
  }
}
</script>
