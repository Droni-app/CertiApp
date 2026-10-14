import { z } from 'zod'

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { currentPassword, newPassword } = await readValidatedBody(event, bodySchema.parse)

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !(await verifyPassword(dbUser.password, currentPassword))) {
    throw createError({ statusCode: 400, statusMessage: 'La contraseña actual es incorrecta' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(newPassword) },
  })
  return { ok: true }
})
