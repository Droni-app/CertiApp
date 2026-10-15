/**
 * Definición de los recursos administrables (CRUD genérico).
 * Se usa tanto en el server (validación y consultas) como en el cliente (tablas y formularios).
 */

export type AdminFieldType =
  | 'string'
  | 'text'
  | 'email'
  | 'password'
  | 'int'
  | 'decimal'
  | 'currency'
  | 'date'
  | 'boolean'
  | 'select'
  | 'relation'

export interface AdminField {
  /** Nombre del campo en el modelo de Prisma */
  name: string
  label: string
  type: AdminFieldType
  required?: boolean
  /** Longitud máxima (texto) */
  max?: number
  /** Opciones fijas para `select` */
  options?: string[]
  /** Sugiere los valores ya existentes en la base (categorías de texto libre) */
  suggest?: boolean
  /** Recurso relacionado para `relation` */
  relation?: { resource: string }
  /** Solo editable al crear (ej. llaves naturales) */
  createOnly?: boolean
  help?: string
}

export interface AdminColumn {
  /** Campo del modelo o ruta de una relación incluida (ej. `party.fullName`) */
  name: string
  label: string
  type?: AdminFieldType
}

export interface AdminResource {
  /** Segmento de la URL: /admin/<key> */
  key: string
  /** Delegado de Prisma (prisma.<model>) */
  model: string
  label: string
  singular: string
  icon: string
  primaryKey: { name: string; type: 'int' | 'string' }
  /** Campos con los que se arma la etiqueta de un registro (relaciones, títulos) */
  titleFields: string[]
  columns: AdminColumn[]
  /** Campos (o rutas de relación) donde busca el buscador */
  search: string[]
  defaultSort: { field: string; dir: 'asc' | 'desc' }
  include?: Record<string, unknown>
  /** Campos que nunca se devuelven al cliente */
  omit?: string[]
  /** Listados relacionados que se muestran en el detalle (filtrados por `field` = llave de este registro) */
  children?: { resource: string; field: string }[]
  fields: AdminField[]
}

const propertyRelation = { resource: 'predios' }

