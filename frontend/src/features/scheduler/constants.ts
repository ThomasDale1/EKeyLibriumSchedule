export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const
export const DAYS_SHORT = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'] as const

export const START_HOUR = 7
export const END_HOUR = 21
export const SLOT_MINUTES = 30
export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES
export const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR

export const SLOT_HEIGHT_PX = 28
export const HEADER_HEIGHT_PX = 44
export const TIME_COL_WIDTH_PX = 64

export const MIN_DURATION_SLOTS = 1
export const DEFAULT_DURATION_SLOTS = 2

export function slotToTime(slot: number): string {
  const totalMinutes = START_HOUR * 60 + slot * SLOT_MINUTES
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function slotsToLabel(slots: number): string {
  const mins = slots * SLOT_MINUTES
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
