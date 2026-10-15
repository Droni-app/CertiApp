<script setup lang="ts">
import { DuiCard, DuiBadge, DuiButton, DuiAlert, DuiTabs, DuiTable, DuiSkeleton, DuiModal, DuiForm, DuiLabel, DuiInput } from '@dronico/droni-kit'

type Row = Record<string, any>

const route = useRoute()
const router = useRouter()
const { user } = useUserSession()

const number = String(route.params.number)
const { data: p, error } = await useFetch<Row>(`/api/properties/${number}`)

const fmt = formatAdminValue
const m2 = (v: unknown) => (v == null ? '—' : `${fmt(v, 'decimal')} m²`)

// --- Indicadores ---------------------------------------------------------------
const stats = computed(() => {
  if (!p.value) return []
  const owners = p.value.owners.length
  return [
    {
      label: 'Avalúo catastral',
      value: fmt(p.value.cadastralValue, 'currency'),
      icon: 'mdi-cash-multiple',
      trend: percentChange(p.value.cadastralValue, p.value.previousCadastralValue),
      hint: 'vs. avalúo anterior',
    },
    { label: 'Área de terreno', value: m2(p.value.landArea), icon: 'mdi-texture-box' },
    { label: 'Área construida', value: m2(p.value.builtArea), icon: 'mdi-office-building-outline', hint: `${p.value.constructions.length} construcciones` },
    { label: 'Interesados', value: String(owners), icon: 'mdi-account-group-outline', hint: owners === 1 ? 'titular' : 'titulares' },
  ]
})

// --- Información general ---------------------------------------------------------
const identification = computed(() =>
  p.value
    ? [
        { label: 'Número predial', value: p.value.number, mono: true },
        { label: 'Número predial anterior', value: p.value.previousNumber ?? '—', mono: true },
        { label: 'Código homologado', value: p.value.homologatedCode ?? '—', mono: true },
        { label: 'NUPRE', value: p.value.nupre ?? '—', mono: true },
        { label: 'Matrícula inmobiliaria', value: p.value.registrationNumber ?? '—', mono: true },
        { label: 'Matrícula anterior', value: p.value.previousRegistrationNumber ?? '—', mono: true },
      ]
    : [],
)

const characteristics = computed(() => {
  if (!p.value) return []
  const items = [
    { label: 'Zona', value: `${zoneLabel(p.value.zone)}${p.value.zone ? ` (${p.value.zone})` : ''}` },
    { label: 'Condición', value: humanize(p.value.condition) },
    { label: 'Destinación económica', value: humanize(p.value.economicDestination) },
    { label: 'Tipo de predio', value: humanize(p.value.propertyType) },
    { label: 'Estado', value: humanize(p.value.status) },
    { label: 'Vigencia', value: fmt(p.value.validFrom, 'date') },
  ]
  if (p.value.coOwnershipCoefficient != null)
    items.push({ label: 'Coeficiente de copropiedad', value: `${fmt(p.value.coOwnershipCoefficient, 'decimal')} %` })
  if (p.value.matrix)
    items.push({ label: 'Predio matriz', value: p.value.matrix.number, to: `/predios/${p.value.matrix.number}`, mono: true } as any)
  return items
})

const valuations = computed(() => {
  if (!p.value) return []
  return [
    { label: 'Avalúo 2024', value: p.value.cadastralValue2024, change: null },
    { label: 'Avalúo anterior', value: p.value.previousCadastralValue, change: percentChange(p.value.previousCadastralValue, p.value.cadastralValue2024) },
    { label: 'Avalúo actual', value: p.value.cadastralValue, change: percentChange(p.value.cadastralValue, p.value.previousCadastralValue) },
  ]
})

const horizontal = computed(() => {
  const h = p.value?.horizontalProperty
  if (!h) return []
  return [
    { label: 'Código (COND)', value: h.condominiumCode ?? '—' },
    { label: 'Terreno total / privado / común', value: [h.totalLandArea, h.privateLandArea, h.commonLandArea].map((v) => fmt(v, 'decimal')).join(' / ') + ' m²' },
    { label: 'Construido total / privado / común', value: [h.totalBuiltArea, h.privateBuiltArea, h.commonBuiltArea].map((v) => fmt(v, 'decimal')).join(' / ') + ' m²' },
    { label: 'Torres', value: fmt(h.towers) },
    { label: 'Unidades privadas', value: fmt(h.privateUnits) },
  ]
})

