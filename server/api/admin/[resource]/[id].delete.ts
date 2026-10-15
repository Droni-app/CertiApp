export default defineEventHandler(async (event) => {
  const { resource, delegate } = useAdminResource(event)
  const id = parseId(resource, getRouterParam(event, 'id'))
  await guardSelfUser(event, resource, id)

  try {
    await delegate.delete({ where: { [resource.primaryKey.name]: id } })
    return { ok: true }
  } catch (error) {
    handlePrismaError(error)
  }
})
