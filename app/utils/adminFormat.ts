const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 })

/** Formatea un valor para mostrarlo en tablas según el tipo del campo */
export function formatAdminValue(value: unknown, type?: AdminFieldType): string {
  if (value === null || value === undefined || value === '') return '—'
  switch (type) {
    case 'currency':
      return currency.format(Number(value))
    case 'decimal':
      return decimal.format(Number(value))
    case 'date': {
      const [y, m, d] = String(value).slice(0, 10).split('-')
      return `${d}/${m}/${y}`
    }
    case 'boolean':
      return value ? 'Sí' : 'No'
    default:
      return String(value)
  }
}

/** Mensaje legible de un error de $fetch */
export const fetchErrorMessage = (e: any, fallback = 'Ocurrió un error') =>
  e?.data?.statusMessage ?? e?.statusMessage ?? fallback
