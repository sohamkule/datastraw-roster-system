import { holidayName, ruleKey } from './calendar.js'
import { monthDates, weekday } from './dates.js'
import {
  assignedEmployees,
  employeeAssignments,
  indexOrg,
  operatingAssignmentsOnDate,
  requiredCoverageForDate,
} from './lookups.js'
import { HARD_UNAVAILABLE, STATUS, TIME_OFF_TO_STATUS } from './status.js'

function emptyDayMap(employees, dates) {
  const map = {}
  for (const emp of employees) {
    map[emp.id] = {}
    for (const date of dates) {
      map[emp.id][date] = { status: null, note: null }
    }
  }
  return map
}

function applyHardTimeOff(idx, employeeDays, year, month) {
  for (const off of idx.org.timeOff ?? []) {
    if (!off.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)) continue
    if (!employeeDays[off.employeeId]) continue
    const status = TIME_OFF_TO_STATUS[off.type] ?? STATUS.UNAVAILABLE
    employeeDays[off.employeeId][off.date] = {
      status,
      note: off.reason ?? off.type,
    }
  }
}

function currentlyAvailable(idx, employeeDays, employeeId, date) {
  const cell = employeeDays[employeeId]?.[date]
  if (!cell) return false
  if (HARD_UNAVAILABLE.has(cell.status)) return false
  if (cell.status === STATUS.WEEKLY_OFF) return false
  if (cell.status === STATUS.PUBLIC_HOLIDAY) return false
  if (cell.status === STATUS.REST) return false
  return true
}

function eligibleForBackupDuty(employeeDays, employeeId, date) {
  const status = employeeDays[employeeId]?.[date]?.status
  return status === STATUS.WORKING || status === STATUS.REST || status === null
}

function primaryCoverageCount(idx, employeeDays, rule, date, exceptEmployeeId) {
  const assigned = assignedEmployees(idx, rule.brandId, rule.processId)
  let count = 0
  for (const a of assigned) {
    if (a.employeeId === exceptEmployeeId) continue
    if (currentlyAvailable(idx, employeeDays, a.employeeId, date)) count += 1
  }
  return count
}

/**
 * Grant preferred weekly offs only when remaining assigned staff can still meet
 * minimum coverage. Coverage is mandatory; weekly-off preference is not.
 */
function grantWeeklyOffs(idx, employeeDays, dates) {
  const preferenceNotes = []
  const employees = [...idx.org.employees].sort((a, b) => a.id.localeCompare(b.id))
  const grantedCount = Object.fromEntries(employees.map((e) => [e.id, 0]))

  const candidates = []
  for (const emp of employees) {
    const preferred = emp.preferredWeeklyOffs ?? []
    for (const date of dates) {
      if (employeeDays[emp.id][date].status) continue
      if (!preferred.includes(weekday(date))) continue
      candidates.push({ employeeId: emp.id, date })
    }
  }

  candidates.sort((a, b) => {
    const byGranted = grantedCount[a.employeeId] - grantedCount[b.employeeId]
    if (byGranted !== 0) return byGranted
    const byEmp = a.employeeId.localeCompare(b.employeeId)
    if (byEmp !== 0) return byEmp
    return a.date.localeCompare(b.date)
  })

  // Re-sort inside loop would be more accurate for fairness; do a few stable passes.
  const remaining = [...candidates]
  remaining.sort((a, b) => a.employeeId.localeCompare(b.employeeId) || a.date.localeCompare(b.date))

  for (const candidate of remaining) {
    const { employeeId, date } = candidate
    if (employeeDays[employeeId][date].status) continue

    const operating = operatingAssignmentsOnDate(idx, employeeId, date)
    let canGrant = true
    const blocking = []
    for (const assignment of operating) {
      const rule = idx.rulesByKey[ruleKey(assignment.brandId, assignment.processId)]
      const others = primaryCoverageCount(idx, employeeDays, rule, date, employeeId)
      if (others < rule.minStaffing) {
        canGrant = false
        blocking.push({
          brandId: rule.brandId,
          processId: rule.processId,
          minStaffing: rule.minStaffing,
          remaining: others,
        })
      }
    }

    if (canGrant) {
      employeeDays[employeeId][date] = {
        status: STATUS.WEEKLY_OFF,
        note: 'Preferred weekly off granted',
      }
      grantedCount[employeeId] += 1
    } else {
      preferenceNotes.push({
        severity: 'preference',
        code: 'WEEKLY_OFF_DEFERRED',
        employeeId,
        date,
        message: `Preferred weekly off on ${date} was not granted because coverage would fall below minimum.`,
        blocking,
      })
    }
  }

  return preferenceNotes
}

function fillRemainingStatuses(idx, employeeDays, dates) {
  for (const emp of idx.org.employees) {
    for (const date of dates) {
      if (employeeDays[emp.id][date].status) continue
      const operating = operatingAssignmentsOnDate(idx, emp.id, date)
      if (operating.length > 0) {
        employeeDays[emp.id][date] = { status: STATUS.WORKING, note: null }
        continue
      }
      if (idx.holidays.has(date)) {
        employeeDays[emp.id][date] = {
          status: STATUS.PUBLIC_HOLIDAY,
          note: holidayName(idx.org.holidays, date),
        }
      } else {
        employeeDays[emp.id][date] = {
          status: STATUS.REST,
          note: 'No assigned process operates this day',
        }
      }
    }
  }
}

