<script setup lang="ts">
import { DuiCard, DuiForm, DuiLabel, DuiInput, DuiButton, DuiAlert, DuiBadge, useToast } from '@dronico/droni-kit'

const { user } = useUserSession()
const toast = useToast()

const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')

const confirmError = computed(() =>
  form.confirmPassword && form.confirmPassword !== form.newPassword ? 'Las contraseñas no coinciden' : undefined,
)

async function onSubmit() {
  if (confirmError.value) return
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/profile/password', {
      method: 'PUT',
      body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
    })
    Object.assign(form, { currentPassword: '', newPassword: '', confirmPassword: '' })
    toast.success('Contraseña actualizada correctamente')
  } catch (e: any) {
    error.value = e?.data?.statusMessage === 'Validation Error'
      ? 'La nueva contraseña debe tener al menos 8 caracteres'
      : e?.data?.statusMessage ?? 'No fue posible cambiar la contraseña'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
      <i class="mdi mdi-account-outline mr-1" /> Perfil
    </h1>

    <DuiCard title="Información">
      <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <dt class="text-gray-500 dark:text-gray-400">Nombre</dt>
          <dd class="font-medium text-gray-800 dark:text-gray-100">{{ user?.name }}</dd>
        </div>
        <div>
          <dt class="text-gray-500 dark:text-gray-400">Correo</dt>
          <dd class="font-medium text-gray-800 dark:text-gray-100 break-all">{{ user?.email }}</dd>
        </div>
        <div>
          <dt class="text-gray-500 dark:text-gray-400">Rol</dt>
          <dd>
            <DuiBadge :color="user?.role === 'admin' ? 'primary' : 'neutral'">{{ user?.role }}</DuiBadge>
          </dd>
        </div>
      </dl>
    </DuiCard>

    <DuiCard title="Cambiar contraseña">
      <DuiForm :loading="loading" @submit="onSubmit">
        <DuiAlert v-if="error" color="danger" variant="outline">
          <i class="mdi mdi-alert-circle-outline mr-1" /> {{ error }}
        </DuiAlert>
        <DuiLabel title="Contraseña actual" icon="mdi mdi-lock-outline" required>
          <DuiInput v-model="form.currentPassword" type="password" autocomplete="current-password" required block />
        </DuiLabel>
        <DuiLabel title="Nueva contraseña" icon="mdi mdi-lock-reset" help-text="Mínimo 8 caracteres" required>
          <DuiInput v-model="form.newPassword" type="password" autocomplete="new-password" minlength="8" required block />
        </DuiLabel>
        <DuiLabel title="Confirmar nueva contraseña" icon="mdi mdi-lock-check-outline" :error="confirmError" required>
          <DuiInput v-model="form.confirmPassword" type="password" autocomplete="new-password" required block />
        </DuiLabel>
        <template #footer>
          <DuiButton type="submit" color="primary" :loading="loading" :disabled="!!confirmError">
            <i class="mdi mdi-content-save-outline mr-1" /> Guardar contraseña
          </DuiButton>
        </template>
      </DuiForm>
    </DuiCard>
  </div>
</template>
