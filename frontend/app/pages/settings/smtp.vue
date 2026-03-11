<template>
  <div class="p-6 space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Profils SMTP</h1>
      <UButton icon="i-heroicons-plus" @click="ouvrirCreation">
        Nouveau profil
      </UButton>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">Chargement…</div>

    <template v-else>
      <!-- Bannière vide -->
      <UAlert
        v-if="profiles.length === 0"
        color="blue"
        icon="i-heroicons-information-circle"
        title="Aucun profil SMTP configuré"
        description="Créez un profil pour pouvoir envoyer des relances depuis vos séquences."
      />

      <!-- Table -->
      <UCard v-else :ui="{ body: { padding: 'p-0' } }">
        <UTable :data="rows" :columns="colonnes">
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <UButton
                icon="i-heroicons-pencil-square"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="ouvrirEdition(row.original)"
              />
              <UButton
                icon="i-heroicons-trash"
                color="red"
                variant="ghost"
                size="xs"
                @click="confirmerSuppression(row.original)"
              />
            </div>
          </template>
        </UTable>
      </UCard>
    </template>

    <!-- ══════════════════════════════════════
         MODAL — Confirmer suppression
    ══════════════════════════════════════ -->
    <UModal v-model:open="showDeleteModal" title="Supprimer le profil">
      <template #body>
        <div class="space-y-3">
          <p>Supprimer le profil <strong>{{ profileASupprimer?.nom }}</strong> ?</p>
          <UAlert
            v-if="usagesSequences > 0"
            color="orange"
            icon="i-heroicons-exclamation-triangle"
            :title="`Ce profil est utilisé par ${usagesSequences} séquence(s)`"
            description="Les relances planifiées avec ce profil ne pourront plus être envoyées."
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showDeleteModal = false">Annuler</UButton>
          <UButton color="red" :loading="deleting" @click="supprimerProfile">Supprimer</UButton>
        </div>
      </template>
    </UModal>

    <!-- ══════════════════════════════════════
         DRAWER — Créer / Modifier
    ══════════════════════════════════════ -->
    <SmtpDrawer
      v-model="showDrawer"
      :mode-edition="modeEdition"
      :profile="profileEnEdition"
      @saved="onDrawerSaved"
    />

  </div>
</template>

<script setup>
const { $parse } = useNuxtApp()
const toast = useToast()

// ── State ──────────────────────────────────────────────────────
const loading = ref(false)
const deleting = ref(false)
const profiles = ref([])

// Suppression
const showDeleteModal = ref(false)
const profileASupprimer = ref(null)
const usagesSequences = ref(0)

// Drawer
const showDrawer = ref(false)
const modeEdition = ref(false)
const profileEnEdition = ref(null)

// ── Table ──────────────────────────────────────────────────────
const colonnes = [
  { accessorKey: 'nom',        header: 'Nom' },
  { accessorKey: 'host',       header: 'Host' },
  { accessorKey: 'email_from', header: 'Email from' },
  { id: 'actions',             header: ' ' },
]

const rows = computed(() =>
  profiles.value.map(p => ({
    _parse:     p,
    id:         p.id,
    nom:        p.get('nom') || '—',
    host:       p.get('host') || '—',
    email_from: p.get('email_from') || '—',
  }))
)

// ── Chargement ────────────────────────────────────────────────
async function charger() {
  loading.value = true
  try {
    const q = new $parse.Query('SmtpProfile')
    q.ascending('nom')
    q.limit(100)
    profiles.value = await q.find()
  } catch (err) {
    toast.add({ title: 'Erreur chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

// ── Création / Édition ────────────────────────────────────────
function ouvrirCreation() {
  modeEdition.value = false
  profileEnEdition.value = null
  showDrawer.value = true
}

function ouvrirEdition(row) {
  modeEdition.value = true
  profileEnEdition.value = row._parse
  showDrawer.value = true
}

function onDrawerSaved() {
  showDrawer.value = false
  charger()
}

// ── Suppression ───────────────────────────────────────────────
async function confirmerSuppression(row) {
  profileASupprimer.value = row
  usagesSequences.value = 0

  // Vérifier usages dans les séquences
  try {
    const seqs = await new $parse.Query('Sequence').limit(200).find()
    let count = 0
    for (const seq of seqs) {
      const emails = seq.get('emails') || []
      if (emails.some(e => e.smtp === row.id)) count++
    }
    usagesSequences.value = count
  } catch {}

  showDeleteModal.value = true
}

async function supprimerProfile() {
  deleting.value = true
  try {
    await profileASupprimer.value._parse.destroy()
    showDeleteModal.value = false
    toast.add({ title: 'Profil supprimé', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    deleting.value = false
  }
}

onMounted(charger)
</script>
