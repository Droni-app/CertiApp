<script setup lang="ts">
import { DuiToast } from '@dronico/droni-kit'
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- droni-kit usa Teleport: se renderiza solo en cliente para evitar mismatches de hidratación -->
  <ClientOnly>
    <DuiToast position="top-right" />
  </ClientOnly>
</template>
