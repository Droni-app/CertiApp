<script setup lang="ts">
import { DuiCard } from '@dronico/droni-kit'

const { user } = useUserSession()
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
      Hola, {{ user?.name }}
    </h1>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <NuxtLink to="/predios" class="block">
        <DuiCard title="Consultar predios" subtitle="Información catastral completa de cada predio" class="h-full transition-shadow hover:shadow-md">
          <p class="text-gray-600 dark:text-gray-300">
            <i class="mdi mdi-home-city-outline mr-1" />
            Busca por número predial, dirección, matrícula o propietario.
          </p>
        </DuiCard>
      </NuxtLink>
      <DuiCard title="Certificados catastrales" subtitle="Próximamente">
        <p class="text-gray-600 dark:text-gray-300">
          <i class="mdi mdi-information-outline mr-1" />
          Aquí podrás procesar los certificados catastrales.
        </p>
      </DuiCard>
    </div>
  </div>
</template>
