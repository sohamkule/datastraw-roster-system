import { weekday } from './dates.js'

export const CALENDAR_TYPE = {
  FULL_YEAR: '365',
  HOLIDAYS_OFF: 'holidays_off',
  SUNDAYS_AND_HOLIDAYS_OFF: 'sundays_and_holidays_off',
  WEEKDAYS: 'weekdays',
}

export const CALENDAR_LABELS = {
  [CALENDAR_TYPE.FULL_YEAR]: '365-day (Sundays & holidays included)',
  [CALENDAR_TYPE.HOLIDAYS_OFF]: 'Daily, public holidays off',
  [CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF]: 'Sundays and public holidays off',
  [CALENDAR_TYPE.WEEKDAYS]: 'Weekdays only (Sat–Sun and holidays off)',
}

/**
 * Whether a brand/process requires coverage on a given date.
 * Brand operating calendars are independent of employee weekly-off preferences.
 */
export function isOperatingDay(calendarType, isoDate, holidaySet) {
  const day = weekday(isoDate)
  const isHoliday = holidaySet.has(isoDate)

  switch (calendarType) {
    case CALENDAR_TYPE.FULL_YEAR:
      return true
    case CALENDAR_TYPE.HOLIDAYS_OFF:
      return !isHoliday
    case CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF:
      return day !== 0 && !isHoliday
    case CALENDAR_TYPE.WEEKDAYS:
      return day !== 0 && day !== 6 && !isHoliday
    default:
      return day !== 0 && !isHoliday
  }
}

export function holidaySet(holidays) {
  return new Set((holidays ?? []).map((h) => h.date))
}

export function holidayName(holidays, isoDate) {
  return (holidays ?? []).find((h) => h.date === isoDate)?.name ?? null
}

export function ruleKey(brandId, processId) {
  return `${brandId}::${processId}`
}
