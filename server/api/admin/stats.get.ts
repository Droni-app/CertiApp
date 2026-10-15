// Totales por recurso para el resumen de Administración
export default defineEventHandler(async () => {
  const delegates = prisma as unknown as Record<string, { count: () => Promise<number> }>
  const counts = await Promise.all(adminResources.map((r) => delegates[r.model]!.count()))
  return Object.fromEntries(adminResources.map((r, i) => [r.key, counts[i]]))
})
