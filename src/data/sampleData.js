import { CALENDAR_TYPE } from '../engine/calendar.js'

const processes = [
  { id: 'cs', code: 'CS', name: 'Customer Support' },
  { id: 'acc', code: 'ACC', name: 'Abandoned Cart Conversions' },
  { id: 'ndr', code: 'NDR', name: 'Non-Delivery Report Management' },
  { id: 'ret', code: 'RET', name: 'Retention' },
]

const pods = [
  { id: 'pod-alpha', name: 'Pod Alpha · Fashion & Beauty', leadEmployeeId: 'e01' },
  { id: 'pod-beta', name: 'Pod Beta · Wellness & Lifestyle', leadEmployeeId: 'e10' },
  { id: 'pod-gamma', name: 'Pod Gamma · Home & Living', leadEmployeeId: 'e19' },
  { id: 'pod-delta', name: 'Pod Delta · Food & Family', leadEmployeeId: 'e27' },
]

function emp(id, name, podId, role, preferredWeeklyOffs, backupSkills, extra = {}) {
  return { id, name, podId, role, preferredWeeklyOffs, backupSkills, ...extra }
}

const employees = [
  emp('e01', 'Kavya Menon', 'pod-alpha', 'pod_lead', [0], ['cs', 'acc', 'ndr']),
  emp('e02', 'Aditi Rao', 'pod-alpha', 'associate', [0], ['cs']),
  emp('e03', 'Nikhil Bose', 'pod-alpha', 'associate', [0], ['cs', 'acc']),
  emp('e04', 'Priya Nair', 'pod-alpha', 'associate', [6], ['cs']),
  emp('e05', 'Sameer Khan', 'pod-alpha', 'associate', [3], ['cs', 'ndr']),
  emp('e06', 'Tara Gill', 'pod-alpha', 'associate', [0], ['acc', 'ret']),
  emp('e07', 'Dev Malhotra', 'pod-alpha', 'associate', [1], ['ndr', 'cs']),
  emp('e08', 'Isha Kapoor', 'pod-alpha', 'associate', [0], ['cs']),
  emp('e09', 'Vikram Sethi', 'pod-alpha', 'associate', [2], ['cs', 'acc']),
  emp('e10', 'Rohan Iyer', 'pod-beta', 'pod_lead', [0], ['cs', 'acc', 'ret']),
  emp('e11', 'Ananya Das', 'pod-beta', 'associate', [0], ['cs']),
  emp('e12', 'Farhan Qureshi', 'pod-beta', 'associate', [6], ['cs', 'ndr']),
  emp('e13', 'Leela Krishnan', 'pod-beta', 'associate', [0], ['cs', 'ret']),
  emp('e14', 'Mohit Bansal', 'pod-beta', 'associate', [1], ['cs']),
  emp('e15', 'Sneha Pillai', 'pod-beta', 'associate', [3], ['cs', 'acc']),
  emp('e16', 'Kabir Anand', 'pod-beta', 'associate', [0], ['acc', 'ndr']),
  emp('e17', 'Riya Sen', 'pod-beta', 'associate', [0], ['cs']),
  emp('e18', 'Harsh Vora', 'pod-beta', 'associate', [6], ['cs', 'ndr']),
  emp('e19', 'Meera Shah', 'pod-gamma', 'pod_lead', [0], ['cs', 'acc']),
  emp('e20', 'Paul George', 'pod-gamma', 'associate', [0], ['cs']),
  emp('e21', 'Nandini Rao', 'pod-gamma', 'associate', [6], ['cs', 'acc']),
  emp('e22', 'Arun Iyer', 'pod-gamma', 'associate', [0], ['cs']),
  emp('e23', 'Pooja Bhatt', 'pod-gamma', 'associate', [2], ['cs', 'ret']),
  emp('e24', 'Karan Mehta', 'pod-gamma', 'associate', [0], ['acc', 'ret']),
  emp('e25', 'Diya Sharma', 'pod-gamma', 'associate', [0], ['cs']),
  emp('e26', 'Rohit Jain', 'pod-gamma', 'associate', [6], ['cs', 'ndr']),
  emp('e27', 'Arjun Patel', 'pod-delta', 'pod_lead', [0], ['cs', 'acc', 'ndr']),
  emp('e28', 'Sana Mir', 'pod-delta', 'associate', [0], ['cs']),
  emp('e29', 'Ajay Kumar', 'pod-delta', 'associate', [6], ['cs', 'acc']),
  emp('e30', 'Neha Joshi', 'pod-delta', 'associate', [1], ['cs']),
  emp('e31', 'Vivek Nair', 'pod-delta', 'associate', [0], ['acc', 'ndr']),
  emp('e32', 'Fatima Sheikh', 'pod-delta', 'associate', [3], ['cs', 'ndr']),
  emp('e33', 'Anjali Deshpande', 'pod-delta', 'ops_manager', [0], ['cs', 'acc', 'ndr', 'ret']),
]

