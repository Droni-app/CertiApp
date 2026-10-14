<script setup lang="ts">
import { DuiButton } from '@dronico/droni-kit'

const { isDark, toggle } = useTheme()
</script>

<template>
  <DuiButton
    variant="ghost"
    size="sm"
    :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    @click="toggle"
  >
    <i class="mdi text-xl" :class="isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'" />
  </DuiButton>
</template>
