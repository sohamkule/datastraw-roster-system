/** Date-only helpers using UTC to avoid timezone drift. */

export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function toISODate(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function parseISODate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

export function weekday(iso) {
  const { year, month, day } = parseISODate(iso)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function monthDates(year, month) {
  const count = daysInMonth(year, month)
  return Array.from({ length: count }, (_, i) => toISODate(year, month, i + 1))
}

export function monthKey(year, month) {
  return `${year}-${pad2(month)}`
}

export function inMonth(iso, year, month) {
  return iso.startsWith(monthKey(year, month))
}

export function formatMonthLabel(year, month) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