// --- Pestañas con la información relacionada ---------------------------------------
type DetailTable = { columns: { name: string; label: string; classes?: string }[]; rows: Row[] }

const tables = computed((): Record<string, DetailTable> => {
  if (!p.value) return {}
  return {
    owners: {
      columns: [
        { name: 'order', label: '#' },
        { name: 'name', label: 'Nombre / razón social' },
        { name: 'document', label: 'Documento' },
        { name: 'right', label: 'Derecho' },
        { name: 'participation', label: 'Participación' },
      ],
      rows: p.value.owners.map((o: Row) => ({
        order: o.order,
        name: o.party.fullName,
        document: [humanize(o.party.documentType), o.party.documentNumber ?? 'Sin número'].join(' · '),
        right: rightLabel(o.rightType),
        participation: o.participation == null ? '—' : `${fmt(o.participation, 'decimal')} %`,
      })),
    },
    constructions: {
      columns: [
        { name: 'identifier', label: 'Id.' },
        { name: 'unitType', label: 'Unidad' },
        { name: 'type', label: 'Tipo' },
        { name: 'area', label: 'Área' },
        { name: 'floors', label: 'Plantas' },
        { name: 'rooms', label: 'Hab. / Baños / Locales' },
        { name: 'stratum', label: 'Estrato' },
        { name: 'typology', label: 'Tipología' },
        { name: 'value', label: 'Avalúo' },
      ],
      rows: p.value.constructions.map((c: Row) => ({
        identifier: c.identifier ?? c.order,
        unitType: humanize(c.unitType),
        type: humanize(c.constructionType),
        area: m2(c.builtArea),
        floors: fmt(c.floors),
        rooms: [c.bedrooms, c.bathrooms, c.commercialUnits].map((v) => fmt(v)).join(' / '),
        stratum: fmt(c.stratum),
        typology: humanize(c.typology),
        value: fmt(c.cadastralValue, 'currency'),
      })),
    },
    zones: {
      columns: [
        { name: 'order', label: '#' },
        { name: 'physical', label: 'Zona física' },
        { name: 'economic', label: 'Zona geoeconómica' },
        { name: 'area', label: 'Área' },
        { name: 'zone2', label: 'Zona 2 (física / geoeconómica / área)' },
        { name: 'value', label: 'Avalúo terreno' },
      ],
      rows: p.value.landZones.map((z: Row) => ({
        order: z.order,
        physical: fmt(z.physicalZone1),
        economic: fmt(z.geoeconomicZone1),
        area: m2(z.area1),
        zone2: Number(z.area2) > 0 ? `${fmt(z.physicalZone2)} / ${fmt(z.geoeconomicZone2)} / ${m2(z.area2)}` : '—',
        value: fmt(z.landValue, 'currency'),
      })),
    },
    sources: {
      columns: [
        { name: 'type', label: 'Tipo de fuente' },
        { name: 'number', label: 'Número' },
        { name: 'date', label: 'Fecha' },
        { name: 'entity', label: 'Ente emisor' },
        { name: 'place', label: 'Oficina / ciudad' },
        { name: 'notes', label: 'Observación' },
      ],
      rows: p.value.administrativeSources.map((s: Row) => ({
        type: humanize(s.sourceType),
        number: fmt(s.documentNumber),
        date: fmt(s.documentDate, 'date'),
        entity: humanize(s.issuingEntity),
        place: [s.office, s.city].filter(Boolean).join(' · ') || '—',
        notes: fmt(s.notes),
      })),
    },
    procedures: {
      columns: [
        { name: 'type', label: 'Mutación' },
        { name: 'resolution', label: 'Resolución' },
        { name: 'resolutionDate', label: 'Fecha resolución' },
        { name: 'filingDate', label: 'Fecha radicación' },
      ],
      rows: p.value.procedures.map((t: Row) => ({
        type: humanize(t.mutationType),
        resolution: fmt(t.resolutionNumber),
        resolutionDate: fmt(t.resolutionDate, 'date'),
        filingDate: fmt(t.filingDate, 'date'),
      })),
    },
    units: {
      columns: [
        { name: 'number', label: 'Número predial' },
        { name: 'address', label: 'Dirección' },
        { name: 'condition', label: 'Condición' },
        { name: 'value', label: 'Avalúo' },
      ],
      rows: p.value.units.map((u: Row) => ({
        number: u.number,
        address: fmt(u.address),
        condition: humanize(u.condition),
        value: fmt(u.cadastralValue, 'currency'),
      })),
    },
  }
})

