import { STATUS_LABELS } from './status.js'
import { WEEKDAY_SHORT, weekday } from './dates.js'

export function rosterToCsv(org, roster) {
  const employees = [...org.employees].sort((a, b) => a.name.localeCompare(b.name))
  const header = ['Employee', 'Role', 'Pod', ...roster.dates.map((d) => `${d} (${WEEKDAY_SHORT[weekday(d)]})`)]
  const lines = [header.join(',')]
  const pods = Object.fromEntries(org.pods.map((p) => [p.id, p.name]))
  for (const emp of employees) {
    const cells = roster.dates.map((d) => STATUS_LABELS[roster.employeeDays[emp.id][d].status] ?? '')
    lines.push([csv(emp.name), csv(emp.role), csv(pods[emp.podId] ?? ''), ...cells.map(csv)].join(','))
  }
  return lines.join('\n')
}

function csv(value) {
  const s = String(value ?? '')
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`
  return s
}

export function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
