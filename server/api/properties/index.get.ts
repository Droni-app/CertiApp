import { z } from 'zod'

const querySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

// Listado de predios (solo lectura) para cualquier usuario autenticado.
// Busca por número predial, número anterior, dirección, matrícula o propietario (nombre / documento).
export default defineEventHandler(async (event) => {
  const { search, page, pageSize } = await getValidatedQuery(event, querySchema.parse)

  const where = search
    ? {
        OR: [
          { number: { startsWith: search } },
          { previousNumber: { startsWith: search } },
          { registrationNumber: { contains: search } },
          { address: { contains: search } },
          { owners: { some: { party: { OR: [{ documentNumber: search }, { fullName: { contains: search } }] } } } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { number: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        number: true,
        address: true,
        zone: true,
        condition: true,
        economicDestination: true,
        cadastralValue: true,
        isPlaceholder: true,
        owners: { orderBy: { order: 'asc' }, take: 1, select: { party: { select: { fullName: true } } } },
        _count: { select: { owners: true } },
      },
    }),
    prisma.property.count({ where }),
  ])

  return { items, total, page, pageSize }
})