function eligibleBackup(idx, employeeDays, rule, date, alreadyUsed) {
  const assignedIds = new Set(
    assignedEmployees(idx, rule.brandId, rule.processId).map((a) => a.employeeId),
  )
  const brand = idx.brandsById[rule.brandId]
  const candidates = idx.org.employees.filter((emp) => {
    if (assignedIds.has(emp.id)) return false
    if (alreadyUsed.has(emp.id)) return false
    if (!eligibleForBackupDuty(employeeDays, emp.id, date)) return false
    if (!(emp.backupSkills ?? []).includes(rule.processId)) return false
    if (brand?.podId && emp.podId !== brand.podId) return false
    return true
  })
  candidates.sort((a, b) => a.id.localeCompare(b.id))
  return candidates
}

function assignBackups(idx, employeeDays, dates) {
  const backupAssignments = []
  for (const date of dates) {
    for (const rule of requiredCoverageForDate(idx, date)) {
      const assigned = assignedEmployees(idx, rule.brandId, rule.processId)
      const workingPrimaries = assigned
        .filter((a) => employeeDays[a.employeeId]?.[date]?.status === STATUS.WORKING)
        .map((a) => a.employeeId)
      const used = new Set(workingPrimaries)
      let staffing = workingPrimaries.length
      while (staffing < rule.minStaffing) {
        const [next] = eligibleBackup(idx, employeeDays, rule, date, used)
        if (!next) break
        used.add(next.id)
        if (employeeDays[next.id][date].status !== STATUS.WORKING) {
          employeeDays[next.id][date] = {
            status: STATUS.WORKING,
            note: `Backup coverage for ${rule.brandId}/${rule.processId}`,
          }
        }
        backupAssignments.push({
          date,
          employeeId: next.id,
          brandId: rule.brandId,
          processId: rule.processId,
          reason: 'Automatic backup to meet minimum staffing',
        })
        staffing += 1
      }
    }
  }
  return backupAssignments
}

function buildCoverage(idx, employeeDays, backupAssignments, dates) {
  const coverage = {}
  for (const date of dates) {
    coverage[date] = {}
    const required = requiredCoverageForDate(idx, date)
    const requiredKeys = new Set(required.map((r) => ruleKey(r.brandId, r.processId)))

    for (const rule of idx.org.operatingRules) {
      const key = ruleKey(rule.brandId, rule.processId)
      const isRequired = requiredKeys.has(key)
      const primaries = assignedEmployees(idx, rule.brandId, rule.processId)
        .filter((a) => employeeDays[a.employeeId]?.[date]?.status === STATUS.WORKING)
        .map((a) => a.employeeId)
      const backups = backupAssignments
        .filter((b) => b.date === date && b.brandId === rule.brandId && b.processId === rule.processId)
        .map((b) => b.employeeId)
      const unique = [...new Set([...primaries, ...backups])]
      coverage[date][key] = {
        brandId: rule.brandId,
        processId: rule.processId,
        required: isRequired,
        minStaffing: rule.minStaffing,
        staffing: isRequired ? unique.length : 0,
        primaryEmployeeIds: primaries,
        backupEmployeeIds: backups,
      }
    }
  }
  return coverage
}

/**
 * Deterministic monthly roster generator.
 * Does not decide validity — callers must run validateRoster independently.
 */
export function generateRoster(org, year, month) {
  const idx = indexOrg(org)
  const dates = monthDates(year, month)
  const employeeDays = emptyDayMap(org.employees, dates)

  applyHardTimeOff(idx, employeeDays, year, month)
  const preferenceNotes = grantWeeklyOffs(idx, employeeDays, dates)
  fillRemainingStatuses(idx, employeeDays, dates)
  const backupAssignments = assignBackups(idx, employeeDays, dates)
  const coverage = buildCoverage(idx, employeeDays, backupAssignments, dates)

  return {
    year,
    month,
    dates,
    employeeDays,
    backupAssignments,
    coverage,
    generatorNotes: preferenceNotes,
  }
}

export function applyManualChange(org, roster, employeeId, date, nextStatus, note = 'Manual edit') {
  const idx = indexOrg(org)
  const employeeDays = structuredClone(roster.employeeDays)
  if (!employeeDays[employeeId]?.[date]) {
    throw new Error(`Unknown employee/date: ${employeeId} ${date}`)
  }
  employeeDays[employeeId][date] = { status: nextStatus, note }

  const dates = roster.dates
  const backupAssignments = assignBackups(idx, employeeDays, dates)
  const coverage = buildCoverage(idx, employeeDays, backupAssignments, dates)

  return {
    ...roster,
    employeeDays,
    backupAssignments,
    coverage,
    generatorNotes: roster.generatorNotes ?? [],
  }
}

export function applyTimeOffAndReconcile(org, roster, timeOffEntry) {
  const nextOrg = {
    ...org,
    timeOff: [...(org.timeOff ?? []).filter((t) => !(t.employeeId === timeOffEntry.employeeId && t.date === timeOffEntry.date)), timeOffEntry],
  }
  const idx = indexOrg(nextOrg)
  const employeeDays = structuredClone(roster.employeeDays)
  const status = TIME_OFF_TO_STATUS[timeOffEntry.type] ?? STATUS.UNAVAILABLE
  employeeDays[timeOffEntry.employeeId][timeOffEntry.date] = {
    status,
    note: timeOffEntry.reason ?? timeOffEntry.type,
  }
  const backupAssignments = assignBackups(idx, employeeDays, roster.dates)
  const coverage = buildCoverage(idx, employeeDays, backupAssignments, roster.dates)
  return {
    org: nextOrg,
    roster: {
      ...roster,
      employeeDays,
      backupAssignments,
      coverage,
    },
  }
}

export { employeeAssignments, operatingAssignmentsOnDate }