export const adminResources: AdminResource[] = [
  {
    key: 'predios',
    model: 'property',
    label: 'Predios',
    singular: 'Predio',
    icon: 'mdi-home-city-outline',
    primaryKey: { name: 'number', type: 'string' },
    titleFields: ['number', 'address'],
    columns: [
      { name: 'number', label: 'Número predial' },
      { name: 'address', label: 'Dirección' },
      { name: 'economicDestination', label: 'Destinación' },
      { name: 'condition', label: 'Condición' },
      { name: 'cadastralValue', label: 'Avalúo', type: 'currency' },
      { name: 'status', label: 'Estado' },
    ],
    search: ['number', 'previousNumber', 'address', 'registrationNumber', 'homologatedCode'],
    defaultSort: { field: 'number', dir: 'asc' },
    children: [
      { resource: 'propietarios', field: 'propertyNumber' },
      { resource: 'construcciones', field: 'propertyNumber' },
      { resource: 'zonas', field: 'propertyNumber' },
      { resource: 'fuentes', field: 'propertyNumber' },
      { resource: 'tramites', field: 'propertyNumber' },
      { resource: 'propiedad-horizontal', field: 'propertyNumber' },
      { resource: 'predios', field: 'matrixNumber' },
    ],
    fields: [
      { name: 'number', label: 'Número predial', type: 'string', required: true, max: 30, createOnly: true, help: '30 dígitos' },
      { name: 'previousNumber', label: 'Número predial anterior', type: 'string', max: 30 },
      { name: 'zone', label: 'Zona', type: 'string', max: 2, suggest: true, help: '01 = urbano, 00 o > 01 = rural' },
      { name: 'homologatedCode', label: 'Código homologado', type: 'string', max: 20 },
      { name: 'nupre', label: 'NUPRE', type: 'string', max: 20 },
      { name: 'condition', label: 'Condición', type: 'string', max: 40, suggest: true },
      { name: 'registrationNumber', label: 'Matrícula inmobiliaria', type: 'string', max: 30 },
      { name: 'previousRegistrationNumber', label: 'Matrícula anterior', type: 'string', max: 30 },
      { name: 'landArea', label: 'Área de terreno (m²)', type: 'decimal' },
      { name: 'builtArea', label: 'Área construida (m²)', type: 'decimal' },
      { name: 'address', label: 'Dirección', type: 'string', max: 200 },
      { name: 'economicDestination', label: 'Destinación económica', type: 'string', max: 60, suggest: true },
      { name: 'propertyType', label: 'Tipo de predio', type: 'string', max: 60, suggest: true },
      { name: 'cadastralValue', label: 'Avalúo catastral', type: 'currency' },
      { name: 'previousCadastralValue', label: 'Avalúo anterior', type: 'currency' },
      { name: 'cadastralValue2024', label: 'Avalúo 2024', type: 'currency' },
      { name: 'validFrom', label: 'Vigencia', type: 'date' },
      { name: 'status', label: 'Estado', type: 'string', max: 20, suggest: true },
      { name: 'matrixNumber', label: 'Predio matriz', type: 'relation', relation: propertyRelation },
      { name: 'coOwnershipCoefficient', label: 'Coeficiente de copropiedad (%)', type: 'decimal' },
      { name: 'isPlaceholder', label: 'Creado solo como referencia (sin datos en Predios)', type: 'boolean' },
    ],
  },
  {
    key: 'interesados',
    model: 'party',
    label: 'Interesados',
    singular: 'Interesado',
    icon: 'mdi-account-group-outline',
    primaryKey: { name: 'id', type: 'int' },
    titleFields: ['fullName', 'documentNumber'],
    columns: [
      { name: 'documentType', label: 'Tipo doc.' },
      { name: 'documentNumber', label: 'Documento' },
      { name: 'fullName', label: 'Nombre completo' },
      { name: 'sex', label: 'Sexo' },
    ],
    search: ['documentNumber', 'fullName', 'businessName'],
    defaultSort: { field: 'fullName', dir: 'asc' },
    children: [{ resource: 'propietarios', field: 'partyId' }],
    fields: [
      { name: 'documentType', label: 'Tipo de documento', type: 'string', max: 30, suggest: true },
      { name: 'documentNumber', label: 'Número de documento', type: 'string', max: 30 },
      { name: 'fullName', label: 'Nombre completo', type: 'string', required: true, max: 200 },
      { name: 'firstName', label: 'Primer nombre', type: 'string', max: 60 },
      { name: 'middleName', label: 'Segundo nombre', type: 'string', max: 60 },
      { name: 'firstSurname', label: 'Primer apellido', type: 'string', max: 60 },
      { name: 'secondSurname', label: 'Segundo apellido', type: 'string', max: 60 },
      { name: 'businessName', label: 'Razón social', type: 'string', max: 200 },
      { name: 'sex', label: 'Sexo', type: 'string', max: 20, suggest: true },
      { name: 'ethnicGroup', label: 'Grupo étnico', type: 'string', max: 30, suggest: true },
      { name: 'maritalStatus', label: 'Estado civil', type: 'string', max: 60, suggest: true },
    ],
  },
  {
    key: 'propietarios',
    model: 'propertyOwner',
    label: 'Propietarios',
    singular: 'Propietario',
    icon: 'mdi-account-key-outline',
    primaryKey: { name: 'id', type: 'int' },
    titleFields: ['propertyNumber', 'party.fullName'],
    include: { party: { select: { fullName: true, documentType: true, documentNumber: true } } },
    columns: [
      { name: 'propertyNumber', label: 'Número predial' },
      { name: 'party.fullName', label: 'Interesado' },
      { name: 'party.documentNumber', label: 'Documento' },
      { name: 'order', label: 'Orden' },
      { name: 'rightType', label: 'Derecho' },
      { name: 'participation', label: 'Participación (%)', type: 'decimal' },
    ],
    search: ['propertyNumber', 'party.fullName', 'party.documentNumber'],
    defaultSort: { field: 'propertyNumber', dir: 'asc' },
    fields: [
      { name: 'propertyNumber', label: 'Predio', type: 'relation', required: true, relation: propertyRelation },
      { name: 'partyId', label: 'Interesado', type: 'relation', required: true, relation: { resource: 'interesados' } },
      { name: 'order', label: 'Orden', type: 'int', required: true },
      { name: 'rightType', label: 'Tipo de derecho', type: 'string', max: 20, suggest: true, help: 'Vacío = Propietario(a)' },
      { name: 'participation', label: 'Participación (%)', type: 'decimal' },
    ],
  },
  {
    key: 'construcciones',
    model: 'construction',
    label: 'Construcciones',
    singular: 'Construcción',
    icon: 'mdi-office-building-outline',
    primaryKey: { name: 'id', type: 'int' },
    titleFields: ['propertyNumber', 'identifier'],
    columns: [
      { name: 'propertyNumber', label: 'Número predial' },
      { name: 'order', label: 'Orden' },
      { name: 'identifier', label: 'Id.' },
      { name: 'unitType', label: 'Tipo de unidad' },
      { name: 'builtArea', label: 'Área (m²)', type: 'decimal' },
      { name: 'stratum', label: 'Estrato' },
    ],
    search: ['propertyNumber', 'typology'],
    defaultSort: { field: 'propertyNumber', dir: 'asc' },
    fields: [
      { name: 'propertyNumber', label: 'Predio', type: 'relation', required: true, relation: propertyRelation },
      { name: 'order', label: 'Orden', type: 'int', required: true },
      { name: 'identifier', label: 'Identificador', type: 'string', max: 5 },
      { name: 'constructionType', label: 'Tipo de construcción', type: 'string', max: 40, suggest: true },
      { name: 'domainType', label: 'Tipo de dominio', type: 'string', max: 20, suggest: true },
      { name: 'unitType', label: 'Tipo de unidad', type: 'string', max: 40, suggest: true },
      { name: 'bedrooms', label: 'Habitaciones', type: 'int' },
      { name: 'bathrooms', label: 'Baños', type: 'int' },
      { name: 'commercialUnits', label: 'Locales', type: 'int' },
      { name: 'floors', label: 'Plantas', type: 'int' },
      { name: 'stratum', label: 'Estrato', type: 'int' },
      { name: 'useCode', label: 'Código de uso', type: 'int' },
      { name: 'score', label: 'Puntaje', type: 'int' },
      { name: 'typology', label: 'Tipología', type: 'string', max: 60, suggest: true },
      { name: 'builtArea', label: 'Área construida (m²)', type: 'decimal' },
      { name: 'age', label: 'Edad', type: 'int' },
      { name: 'usefulLife', label: 'Vida útil', type: 'int' },
      { name: 'conservationState', label: 'Estado de conservación', type: 'decimal' },
      { name: 'cadastralValue', label: 'Avalúo de la construcción', type: 'currency' },
    ],
  },
  {
    key: 'zonas',
    model: 'landZone',
    label: 'Zonas',
    singular: 'Zona',
    icon: 'mdi-map-outline',
    primaryKey: { name: 'id', type: 'int' },
    titleFields: ['propertyNumber', 'order'],
    columns: [
      { name: 'propertyNumber', label: 'Número predial' },
      { name: 'order', label: 'Orden' },
      { name: 'physicalZone1', label: 'Zona física' },
      { name: 'geoeconomicZone1', label: 'Zona geoeconómica' },
      { name: 'area1', label: 'Área (m²)', type: 'decimal' },
      { name: 'landValue', label: 'Avalúo terreno', type: 'currency' },
    ],
    search: ['propertyNumber'],
    defaultSort: { field: 'propertyNumber', dir: 'asc' },
    fields: [
      { name: 'propertyNumber', label: 'Predio', type: 'relation', required: true, relation: propertyRelation },
      { name: 'order', label: 'Orden', type: 'int', required: true },
      { name: 'physicalZone1', label: 'Zona física 1', type: 'string', max: 10 },
      { name: 'geoeconomicZone1', label: 'Zona geoeconómica 1', type: 'string', max: 10 },
      { name: 'area1', label: 'Área 1 (m²)', type: 'decimal' },
      { name: 'physicalZone2', label: 'Zona física 2', type: 'string', max: 10 },
      { name: 'geoeconomicZone2', label: 'Zona geoeconómica 2', type: 'string', max: 10 },
      { name: 'area2', label: 'Área 2 (m²)', type: 'decimal' },
      { name: 'landValue', label: 'Avalúo del terreno', type: 'currency' },
    ],
  },
  {
    key: 'fuentes',
    model: 'administrativeSource',
    label: 'Fuentes administrativas',
    singular: 'Fuente administrativa',
    icon: 'mdi-file-document-outline',
    primaryKey: { name: 'id', type: 'int' },
    titleFields: ['propertyNumber', 'documentNumber'],
    columns: [
      { name: 'propertyNumber', label: 'Número predial' },
      { name: 'sourceType', label: 'Tipo de fuente' },
      { name: 'issuingEntity', label: 'Ente emisor' },
      { name: 'documentNumber', label: 'Número' },
      { name: 'documentDate', label: 'Fecha', type: 'date' },
      { name: 'city', label: 'Ciudad' },
    ],
    search: ['propertyNumber', 'documentNumber', 'city'],
    defaultSort: { field: 'propertyNumber', dir: 'asc' },
    fields: [
      { name: 'propertyNumber', label: 'Predio', type: 'relation', required: true, relation: propertyRelation },
      { name: 'sourceType', label: 'Tipo de fuente', type: 'string', max: 60, suggest: true },
      { name: 'issuingEntity', label: 'Ente emisor', type: 'string', max: 100, suggest: true },
      { name: 'office', label: 'Oficina de origen', type: 'string', max: 10 },
      { name: 'city', label: 'Ciudad de origen', type: 'string', max: 60, suggest: true },
      { name: 'documentNumber', label: 'Número de documento', type: 'string', max: 30 },
      { name: 'documentDate', label: 'Fecha del documento', type: 'date' },
      { name: 'notes', label: 'Observación', type: 'text', max: 255 },
    ],
  },
  {
    key: 'tramites',
    model: 'cadastralProcedure',
    label: 'Trámites catastrales',
    singular: 'Trámite catastral',
    icon: 'mdi-clipboard-text-clock-outline',
    primaryKey: { name: 'id', type: 'int' },
    titleFields: ['propertyNumber', 'resolutionNumber'],
    columns: [
      { name: 'propertyNumber', label: 'Número predial' },
      { name: 'mutationType', label: 'Mutación' },
      { name: 'resolutionNumber', label: 'Resolución' },
      { name: 'resolutionDate', label: 'Fecha resolución', type: 'date' },
      { name: 'filingDate', label: 'Fecha radicación', type: 'date' },
    ],
    search: ['propertyNumber', 'resolutionNumber'],
    defaultSort: { field: 'resolutionDate', dir: 'desc' },
    fields: [
      { name: 'propertyNumber', label: 'Predio', type: 'relation', required: true, relation: propertyRelation },
      { name: 'mutationType', label: 'Clasificación de la mutación', type: 'string', max: 40, suggest: true },
      { name: 'resolutionNumber', label: 'Número de resolución', type: 'string', max: 30 },
      { name: 'resolutionDate', label: 'Fecha de resolución', type: 'date' },
      { name: 'filingDate', label: 'Fecha de radicación', type: 'date' },
    ],
  },
  {
    key: 'propiedad-horizontal',
    model: 'horizontalProperty',
    label: 'Propiedad horizontal',
    singular: 'Propiedad horizontal',
    icon: 'mdi-domain',
    primaryKey: { name: 'id', type: 'int' },
    titleFields: ['propertyNumber', 'condominiumCode'],
    columns: [
      { name: 'propertyNumber', label: 'Número predial' },
      { name: 'condominiumCode', label: 'COND' },
      { name: 'totalLandArea', label: 'Terreno total (m²)', type: 'decimal' },
      { name: 'totalBuiltArea', label: 'Construido total (m²)', type: 'decimal' },
      { name: 'privateUnits', label: 'Unidades privadas' },
    ],
    search: ['propertyNumber', 'condominiumCode'],
    defaultSort: { field: 'propertyNumber', dir: 'asc' },
    fields: [
      { name: 'propertyNumber', label: 'Predio', type: 'relation', required: true, relation: propertyRelation },
      { name: 'condominiumCode', label: 'Código (COND)', type: 'string', max: 5 },
      { name: 'totalLandArea', label: 'Área total de terreno', type: 'decimal' },
      { name: 'privateLandArea', label: 'Área de terreno privada', type: 'decimal' },
      { name: 'commonLandArea', label: 'Área de terreno común', type: 'decimal' },
      { name: 'totalBuiltArea', label: 'Área total construida', type: 'decimal' },
      { name: 'privateBuiltArea', label: 'Área construida privada', type: 'decimal' },
      { name: 'commonBuiltArea', label: 'Área construida común', type: 'decimal' },
      { name: 'towers', label: 'Número de torres', type: 'int' },
      { name: 'privateUnits', label: 'Total de unidades privadas', type: 'int' },
    ],
  },
  {
    key: 'usuarios',
    model: 'user',
    label: 'Usuarios',
    singular: 'Usuario',
    icon: 'mdi-account-cog-outline',
    primaryKey: { name: 'id', type: 'int' },
    titleFields: ['name', 'email'],
    omit: ['password'],
    columns: [
      { name: 'name', label: 'Nombre' },
      { name: 'email', label: 'Correo' },
      { name: 'position', label: 'Cargo' },
      { name: 'role', label: 'Rol' },
      { name: 'active', label: 'Activo', type: 'boolean' },
    ],
    search: ['name', 'email'],
    defaultSort: { field: 'name', dir: 'asc' },
    fields: [
      { name: 'name', label: 'Nombre', type: 'string', required: true, max: 120 },
      { name: 'email', label: 'Correo electrónico', type: 'email', required: true, max: 191 },
      { name: 'position', label: 'Cargo', type: 'string', max: 120, help: 'Aparece en "Proyectó" de los certificados' },
      { name: 'password', label: 'Contraseña', type: 'password', help: 'Mínimo 8 caracteres. Al editar, déjala vacía para no cambiarla' },
      { name: 'role', label: 'Rol', type: 'select', required: true, options: ['admin', 'user'] },
      { name: 'active', label: 'Activo', type: 'boolean' },
    ],
  },
]

export const getAdminResource = (key: string) => adminResources.find((r) => r.key === key)

/** Lee un valor anidado: getPath(row, 'party.fullName') */
export const getPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, k) => (acc == null ? acc : (acc as Record<string, unknown>)[k]), obj)

/** Etiqueta legible de un registro según `titleFields` */
export const recordTitle = (resource: AdminResource, row: Record<string, unknown>) =>
  resource.titleFields
    .map((f) => getPath(row, f))
    .filter((v) => v !== null && v !== undefined && v !== '')
    .join(' · ')
