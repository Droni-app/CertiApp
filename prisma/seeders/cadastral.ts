/**
 * Importa los CSV de sources/DB a las tablas catastrales.
 *
 *   npm run db:seed:cadastral            # usa sources/DB
 *   npm run db:seed:cadastral -- <dir>   # otra carpeta con los mismos CSV
 *
 * ATENCIÓN: vacía las tablas catastrales antes de importar (no toca `users`).
 * Al terminar escribe un reporte de advertencias en .data/import-report.json
 */
import 'dotenv/config'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse } from 'csv-parse/sync'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient, Prisma } from '../../server/generated/prisma/client'

type Row = Record<string, string>

const dir = resolve(process.argv[2] ?? 'sources/DB')
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) })
const CHUNK = 1000

// ---------------------------------------------------------------------------
// Reporte de advertencias
// ---------------------------------------------------------------------------
const warnings = new Map<string, { count: number; examples: unknown[] }>()
function warn(type: string, example: unknown) {
  const w = warnings.get(type) ?? { count: 0, examples: [] }
  w.count++
  if (w.examples.length < 5) w.examples.push(example)
  warnings.set(type, w)
}

// ---------------------------------------------------------------------------
// Limpieza de valores
// ---------------------------------------------------------------------------
const text = (v: string | undefined): string | null => {
  const s = (v ?? '').replace(/\s+/g, ' ').trim()
  return s === '' ? null : s
}

const decimal = (v: string | undefined, field: string, max?: number): string | null => {
  let s = text(v)
  // "8,633,235,932" → separador de miles; "2,5" → coma decimal
  s = s && /^\d{1,3}(,\d{3}){2,}$/.test(s) ? s.replaceAll(',', '') : s?.replace(',', '.')
  if (!s) return null
  if (!/^-?\d+(\.\d+)?$/.test(s)) {
    warn(`Decimal inválido: ${field}`, v)
    return null
  }
  if (max !== undefined && Math.abs(Number(s)) > max) {
    warn(`Valor fuera de rango (> ${max}): ${field}`, v)
    return null
  }
  return s
}

const int = (v: string | undefined, field: string): number | null => {
  const d = decimal(v, field)
  return d === null ? null : Math.round(Number(d))
}

const date = (v: string | undefined, field: string): Date | null => {
  const s = text(v)
  if (!s || s === '1900-01-01') return null
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (ymd) {
    let [, y, m, d] = ymd.map(Number) as [number, number, number, number]
    // Día y mes invertidos: 2025-15-09 → 2025-09-15
    if (m > 12 && d >= 1 && d <= 12) {
      ;[m, d] = [d, m]
      warn(`Fecha con día y mes invertidos (corregida): ${field}`, v)
    }
    const date = new Date(Date.UTC(y, m - 1, d))
    if (m >= 1 && m <= 12 && date.getUTCDate() === d) return date
  }
  // Fecha serial de Excel (días desde 1899-12-30)
  if (/^\d{5}$/.test(s)) return new Date(Date.UTC(1899, 11, 30) + Number(s) * 86_400_000)
  warn(`Fecha inválida: ${field}`, v)
  return null
}

const predialNumber = (v: string | undefined, file: string): string | null => {
  const s = (v ?? '').replace(/\s/g, '')
  if (!s) return null
  if (!/^\d{30}$/.test(s)) warn(`Número predial con formato no estándar (${file})`, s)
  if (s.length > 30) return null
  return s
}

const previousNumber = (v: string | undefined): string | null => {
  const s = text(v)
  return s && /^\d{1,30}$/.test(s) ? s : null
}

const homologatedCode = (v: string | undefined, file: string): string | null => {
  const s = text(v)
  if (!s || s === '0') return null
  if (!/^[A-Z]{3}\d{4}[A-Z]{4}$/.test(s)) {
    warn(`Código homologado inválido (${file})`, s)
    return null
  }
  return s
}

/**
 * Unifica variantes de una categoría (mayúsculas, espacios, tildes):
 * "habitacional", "HABITACIONAL " y "Habitacional" → la variante más frecuente.
 */
