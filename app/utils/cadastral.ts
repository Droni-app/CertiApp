/** "Lote_Urbanizado_No_Construido" → "Lote Urbanizado No Construido"; "PH.Unidad_Predial" → "PH Unidad Predial" */
export function humanize(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value).replace(/[_.]+/g, ' ').trim()
}

/** Zona: 01 = urbano, 00 o > 01 = rural */
export const zoneLabel = (zone: string | null | undefined) => (!zone ? '—' : zone === '01' ? 'Urbano' : 'Rural')

/** Tipo de derecho del interesado: vacío = Propietario(a) */
export const rightLabel = (rightType: string | null | undefined) => (rightType ? humanize(rightType) : 'Propietario(a)')

/** Variación porcentual entre dos valores (null si no se puede calcular) */
export function percentChange(current: unknown, previous: unknown): number | null {
  const c = Number(current)
  const p = Number(previous)
  if (current == null || previous == null || !Number.isFinite(c) || !Number.isFinite(p) || p === 0) return null
  return ((c - p) / p) * 100
}