const tabs = computed(() => {
  if (!p.value) return []
  const list = [
    { value: 'owners', label: 'Interesados', badge: p.value.owners.length },
    { value: 'constructions', label: 'Construcciones', badge: p.value.constructions.length },
    { value: 'zones', label: 'Zonas', badge: p.value.landZones.length },
    { value: 'sources', label: 'Fuentes administrativas', badge: p.value.administrativeSources.length },
    { value: 'procedures', label: 'Trámites', badge: p.value.procedures.length },
  ]
  if (p.value._count.units) list.push({ value: 'units', label: 'Unidades', badge: p.value._count.units })
  return list
})

// Las pestañas muestran 50 filas al inicio (hay predios con miles de interesados)
const PAGE = 50
const expanded = reactive<Record<string, boolean>>({})
const visibleRows = (key: string) => {
  const rows = tables.value[key]?.rows ?? []
  return expanded[key] ? rows : rows.slice(0, PAGE)
}

const tab = computed({
  get: () => String(route.query.tab ?? 'owners'),
  set: (value) => router.replace({ query: { ...route.query, tab: value } }),
})

// --- Certificado catastral -----------------------------------------------------------
const certificateOpen = ref(false)
const certificate = reactive({ addressedTo: 'A QUIEN INTERESE', consecutive: '' })
const consecutiveError = computed(() =>
  certificate.consecutive && !/^\d{1,6}$/.test(certificate.consecutive) ? 'Solo números, máximo 6 dígitos' : undefined,
)
const certificatePreview = computed(
  () => `25-307-${(certificate.consecutive || '').padStart(6, '0')}-${new Date().getFullYear()}`,
)

function generateCertificate() {
  if (!/^\d{1,6}$/.test(certificate.consecutive)) return
  const query = new URLSearchParams({
    para: certificate.addressedTo.trim() || 'A QUIEN INTERESE',
    consecutivo: certificate.consecutive,
  })
  window.open(`/certificados/${number}?${query}`, '_blank')
  certificateOpen.value = false
  certificate.consecutive = ''
}

