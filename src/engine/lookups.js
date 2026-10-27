import { holidaySet, isOperatingDay, ruleKey } from './calendar.js'
import { inMonth, monthDates } from './dates.js'

export function indexOrg(org) {
  const employeesById = Object.fromEntries(org.employees.map((e) => [e.id, e]))
  const brandsById = Object.fromEntries(org.brands.map((b) => [b.id, b]))
  const processesById = Object.fromEntries(org.processes.map((p) => [p.id, p]))
  const podsById = Object.fromEntries(org.pods.map((p) => [p.id, p]))
  const rulesByKey = Object.fromEntries(org.operatingRules.map((r) => [ruleKey(r.brandId, r.processId), r]))
  const holidays = holidaySet(org.holidays)

  const assignmentsByEmployee = new Map()
  const assignmentsByRule = new Map()
  for (const a of org.assignments) {
    if (!assignmentsByEmployee.has(a.employeeId)) assignmentsByEmployee.set(a.employeeId, [])
    assignmentsByEmployee.get(a.employeeId).push(a)
    const key = ruleKey(a.brandId, a.processId)
    if (!assignmentsByRule.has(key)) assignmentsByRule.set(key, [])
    assignmentsByRule.get(key).push(a)
  }

  const timeOffByEmployeeDate = new Map()
  for (const t of org.timeOff ?? []) {
    timeOffByEmployeeDate.set(`${t.employeeId}::${t.date}`, t)
  }

  return {
    org,
    employeesById,
    brandsById,
    processesById,
    podsById,
    rulesByKey,
    holidays,
    assignmentsByEmployee,
    assignmentsByRule,
    timeOffByEmployeeDate,
  }
}

export function requiredCoverageForDate(idx, isoDate) {
  const required = []
  for (const rule of idx.org.operatingRules) {
    if (isOperatingDay(rule.calendarType, isoDate, idx.holidays)) {
      required.push(rule)
    }
  }
  return required
}

export function employeeAssignments(idx, employeeId) {
  return idx.assignmentsByEmployee.get(employeeId) ?? []
}

export function assignedEmployees(idx, brandId, processId) {
  return idx.assignmentsByRule.get(ruleKey(brandId, processId)) ?? []
}

export function operatingAssignmentsOnDate(idx, employeeId, isoDate) {
  return employeeAssignments(idx, employeeId).filter((a) => {
    const rule = idx.rulesByKey[ruleKey(a.brandId, a.processId)]
    if (!rule) return false
    return isOperatingDay(rule.calendarType, isoDate, idx.holidays)
  })
}

export function monthTimeOff(org, year, month) {
  return (org.timeOff ?? []).filter((t) => inMonth(t.date, year, month))
}

export function allRuleKeys(org) {
  return org.operatingRules.map((r) => ruleKey(r.brandId, r.processId))
}

export function datesOfMonth(year, month) {
  return monthDates(year, month)
}
