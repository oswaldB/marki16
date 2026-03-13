## 1. Écran de chargement dans `app.vue`

- [ ] 1.1 Ajouter `const isLoading = ref(true)` dans le `<script setup>` de `app.vue`
- [ ] 1.2 Entourer `onMounted` d'un `try/finally` : appeler `authStore.fetchCurrentUser()` puis mettre `isLoading.value = false` dans le `finally`
- [ ] 1.3 Ajouter l'overlay de chargement dans le `<template>` : `<Transition name="fade"><div v-if="isLoading" class="...">` avec logo, spinner et texte "Chargement…"
- [ ] 1.4 Ajouter les styles CSS de la transition `fade` et du spinner animé (CSS pur) dans un `<style scoped>` ou `<style>`

## 2. Vérification & ajustements

- [ ] 2.1 Tester manuellement : rafraîchir la page et vérifier que l'overlay apparaît puis disparaît proprement
- [ ] 2.2 Vérifier que l'écran de chargement disparaît aussi quand l'utilisateur n'est pas connecté (redirection `/login`)
- [ ] 2.3 Vérifier qu'il n'y a pas de flash du layout derrière l'overlay (s'assurer que `z-index` est suffisamment élevé, ex. `z-50`)
