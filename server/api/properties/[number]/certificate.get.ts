import { z } from 'zod'

const querySchema = z.object({
  addressedTo: z.string().trim().max(200).optional().transform((v) => v || 'A QUIEN INTERESE'),
  consecutive: z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, 'El consecutivo debe tener entre 1 y 6 dígitos'),
})

const TIME_ZONE = 'America/Bogota'

// Abreviaturas de tipo de documento (sources/Conventions.md)
const documentTypes: Record<string, string> = {
  Cedula_Ciudadania: 'CC',
  Cedula_Extranjeria: 'CE',
  Pasaporte: 'PAP',
  NIT: 'NIT',
  Tarjeta_Identidad: 'TI',
  Registro_Civil: 'RC',
}

/** Partes de la fecha actual en la zona horaria de Colombia */
function nowParts() {
  const now = new Date()
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-CO', { timeZone: TIME_ZONE, ...options }).format(now)
  return {
    issuedAt: now.toISOString(),
    date: part({ day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: part({ hour: '2-digit', minute: '2-digit', hour12: true }),
    day: part({ day: 'numeric' }),
    month: part({ month: 'long' }),
    year: part({ year: 'numeric' }),
  }
}

const decimal = (v: unknown) =>
  v == null ? null : new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(Number(v))

// Datos del Certificado Catastral Individual (PMR34) de un predio
export default defineEventHandler(async (event) => {
  const number = getRouterParam(event, 'number') ?? ''
  const result = querySchema.safeParse(getQuery(event))
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: result.error.issues[0]?.message ?? 'Datos inválidos' })
  }
  const { addressedTo, consecutive } = result.data

  const { user } = await requireUserSession(event)
  const [property, issuer] = await Promise.all([
    prisma.property.findUnique({
      where: { number },
      include: {
        owners: {
          orderBy: { order: 'asc' },
          include: { party: { select: { fullName: true, documentType: true, documentNumber: true } } },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, position: true } }),
  ])
  if (!property) throw createError({ statusCode: 404, statusMessage: 'Predio no encontrado' })
  if (property.isPlaceholder) {
    throw createError({ statusCode: 422, statusMessage: 'El predio no está en el registro de predios; no se puede certificar' })
  }

  const now = nowParts()

  return {
    certificateNumber: `25-307-${consecutive.padStart(6, '0')}-${now.year}`,
    addressedTo,
    ...now,
    issuer: { name: issuer?.name ?? user.name, position: issuer?.position ?? null },
    property: {
      number: property.number,
      previousNumber: property.previousNumber,
      zone: property.zone === '01' ? 'URBANA' : property.zone ? 'RURAL' : null,
      registrationNumber: property.registrationNumber,
      address: property.address,
      landArea: decimal(property.landArea),
      builtArea: decimal(property.builtArea),
    },
    owners: property.owners.map((o) => ({
      documentType: o.party.documentType ? (documentTypes[o.party.documentType] ?? o.party.documentType) : null,
      documentNumber: o.party.documentNumber,
      name: o.party.fullName,
      rightType: o.rightType ? o.rightType.replace(/_/g, ' ') : 'Propietario(a)',
      participation: decimal(o.participation),
    })),
  }
})
