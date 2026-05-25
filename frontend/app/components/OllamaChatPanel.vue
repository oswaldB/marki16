<template>
  <UCard class="h-full flex flex-col">
    <!-- Header -->
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="size-5" />
          <span class="font-semibold">Chat avec Ollama</span>
          <UBadge color="blue" variant="subtle" size="xs">
            Modèle: mistral
          </UBadge>
        </div>
        <div class="flex items-center gap-2">
          <UBadge :color="contextType === 'sequence' ? 'primary' : 'neutral'" variant="subtle" size="xs">
            {{ contextType === 'sequence' ? 'Séquence complète' : `Email ${selectedEmailIndex + 1}` }}
          </UBadge>
        </div>
      </div>
    </template>

    <!-- Contenu principal -->
    <div class="flex-1 flex flex-col gap-4 min-h-0">
      <!-- Sélecteur de contexte -->
      <div class="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <div class="text-sm font-medium text-gray-700 mb-2">
          Contexte du chat
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="outline"
            size="sm"
            :color="selectedEmailIndex === null ? 'primary' : 'neutral'"
            @click="$emit('select-context', null)"
          >
            Toute la séquence
          </UButton>
          <UButton
            v-for="(email, idx) in emails"
            :key="email._key || idx"
            variant="outline"
            size="sm"
            :color="selectedEmailIndex === idx ? 'primary' : 'neutral'"
            @click="$emit('select-context', idx)"
          >
            Email {{ idx + 1 }}
          </UButton>
        </div>
        <div v-if="signature" class="mt-3 p-2 bg-white rounded border text-xs text-gray-600">
          <div class="font-medium mb-1">Signature SMTP:</div>
          <div v-html="signature" class="prose prose-sm max-w-none" />
        </div>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto min-h-0 space-y-3">
        <div v-if="messages.length === 0" class="text-center text-gray-400 py-8">
          <UIcon name="i-heroicons-chat-bubble-oval-left-ellipsis" class="size-8 mx-auto mb-2" />
          <p>Commencez une conversation avec Ollama</p>
          <p class="text-xs mt-1">Posez vos questions sur la rédaction de vos emails</p>
        </div>

        <template v-else>
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="flex gap-2"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] rounded-xl px-3 py-2"
              :class="{
                'bg-primary-50 text-primary-900 rounded-br-none': msg.role === 'user',
                'bg-gray-100 text-gray-800 rounded-bl-none': msg.role === 'assistant'
              }"
            >
              <div class="flex items-start gap-2">
                <UIcon
                  v-if="msg.role === 'user'"
                  name="i-heroicons-user-circle"
                  class="size-4 mt-0.5 shrink-0"
                />
                <UIcon
                  v-if="msg.role === 'assistant'"
                  name="i-heroicons-cpu-chip"
                  class="size-4 mt-0.5 shrink-0"
                />
                <div class="whitespace-pre-wrap">
                  {{ msg.content }}
                </div>
              </div>
              <div class="text-xs text-gray-400 mt-1 flex justify-end">
                {{ formatTime(msg.timestamp) }}
              </div>
            </div>
          </div>
        </template>

        <!-- Loading indicator -->
        <div v-if="loading" class="flex justify-start gap-2">
          <div class="bg-gray-100 rounded-xl px-3 py-2 rounded-bl-none">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-cpu-chip" class="size-4" />
              <div class="flex gap-1">
                <span class="animate-pulse">●</span>
                <span class="animate-pulse" style="animation-delay: 0.2s">●</span>
                <span class="animate-pulse" style="animation-delay: 0.4s">●</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Variables disponibles -->
      <div v-if="formattedVariables" class="border-t pt-3">
        <div class="text-xs text-gray-500 mb-1">
          Variables disponibles: <span class="font-mono">{{ formattedVariables }}</span>
        </div>
      </div>

      <!-- Input -->
      <div class="border-t pt-3">
        <div class="flex gap-2">
          <UInput
            v-model="currentInput"
            placeholder="Ex: Rédige un email de relance pour un impayé de plus de 30 jours..."
            class="flex-1"
            :disabled="loading"
            @keyup.enter="handleSend"
          />
          <UButton
            icon="i-heroicons-paper-airplane"
            color="primary"
            :disabled="!currentInput.trim() || loading"
            :loading="loading"
            @click="handleSend"
          />
        </div>
        <div class="flex gap-2 mt-2 justify-end">
          <UButton
            v-if="currentResponse"
            variant="outline"
            size="sm"
            icon="i-heroicons-clipboard"
            @click="$emit('copy-response')"
          >
            Copier
          </UButton>
          <UButton
            v-if="currentResponse"
            variant="outline"
            size="sm"
            icon="i-heroicons-document-duplicate"
            @click="$emit('insert-response')"
          >
            Insérer dans l'éditeur
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup>
const props = defineProps({
  loading: Boolean,
  messages: Array,
  currentInput: String,
  currentResponse: String,
  selectedEmailIndex: Number,
  contextType: String,
  formattedVariables: String,
  emails: Array,
  signature: String
})

const emit = defineEmits(['send-message', 'select-context', 'copy-response', 'insert-response'])

function handleSend() {
  emit('send-message')
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
/* Scrollbar pour la zone de messages */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
