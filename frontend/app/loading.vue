<template>
  <div class="fixed inset-0 flex items-center justify-center bg-white z-50">
    <div class="flex flex-col items-center gap-6">
      <img src="/marki-logo.png" alt="Marki" class="h-12 w-auto" />
      <div class="spinner" />
    </div>
  </div>
</template>

<style scoped>
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0f2fe;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
