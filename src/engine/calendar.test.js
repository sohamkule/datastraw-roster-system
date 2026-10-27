import { describe, expect, it } from 'vitest'
import { CALENDAR_TYPE, holidaySet, isOperatingDay } from './calendar.js'
import { weekday } from './dates.js'

const holidays = holidaySet([{ date: '2026-10-02', name: 'Gandhi Jayanti' }])

describe('isOperatingDay', () => {
  it('treats 365-day calendars as always on, including Sundays and holidays', () => {
    expect(isOperatingDay(CALENDAR_TYPE.FULL_YEAR, '2026-10-04', holidays)).toBe(true) // Sunday
    expect(isOperatingDay(CALENDAR_TYPE.FULL_YEAR, '2026-10-02', holidays)).toBe(true) // holiday
  })

  it('closes holidays_off calendars on public holidays but not Sundays', () => {
    expect(weekday('2026-10-04')).toBe(0)
    expect(isOperatingDay(CALENDAR_TYPE.HOLIDAYS_OFF, '2026-10-04', holidays)).toBe(true)
    expect(isOperatingDay(CALENDAR_TYPE.HOLIDAYS_OFF, '2026-10-02', holidays)).toBe(false)
  })

  it('closes Sundays and holidays for sundays_and_holidays_off', () => {
    expect(isOperatingDay(CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, '2026-10-04', holidays)).toBe(false)
    expect(isOperatingDay(CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, '2026-10-02', holidays)).toBe(false)
    expect(isOperatingDay(CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, '2026-10-05', holidays)).toBe(true)
  })

  it('keeps weekdays-only calendars closed on Saturday, Sunday and holidays', () => {
    expect(isOperatingDay(CALENDAR_TYPE.WEEKDAYS, '2026-10-03', holidays)).toBe(false) // Saturday
    expect(isOperatingDay(CALENDAR_TYPE.WEEKDAYS, '2026-10-05', holidays)).toBe(true) // Monday
  })
})
