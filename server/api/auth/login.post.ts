import { z } from 'zod'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.active || !(await verifyPassword(user.password, password))) {
    throw createError({ statusCode: 401, statusMessage: 'Credenciales inválidas' })
  }

  await setUserSession(event, { user: toSessionUser(user), loggedInAt: new Date() })
  return { user: toSessionUser(user) }
})
