<script setup lang="ts">
import { DuiTable, DuiButton, DuiInput, DuiSelect, DuiBadge, DuiModal, DuiAlert, useToast } from '@dronico/droni-kit'

definePageMeta({ middleware: 'admin', key: (route) => String(route.params.resource) })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const found = getAdminResource(String(route.params.resource))
if (!found) throw createError({ statusCode: 404, statusMessage: 'Recurso no encontrado', fatal: true })
const resource: AdminResource = found

const pk = resource.primaryKey.name
const reserved = ['page', 'search', 'sort', 'dir']

// Filtros exactos que llegan por la URL (ej. ?propertyNumber=...)
const filters = computed(() =>
  resource.fields
    .filter((f) => route.query[f.name] !== undefined && route.query[f.name] !== '')
    .map((f) => ({ field: f, value: String(route.query[f.name]) })),
)

const query = computed(() => ({ ...route.query, pageSize: 20 }))
const { data, pending, error, refresh } = await useFetch<{ items: Record<string, any>[]; total: number; page: number; pageSize: number }>(
  `/api/admin/${resource.key}`,
  { query },
)

function setQuery(patch: Record<string, string | number | undefined>) {
  router.replace({ query: { ...route.query, ...patch } })
}

// Búsqueda con debounce
const search = ref(String(route.query.search ?? ''))
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => setQuery({ search: value || undefined, page: undefined }), 400)
})

const sortOptions = [resource.primaryKey.name === 'id' ? { label: 'ID', value: 'id' } : null, ...resource.fields
  .filter((f) => !['password', 'relation', 'text'].includes(f.type) || f.name === 'propertyNumber')
  .map((f) => ({ label: f.label, value: f.name }))].filter(Boolean) as { label: string; value: string }[]
const sort = computed({
  get: () => String(route.query.sort ?? resource.defaultSort.field),
  set: (value) => setQuery({ sort: value, page: undefined }),
})
const dir = computed(() => String(route.query.dir ?? resource.defaultSort.dir))

const columns = [...resource.columns.map((c) => ({ name: c.name, label: c.label })), { name: 'actions', label: '', classes: 'w-px' }]
const rows = computed(() =>
  (data.value?.items ?? []).map((item) => ({
    ...Object.fromEntries(resource.columns.map((c) => [c.name, formatAdminValue(getPath(item, c.name), c.type)])),
    __id: String(item[pk]),
    __title: recordTitle(resource, item),
  })),
)

const newLink = computed(() => ({
  path: `/admin/${resource.key}/nuevo`,
  query: Object.fromEntries(filters.value.map((f) => [f.field.name, f.value])),
}))

// Eliminación
const toDelete = ref<{ id: string; title: string } | null>(null)
const deleting = ref(false)
async function confirmDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    const url: string = `/api/admin/${resource.key}/${encodeURIComponent(toDelete.value.id)}`
    await $fetch(url, { method: 'DELETE' })
    toast.success(`${resource.singular} eliminado`)
    toDelete.value = null
    await refresh()
  } catch (e) {
    toast.error(fetchErrorMessage(e, 'No fue posible eliminar'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
        <i class="mdi mr-1" :class="resource.icon" /> {{ resource.label }}
      </h1>
      <DuiButton color="primary" :to="newLink">
        <i class="mdi mdi-plus mr-1" /> Nuevo
      </DuiButton>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <i class="mdi mdi-magnify absolute left-3 top-2.5 text-gray-400" />
        <DuiInput v-model="search" placeholder="Buscar..." class="!pl-9" block />
      </div>
      <div class="flex items-center gap-2">
        <DuiSelect v-model="sort" :options="sortOptions" item-label="label" item-value="value" :block="false" />
        <DuiButton
          variant="outline"
          :title="dir === 'asc' ? 'Ascendente' : 'Descendente'"
          @click="setQuery({ dir: dir === 'asc' ? 'desc' : 'asc', page: undefined })"
        >
          <i class="mdi" :class="dir === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending'" />
        </DuiButton>
      </div>
    </div>

    <div v-if="filters.length" class="flex flex-wrap gap-2">
      <DuiBadge v-for="f in filters" :key="f.field.name" color="primary" variant="soft">
        {{ f.field.label }}: {{ f.value }}
        <button type="button" class="ml-1" title="Quitar filtro" @click="setQuery({ [f.field.name]: undefined, page: undefined })">
          <i class="mdi mdi-close" />
        </button>
      </DuiBadge>
    </div>

    <DuiAlert v-if="error" color="danger" variant="outline">{{ fetchErrorMessage(error) }}</DuiAlert>

    <div class="overflow-x-auto">
      <DuiTable
        :columns="columns"
        :rows="rows"
        :loading="pending"
        :pagination="data ? { page: data.page, perPage: data.pageSize, total: data.total } : undefined"
        @paginate="(page: number) => setQuery({ page })"
      >
        <template #actions="row">
          <div class="flex justify-end gap-1 whitespace-nowrap">
            <DuiButton variant="ghost" size="sm" title="Editar" :to="`/admin/${resource.key}/${encodeURIComponent(row.__id)}`">
              <i class="mdi mdi-pencil-outline" />
            </DuiButton>
            <DuiButton variant="ghost" size="sm" color="danger" title="Eliminar" @click="toDelete = { id: row.__id, title: row.__title }">
              <i class="mdi mdi-trash-can-outline" />
            </DuiButton>
          </div>
        </template>
      </DuiTable>
      <p v-if="!pending && !rows.length" class="py-8 text-center text-sm text-gray-500">No hay registros</p>
    </div>

    <ClientOnly>
      <DuiModal :model-value="!!toDelete" :title="`Eliminar ${resource.singular.toLowerCase()}`" size="sm" @update:model-value="(v: boolean) => !v && (toDelete = null)">
        <p class="text-gray-700 dark:text-gray-300">
          ¿Seguro que quieres eliminar <strong>{{ toDelete?.title }}</strong>?
        </p>
        <p v-if="resource.children?.length" class="mt-2 text-sm text-red-600 dark:text-red-400">
          <i class="mdi mdi-alert-outline" /> También se eliminarán sus registros relacionados.
        </p>
        <template #footer>
          <DuiButton variant="ghost" @click="toDelete = null">Cancelar</DuiButton>
          <DuiButton color="danger" :loading="deleting" @click="confirmDelete">Eliminar</DuiButton>
        </template>
      </DuiModal>
    </ClientOnly>
  </div>
</template>
