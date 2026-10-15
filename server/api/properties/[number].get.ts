// Detalle de un predio con toda su información relacionada
export default defineEventHandler(async (event) => {
  const number = getRouterParam(event, 'number') ?? ''

  const property = await prisma.property.findUnique({
    where: { number },
    include: {
      matrix: { select: { number: true, address: true } },
      horizontalProperty: true,
      owners: {
        orderBy: { order: 'asc' },
        include: {
          party: {
            select: { id: true, fullName: true, documentType: true, documentNumber: true, sex: true, maritalStatus: true, businessName: true },
          },
        },
      },
      constructions: { orderBy: [{ order: 'asc' }, { identifier: 'asc' }] },
      landZones: { orderBy: { order: 'asc' } },
      administrativeSources: { orderBy: { documentDate: 'desc' } },
      procedures: { orderBy: { resolutionDate: 'desc' } },
      units: { orderBy: { number: 'asc' }, take: 100, select: { number: true, address: true, condition: true, cadastralValue: true } },
      _count: { select: { units: true } },
    },
  })
  if (!property) throw createError({ statusCode: 404, statusMessage: 'Predio no encontrado' })

  return property
})
