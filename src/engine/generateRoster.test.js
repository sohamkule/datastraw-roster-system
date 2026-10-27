import { describe, expect, it } from 'vitest'
import { CALENDAR_TYPE } from './calendar.js'
import { weekday } from './dates.js'
import { applyManualChange, applyTimeOffAndReconcile, generateRoster } from './generateRoster.js'
import { recommendCoverageFixes } from './recommendations.js'
import { STATUS } from './status.js'
import { validateRoster } from './validateRoster.js'

function miniOrg(overrides = {}) {
  const org = {
    employees: [
      { id: 'a', name: 'Asha', podId: 'p1', role: 'associate', preferredWeeklyOffs: [0], backupSkills: ['cs'] },
      { id: 'b', name: 'Bharat', podId: 'p1', role: 'associate', preferredWeeklyOffs: [0], backupSkills: ['cs'] },
      { id: 'c', name: 'Chetna', podId: 'p1', role: 'pod_lead', preferredWeeklyOffs: [0], backupSkills: ['cs'] },
    ],
    pods: [{ id: 'p1', name: 'Pod 1', leadEmployeeId: 'c' }],
    brands: [{ id: 'brand-solo', name: 'Solo Brand', podId: 'p1' }],
    processes: [{ id: 'cs', name: 'Customer Support', code: 'CS' }],
    operatingRules: [
      { brandId: 'brand-solo', processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
    ],
    assignments: [{ id: '1', employeeId: 'a', brandId: 'brand-solo', processId: 'cs', isPrimary: true }],
    holidays: [{ date: '2026-10-02', name: 'Gandhi Jayanti' }],
    timeOff: [],
  }
  return { ...org, ...overrides, employees: overrides.employees ?? org.employees }
}

describe('generateRoster', () => {

  
  it('does not recommend an employee on approved leave as a replacement', () => {
    const org = miniOrg({
      employees: [
        {
          id: 'a',
          name: 'Asha',
          podId: 'p1',
          role: 'associate',
          preferredWeeklyOffs: [],
          backupSkills: [],
        },
      ],
    })

    const roster = generateRoster(org, 2026, 10)
    const result = applyTimeOffAndReconcile(org, roster, {
      employeeId: 'a',
      date: '2026-10-16',
      type: 'planned_leave',
      reason: 'Approved leave',
    })

    const validation = validateRoster(result.org, result.roster)
    const recommendations = recommendCoverageFixes(
      result.org,
      result.roster,
      validation,
    )

    const gap = recommendations.find((r) => r.date === '2026-10-16')

    expect(gap).toBeDefined()
    expect(gap.suggestions.some((s) => s.employeeId === 'a')).toBe(false)
  })

  it('restores a backup employee status when the backup is no longer needed', () => {
    const org = miniOrg({
      employees: [
        {
          id: 'a',
          name: 'Asha',
          podId: 'p1',
          role: 'associate',
          preferredWeeklyOffs: [],
          backupSkills: [],
        },
        {
          id: 'b',
          name: 'Bharat',
          podId: 'p1',
          role: 'associate',
          preferredWeeklyOffs: [],
          backupSkills: ['cs'],
        },
      ],
    })

    const roster = generateRoster(org, 2026, 10)
    expect(roster.employeeDays.b['2026-10-16'].status).toBe(STATUS.REST)

    const leaveRoster = applyManualChange(
      org,
      roster,
      'a',
      '2026-10-16',
      STATUS.PLANNED_LEAVE,
    )

    expect(leaveRoster.employeeDays.b['2026-10-16'].status).toBe(STATUS.WORKING)

    const restoredRoster = applyManualChange(
      org,
      leaveRoster,
      'a',
      '2026-10-16',
      STATUS.WORKING,
    )

    expect(restoredRoster.employeeDays.b['2026-10-16'].status).toBe(STATUS.REST)
  })


  it('is deterministic for the same inputs', () => {
    const org = miniOrg()
    const first = generateRoster(org, 2026, 10)
    const second = generateRoster(org, 2026, 10)
    expect(first.employeeDays).toEqual(second.employeeDays)
    expect(first.backupAssignments).toEqual(second.backupAssignments)
  })

  it('does not grant a weekly off that would uncover a single-resource 365-day process', () => {
    const org = miniOrg()
    const roster = generateRoster(org, 2026, 10)
    const sundays = roster.dates.filter((d) => weekday(d) === 0)
    for (const date of sundays) {
      expect(roster.employeeDays.a[date].status).toBe(STATUS.WORKING)
    }
    expect(roster.generatorNotes.some((n) => n.code === 'WEEKLY_OFF_DEFERRED')).toBe(true)
  })

  it('requires Sunday coverage for 365 calendars and not for Sunday-off calendars', () => {
    const full = generateRoster(miniOrg(), 2026, 10)
    expect(full.coverage['2026-10-04']['brand-solo::cs'].required).toBe(true)

    const sundayOff = miniOrg({
      operatingRules: [
        { brandId: 'brand-solo', processId: 'cs', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      ],
    })
    const roster = generateRoster(sundayOff, 2026, 10)
    expect(roster.coverage['2026-10-04']['brand-solo::cs'].required).toBe(false)
    expect(roster.employeeDays.a['2026-10-04'].status).toBe(STATUS.WEEKLY_OFF)
  })

  it('assigns a same-pod backup when the only resource takes leave on a required day', () => {
    const org = miniOrg({
      timeOff: [{ employeeId: 'a', date: '2026-10-08', type: 'planned_leave', reason: 'Leave' }],
    })
    const roster = generateRoster(org, 2026, 10)
    expect(roster.employeeDays.a['2026-10-08'].status).toBe(STATUS.PLANNED_LEAVE)
    const backups = roster.backupAssignments.filter((b) => b.date === '2026-10-08')
    expect(backups.length).toBeGreaterThan(0)
    const validation = validateRoster(org, roster)
    expect(validation.isValid).toBe(true)
  })
})

describe('validateRoster', () => {
  it('never reports valid when mandatory coverage is missing', () => {
    const org = miniOrg({
      employees: [{ id: 'a', name: 'Asha', podId: 'p1', role: 'associate', preferredWeeklyOffs: [0], backupSkills: [] }],
      timeOff: [{ employeeId: 'a', date: '2026-10-08', type: 'planned_leave', reason: 'Leave' }],
    })
    const roster = generateRoster(org, 2026, 10)
    const validation = validateRoster(org, roster)
    expect(validation.issues.some((i) => i.code === 'COVERAGE_GAP')).toBe(true)
    expect(validation.isValid).toBe(false)
  })

  it('does not treat preference violations as making a roster invalid', () => {
    const org = miniOrg()
    const roster = generateRoster(org, 2026, 10)
    const validation = validateRoster(org, roster)
    expect(validation.preferenceCount).toBeGreaterThan(0)
    expect(validation.isValid).toBe(true)
    expect(validation.issues.filter((i) => i.severity === 'mandatory')).toHaveLength(0)
  })

  it('flags an employee who is marked working despite approved leave', () => {
    const org = miniOrg()
    const roster = generateRoster(org, 2026, 10)
    roster.employeeDays.a['2026-10-08'] = { status: STATUS.WORKING, note: 'bad' }
    org.timeOff = [{ employeeId: 'a', date: '2026-10-08', type: 'planned_leave', reason: 'Leave' }]
    const validation = validateRoster(org, roster)
    expect(validation.isValid).toBe(false)
    expect(validation.issues.some((i) => i.code === 'TIME_OFF_IGNORED')).toBe(true)
  })

  it('keeps coverage when one of two overlapping employees is on leave and minStaffing is 1', () => {
    const org = miniOrg({
      operatingRules: [
        { brandId: 'brand-solo', processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
      ],
      assignments: [
        { id: '1', employeeId: 'a', brandId: 'brand-solo', processId: 'cs', isPrimary: true },
        { id: '2', employeeId: 'b', brandId: 'brand-solo', processId: 'cs', isPrimary: true },
      ],
      timeOff: [{ employeeId: 'a', date: '2026-10-08', type: 'planned_leave', reason: 'Leave' }],
    })
    const roster = generateRoster(org, 2026, 10)
    const validation = validateRoster(org, roster)
    expect(roster.employeeDays.b['2026-10-08'].status).toBe(STATUS.WORKING)
    expect(validation.issues.filter((i) => i.code === 'COVERAGE_GAP' && i.date === '2026-10-08')).toHaveLength(0)
    expect(validation.isValid).toBe(true)
  })

  it('flags a gap when minStaffing is 2 and only one overlapping employee remains, with no backup', () => {
    const org = miniOrg({
      employees: [
        { id: 'a', name: 'Asha', podId: 'p1', role: 'associate', preferredWeeklyOffs: [3], backupSkills: [] },
        { id: 'b', name: 'Bharat', podId: 'p1', role: 'associate', preferredWeeklyOffs: [2], backupSkills: [] },
      ],
      operatingRules: [
        { brandId: 'brand-solo', processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 2 },
      ],
      assignments: [
        { id: '1', employeeId: 'a', brandId: 'brand-solo', processId: 'cs', isPrimary: true },
        { id: '2', employeeId: 'b', brandId: 'brand-solo', processId: 'cs', isPrimary: true },
      ],
      timeOff: [{ employeeId: 'a', date: '2026-10-08', type: 'planned_leave', reason: 'Leave' }],
    })
    const roster = generateRoster(org, 2026, 10)
    const validation = validateRoster(org, roster)
    expect(validation.isValid).toBe(false)
    expect(validation.issues.some((i) => i.code === 'COVERAGE_GAP' && i.date === '2026-10-08')).toBe(true)
  })
})

describe('manual changes and post-generation leave', () => {
  it('revalidates after a manual weekly off that uncovers a process', () => {
    const org = miniOrg({
      employees: [{ id: 'a', name: 'Asha', podId: 'p1', role: 'associate', preferredWeeklyOffs: [0], backupSkills: [] }],
    })
    const roster = generateRoster(org, 2026, 10)
    expect(validateRoster(org, roster).isValid).toBe(true)
    const edited = applyManualChange(org, roster, 'a', '2026-10-07', STATUS.WEEKLY_OFF)
    const validation = validateRoster(org, edited)
    expect(validation.isValid).toBe(false)
    expect(validation.issues.some((i) => i.code === 'COVERAGE_GAP')).toBe(true)
  })

  it('flags a single-resource brand when the owner becomes unavailable after generation and lists backup options', () => {
    const org = miniOrg()
    const roster = generateRoster(org, 2026, 10)
    const { org: nextOrg, roster: nextRoster } = applyTimeOffAndReconcile(org, roster, {
      employeeId: 'a',
      date: '2026-10-16',
      type: 'planned_leave',
      reason: 'Sudden leave',
    })
    const validation = validateRoster(nextOrg, nextRoster)
    const recs = recommendCoverageFixes(nextOrg, nextRoster, validation)
    expect(nextRoster.backupAssignments.some((b) => b.date === '2026-10-16')).toBe(true)
    expect(validation.isValid).toBe(true)
    expect(recs.filter((r) => r.date === '2026-10-16')).toHaveLength(0)
  })

  it('explains the gap when a sole resource is unavailable and nobody can backup', () => {
    const org = miniOrg({
      employees: [{ id: 'a', name: 'Asha', podId: 'p1', role: 'associate', preferredWeeklyOffs: [0], backupSkills: [] }],
    })
    const roster = generateRoster(org, 2026, 10)
    const { org: nextOrg, roster: nextRoster } = applyTimeOffAndReconcile(org, roster, {
      employeeId: 'a',
      date: '2026-10-16',
      type: 'planned_leave',
      reason: 'Sudden leave',
    })
    const validation = validateRoster(nextOrg, nextRoster)
    expect(validation.isValid).toBe(false)
    const recs = recommendCoverageFixes(nextOrg, nextRoster, validation)
    expect(recs[0].explanation).toMatch(/sole resource/i)
  })
})
