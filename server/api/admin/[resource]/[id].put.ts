export default defineEventHandler(async (event) => {
  const { resource, delegate, omit } = useAdminResource(event)
  const id = parseId(resource, getRouterParam(event, 'id'))
  const data = await readAdminBody(event, resource, 'update')
  await guardSelfUser(event, resource, id, data)

  try {
    return await delegate.update({ where: { [resource.primaryKey.name]: id }, data, omit })
  } catch (error) {
    handlePrismaError(error)
  }
})
