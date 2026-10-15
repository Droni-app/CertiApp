export default defineEventHandler(async (event) => {
  const { resource, delegate, omit } = useAdminResource(event)
  const { page, pageSize, where, orderBy } = buildListQuery(event, resource)

  const [items, total] = await Promise.all([
    delegate.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: resource.include,
      omit,
    }),
    delegate.count({ where }),
  ])

  return { items, total, page, pageSize }
})
