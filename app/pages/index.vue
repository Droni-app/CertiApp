<script setup lang="ts">
import { DuiCard } from '@dronico/droni-kit'

const { user } = useUserSession()
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
      Hola, {{ user?.name }}
    </h1>
    <DuiCard title="Certificados catastrales" subtitle="Próximamente">
      <p class="text-gray-600 dark:text-gray-300">
        <i class="mdi mdi-information-outline mr-1" />
        Aquí podrás procesar los certificados catastrales.
      </p>
    </DuiCard>
  </div>
</template>
