// Redirige a /login si no hay sesión; las páginas públicas declaran `auth: false`.
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  if (to.meta.auth === false) {
    if (loggedIn.value && to.path === '/login') return navigateTo('/')
    return
  }
  if (!loggedIn.value) return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
})
