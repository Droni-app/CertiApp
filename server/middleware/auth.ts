// Protege todo /api excepto las rutas públicas de autenticación.
// /api/_auth/session la expone nuxt-auth-utils para useUserSession().
const publicRoutes = ['/api/auth/login', '/api/_auth/session']

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/') || publicRoutes.includes(path)) return
  await requireUserSession(event)
})
