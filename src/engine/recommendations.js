import { assignedEmployees, indexOrg } from './lookups.js'
import { STATUS } from './status.js'

/**
 * For each coverage gap, suggest people who could cover: same-pod backup skills,
 * or assigned teammates who are currently off (so a manager can swap weekly offs).
 */
export function recommendCoverageFixes(org, roster, validation) {
  const idx = indexOrg(org)
  const gaps = (validation?.issues ?? []).filter((i) => i.code === 'COVERAGE_GAP')
  return gaps.map((gap) => {
    const brand = idx.brandsById[gap.brandId]
    const process = idx.processesById[gap.processId]
    const assigned = assignedEmployees(idx, gap.brandId, gap.processId)
    const swapCandidates = assigned
      .map((a) => {
        const emp = idx.employeesById[a.employeeId]
        const status = roster.employeeDays[a.employeeId]?.[gap.date]?.status
        return { employeeId: emp.id, name: emp.name, status, kind: 'assigned' }
      })
      .filter((c) => c.status === STATUS.WEEKLY_OFF)

    const backupCandidates = org.employees
      .filter((emp) => {
        if (assigned.some((a) => a.employeeId === emp.id)) return false
        if (brand?.podId && emp.podId !== brand.podId) return false
        if (!(emp.backupSkills ?? []).includes(gap.processId)) return false
        const status = roster.employeeDays[emp.id]?.[gap.date]?.status
        return status === STATUS.WORKING || status === STATUS.REST || status === STATUS.WEEKLY_OFF
      })
      .map((emp) => ({
        employeeId: emp.id,
        name: emp.name,
        status: roster.employeeDays[emp.id]?.[gap.date]?.status,
        kind: 'backup',
      }))
      .sort((a, b) => a.employeeId.localeCompare(b.employeeId))

    const shortfall = gap.minStaffing - gap.staffing
    let explanation

    if (assigned.length === 1 && swapCandidates.length === 1) {
      explanation = `${assigned[0] ? idx.employeesById[assigned[0].employeeId].name : 'The only assigned employee'} is the sole resource for this brand/process. When they are unavailable on a required day, coverage cannot be met without a backup or a schedule swap.`
    } else if (assigned.length === 1 && swapCandidates.length === 0) {
      explanation = `${assigned[0] ? idx.employeesById[assigned[0].employeeId].name : 'The only assigned employee'} is the sole resource for this brand/process, and no eligible replacement is available.`
    } else if (assigned.length > 1 && gap.staffing > 0) {
      explanation = `Remaining assigned employees are working, but staffing is still below the minimum of ${gap.minStaffing}.`
    } else {
      explanation = `No assigned employee is available to work this required day.`
    }

    return {
      date: gap.date,
      brandId: gap.brandId,
      processId: gap.processId,
      brandName: brand?.name,
      processName: process?.name,
      shortfall,
      message: gap.message,
      explanation,
      suggestions: [...swapCandidates, ...backupCandidates],
    }
  })
}
