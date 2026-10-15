export default defineEventHandler(async (event) => {
  const { resource, delegate, omit } = useAdminResource(event)
  const id = parseId(resource, getRouterParam(event, 'id'))

  const item = await delegate.findUnique({
    where: { [resource.primaryKey.name]: id },
    include: resource.include,
    omit,
  })
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Registro no encontrado' })
  return item
})
