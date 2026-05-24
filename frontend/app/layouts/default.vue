<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow-sm flex flex-col shrink-0 sticky top-0 h-screen hidden md:flex">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200">
        <img src="/marki-logo.png" alt="Marki" class="h-8 w-auto" />
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 overflow-y-auto">
        <!-- Main section -->
        <ul class="space-y-1 px-3">
          <li v-for="item in mainItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="isActive(item.to)
                ? 'bg-sky-50 text-sky-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              <UIcon :name="item.icon" class="size-5 shrink-0" />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>

        <!-- Impayés section -->
        <div class="mt-6 px-3">
          <p class="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Impayés</p>
          <ul class="space-y-1">
            <li v-for="item in impayesItems" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ml-4"
                :class="isActive(item.to)
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                <UIcon :name="item.icon" class="size-5 shrink-0" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Relances section -->
        <div class="mt-6 px-3">
          <p class="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Relances</p>
          <ul class="space-y-1">
            <li v-for="item in relancesItems" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ml-4"
                :class="isActive(item.to)
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                <UIcon :name="item.icon" class="size-5 shrink-0" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contacts section -->
        <div class="mt-6 px-3">
          <p class="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacts</p>
          <ul class="space-y-1">
            <li v-for="item in contactsItems" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ml-4"
                :class="isActive(item.to)
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                <UIcon :name="item.icon" class="size-5 shrink-0" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Settings section -->
        <div class="mt-6 px-3">
          <p class="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Paramètres</p>
          <ul class="space-y-1">
            <li v-for="item in settingsItems" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ml-4"
                :class="isActive(item.to)
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                <UIcon :name="item.icon" class="size-5 shrink-0" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>

      <!-- User footer -->
      <div class="border-t border-gray-200 p-4">
        <div class="flex items-center gap-3">
          <UAvatar
            :alt="userInitials"
            size="sm"
            class="shrink-0"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ userName }}</p>
            <p class="text-xs text-gray-500 truncate">{{ userEmail }}</p>
          </div>
          <UButton
            icon="i-heroicons-arrow-right-on-rectangle"
            color="neutral"
            variant="ghost"
            size="xs"
            title="Déconnexion"
            @click="handleLogout"
          />
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 md:ml-0 ml-0">
      <!-- Mobile dock -->
      <div class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div class="flex items-center h-20 overflow-x-auto scrollbar-hide">
          <div class="flex space-x-2 px-4">
            <!-- Main navigation items -->
            <template v-for="item in mainItems" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="flex flex-col items-center justify-center min-w-[80px] h-full transition-colors"
                :class="isActive(item.to) ? 'text-sky-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <UIcon :name="item.icon" class="size-8" />
                <span class="text-sm mt-2 font-medium">{{ item.label }}</span>
              </NuxtLink>
            </template>

            <!-- Impayés dropdown -->
            <UDropdown :items="impayesDropdownItems" :popper="{ placement: 'top' }" class="min-w-[80px] h-full">
              <button class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-700">
                <UIcon name="i-heroicons-banknotes" class="size-8" />
                <span class="text-sm mt-2 font-medium">Impayés</span>
              </button>
            </UDropdown>

            <!-- Relances dropdown -->
            <UDropdown :items="relancesDropdownItems" :popper="{ placement: 'top' }" class="min-w-[80px] h-full">
              <button class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-700">
                <UIcon name="i-heroicons-calendar-days" class="size-8" />
                <span class="text-sm mt-2 font-medium">Relances</span>
              </button>
            </UDropdown>

            <!-- Contacts dropdown -->
            <UDropdown :items="contactsDropdownItems" :popper="{ placement: 'top' }" class="min-w-[80px] h-full">
              <button class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-700">
                <UIcon name="i-heroicons-users" class="size-8" />
                <span class="text-sm mt-2 font-medium">Contacts</span>
              </button>
            </UDropdown>

            <!-- Settings dropdown -->
            <UDropdown :items="settingsDropdownItems" :popper="{ placement: 'top' }" class="min-w-[80px] h-full">
              <button class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-700">
                <UIcon name="i-heroicons-cog-6-tooth" class="size-8" />
                <span class="text-sm mt-2 font-medium">Param.</span>
              </button>
            </UDropdown>

            <!-- Logout button -->
            <button
              class="flex flex-col items-center justify-center min-w-[80px] h-full text-gray-500 hover:text-gray-700"
              @click="handleLogout"
            >
              <UIcon name="i-heroicons-arrow-right-on-rectangle" class="size-8" />
              <span class="text-sm mt-2 font-medium">Quitter</span>
            </button>
          </div>
        </div>
      </div>
      <!-- Header -->
      <header class="h-16 bg-white shadow-sm flex items-center px-6 shrink-0">
        <h2 class="text-base font-semibold text-gray-700">{{ currentPageTitle }}</h2>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-6 overflow-auto md:mb-0 mb-24">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const authStore = useAuthStore()

