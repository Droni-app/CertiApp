// Uso: definePageMeta({ middleware: 'admin' })
export default defineNuxtRouteMiddleware(() => {
  const { user } = useUserSession()
  if (user.value?.role !== 'admin') return navigateTo('/')
})
