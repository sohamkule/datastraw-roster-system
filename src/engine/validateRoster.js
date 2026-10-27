import { ruleKey } from './calendar.js'
import { weekday } from './dates.js'
import { assignedEmployees, indexOrg, operatingAssignmentsOnDate, requiredCoverageForDate } from './lookups.js'
import { HARD_UNAVAILABLE, STATUS, TIME_OFF_TO_STATUS, canCountTowardCoverage } from './status.js'

const MANDATORY = 'mandatory'
const PREFERENCE = 'preference'

function issue(severity, code, fields) {
  return { severity, code, ...fields }
}

function coveringIds(roster, date, brandId, processId) {
  const cell = roster.coverage?.[date]?.[ruleKey(brandId, processId)]
  if (cell) {
    return [...new Set([...(cell.primaryEmployeeIds ?? []), ...(cell.backupEmployeeIds ?? [])])]
  }
  const primaries = []
  // Independent reconstruction from statuses + assignments + backups
  return primaries
}

function reconstructCovering(idx, roster, date, rule) {
  const primaries = assignedEmployees(idx, rule.brandId, rule.processId)
    .filter((a) => canCountTowardCoverage(roster.employeeDays[a.employeeId]?.[date]?.status))
    .map((a) => a.employeeId)
  const backups = (roster.backupAssignments ?? [])
    .filter(
      (b) =>
        b.date === date &&
        b.brandId === rule.brandId &&
        b.processId === rule.processId &&
        canCountTowardCoverage(roster.employeeDays[b.employeeId]?.[date]?.status),
    )
    .map((b) => b.employeeId)
  return [...new Set([...primaries, ...backups])]
}

/**
 * Independent validator. Never trusts generator-computed `isValid`.
 * A roster is valid only when zero mandatory issues exist.
 */
export function validateRoster(org, roster) {
  const idx = indexOrg(org)
  const issues = []

  if (!roster?.employeeDays || !roster?.dates) {
    return {
      isValid: false,
      issues: [
        issue(MANDATORY, 'ROSTER_MISSING', {
          message: 'No roster has been generated yet.',
        }),
      ],
    }
  }

  for (const emp of org.employees) {
    for (const date of roster.dates) {
      const cell = roster.employeeDays[emp.id]?.[date]
      if (!cell?.status) {
        issues.push(
          issue(MANDATORY, 'MISSING_STATUS', {
            employeeId: emp.id,
            date,
            message: `${emp.name} has no roster status on ${date}.`,
          }),
        )
      }
    }
  }

  for (const off of org.timeOff ?? []) {
    if (!roster.dates.includes(off.date)) continue
    const expected = TIME_OFF_TO_STATUS[off.type] ?? STATUS.UNAVAILABLE
    const actual = roster.employeeDays[off.employeeId]?.[off.date]?.status
    if (actual !== expected) {
      const emp = idx.employeesById[off.employeeId]
      issues.push(
        issue(MANDATORY, 'TIME_OFF_IGNORED', {
          employeeId: off.employeeId,
          date: off.date,
          message: `${emp?.name ?? off.employeeId} is rostered as ${actual} on ${off.date} but has approved ${off.type.replace('_', ' ')}.`,
        }),
      )
    }
    if (canCountTowardCoverage(actual)) {
      issues.push(
        issue(MANDATORY, 'UNAVAILABLE_COUNTED_AS_WORKING', {
          employeeId: off.employeeId,
          date: off.date,
          message: `${idx.employeesById[off.employeeId]?.name ?? off.employeeId} cannot cover processes on ${off.date} while marked ${off.type.replace('_', ' ')}.`,
        }),
      )
    }
  }

  for (const date of roster.dates) {
    const required = requiredCoverageForDate(idx, date)
    for (const rule of required) {
      const covering = reconstructCovering(idx, roster, date, rule)
      const brand = idx.brandsById[rule.brandId]
      const process = idx.processesById[rule.processId]
      if (covering.length < rule.minStaffing) {
        const assigned = assignedEmployees(idx, rule.brandId, rule.processId)
        const unavailable = assigned.map((a) => {
          const emp = idx.employeesById[a.employeeId]
          const status = roster.employeeDays[a.employeeId]?.[date]?.status
          return `${emp?.name ?? a.employeeId} (${status ?? 'unscheduled'})`
        })
        issues.push(
          issue(MANDATORY, 'COVERAGE_GAP', {
            date,
            brandId: rule.brandId,
            processId: rule.processId,
            minStaffing: rule.minStaffing,
            staffing: covering.length,
            coveringEmployeeIds: covering,
            message: `${brand?.name ?? rule.brandId} / ${process?.name ?? rule.processId} needs ${rule.minStaffing} on ${date} but only ${covering.length} available. Assigned resources: ${unavailable.join(', ') || 'none'}.`,
          }),
        )
      }

      for (const employeeId of covering) {
        const status = roster.employeeDays[employeeId]?.[date]?.status
        if (HARD_UNAVAILABLE.has(status) || status === STATUS.WEEKLY_OFF || status === STATUS.PUBLIC_HOLIDAY) {
          issues.push(
            issue(MANDATORY, 'UNAVAILABLE_RESOURCE_COVERING', {
              date,
              employeeId,
              brandId: rule.brandId,
              processId: rule.processId,
              message: `${idx.employeesById[employeeId]?.name ?? employeeId} is ${status} on ${date} but was counted against ${brand?.name} / ${process?.name}.`,
            }),
          )
        }
      }
    }
  }

  for (const emp of org.employees) {
    const preferred = emp.preferredWeeklyOffs ?? []
    if (preferred.length === 0) continue
    for (const date of roster.dates) {
      if (!preferred.includes(weekday(date))) continue
      const status = roster.employeeDays[emp.id]?.[date]?.status
      if (status === STATUS.WEEKLY_OFF) continue
      if (HARD_UNAVAILABLE.has(status)) continue
      const operating = operatingAssignmentsOnDate(idx, emp.id, date)
      if (operating.length === 0) continue
      issues.push(
        issue(PREFERENCE, 'PREFERRED_OFF_NOT_HONORED', {
          employeeId: emp.id,
          date,
          message: `${emp.name} prefers weekly off on ${date} but is rostered as ${status} to protect mandatory coverage.`,
        }),
      )
    }
  }

  for (const note of roster.generatorNotes ?? []) {
    if (!issues.some((i) => i.code === note.code && i.employeeId === note.employeeId && i.date === note.date)) {
      issues.push(note)
    }
  }

  // Stored coverage vs reconstructed coverage (detect stale UI state)
  for (const date of roster.dates) {
    for (const rule of requiredCoverageForDate(idx, date)) {
      const key = ruleKey(rule.brandId, rule.processId)
      const stored = roster.coverage?.[date]?.[key]
      const reconstructed = reconstructCovering(idx, roster, date, rule)
      if (stored && stored.staffing !== reconstructed.length) {
        issues.push(
          issue(MANDATORY, 'STALE_COVERAGE_MATRIX', {
            date,
            brandId: rule.brandId,
            processId: rule.processId,
            message: `Stored coverage for ${idx.brandsById[rule.brandId]?.name} / ${idx.processesById[rule.processId]?.name} on ${date} does not match independently reconstructed staffing.`,
          }),
        )
      }
    }
  }

  const mandatoryCount = issues.filter((i) => i.severity === MANDATORY).length
  return {
    isValid: mandatoryCount === 0,
    mandatoryCount,
    preferenceCount: issues.filter((i) => i.severity === PREFERENCE).length,
    issues,
  }
}

export { coveringIds, reconstructCovering }
