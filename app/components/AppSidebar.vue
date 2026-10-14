<script setup lang="ts">
const emit = defineEmits<{ navigate: [] }>()

const { user, clear } = useUserSession()

// Agrega aquí las secciones del menú a medida que crezca la app
const items = [
  { label: 'Inicio', to: '/', icon: 'mdi-home-outline' },
  { label: 'Perfil', to: '/profile', icon: 'mdi-account-outline' },
]

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between gap-2 px-4 h-16 border-b border-gray-200 dark:border-gray-800">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100" @click="emit('navigate')">
        <i class="mdi mdi-file-certificate-outline text-2xl text-blue-600 dark:text-blue-400" />
        CertiApp
      </NuxtLink>
      <ThemeToggle />
    </div>

    <nav class="flex-1 overflow-y-auto p-3 space-y-1">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
        exact-active-class="!bg-blue-50 !text-blue-700 dark:!bg-blue-500/15 dark:!text-blue-300"
        @click="emit('navigate')"
      >
        <i class="mdi text-lg" :class="item.icon" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="border-t border-gray-200 dark:border-gray-800 p-3">
      <div class="flex items-center gap-3 px-3 py-2">
        <i class="mdi mdi-account-circle text-3xl text-gray-400" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{{ user?.name }}</p>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ user?.email }}</p>
        </div>
      </div>
      <button
        type="button"
        class="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
        @click="logout"
      >
        <i class="mdi mdi-logout text-lg" />
        Cerrar sesión
      </button>
    </div>
  </div>
</template>
