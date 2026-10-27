import { describe, expect, it } from 'vitest'
import { generateRoster } from '../engine/generateRoster.js'
import { validateRoster } from '../engine/validateRoster.js'
import { createSampleOrg, uniqueBrandCountByStaffing } from './sampleData.js'

describe('sample organization', () => {
  it('has at least 30 employees and ~80% single-employee brands', () => {
    const org = createSampleOrg()
    const stats = uniqueBrandCountByStaffing(org)
    expect(stats.employees).toBeGreaterThanOrEqual(30)
    expect(stats.brands).toBeGreaterThanOrEqual(8)
    expect(stats.single / stats.brands).toBeGreaterThanOrEqual(0.75)
    expect(stats.multi).toBeGreaterThanOrEqual(3)
  })

  it('includes overlapping process assignments and employees on multiple processes', () => {
    const org = createSampleOrg()
    const byBrandProcess = new Map()
    for (const a of org.assignments) {
      const key = `${a.brandId}::${a.processId}`
      byBrandProcess.set(key, (byBrandProcess.get(key) ?? 0) + 1)
    }
    expect([...byBrandProcess.values()].some((n) => n >= 2)).toBe(true)

    const byEmployee = new Map()
    for (const a of org.assignments) {
      byEmployee.set(a.employeeId, (byEmployee.get(a.employeeId) ?? 0) + 1)
    }
    expect([...byEmployee.values()].some((n) => n >= 2)).toBe(true)
  })

  it('generates an October 2026 roster that independent validation can score', () => {
    const org = createSampleOrg()
    const roster = generateRoster(org, 2026, 10)
    const validation = validateRoster(org, roster)
    expect(roster.dates).toHaveLength(31)
    expect(Object.keys(roster.employeeDays).length).toBe(org.employees.length)
    expect(validation.mandatoryCount).toBeGreaterThanOrEqual(0)
    expect(validation.isValid).toBe(true)
    expect(validation.issues.some((i) => i.severity === 'mandatory')).toBe(false)
  })
})
