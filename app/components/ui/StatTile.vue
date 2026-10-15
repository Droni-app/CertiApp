<script setup lang="ts">
import { DuiCard } from '@dronico/droni-kit'

defineProps<{ label: string; value: string; icon: string; hint?: string; trend?: number | null }>()
</script>

<template>
  <DuiCard class="h-full">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</p>
        <p class="mt-1 truncate text-2xl font-semibold text-gray-900 dark:text-white" :title="value">{{ value }}</p>
        <p v-if="trend !== undefined && trend !== null" class="mt-1 text-xs" :class="trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
          <i class="mdi" :class="trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" />
          {{ trend >= 0 ? '+' : '' }}{{ trend.toFixed(1) }}% {{ hint }}
        </p>
        <p v-else-if="hint" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ hint }}</p>
      </div>
      <i class="mdi text-3xl text-blue-600/70 dark:text-blue-400/70" :class="icon" />
    </div>
  </DuiCard>
</template>
