// Valores ya usados en un campo de categoría (para autocompletar en los formularios)
export default defineEventHandler(async (event) => {
  const { resource, delegate } = useAdminResource(event)
  const field = resource.fields.find((f) => f.name === getQuery(event).field && f.suggest)
  if (!field) throw createError({ statusCode: 400, statusMessage: 'Campo sin sugerencias' })

  const rows = await delegate.findMany({
    where: { [field.name]: { not: null } },
    distinct: [field.name],
    select: { [field.name]: true },
    orderBy: { [field.name]: 'asc' },
    take: 200,
  })
  return rows.map((r) => r[field.name] as string)
})