const mainItems = [
  { to: '/', label: 'Dashboard', icon: 'i-heroicons-home' },
]

const impayesItems = [
  { to: '/impayes', label: 'Unitaire', icon: 'i-heroicons-table-cells' },
  { to: '/impayes?vue=payeur', label: 'Par payeur', icon: 'i-heroicons-user-group' },
  { to: '/impayes?vue=contact', label: 'Par contact', icon: 'i-heroicons-user' },
  { to: '/impayes?vue=sans-sequence', label: 'Sans séquence', icon: 'i-heroicons-document-minus' },
]

const relancesItems = [
  { to: '/relances', label: 'Tableau', icon: 'i-heroicons-table-cells' },
  { to: '/relances?vue=calendrier', label: 'Calendrier', icon: 'i-heroicons-calendar-days' },
  { to: '/relances?vue=validation', label: 'Validation', icon: 'i-heroicons-check-circle' },
]

const contactsItems = [
  { to: '/contacts', label: 'Contacts', icon: 'i-heroicons-users' },
  { to: '/blacklist', label: 'Blacklist', icon: 'i-heroicons-no-symbol' },
  { to: '/a-corriger', label: 'À corriger', icon: 'i-heroicons-wrench-screwdriver' },
  { to: '/recalcitrants', label: 'Récalcitrants', icon: 'i-heroicons-exclamation-triangle' },
]

const settingsItems = [
  { to: '/sequences', label: 'Séquences', icon: 'i-heroicons-queue-list' },
  { to: '/settings/smtp', label: 'Profils SMTP', icon: 'i-heroicons-envelope' },
  { to: '/settings/users', label: 'Utilisateurs', icon: 'i-heroicons-user-group' },
  { to: '/faq', label: 'FAQ', icon: 'i-heroicons-question-mark-circle' },
]

const allItems = [...mainItems, ...impayesItems, ...relancesItems, ...contactsItems, ...settingsItems]

const isActive = (path) => {
  if (path === '/') return route.path === '/'

  // Normaliser le path en retirant les query params pour la comparaison
  const pathWithoutQuery = path.split('?')[0]

  // Vérifier si le chemin de base correspond
  if (route.path === pathWithoutQuery) {
    // Si le path a des query params, vérifier qu'ils correspondent
    if (path.includes('?')) {
      const pathQuery = path.split('?')[1]
      const routeQuery = route.query

      // Parser les query params du path
      const pathParams = new URLSearchParams(pathQuery)

      // Vérifier que tous les params du path sont présents dans la route
      for (const [key, value] of pathParams.entries()) {
        if (routeQuery[key] !== value) {
          return false
        }
      }
      return true
    }
    return true
  }

  return route.path.startsWith(pathWithoutQuery)
}

const currentPageTitle = computed(() => {
  const found = allItems.find(item => isActive(item.to))
  return found?.label ?? ''
})

// Mobile dock dropdowns
const impayesDropdownItems = computed(() => [
  ...impayesItems.map(item => ([{
    label: item.label,
    icon: item.icon,
    to: item.to
  }]))
])

const relancesDropdownItems = computed(() => [
  ...relancesItems.map(item => ([{
    label: item.label,
    icon: item.icon,
    to: item.to
  }]))
])

const contactsDropdownItems = computed(() => [
  ...contactsItems.map(item => ([{
    label: item.label,
    icon: item.icon,
    to: item.to
  }]))
])

const settingsDropdownItems = computed(() => [
  ...settingsItems.map(item => ([{
    label: item.label,
    icon: item.icon,
    to: item.to
  }]))
])

const userName = computed(() => {
  const user = authStore.user
  if (!user) return ''
  return user.get('username') || user.get('email') || ''
})

const userEmail = computed(() => {
  const user = authStore.user
  if (!user) return ''
  return user.get('email') || ''
})

const userInitials = computed(() => {
  return userName.value.slice(0, 2).toUpperCase() || 'U'
})

const handleLogout = () => {
  authStore.logout()
}
</script>

<style>
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Chrome, Safari, and Opera */
}
</style>
