<script setup lang="ts">
import { DuiInput, DuiButton } from '@dronico/droni-kit'

// Buscador de registros relacionados: muestra el seleccionado y busca en /api/admin/<resource>
const props = defineProps<{ resource: string; disabled?: boolean }>()
const model = defineModel<string | number | null>()

const target = getAdminResource(props.resource)!
const search = ref('')
const results = ref<Record<string, unknown>[]>([])
const open = ref(false)
const loading = ref(false)
const selectedLabel = ref('')

async function loadSelected(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    selectedLabel.value = ''
    return
  }
  try {
    const row = await $fetch<Record<string, unknown>>(`/api/admin/${target.key}/${encodeURIComponent(String(value))}`)
    selectedLabel.value = recordTitle(target, row)
  } catch {
    selectedLabel.value = `${value} (no encontrado)`
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
watch(search, (term) => {
  clearTimeout(timer)
  if (!term.trim()) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    loading.value = true
    try {
      const res = await $fetch<{ items: Record<string, unknown>[] }>(`/api/admin/${target.key}`, {
        query: { search: term, pageSize: 8 },
      })
      results.value = res.items
      open.value = true
    } finally {
      loading.value = false
    }
  }, 300)
})

function select(row: Record<string, unknown>) {
  model.value = row[target.primaryKey.name] as string | number
  selectedLabel.value = recordTitle(target, row)
  search.value = ''
  results.value = []
  open.value = false
}

function clear() {
  model.value = null
}

const closeLater = () => setTimeout(() => (open.value = false), 150)

onMounted(() => watch(model, loadSelected, { immediate: true }))
</script>

<template>
  <div class="relative">
    <div v-if="model !== null && model !== undefined && model !== ''" class="flex items-center gap-2">
      <NuxtLink
        :to="`/admin/${target.key}/${encodeURIComponent(String(model))}`"
        class="flex-1 truncate rounded bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:underline dark:bg-blue-500/15 dark:text-blue-300"
      >
        <i class="mdi mr-1" :class="target.icon" />{{ selectedLabel || model }}
      </NuxtLink>
      <DuiButton v-if="!disabled" variant="ghost" size="sm" title="Quitar" @click="clear">
        <i class="mdi mdi-close" />
      </DuiButton>
    </div>
    <template v-else>
      <DuiInput
        v-model="search"
        :placeholder="`Buscar ${target.singular.toLowerCase()}...`"
        :disabled="disabled"
        autocomplete="off"
        block
        @focus="open = results.length > 0"
        @blur="closeLater"
      />
      <i v-if="loading" class="mdi mdi-loading mdi-spin absolute right-3 top-2.5 text-gray-400" />
      <ul
        v-if="open"
        class="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <li v-if="!results.length" class="px-3 py-2 text-sm text-gray-500">Sin resultados</li>
        <li v-for="row in results" :key="String(row[target.primaryKey.name])">
          <button
            type="button"
            class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            @mousedown.prevent="select(row)"
          >
            {{ recordTitle(target, row) }}
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>
