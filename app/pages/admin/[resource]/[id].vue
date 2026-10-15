<script setup lang="ts">
import { DuiCard, DuiForm, DuiButton, DuiAlert, DuiModal, useToast } from '@dronico/droni-kit'

definePageMeta({ middleware: 'admin', key: (route) => route.path })

const route = useRoute()
const toast = useToast()

const found = getAdminResource(String(route.params.resource))
if (!found) throw createError({ statusCode: 404, statusMessage: 'Recurso no encontrado', fatal: true })
const resource: AdminResource = found

const id = String(route.params.id)
const isNew = id === 'nuevo'
const mode = isNew ? 'create' : 'update'
const endpoint: string = `/api/admin/${resource.key}`

const { data: record, error: loadError } = isNew
  ? { data: ref<Record<string, any> | null>(null), error: ref(null) }
  : await useFetch<Record<string, any>>(`${endpoint}/${encodeURIComponent(id)}`)

// Valores del formulario: los inputs trabajan con strings, relaciones y booleanos con su tipo
function toFormValue(field: AdminField, value: unknown) {
  if (field.type === 'boolean') return Boolean(value)
  if (field.type === 'password') return ''
  if (field.type === 'relation') return value ?? null
  if (value === null || value === undefined) return ''
  if (field.type === 'date') return String(value).slice(0, 10)
  return String(value)
}

const form = reactive<Record<string, any>>({})
function resetForm() {
  for (const field of resource.fields) {
    const source = isNew ? (route.query[field.name] ?? (field.type === 'select' ? field.options?.at(-1) : null)) : record.value?.[field.name]
    form[field.name] = toFormValue(field, source)
  }
}
resetForm()

const title = computed(() => (isNew ? `Nuevo ${resource.singular.toLowerCase()}` : record.value ? recordTitle(resource, record.value) : resource.singular))
const saving = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

async function save() {
  saving.value = true
  error.value = ''
  errors.value = {}
  const body = Object.fromEntries(
    resource.fields.filter((f) => !(mode === 'update' && f.createOnly)).map((f) => [f.name, form[f.name]]),
  )
  try {
    const url: string = isNew ? endpoint : `${endpoint}/${encodeURIComponent(id)}`
    const saved = await $fetch<Record<string, any>>(url, {
      method: isNew ? 'POST' : 'PUT',
      body,
    })
    toast.success(isNew ? `${resource.singular} creado` : 'Cambios guardados')
    if (isNew) await navigateTo(`/admin/${resource.key}/${encodeURIComponent(String(saved[resource.primaryKey.name]))}`)
    else {
      record.value = saved
      resetForm()
    }
  } catch (e: any) {
    errors.value = e?.data?.data?.errors ?? {}
    error.value = fetchErrorMessage(e, 'No fue posible guardar')
  } finally {
    saving.value = false
  }
}

const childLinks = computed(() =>
  isNew
    ? []
    : (resource.children ?? []).map((c) => {
        const child = getAdminResource(c.resource)!
        const label = c.field === 'matrixNumber' ? 'Unidades (predios)' : child.label
        return { key: `${c.resource}-${c.field}`, label, icon: child.icon, to: { path: `/admin/${child.key}`, query: { [c.field]: id } } }
      }),
)

const confirmDelete = ref(false)
const deleting = ref(false)
async function remove() {
  deleting.value = true
  try {
    const url: string = `${endpoint}/${encodeURIComponent(id)}`
    await $fetch(url, { method: 'DELETE' })
    toast.success(`${resource.singular} eliminado`)
    await navigateTo(`/admin/${resource.key}`)
  } catch (e) {
    toast.error(fetchErrorMessage(e, 'No fue posible eliminar'))
    confirmDelete.value = false
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-4 max-w-5xl">
    <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <NuxtLink to="/admin" class="hover:underline">Administración</NuxtLink>
      <i class="mdi mdi-chevron-right" />
      <NuxtLink :to="`/admin/${resource.key}`" class="hover:underline">{{ resource.label }}</NuxtLink>
    </div>
    <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 break-all">
      <i class="mdi mr-1" :class="resource.icon" /> {{ title }}
    </h1>

    <DuiAlert v-if="loadError" color="danger" variant="outline">{{ fetchErrorMessage(loadError, 'No se pudo cargar el registro') }}</DuiAlert>

    <template v-else>
      <div v-if="childLinks.length" class="flex flex-wrap gap-2">
        <DuiButton v-for="link in childLinks" :key="link.key" variant="outline" size="sm" :to="link.to">
          <i class="mdi mr-1" :class="link.icon" /> {{ link.label }}
        </DuiButton>
      </div>

      <DuiCard>
        <DuiForm :loading="saving" novalidate @submit="save">
          <DuiAlert v-if="error" color="danger" variant="outline">
            <i class="mdi mdi-alert-circle-outline mr-1" /> {{ error }}
          </DuiAlert>
          <div class="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <AdminField
              v-for="field in resource.fields"
              :key="field.name"
              v-model="form[field.name]"
              :field="field"
              :resource="resource.key"
              :mode="mode"
              :error="errors[field.name]"
              :class="{ 'md:col-span-2': field.type === 'text' }"
            />
          </div>
          <template #footer>
            <div class="flex w-full flex-wrap items-center gap-2">
              <DuiButton type="submit" color="primary" :loading="saving">
                <i class="mdi mdi-content-save-outline mr-1" /> Guardar
              </DuiButton>
              <DuiButton variant="ghost" :to="`/admin/${resource.key}`">Volver</DuiButton>
              <DuiButton v-if="!isNew" class="ml-auto" variant="outline" color="danger" @click="confirmDelete = true">
                <i class="mdi mdi-trash-can-outline mr-1" /> Eliminar
              </DuiButton>
            </div>
          </template>
        </DuiForm>
      </DuiCard>
    </template>

    <ClientOnly>
      <DuiModal v-model="confirmDelete" :title="`Eliminar ${resource.singular.toLowerCase()}`" size="sm">
        <p class="text-gray-700 dark:text-gray-300">¿Seguro que quieres eliminar <strong>{{ title }}</strong>?</p>
        <p v-if="resource.children?.length" class="mt-2 text-sm text-red-600 dark:text-red-400">
          <i class="mdi mdi-alert-outline" /> También se eliminarán sus registros relacionados.
        </p>
        <template #footer>
          <DuiButton variant="ghost" @click="confirmDelete = false">Cancelar</DuiButton>
          <DuiButton color="danger" :loading="deleting" @click="remove">Eliminar</DuiButton>
        </template>
      </DuiModal>
    </ClientOnly>
  </div>
</template>