const brands = [
  { id: 'b-lumen', name: 'Lumen Skincare', podId: 'pod-alpha' },
  { id: 'b-drift', name: 'Drift Eyewear', podId: 'pod-alpha' },
  { id: 'b-halo', name: 'Halo Hair', podId: 'pod-alpha' },
  { id: 'b-oak', name: 'Oak & Co', podId: 'pod-alpha' },
  { id: 'b-nova', name: 'Nova Apparel', podId: 'pod-alpha' },
  { id: 'b-ember', name: 'Ember Beauty', podId: 'pod-alpha' },
  { id: 'b-peak', name: 'Peak Athletics', podId: 'pod-beta' },
  { id: 'b-saffron', name: 'Saffron Box', podId: 'pod-beta' },
  { id: 'b-aura', name: 'Aura Aromatics', podId: 'pod-beta' },
  { id: 'b-summit', name: 'Summit Nutrition', podId: 'pod-beta' },
  { id: 'b-coral', name: 'Coral Dental', podId: 'pod-beta' },
  { id: 'b-northfork', name: 'Northfork Outdoor', podId: 'pod-beta' },
  { id: 'b-willow', name: 'Willow Home', podId: 'pod-gamma' },
  { id: 'b-cinder', name: 'Cinder Candles', podId: 'pod-gamma' },
  { id: 'b-velvet', name: 'Velvet Vault', podId: 'pod-gamma' },
  { id: 'b-kindred', name: 'Kindred Kitchen', podId: 'pod-gamma' },
  { id: 'b-pixel', name: 'Pixel Pets', podId: 'pod-gamma' },
  { id: 'b-nori', name: 'Nori Tea', podId: 'pod-delta' },
  { id: 'b-breeze', name: 'Breeze Baby', podId: 'pod-delta' },
  { id: 'b-harbor', name: 'Harbor Pets', podId: 'pod-delta' },
]

/**
 * Staffing pattern:
 * - 16 single-employee brands (~80%)
 * - 4 multi-employee brands (Nova 3 split processes, Ember 2 overlapping CS,
 *   Summit 3 with overlapping CS, Harbor 3 with overlapping CS + split ACC/NDR)
 */
const brandBlueprints = [
  {
    brandId: 'b-lumen',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
      { processId: 'acc', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e02', processIds: ['cs', 'acc'] }],
  },
  {
    brandId: 'b-drift',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'ndr', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e03', processIds: ['cs', 'ndr'] }],
  },
  {
    brandId: 'b-halo',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'ret', calendarType: CALENDAR_TYPE.WEEKDAYS, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e04', processIds: ['cs', 'ret'] }],
  },
  {
    brandId: 'b-oak',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'acc', calendarType: CALENDAR_TYPE.WEEKDAYS, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e01', processIds: ['cs', 'acc'] }],
  },
  {
    brandId: 'b-nova',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
      { processId: 'acc', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'ndr', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
    ],
    assignments: [
      { employeeId: 'e05', processIds: ['cs'] },
      { employeeId: 'e06', processIds: ['acc'] },
      { employeeId: 'e07', processIds: ['ndr'] },
    ],
  },
  {
    brandId: 'b-ember',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 2 },
      { processId: 'acc', calendarType: CALENDAR_TYPE.HOLIDAYS_OFF, minStaffing: 1 },
    ],
    assignments: [
      { employeeId: 'e08', processIds: ['cs'] },
      { employeeId: 'e09', processIds: ['cs', 'acc'] },
    ],
  },
  {
    brandId: 'b-peak',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
      { processId: 'acc', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e11', processIds: ['cs', 'acc'] }],
  },
  {
    brandId: 'b-saffron',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'ndr', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e12', processIds: ['cs', 'ndr'] }],
  },
  {
    brandId: 'b-aura',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'ret', calendarType: CALENDAR_TYPE.WEEKDAYS, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e13', processIds: ['cs', 'ret'] }],
  },
  {
    brandId: 'b-summit',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 2 },
      { processId: 'acc', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'ndr', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
    ],
    assignments: [
      { employeeId: 'e14', processIds: ['cs'] },
      { employeeId: 'e15', processIds: ['cs', 'acc'] },
      { employeeId: 'e16', processIds: ['ndr'] },
    ],
  },
  {
    brandId: 'b-coral',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.WEEKDAYS, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e17', processIds: ['cs'] }],
  },
  {
    brandId: 'b-northfork',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'ndr', calendarType: CALENDAR_TYPE.HOLIDAYS_OFF, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e18', processIds: ['cs', 'ndr'] }],
  },
  {
    brandId: 'b-willow',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'acc', calendarType: CALENDAR_TYPE.WEEKDAYS, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e20', processIds: ['cs', 'acc'] }],
  },
  {
    brandId: 'b-cinder',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'ret', calendarType: CALENDAR_TYPE.WEEKDAYS, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e21', processIds: ['cs', 'ret'] }],
  },
  {
    brandId: 'b-velvet',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e22', processIds: ['cs'] }],
  },
  {
    brandId: 'b-kindred',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'acc', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e25', processIds: ['cs', 'acc'] }],
  },
  {
    brandId: 'b-pixel',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'ndr', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e26', processIds: ['cs', 'ndr'] }],
  },
  {
    brandId: 'b-nori',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'acc', calendarType: CALENDAR_TYPE.WEEKDAYS, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e28', processIds: ['cs', 'acc'] }],
  },
  {
    brandId: 'b-breeze',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
      { processId: 'ndr', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
    ],
    assignments: [{ employeeId: 'e29', processIds: ['cs', 'ndr'] }],
  },
  {
    brandId: 'b-harbor',
    rules: [
      { processId: 'cs', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 2 },
      { processId: 'acc', calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
      { processId: 'ndr', calendarType: CALENDAR_TYPE.FULL_YEAR, minStaffing: 1 },
    ],
    assignments: [
      { employeeId: 'e30', processIds: ['cs'] },
      { employeeId: 'e31', processIds: ['acc'] },
      { employeeId: 'e32', processIds: ['cs', 'ndr'] },
    ],
  },
]