useHead({ title: () => `Predio ${number} · CertiApp` })
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <NuxtLink to="/predios" class="hover:underline">Predios</NuxtLink>
      <i class="mdi mdi-chevron-right" />
      <span class="font-mono">{{ number }}</span>
    </div>

    <DuiAlert v-if="error" color="danger" variant="outline">
      <i class="mdi mdi-alert-circle-outline mr-1" /> {{ fetchErrorMessage(error, 'No se pudo cargar el predio') }}
    </DuiAlert>

    <template v-else-if="p">
      <!-- Encabezado -->
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h1 class="break-all font-mono text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">{{ p.number }}</h1>
          <p class="mt-1 text-gray-600 dark:text-gray-300">
            <i class="mdi mdi-map-marker-outline mr-1" />{{ p.address ?? 'Sin dirección' }}
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <DuiBadge color="primary" variant="soft">{{ zoneLabel(p.zone) }}</DuiBadge>
            <DuiBadge v-if="p.economicDestination" variant="soft">{{ humanize(p.economicDestination) }}</DuiBadge>
            <DuiBadge v-if="p.condition" variant="soft">{{ humanize(p.condition) }}</DuiBadge>
            <DuiBadge v-if="p.status" :color="p.status === 'Activo' ? 'success' : 'warning'" variant="soft">{{ p.status }}</DuiBadge>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <DuiButton
            color="primary"
            :disabled="p.isPlaceholder"
            :title="p.isPlaceholder ? 'El predio no está en el registro de predios' : undefined"
            @click="certificateOpen = true"
          >
            <i class="mdi mdi-file-certificate-outline mr-1" /> Generar certificado
          </DuiButton>
          <DuiButton v-if="user?.role === 'admin'" variant="outline" :to="`/admin/predios/${p.number}`">
            <i class="mdi mdi-pencil-outline mr-1" /> Editar en administración
          </DuiButton>
        </div>
      </div>

      <DuiAlert v-if="p.isPlaceholder" color="warning" variant="outline">
        <i class="mdi mdi-alert-outline mr-1" />
        Este predio no está en el registro de predios; solo existe porque otras tablas lo referencian. Su información puede estar incompleta.
      </DuiAlert>

      <!-- Indicadores -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UiStatTile v-for="s in stats" :key="s.label" v-bind="s" />
      </div>

      <!-- Información general -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DuiCard title="Identificación">
          <UiInfoList :items="identification" />
        </DuiCard>
        <DuiCard title="Características">
          <UiInfoList :items="characteristics" />
        </DuiCard>
        <DuiCard title="Avalúos">
          <dl class="divide-y divide-gray-100 dark:divide-gray-800">
            <div v-for="v in valuations" :key="v.label" class="flex items-center justify-between gap-3 py-2 text-sm">
              <dt class="text-gray-500 dark:text-gray-400">{{ v.label }}</dt>
              <dd class="text-right">
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ fmt(v.value, 'currency') }}</span>
                <span v-if="v.change !== null" class="ml-2 text-xs" :class="v.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                  {{ v.change >= 0 ? '+' : '' }}{{ v.change.toFixed(1) }}%
                </span>
              </dd>
            </div>
          </dl>
        </DuiCard>
        <DuiCard v-if="horizontal.length" title="Propiedad horizontal / condominio">
          <UiInfoList :items="horizontal" />
        </DuiCard>
      </div>

      <!-- Información relacionada -->
      <DuiCard>
        <ClientOnly>
          <DuiTabs v-model="tab" :tabs="tabs" variant="underline">
            <template v-for="t in tabs" :key="t.value" #[t.value]>
              <div class="overflow-x-auto pt-4">
                <DuiTable v-if="tables[t.value]?.rows.length" :columns="tables[t.value]!.columns" :rows="visibleRows(t.value)">
                  <template v-if="t.value === 'units'" #number="row">
                    <NuxtLink :to="`/predios/${row.number}`" class="font-mono text-blue-700 hover:underline dark:text-blue-300">{{ row.number }}</NuxtLink>
                  </template>
                </DuiTable>
                <p v-else class="py-6 text-center text-sm text-gray-500">Sin registros</p>
                <div v-if="!expanded[t.value] && (tables[t.value]?.rows.length ?? 0) > PAGE" class="pt-3 text-center">
                  <DuiButton variant="ghost" size="sm" @click="expanded[t.value] = true">
                    Mostrar todos ({{ tables[t.value]!.rows.length }})
                  </DuiButton>
                </div>
                <p v-if="t.value === 'units' && p._count.units > p.units.length" class="pt-2 text-xs text-gray-500">
                  Mostrando {{ p.units.length }} de {{ p._count.units }} unidades.
                </p>
              </div>
            </template>
          </DuiTabs>
          <template #fallback>
            <DuiSkeleton height="200px" variant="rounded" />
          </template>
        </ClientOnly>
      </DuiCard>
    </template>

    <ClientOnly>
      <DuiModal v-model="certificateOpen" title="Certificado catastral individual" size="md">
        <DuiForm id="certificate-form" @submit="generateCertificate">
          <DuiLabel title="Dirigido a" icon="mdi mdi-account-arrow-right-outline" required>
            <DuiInput v-model="certificate.addressedTo" maxlength="200" required block />
          </DuiLabel>
          <DuiLabel
            title="Número consecutivo"
            icon="mdi mdi-pound"
            :error="consecutiveError"
            required
          >
            <DuiInput v-model="certificate.consecutive" inputmode="numeric" maxlength="6" placeholder="Ej. 123" required block />
          </DuiLabel>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            No. CERTIFICADO: <span class="font-mono font-semibold">{{ certificatePreview }}</span>
          </p>
        </DuiForm>
        <template #footer>
          <DuiButton variant="ghost" @click="certificateOpen = false">Cancelar</DuiButton>
          <DuiButton type="submit" form="certificate-form" color="primary" :disabled="!certificate.consecutive || !!consecutiveError">
            <i class="mdi mdi-open-in-new mr-1" /> Generar
          </DuiButton>
        </template>
      </DuiModal>
    </ClientOnly>
  </div>
</template>
