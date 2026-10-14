<script setup lang="ts">
import { DuiButton, DuiDrawer } from '@dronico/droni-kit'

const drawerOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Sidebar fijo en escritorio -->
    <aside class="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <AppSidebar />
    </aside>

    <!-- Barra superior + drawer en móvil -->
    <header class="lg:hidden sticky top-0 z-30 flex items-center gap-2 h-14 px-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <DuiButton variant="ghost" size="sm" title="Abrir menú" @click="drawerOpen = true">
        <i class="mdi mdi-menu text-xl" />
      </DuiButton>
      <span class="flex-1 font-semibold text-gray-800 dark:text-gray-100">CertiApp</span>
      <ThemeToggle />
    </header>
    <ClientOnly>
      <DuiDrawer v-model="drawerOpen" position="left" size="sm" :show-close="false">
        <AppSidebar @navigate="drawerOpen = false" />
      </DuiDrawer>
    </ClientOnly>

    <main class="lg:pl-64">
      <div class="max-w-7xl mx-auto p-4 sm:p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
