export default defineEventHandler(async (event) => {
  const { resource, delegate, omit } = useAdminResource(event)
  const data = await readAdminBody(event, resource, 'create')

  try {
    setResponseStatus(event, 201)
    return await delegate.create({ data, omit })
  } catch (error) {
    handlePrismaError(error)
  }
})
