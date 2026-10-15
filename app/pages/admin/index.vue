<script setup lang="ts">
import { DuiCard, DuiSkeleton } from '@dronico/droni-kit'

definePageMeta({ middleware: 'admin' })

const { data: stats, pending } = await useFetch<Record<string, number>>('/api/admin/stats')
const number = new Intl.NumberFormat('es-CO')
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
      <i class="mdi mdi-shield-crown-outline mr-1" /> Administración
    </h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <NuxtLink v-for="r in adminResources" :key="r.key" :to="`/admin/${r.key}`" class="block">
        <DuiCard class="h-full transition-shadow hover:shadow-md">
          <div class="flex items-center gap-4">
            <i class="mdi text-4xl text-blue-600 dark:text-blue-400" :class="r.icon" />
            <div>
              <p class="font-medium text-gray-800 dark:text-gray-100">{{ r.label }}</p>
              <DuiSkeleton v-if="pending" width="80px" />
              <p v-else class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ number.format(stats?.[r.key] ?? 0) }}
              </p>
            </div>
          </div>
        </DuiCard>
      </NuxtLink>
    </div>
  </div>
</template>
