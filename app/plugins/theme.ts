// Aplica la clase .dark en <html> según la cookie `theme`.
// Si aún no hay preferencia guardada, toma la del sistema operativo.
export default defineNuxtPlugin(() => {
  const { theme, setTheme } = useTheme()

  if (import.meta.client && !theme.value) {
    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  }

  useHead({
    htmlAttrs: { class: computed(() => (theme.value === 'dark' ? 'dark' : undefined)) },
  })
})
