// Protege todo /api excepto las rutas públicas de autenticación.
// /api/_auth/session la expone nuxt-auth-utils para useUserSession().
// /api/admin/* además exige rol admin.
const publicRoutes = ['/api/auth/login', '/api/_auth/session']

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/') || publicRoutes.includes(path)) return
  if (path.startsWith('/api/admin/')) await requireAdmin(event)
  else await requireUserSession(event)
})
