/**
 * Composable pour le chat avec Ollama sur les séquences
 * Utilise la Cloud Function 'chatSequence' du backend
 */

import { VARIABLES } from '~/composables/useSequenceEditor'

export function useOllamaChat(sequenceId, allVariables) {
    const { $parse } = useNuxtApp()
    const toast = useToast()

    // State
    const loading = ref(false)
    const messages = ref([]) // Historique des messages: { role: 'user'|'assistant', content: string, timestamp: Date }
    const currentInput = ref('')
    const selectedEmailIndex = ref(null) // null = toute la séquence, sinon index de l'email
    const currentResponse = ref('')
    const variablesUsed = ref([])
    const emailDetails = ref(null) // Détails de l'email sélectionné
    const signature = ref('') // Signature SMTP de l'email sélectionné

    // Contexte de la séquence
    const contextType = computed(() => selectedEmailIndex.value !== null ? 'email' : 'sequence')

    // Todas les variables disponibles (合并 depuis allVariables prop)
    const allVars = computed(() => {
        if (allVariables && allVariables.value) {
            return allVariables.value.flatMap(g => g.vars.map(v => v.name || v))
        }
        return VARIABLES.flatMap(g => g.vars)
    })

    /**
     * Initialise le chat
     */
    function initChat() {
        messages.value = []
        currentInput.value = ''
        currentResponse.value = ''
        selectedEmailIndex.value = null
        emailDetails.value = null
        signature.value = ''
    }

    /**
     * Sélectionne un email comme contexte
     */
    async function selectEmailContext(emailIndex) {
        selectedEmailIndex.value = emailIndex
        currentInput.value = ''
        
        if (emailIndex !== null) {
            // Charger les détails de l'email via le backend
            try {
                const result = await $parse.Cloud.run('getEmailForDisplay', {
                    sequenceId: sequenceId,
                    emailIndex: emailIndex
                })
                emailDetails.value = result.emailDetails
                signature.value = result.signature || ''
            } catch (err) {
                console.error('Erreur chargement email:', err)
                toast.add({ title: 'Erreur', description: 'Impossible de charger l\'email', color: 'red' })
            }
        } else {
            emailDetails.value = null
            signature.value = ''
        }
    }

    /**
     * Appelle la Cloud Function pour chatter avec Ollama
     */
    async function sendMessage() {
        if (!currentInput.value.trim() || loading.value) return

        const userMessage = currentInput.value.trim()
        
        // Ajouter le message utilisateur à l'historique
        messages.value.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
            emailIndex: selectedEmailIndex.value
        })

        loading.value = true
        currentInput.value = ''
        currentResponse.value = ''

        try {
            const result = await $parse.Cloud.run('chatSequence', {
                sequenceId: sequenceId,
                emailIndex: selectedEmailIndex.value,
                message: userMessage,
                history: messages.value,
                contextType: contextType.value
            })

            // Ajouter la réponse assistant à l'historique
            messages.value.push({
                role: 'assistant',
                content: result.response,
                timestamp: new Date(),
                emailIndex: selectedEmailIndex.value
            })

            currentResponse.value = result.response
            variablesUsed.value = result.variables || []
            
            // Mettre à jour la signature si on est sur un email
            if (selectedEmailIndex.value !== null && result.signature) {
                signature.value = result.signature
            }

        } catch (err) {
            console.error('Erreur Ollama:', err)
            toast.add({
                title: 'Erreur',
                description: err.message || 'Impossible de contacter Ollama',
                color: 'red'
            })
            // Ajouter un message d'erreur
            messages.value.push({
                role: 'assistant',
                content: `Désolé, une erreur est survenue: ${err.message || 'Service temporairement indisponible'}`,
                timestamp: new Date(),
                error: true
            })
        } finally {
            loading.value = false
        }
    }

    /**
     * Copie la réponse actuelle dans le presse-papier
     */
    async function copyResponse() {
        if (!currentResponse.value) {
            toast.add({ title: 'Rien à copier', color: 'neutral' })
            return
        }
        try {
            await navigator.clipboard.writeText(currentResponse.value)
            toast.add({ title: 'Copié!', color: 'green', timeout: 2000 })
        } catch (err) {
            toast.add({ title: 'Erreur de copie', description: err.message, color: 'red' })
        }
    }

    /**
     * Insère la réponse dans l'éditeur d'email (callback à implémenter par le parent)
     */
    function insertIntoEditor() {
        if (!currentResponse.value) {
            toast.add({ title: 'Rien à insérer', color: 'neutral' })
            return
        }
        // Cette fonction sera override par le composant parent
        // qui a accès à l'éditeur
    }

    /**
     * Formate les variables pour affichage
     */
    const formattedVariables = computed(() => {
        const vars = allVars.value
        if (vars.length === 0) return 'Aucune variable'
        return vars.join(', ')
    })

    return {
        // State
        loading,
        messages,
        currentInput,
        currentResponse,
        selectedEmailIndex,
        contextType,
        variablesUsed,
        emailDetails,
        signature,
        allVars,
        formattedVariables,
        
        // Methods
        initChat,
        sendMessage,
        selectEmailContext,
        copyResponse,
        insertIntoEditor
    }
}
