export type Theme = 'light' | 'dark'

export function useTheme() {
  const cookie = useCookie<Theme | undefined>('theme', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  const theme = useState<Theme | undefined>('theme', () => cookie.value)
  const isDark = computed(() => theme.value === 'dark')

  function setTheme(value: Theme) {
    theme.value = value
    cookie.value = value
  }

  const toggle = () => setTheme(isDark.value ? 'light' : 'dark')

  return { theme, isDark, setTheme, toggle }
}