function categoryNormalizer(values: (string | undefined)[]) {
  const key = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s_]+/g, '_').replace(/^_|_$/g, '')
  const counts = new Map<string, Map<string, number>>()
  for (const v of values) {
    const s = text(v)
    if (!s) continue
    const variants = counts.get(key(s)) ?? new Map<string, number>()
    variants.set(s, (variants.get(s) ?? 0) + 1)
    counts.set(key(s), variants)
  }
  const canonical = new Map<string, string>()
  for (const [k, variants] of counts) {
    canonical.set(k, [...variants].sort((a, b) => b[1] - a[1])[0]![0])
  }
  return (v: string | undefined) => {
    const s = text(v)
    return s ? canonical.get(key(s))! : null
  }
}

// ---------------------------------------------------------------------------
// Lectura de CSV
// ---------------------------------------------------------------------------
function readCsv(file: string): Row[] {
  return parse(readFileSync(join(dir, file)), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
  })
}

async function insertChunks<T>(label: string, rows: T[], insert: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await insert(rows.slice(i, i + CHUNK))
    process.stdout.write(`\r  ${label}: ${Math.min(i + CHUNK, rows.length)}/${rows.length}`)
  }
  process.stdout.write('\n')
}

// ---------------------------------------------------------------------------
// Importación
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Leyendo CSV desde ${dir}`)
  const predios = readCsv('Predios.csv')
  const construcciones = readCsv('Construcciones.csv')
  const ph = readCsv('DatosPH_Condominio.csv')
  const fuentes = readCsv('FuentesAdministrativas.csv')
  const interesados = readCsv('Interesados.csv')
  const tramites = readCsv('TramitesCatastrales.csv')
  const zonas = readCsv('Zonas.csv')

  const norm = {
    condition: categoryNormalizer(predios.map((r) => r['condicion'])),
    economicDestination: categoryNormalizer(predios.map((r) => r['Destinacion Economica'])),
    propertyType: categoryNormalizer(predios.map((r) => r['Tipo de Predio'])),
    status: categoryNormalizer(predios.map((r) => r['Estado'])),
    constructionType: categoryNormalizer(construcciones.map((r) => r['Tipo_Construccion'])),
    domainType: categoryNormalizer(construcciones.map((r) => r['Tipo_Dominio'])),
    unitType: categoryNormalizer(construcciones.map((r) => r['Tipo_Unidad_Construccion'])),
    typology: categoryNormalizer(construcciones.map((r) => r['tipologia'])),
    sourceType: categoryNormalizer(fuentes.map((r) => r['Tipo de fuente'])),
    issuingEntity: categoryNormalizer(fuentes.map((r) => r['Ente_Emisor'])),
    city: categoryNormalizer(fuentes.map((r) => r['Ciudad Origen'])),
    documentType: categoryNormalizer(interesados.map((r) => r['Tipo de Documento'])),
    sex: categoryNormalizer(interesados.map((r) => r['Sexo'])),
    ethnicGroup: categoryNormalizer(interesados.map((r) => r['Grupo Etnico'])),
    maritalStatus: categoryNormalizer(interesados.map((r) => r['Estado civil'])),
    rightType: categoryNormalizer(interesados.map((r) => r['Tipo_Derecho'])),
    mutationType: categoryNormalizer(tramites.map((r) => r['Clasificacion_Mutacion'])),
  }

  // --- Predios ---------------------------------------------------------------
  const properties = new Map<string, Prisma.PropertyCreateManyInput>()
  const matrixOf = new Map<string, string>()

  for (const r of predios) {
    const number = predialNumber(r['Numero Predial'], 'Predios')
    if (!number) {
      warn('Predio sin número predial (omitido)', r)
      continue
    }
    if (properties.has(number)) {
      warn('Predio duplicado en Predios.csv (se conserva el primero)', { number, address: text(r['Direccion']) })
      continue
    }

    const matrix = text(r['NPN_Predio_Matriz'])?.replace(/\s/g, '')
    if (matrix) {
      if (/^\d{30}$/.test(matrix) && matrix !== number) matrixOf.set(number, matrix)
      else warn('NPN_Predio_Matriz inválido (se ignora)', { number, value: r['NPN_Predio_Matriz'] })
    }

    properties.set(number, {
      number,
      previousNumber: previousNumber(r['Numero Predial Anterior']),
      zone: text(r['ZONA']),
      homologatedCode: homologatedCode(r['Codigo Homologado'], 'Predios'),
      nupre: homologatedCode(r['NUPRE'], 'Predios (NUPRE)'),
      condition: norm.condition(r['condicion']),
      registrationNumber: text(r['Matricula Inmobiliaria']),
      previousRegistrationNumber: text(r['Matricula Inmobiliaria_ant']),
      landArea: decimal(r['Area de Terreno'], 'Predios.Area de Terreno'),
      builtArea: decimal(r['Area Construida'], 'Predios.Area Construida'),
      address: text(r['Direccion']),
      economicDestination: norm.economicDestination(r['Destinacion Economica']),
      propertyType: norm.propertyType(r['Tipo de Predio']),
      cadastralValue: decimal(r['Avaluo Catastral'], 'Predios.Avaluo Catastral'),
      previousCadastralValue: decimal(r['Avaluo Anterior'], 'Predios.Avaluo Anterior'),
      cadastralValue2024: decimal(r['Avaluo 2024'], 'Predios.Avaluo 2024'),
      validFrom: date(r['Vigencia'], 'Predios.Vigencia'),
      status: norm.status(r['Estado']),
      coOwnershipCoefficient: decimal(r['Coeficiente_Copropiedad'], 'Predios.Coeficiente_Copropiedad', 100),
    })
  }

  // Predios referenciados por otras tablas que no están en Predios.csv
  const ensureProperty = (
    number: string,
    file: string,
    extra: () => Partial<Prisma.PropertyCreateManyInput> = () => ({}),
  ) => {
    const existing = properties.get(number)
    if (existing && !existing.isPlaceholder) return
    if (!existing) warn(`Predio creado como placeholder (referenciado en ${file})`, number)
    const placeholder = existing ?? { number, isPlaceholder: true }
    for (const [k, v] of Object.entries(extra())) (placeholder as any)[k] ??= v
    properties.set(number, placeholder)
  }

  const childFiles: [string, Row[]][] = [
    ['Construcciones', construcciones],
    ['DatosPH_Condominio', ph],
    ['FuentesAdministrativas', fuentes],
    ['Interesados', interesados],
    ['TramitesCatastrales', tramites],
    ['Zonas', zonas],
  ]
  for (const [file, rows] of childFiles) {
    for (const r of rows) {
      const number = predialNumber(r['Numero Predial'], file)
      if (!number) continue
      ensureProperty(number, file, () => ({
        previousNumber: previousNumber(r['Numero Predial Anterior']),
        zone: text(r['ZONA']),
        homologatedCode: homologatedCode(r['Codigo Homologado'], file),
        condition: norm.condition(r['condicion']),
      }))
    }
  }
  for (const matrix of new Set(matrixOf.values())) ensureProperty(matrix, 'Predios (NPN_Predio_Matriz)')

  // --- Interesados → parties + property_owners -----------------------------------
  // Una persona se identifica por tipo + número de documento + nombre (palabras ordenadas),
  // porque hay documentos repetidos con nombres de personas distintas.
  const parties = new Map<string, Prisma.PartyCreateManyInput & { id: number }>()
  const owners = new Map<string, Prisma.PropertyOwnerCreateManyInput>()

  for (const r of interesados) {
    const propertyNumber = predialNumber(r['Numero Predial'], 'Interesados')
    if (!propertyNumber) continue

    const documentType = norm.documentType(r['Tipo de Documento']) === 'X' ? null : norm.documentType(r['Tipo de Documento'])
    const rawDoc = text(r['Numero de Documento'])?.replace(/\.$/, '') ?? null
    const documentNumber = rawDoc && !['0', 'X'].includes(rawDoc) ? rawDoc : null
    const fullName =
      text(r['Nombre Completo']) ??
      text(r['Razon_Social']) ??
      ([r['PRIMER_NOMBRE'], r['SEGUNDO_NOMBRE'], r['PRIMER APELLIDO'], r['SEGUNDO_APELLIDO']].map(text).filter(Boolean).join(' ') ||
        'SIN NOMBRE')

    const nameKey = fullName.toUpperCase().split(' ').sort().join(' ')
    const key = `${documentType}|${documentNumber}|${nameKey}`
    const maritalStatus = norm.maritalStatus(r['Estado civil'])

    const data = {
      documentType,
      documentNumber,
      fullName,
      firstName: text(r['PRIMER_NOMBRE']),
      middleName: text(r['SEGUNDO_NOMBRE']),
      firstSurname: text(r['PRIMER APELLIDO']),
      secondSurname: text(r['SEGUNDO_APELLIDO']),
      businessName: text(r['Razon_Social']),
      sex: norm.sex(r['Sexo']),
      ethnicGroup: norm.ethnicGroup(r['Grupo Etnico']),
      maritalStatus: maritalStatus === '0' ? null : maritalStatus,
    }

    let party = parties.get(key)
    if (!party) {
      party = { id: parties.size + 1, ...data }
      parties.set(key, party)
    } else {
      // Completa campos vacíos con lo que traigan otras filas de la misma persona
      for (const [k, v] of Object.entries(data)) (party as any)[k] ??= v
    }

    const owner = {
      propertyNumber,
      partyId: party.id,
      order: int(r['orden de propietarios'], 'Interesados.orden de propietarios') ?? 0,
      rightType: norm.rightType(r['Tipo_Derecho']),
      participation: decimal(r['Participacion'], 'Interesados.Participacion', 100),
    }
    // Solo se descartan filas idénticas; la misma persona con otro orden en el predio se conserva
    const ownerKey = JSON.stringify(owner)
    if (owners.has(ownerKey)) {
      warn('Interesado duplicado idéntico (omitido)', { propertyNumber, fullName })
      continue
    }
    owners.set(ownerKey, owner)
  }

  // --- Tablas hijas ----------------------------------------------------------
  const rowsOf = <T>(file: string, rows: Row[], map: (r: Row, propertyNumber: string) => T | null): T[] =>
    rows.flatMap((r) => {
      const propertyNumber = predialNumber(r['Numero Predial'], file)
      if (!propertyNumber) return []
      const item = map(r, propertyNumber)
      return item ? [item] : []
    })

  const constructionRows = rowsOf<Prisma.ConstructionCreateManyInput>('Construcciones', construcciones, (r, propertyNumber) => ({
    propertyNumber,
    order: int(r['Orden'], 'Construcciones.Orden') ?? 0,
    identifier: text(r['identificador']),
    constructionType: norm.constructionType(r['Tipo_Construccion']),
    domainType: norm.domainType(r['Tipo_Dominio']),
    unitType: norm.unitType(r['Tipo_Unidad_Construccion']),
    bedrooms: int(r['total_habitaciones'], 'Construcciones.total_habitaciones'),
    bathrooms: int(r['total_banios'], 'Construcciones.total_banios'),
    commercialUnits: int(r['total_locales'], 'Construcciones.total_locales'),
    floors: int(r['total_plantas'], 'Construcciones.total_plantas'),
    stratum: int(r['estrato'], 'Construcciones.estrato'),
    useCode: int(r['uso_cons'], 'Construcciones.uso_cons'),
    score: int(r['puntaje'], 'Construcciones.puntaje'),
    typology: norm.typology(r['tipologia']),
    builtArea: decimal(r['area_construida'], 'Construcciones.area_construida'),
    age: int(r['Edad'], 'Construcciones.Edad'),
    usefulLife: int(r['Vida_Util'], 'Construcciones.Vida_Util'),
    conservationState: decimal(r['Estado_De_Conservacion'], 'Construcciones.Estado_De_Conservacion', 999),
    cadastralValue: decimal(r['Avaluo_Cat_Construccion'], 'Construcciones.Avaluo_Cat_Construccion'),
  }))

  const horizontalRows = rowsOf<Prisma.HorizontalPropertyCreateManyInput>('DatosPH_Condominio', ph, (r, propertyNumber) => ({
    propertyNumber,
    condominiumCode: text(r['COND']),
    totalLandArea: decimal(r['Area total de Terreno'], 'PH.Area total de Terreno'),
    privateLandArea: decimal(r['Area total de Terreno Privada'], 'PH.Area total de Terreno Privada'),
    commonLandArea: decimal(r['Area total de Terreno Comun'], 'PH.Area total de Terreno Comun'),
    totalBuiltArea: decimal(r['Area total Construida'], 'PH.Area total Construida'),
    privateBuiltArea: decimal(r['Area total Construida Privada'], 'PH.Area total Construida Privada'),
    commonBuiltArea: decimal(r['Area total Construida Comun'], 'PH.Area total Construida Comun'),
    towers: int(r['Numero de torres'], 'PH.Numero de torres'),
    privateUnits: int(r['Total de unidades privadas'], 'PH.Total de unidades privadas'),
  }))

  const sourceRows = rowsOf<Prisma.AdministrativeSourceCreateManyInput>('FuentesAdministrativas', fuentes, (r, propertyNumber) => ({
    propertyNumber,
    sourceType: norm.sourceType(r['Tipo de fuente']),
    issuingEntity: norm.issuingEntity(r['Ente_Emisor']) === '0' ? null : norm.issuingEntity(r['Ente_Emisor']),
    office: text(r['Oficina_Origen']),
    city: norm.city(r['Ciudad Origen']),
    documentNumber: text(r['NUM_ESCRITURA']),
    documentDate: date(r['FECHA_FUENTE'], 'Fuentes.FECHA_FUENTE'),
    notes: text(r['OBSERVACION']),
  }))

  const procedureRows = rowsOf<Prisma.CadastralProcedureCreateManyInput>('TramitesCatastrales', tramites, (r, propertyNumber) => ({
    propertyNumber,
    mutationType: norm.mutationType(r['Clasificacion_Mutacion']),
    resolutionNumber: text(r['Numero_Resolucion']),
    resolutionDate: date(r['Fecha_Resolucion'], 'Tramites.Fecha_Resolucion'),
    filingDate: date(r['Fecha_Radicacion'], 'Tramites.Fecha_Radicacion'),
  }))

  const zoneRows = rowsOf<Prisma.LandZoneCreateManyInput>('Zonas', zonas, (r, propertyNumber) => ({
    propertyNumber,
    order: int(r['NUM-ORDEN-TER'], 'Zonas.NUM-ORDEN-TER') ?? 0,
    physicalZone1: text(r['ZON21-TER']),
    geoeconomicZone1: text(r['ECO21-TER']),
    area1: decimal(r['MET21-TER'], 'Zonas.MET21-TER'),
    physicalZone2: text(r['ZON22-TER']),
    geoeconomicZone2: text(r['ECO22-TER']),
    area2: decimal(r['MET22-TER'], 'Zonas.MET22-TER'),
    landValue: decimal(r['Avaluo_Cat_terreno'], 'Zonas.Avaluo_Cat_terreno'),
  }))

  // --- Escritura en la base de datos ----------------------------------------------
  console.log('Vaciando tablas catastrales...')
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0')
    for (const table of [
      'property_owners',
      'parties',
      'constructions',
      'horizontal_properties',
      'administrative_sources',
      'cadastral_procedures',
      'land_zones',
      'properties',
    ]) {
      await tx.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``)
    }
    await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1')
  })

  console.log('Insertando...')
  await insertChunks('properties', [...properties.values()], (data) => prisma.property.createMany({ data }))

  // La relación con el predio matriz se asigna cuando todos los predios ya existen
  const unitsByMatrix = new Map<string, string[]>()
  for (const [unit, matrix] of matrixOf) unitsByMatrix.set(matrix, [...(unitsByMatrix.get(matrix) ?? []), unit])
  for (const [matrixNumber, units] of unitsByMatrix) {
    await prisma.property.updateMany({ where: { number: { in: units } }, data: { matrixNumber } })
  }
  console.log(`  matrix links: ${matrixOf.size}`)

  await insertChunks('parties', [...parties.values()], (data) => prisma.party.createMany({ data }))
  await insertChunks('property_owners', [...owners.values()], (data) => prisma.propertyOwner.createMany({ data }))
  await insertChunks('constructions', constructionRows, (data) => prisma.construction.createMany({ data }))
  await insertChunks('horizontal_properties', horizontalRows, (data) => prisma.horizontalProperty.createMany({ data }))
  await insertChunks('administrative_sources', sourceRows, (data) => prisma.administrativeSource.createMany({ data }))
  await insertChunks('cadastral_procedures', procedureRows, (data) => prisma.cadastralProcedure.createMany({ data }))
  await insertChunks('land_zones', zoneRows, (data) => prisma.landZone.createMany({ data }))

  // --- Reporte ----------------------------------------------------------------
  const report = Object.fromEntries([...warnings].sort((a, b) => b[1].count - a[1].count))
  mkdirSync('.data', { recursive: true })
  writeFileSync('.data/import-report.json', JSON.stringify(report, null, 2))

  console.log('\nAdvertencias:')
  for (const [type, { count }] of Object.entries(report)) console.log(`  ${String(count).padStart(6)}  ${type}`)
  console.log('\nDetalle en .data/import-report.json')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
