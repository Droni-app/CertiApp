import type { H3Event } from 'h3'
import { z } from 'zod'
import { Prisma } from '../generated/prisma/client'

// Mensajes de validación de zod en español
z.config(z.locales.es())

type Mode = 'create' | 'update'
type Delegate = {
  findMany: (args: any) => Promise<any[]>
  findUnique: (args: any) => Promise<any>
  count: (args: any) => Promise<number>
  create: (args: any) => Promise<any>
  update: (args: any) => Promise<any>
  delete: (args: any) => Promise<any>
}

export function useAdminResource(event: H3Event) {
  const resource = getAdminResource(getRouterParam(event, 'resource') ?? '')
  if (!resource) throw createError({ statusCode: 404, statusMessage: 'Recurso no encontrado' })
  const delegate = (prisma as unknown as Record<string, Delegate>)[resource.model]!
  const omit = resource.omit ? Object.fromEntries(resource.omit.map((f) => [f, true])) : undefined
  return { resource, delegate, omit }
}

/** Convierte el parámetro :id de la URL al tipo de la llave primaria */
export function parseId(resource: AdminResource, raw: string | undefined) {
  if (resource.primaryKey.type === 'int') {
    const id = Number(raw)
    if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: 'Identificador inválido' })
    return id
  }
  return decodeURIComponent(raw ?? '')
}

const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v)

function fieldSchema(field: AdminField, mode: Mode): z.ZodType {
  let s: z.ZodType
  switch (field.type) {
    case 'int':
      s = z.coerce.number({ error: 'Debe ser un número entero' }).int('Debe ser un número entero')
      break
    case 'decimal':
    case 'currency':
      s = z
        .union([z.string(), z.number()])
        .transform((v) => String(v).trim().replace(',', '.'))
        .pipe(z.string().regex(/^-?\d+(\.\d+)?$/, 'Debe ser un número'))
      break
    case 'date':
      s = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha inválida')
        .transform((v) => new Date(`${v.slice(0, 10)}T00:00:00Z`))
      break
    case 'boolean':
      s = z.boolean()
      break
    case 'select':
      s = z.enum(field.options as [string, ...string[]], { error: 'Opción inválida' })
      break
    case 'email':
      s = z.email('Correo inválido').max(field.max ?? 191)
      break
    case 'password':
      s = z.string().min(8, 'Mínimo 8 caracteres')
      break
    case 'relation': {
      const target = getAdminResource(field.relation!.resource)!
      s = target.primaryKey.type === 'int' ? z.coerce.number().int() : z.string().trim()
      break
    }
    default:
      s = z.string().trim().max(field.max ?? 255, `Máximo ${field.max} caracteres`)
  }

  if (field.type === 'boolean') return mode === 'create' ? s.default(false) : s.optional()
  const required = field.required || (field.type === 'password' && mode === 'create')
  const base = z.preprocess(emptyToNull, required ? s : s.nullable())
  return mode === 'update' || (!required && mode === 'create') ? base.optional() : base
}

/** Valida el body según la definición del recurso; responde 422 con errores por campo */
export async function readAdminBody(event: H3Event, resource: AdminResource, mode: Mode) {
  const fields = resource.fields.filter((f) => !(mode === 'update' && f.createOnly))
  const schema = z.object(Object.fromEntries(fields.map((f) => [f.name, fieldSchema(f, mode)])))

  const body = await readBody(event)
  const result = schema.safeParse(body ?? {})
  if (!result.success) {
    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const name = String(issue.path[0])
      errors[name] ??= emptyToNull(body?.[name]) === null ? 'Campo obligatorio' : issue.message
    }
    throw createError({ statusCode: 422, statusMessage: 'Datos inválidos', data: { errors } })
  }

  const data = Object.fromEntries(Object.entries(result.data).filter(([, v]) => v !== undefined))
  // En edición, una contraseña vacía significa "no cambiarla"
  for (const f of resource.fields) {
    if (f.type === 'password' && data[f.name]) data[f.name] = await hashPassword(data[f.name] as string)
    else if (f.type === 'password') delete data[f.name]
  }
  return data
}

/** Construye el `where` de Prisma a partir de un campo o ruta (ej. `party.fullName`) */
const nestedWhere = (path: string, condition: unknown): Record<string, unknown> =>
  path
    .split('.')
    .reverse()
    .reduce<unknown>((acc, key) => ({ [key]: acc }), condition) as Record<string, unknown>

export function buildListQuery(event: H3Event, resource: AdminResource) {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))

  const and: Record<string, unknown>[] = []

  const search = String(query.search ?? '').trim()
  if (search) and.push({ OR: resource.search.map((path) => nestedWhere(path, { contains: search })) })

  // Filtros exactos: ?propertyNumber=...&partyId=...
  for (const field of resource.fields) {
    const value = query[field.name]
    if (value === undefined || value === '' || field.type === 'password') continue
    const numeric =
      ['int'].includes(field.type) ||
      (field.type === 'relation' && getAdminResource(field.relation!.resource)?.primaryKey.type === 'int')
    if (field.type === 'boolean') and.push({ [field.name]: value === 'true' })
    else and.push({ [field.name]: numeric ? Number(value) : String(value) })
  }

  const sortable = new Set([resource.primaryKey.name, ...resource.fields.map((f) => f.name)])
  const sort = sortable.has(String(query.sort)) ? String(query.sort) : resource.defaultSort.field
  const dir = query.dir === 'asc' || query.dir === 'desc' ? query.dir : resource.defaultSort.dir

  return {
    page,
    pageSize,
    where: and.length ? { AND: and } : {},
    orderBy: [{ [sort]: dir }, { [resource.primaryKey.name]: 'asc' }],
  }
}

/** Traduce errores conocidos de Prisma a respuestas HTTP con mensajes claros */
export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw createError({ statusCode: 409, statusMessage: 'Ya existe un registro con ese valor' })
      case 'P2003':
        throw createError({ statusCode: 422, statusMessage: 'El registro relacionado no existe' })
      case 'P2025':
        throw createError({ statusCode: 404, statusMessage: 'Registro no encontrado' })
      case 'P2000':
      case 'P2020':
        throw createError({ statusCode: 422, statusMessage: 'Un valor excede el tamaño permitido' })
    }
  }
  throw error
}

/** Reglas propias de usuarios: un admin no puede desactivarse, quitarse el rol ni eliminarse a sí mismo */
export async function guardSelfUser(event: H3Event, resource: AdminResource, id: unknown, data?: Record<string, unknown>) {
  if (resource.key !== 'usuarios') return
  const { user } = await requireUserSession(event)
  if (user.id !== id) return
  if (!data) throw createError({ statusCode: 422, statusMessage: 'No puedes eliminar tu propio usuario' })
  if (data.role && data.role !== 'admin') throw createError({ statusCode: 422, statusMessage: 'No puedes quitarte el rol de administrador' })
  if (data.active === false) throw createError({ statusCode: 422, statusMessage: 'No puedes desactivar tu propio usuario' })
}
