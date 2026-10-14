<script setup lang="ts">
import { DuiForm, DuiLabel, DuiInput, DuiButton, DuiAlert, DuiCard } from '@dronico/droni-kit'

definePageMeta({ layout: 'auth', auth: false })

const route = useRoute()
const { fetch: refreshSession } = useUserSession()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: form })
    await refreshSession()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await navigateTo(redirect.startsWith('/') ? redirect : '/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? 'No fue posible iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <DuiCard title="Iniciar sesión">
    <DuiForm :loading="loading" @submit="onSubmit">
      <DuiAlert v-if="error" color="danger" variant="outline">
        <i class="mdi mdi-alert-circle-outline mr-1" /> {{ error }}
      </DuiAlert>
      <DuiLabel title="Correo electrónico" icon="mdi mdi-email-outline" required>
        <DuiInput v-model="form.email" name="email" type="email" autocomplete="username" required block />
      </DuiLabel>
      <DuiLabel title="Contraseña" icon="mdi mdi-lock-outline" required>
        <DuiInput v-model="form.password" name="password" type="password" autocomplete="current-password" required block />
      </DuiLabel>
      <template #footer>
        <DuiButton type="submit" color="primary" :loading="loading" block>
          <i class="mdi mdi-login mr-1" /> Ingresar
        </DuiButton>
      </template>
    </DuiForm>
  </DuiCard>
</template>