function expandBlueprints(blueprints) {
  const operatingRules = []
  const assignments = []
  let assignmentSeq = 1
  for (const bp of blueprints) {
    for (const rule of bp.rules) {
      operatingRules.push({
        brandId: bp.brandId,
        processId: rule.processId,
        calendarType: rule.calendarType,
        minStaffing: rule.minStaffing,
      })
    }
    for (const a of bp.assignments) {
      for (const processId of a.processIds) {
        assignments.push({
          id: `asg-${String(assignmentSeq).padStart(3, '0')}`,
          employeeId: a.employeeId,
          brandId: bp.brandId,
          processId,
          isPrimary: true,
        })
        assignmentSeq += 1
      }
    }
  }
  return { operatingRules, assignments }
}

const { operatingRules, assignments } = expandBlueprints(brandBlueprints)

const holidays = [
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-03-03', name: 'Holi' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-05-01', name: 'Labour Day' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-10-21', name: 'Diwali' },
  { date: '2026-12-25', name: 'Christmas' },
]

const timeOff = [
  { employeeId: 'e02', date: '2026-10-08', type: 'planned_leave', reason: 'Family function' },
  { employeeId: 'e11', date: '2026-10-14', type: 'planned_leave', reason: 'Medical appointment' },
  { employeeId: 'e11', date: '2026-10-15', type: 'planned_leave', reason: 'Medical appointment' },
  { employeeId: 'e20', date: '2026-10-12', type: 'comp_off', reason: 'Worked Independence Day' },
  { employeeId: 'e28', date: '2026-10-19', type: 'planned_leave', reason: 'Travel' },
  { employeeId: 'e08', date: '2026-10-05', type: 'planned_leave', reason: 'Personal' },
  { employeeId: 'e14', date: '2026-10-22', type: 'unavailable', reason: 'Training' },
  { employeeId: 'e22', date: '2026-10-09', type: 'planned_leave', reason: 'Wedding' },
]

export const ASSUMPTIONS = [
  'Sample month used in demos is October 2026, matching the assessment window.',
  'Public holidays follow a common India operations calendar for 2026.',
  'A working employee covers every assigned brand/process that operates that day (shared CX shift, not exclusive shifts).',
  'Weekly offs are preferences. Mandatory client coverage always wins.',
  'Single-resource 365-day brands generally cannot take a weekly off unless a same-pod backup is assigned.',
  'Backup coverage is offered from same-pod employees who list the process in backupSkills.',
  'Pod leads also run a brand so they appear on the roster; the ops manager (Anjali) has no primary assignments.',
  'Meera Shah (Pod Gamma lead) and Arjun Patel (Pod Delta lead) oversee their pods; Gamma/Delta leads have backup skills but no dedicated single brand so they can absorb gaps.',
]

export function createSampleOrg() {
  return structuredClone({
    companyName: 'Northline CX Operations',
    processes,
    pods,
    employees,
    brands,
    operatingRules,
    assignments,
    holidays,
    timeOff,
    brandBlueprints,
  })
}

export function uniqueBrandCountByStaffing(org) {
  const byBrand = new Map()
  for (const a of org.assignments) {
    if (!byBrand.has(a.brandId)) byBrand.set(a.brandId, new Set())
    byBrand.get(a.brandId).add(a.employeeId)
  }
  let single = 0
  let multi = 0
  for (const set of byBrand.values()) {
    if (set.size <= 1) single += 1
    else multi += 1
  }
  return { brands: byBrand.size, single, multi, employees: org.employees.length }
}
