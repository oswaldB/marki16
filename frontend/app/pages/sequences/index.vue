<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Séquences</h1>
      <UButton icon="i-heroicons-plus" :loading="creating" @click="nouvelleSequence">
        Nouvelle séquence
      </UButton>
    </div>

    <UCard :ui="{ body: { padding: 'p-0' } }">
      <UTable :data="rows" :columns="columns" :loading="loading">
        <template #nom-cell="{ row }">
          <NuxtLink :to="`/sequences/${row.original.id}`" class="text-sky-700 hover:underline font-medium">
            {{ row.original.nom }}
          </NuxtLink>
        </template>

        <template #publiee-cell="{ row }">
          <UBadge :color="row.original.publiee ? 'success' : 'neutral'" variant="subtle" size="sm">
            {{ row.original.publiee ? 'Publiée' : 'Brouillon' }}
          </UBadge>
        </template>

        <template #emails_count-cell="{ row }">
          {{ row.original.emails_count }}
        </template>

        <template #impayes_count-cell="{ row }">
          {{ row.original.impayes_count }}
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              icon="i-heroicons-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              :to="`/sequences/${row.original.id}`"
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

    <!-- Modal confirmation suppression -->
    <UModal v-model:open="showDeleteModal" title="Supprimer la séquence">
      <template #body>
        <div class="space-y-3">
          <p>Supprimer <strong>{{ seqASupprimer?.nom }}</strong> ?</p>
          <UAlert
            v-if="seqASupprimer?.impayes_count > 0"
            color="orange"
            :title="`${seqASupprimer?.impayes_count} impayé(s) assignés seront sans séquence`"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showDeleteModal = false">Annuler</UButton>
          <UButton color="red" :loading="deleting" @click="supprimerSequence">Supprimer</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
const { $parse } = useNuxtApp()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const creating = ref(false)
const deleting = ref(false)
const sequences = ref([])
const showDeleteModal = ref(false)
const seqASupprimer = ref(null)

const columns = [
  { accessorKey: 'nom',          header: 'Nom' },
  { accessorKey: 'publiee',      header: 'Statut' },
  { accessorKey: 'emails_count', header: 'Emails' },
  { accessorKey: 'impayes_count',header: 'Impayés' },
  { id: 'actions',               header: 'Actions' },
]

const rows = computed(() =>
  sequences.value.map(s => ({
    id: s.id,
    nom: s.get('nom'),
    publiee: s.get('publiee') || false,
    emails_count: (s.get('emails') || []).length,
    impayes_count: s._impayes_count ?? 0,
    _seq: s,
  }))
)

async function charger() {
  loading.value = true
  try {
    const q = new $parse.Query('Sequence')
    q.ascending('nom')
    q.limit(200)
    const seqs = await q.find()

    const counts = await Promise.all(
      seqs.map(seq => {
        const ptr = $parse.Object.fromJSON({ __type: 'Pointer', className: 'Sequence', objectId: seq.id })
        return new $parse.Query('Impaye').equalTo('sequence', ptr).count()
      })
    )
    seqs.forEach((seq, i) => { seq._impayes_count = counts[i] })
    sequences.value = seqs
  } catch (err) {
    toast.add({ title: 'Erreur de chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function nouvelleSequence() {
  creating.value = true
  try {
    const seq = new $parse.Object('Sequence')
    seq.set('nom', 'Nouvelle séquence')
    seq.set('emails', [])
    seq.set('regles', [])
    seq.set('regles_type', 'incluant')
    seq.set('lien_paiement', '')
    await seq.save()
    router.push('/sequences/' + seq.id)
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
    creating.value = false
  }
}

function confirmerSuppression(row) {
  seqASupprimer.value = row
  showDeleteModal.value = true
}

async function supprimerSequence() {
  deleting.value = true
  try {
    await seqASupprimer.value._seq.destroy()
    showDeleteModal.value = false
    toast.add({ title: 'Séquence supprimée', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    deleting.value = false
  }
}

onMounted(charger)
</script>
