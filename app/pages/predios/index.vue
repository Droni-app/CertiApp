<script setup lang="ts">
import { DuiTable, DuiInput, DuiButton, DuiAlert } from '@dronico/droni-kit'

type PropertyListItem = {
  number: string
  address: string | null
  zone: string | null
  condition: string | null
  economicDestination: string | null
  cadastralValue: string | null
  isPlaceholder: boolean
  owners: { party: { fullName: string } }[]
  _count: { owners: number }
}

const route = useRoute()
const router = useRouter()

const query = computed(() => ({ search: route.query.search, page: route.query.page }))
const { data, pending, error } = await useFetch<{ items: PropertyListItem[]; total: number; page: number; pageSize: number }>(
  '/api/properties',
  { query },
)

const search = ref(String(route.query.search ?? ''))
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => router.replace({ query: { search: value.trim() || undefined } }), 400)
})

const columns = [
  { name: 'number', label: 'Número predial' },
  { name: 'address', label: 'Dirección' },
  { name: 'owner', label: 'Propietario' },
  { name: 'destination', label: 'Destinación' },
  { name: 'zone', label: 'Zona' },
  { name: 'value', label: 'Avalúo catastral', classes: 'text-right' },
  { name: 'actions', label: '', classes: 'w-px' },
]

const rows = computed(() =>
  (data.value?.items ?? []).map((p) => {
    const others = p._count.owners - 1
    return {
      number: p.number,
      address: p.address ?? '—',
      owner: p.owners[0] ? `${p.owners[0].party.fullName}${others > 0 ? ` (+${others})` : ''}` : '—',
      destination: humanize(p.economicDestination),
      zone: zoneLabel(p.zone),
      value: formatAdminValue(p.cadastralValue, 'currency'),
      isPlaceholder: p.isPlaceholder,
    }
  }),
)
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">
        <i class="mdi mdi-home-city-outline mr-1" /> Predios
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Busca por número predial, número anterior, dirección, matrícula inmobiliaria, nombre o documento del propietario.
      </p>
    </div>

    <div class="relative">
      <i class="mdi mdi-magnify absolute left-3 top-2.5 text-gray-400" />
      <DuiInput v-model="search" placeholder="Ej. número predial, dirección, matrícula o documento" class="!pl-9" block />
    </div>

    <DuiAlert v-if="error" color="danger" variant="outline">{{ fetchErrorMessage(error) }}</DuiAlert>

    <div class="overflow-x-auto">
      <DuiTable
        :columns="columns"
        :rows="rows"
        :loading="pending"
        :pagination="data ? { page: data.page, perPage: data.pageSize, total: data.total } : undefined"
        @paginate="(page: number) => router.replace({ query: { ...route.query, page } })"
      >
        <template #number="row">
          <NuxtLink :to="`/predios/${row.number}`" class="font-mono text-blue-700 hover:underline dark:text-blue-300">
            {{ row.number }}
          </NuxtLink>
          <span v-if="row.isPlaceholder" class="ml-1 text-xs text-amber-600" title="Sin datos en el registro de predios">
            <i class="mdi mdi-alert-outline" />
          </span>
        </template>
        <template #value="row">
          <span class="block text-right whitespace-nowrap">{{ row.value }}</span>
        </template>
        <template #actions="row">
          <DuiButton variant="ghost" size="sm" title="Ver detalle" :to="`/predios/${row.number}`">
            <i class="mdi mdi-eye-outline" />
          </DuiButton>
        </template>
      </DuiTable>
      <p v-if="!pending && !rows.length" class="py-8 text-center text-sm text-gray-500">No se encontraron predios</p>
    </div>
  </div>
</template>
