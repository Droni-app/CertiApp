import type { H3Event } from 'h3'
import type { User } from '../generated/prisma/client'

/** Campos del usuario que se guardan en la sesión (nunca el password). */
export const toSessionUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  position: user.position,
})

/** Exige sesión activa con rol admin. */
export async function requireAdmin(event: H3Event) {
  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'No autorizado' })
  }
  return session
}
