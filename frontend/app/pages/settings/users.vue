<template>
  <div class="p-6 space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
      <UButton icon="i-heroicons-plus" @click="ouvrirCreation">
        Nouvel utilisateur
      </UButton>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">Chargement…</div>

    <template v-else>
      <UAlert
        v-if="users.length === 0"
        color="blue"
        icon="i-heroicons-information-circle"
        title="Aucun utilisateur"
        description="Créez le premier compte administrateur."
      />

      <UCard v-else :ui="{ body: { padding: 'p-0' } }">
        <UTable :data="rows" :columns="colonnes">

          <!-- Badge rôle -->
          <template #role-cell="{ row }">
            <UBadge
              :color="row.original.isAdmin ? 'amber' : 'neutral'"
              variant="soft"
              size="xs"
            >
              {{ row.original.isAdmin ? 'Admin' : 'Utilisateur' }}
            </UBadge>
          </template>

          <!-- Actions -->
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <!-- Changer mot de passe -->
              <UButton
                icon="i-heroicons-key"
                color="neutral"
                variant="ghost"
                size="xs"
                title="Changer le mot de passe"
                @click="ouvrirChangerMdp(row.original)"
              />
              <!-- Toggle admin -->
              <UButton
                :icon="row.original.isAdmin ? 'i-heroicons-shield-check' : 'i-heroicons-shield-exclamation'"
                :color="row.original.isAdmin ? 'amber' : 'neutral'"
                variant="ghost"
                size="xs"
                :title="row.original.isAdmin ? 'Rétrograder' : 'Promouvoir admin'"
                :disabled="row.original.id === currentUserId && row.original.isAdmin"
                @click="toggleAdmin(row.original)"
              />
              <!-- Supprimer -->
              <UButton
                icon="i-heroicons-trash"
                color="red"
                variant="ghost"
                size="xs"
                :disabled="row.original.id === currentUserId"
                @click="confirmerSuppression(row.original)"
              />
            </div>
          </template>

        </UTable>
      </UCard>
    </template>

    <!-- ══════════════════════════════════════
         MODAL — Créer un utilisateur
    ══════════════════════════════════════ -->
    <UModal v-model:open="showCreateModal" title="Nouvel utilisateur">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Email" required>
            <UInput v-model="form.email" type="email" placeholder="prenom.nom@exemple.fr" class="w-full" />
          </UFormField>
          <UFormField label="Mot de passe" required>
            <UInput v-model="form.password" type="password" placeholder="Mot de passe temporaire" class="w-full" />
          </UFormField>
          <UCheckbox v-model="form.makeAdmin" label="Administrateur" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showCreateModal = false">Annuler</UButton>
          <UButton :loading="saving" @click="creerUtilisateur">Créer</UButton>
        </div>
      </template>
    </UModal>

    <!-- ══════════════════════════════════════
         MODAL — Changer mot de passe
    ══════════════════════════════════════ -->
    <UModal v-model:open="showPasswordModal" title="Changer le mot de passe">
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-gray-600">Utilisateur : <strong>{{ userEnAction?.email }}</strong></p>
          <UFormField label="Nouveau mot de passe" required>
            <UInput v-model="form.newPassword" type="password" placeholder="Nouveau mot de passe" class="w-full" />
          </UFormField>
          <UFormField label="Confirmer">
            <UInput v-model="form.confirmPassword" type="password" placeholder="Confirmation" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showPasswordModal = false">Annuler</UButton>
          <UButton :loading="saving" @click="changerMotDePasse">Enregistrer</UButton>
        </div>
      </template>
    </UModal>

    <!-- ══════════════════════════════════════
         MODAL — Confirmer suppression
    ══════════════════════════════════════ -->
    <UModal v-model:open="showDeleteModal" title="Supprimer l'utilisateur">
      <template #body>
        <p>Supprimer le compte <strong>{{ userEnAction?.email }}</strong> ? Cette action est irréversible.</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showDeleteModal = false">Annuler</UButton>
          <UButton color="red" :loading="saving" @click="supprimerUtilisateur">Supprimer</UButton>
        </div>
      </template>
    </UModal>

  </div>
</template>

<script setup>
definePageMeta({ middleware: 'admin' })

const { $parse } = useNuxtApp()
const toast = useToast()

// ── State ──────────────────────────────────────────────────────
const loading = ref(false)
const saving  = ref(false)
const users   = ref([])

const currentUserId = computed(() => $parse.User.current()?.id)

// Modales
const showCreateModal   = ref(false)
const showPasswordModal = ref(false)
const showDeleteModal   = ref(false)
const userEnAction      = ref(null)

// Formulaire unifié
const form = reactive({
  email:           '',
  password:        '',
  makeAdmin:       false,
  newPassword:     '',
  confirmPassword: '',
})

// ── Table ──────────────────────────────────────────────────────
const colonnes = [
  { accessorKey: 'email',     header: 'Email' },
  { id: 'role',               header: 'Rôle' },
  { accessorKey: 'createdAt', header: 'Créé le' },
  { id: 'actions',            header: ' ' },
]

const rows = computed(() =>
  users.value.map(u => ({
    ...u,
    createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—',
  }))
)

// ── Chargement ────────────────────────────────────────────────
async function charger() {
  loading.value = true
  try {
    users.value = await $parse.Cloud.run('listUsers')
  } catch (err) {
    toast.add({ title: 'Erreur chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

// ── Création ──────────────────────────────────────────────────
function ouvrirCreation() {
  form.email     = ''
  form.password  = ''
  form.makeAdmin = false
  showCreateModal.value = true
}

async function creerUtilisateur() {
  if (!form.email || !form.password) {
    toast.add({ title: 'Champs requis', description: 'Email et mot de passe obligatoires', color: 'orange' })
    return
  }
  saving.value = true
  try {
    await $parse.Cloud.run('createUser', {
      email: form.email,
      password: form.password,
      makeAdmin: form.makeAdmin,
    })
    showCreateModal.value = false
    toast.add({ title: 'Utilisateur créé', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

// ── Changer mot de passe ───────────────────────────────────────
function ouvrirChangerMdp(user) {
  userEnAction.value     = user
  form.newPassword       = ''
  form.confirmPassword   = ''
  showPasswordModal.value = true
}

async function changerMotDePasse() {
  if (!form.newPassword) {
    toast.add({ title: 'Mot de passe vide', color: 'orange' })
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    toast.add({ title: 'Les mots de passe ne correspondent pas', color: 'orange' })
    return
  }
  saving.value = true
  try {
    await $parse.Cloud.run('updateUserPassword', {
      userId: userEnAction.value.id,
      newPassword: form.newPassword,
    })
    showPasswordModal.value = false
    toast.add({ title: 'Mot de passe mis à jour', color: 'green' })
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

// ── Toggle admin ───────────────────────────────────────────────
async function toggleAdmin(user) {
  try {
    await $parse.Cloud.run('setAdminRole', {
      userId: user.id,
      makeAdmin: !user.isAdmin,
    })
    toast.add({
      title: user.isAdmin ? 'Droits admin retirés' : 'Utilisateur promu admin',
      color: 'green',
    })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

// ── Suppression ───────────────────────────────────────────────
function confirmerSuppression(user) {
  userEnAction.value  = user
  showDeleteModal.value = true
}

async function supprimerUtilisateur() {
  saving.value = true
  try {
    await $parse.Cloud.run('deleteUser', { userId: userEnAction.value.id })
    showDeleteModal.value = false
    toast.add({ title: 'Utilisateur supprimé', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

onMounted(charger)
</script>
