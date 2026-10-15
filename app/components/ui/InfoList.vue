<script setup lang="ts">
// Lista de pares etiqueta / valor. `to` convierte el valor en enlace.
defineProps<{ items: { label: string; value: string; to?: string; mono?: boolean }[] }>()
</script>

<template>
  <dl class="divide-y divide-gray-100 dark:divide-gray-800">
    <div v-for="item in items" :key="item.label" class="grid grid-cols-5 gap-3 py-2 text-sm">
      <dt class="col-span-2 text-gray-500 dark:text-gray-400">{{ item.label }}</dt>
      <dd class="col-span-3 break-all text-gray-900 dark:text-gray-100" :class="{ 'font-mono': item.mono }">
        <NuxtLink v-if="item.to" :to="item.to" class="text-blue-700 hover:underline dark:text-blue-300">{{ item.value }}</NuxtLink>
        <template v-else>{{ item.value }}</template>
      </dd>
    </div>
  </dl>
</template>
