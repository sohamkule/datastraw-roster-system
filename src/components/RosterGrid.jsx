import { WEEKDAY_SHORT, weekday } from '../engine/dates.js'
import { STATUS } from '../engine/status.js'

const SHORT = {
  [STATUS.WORKING]: 'W',
  [STATUS.WEEKLY_OFF]: 'WO',
  [STATUS.PUBLIC_HOLIDAY]: 'PH',
  [STATUS.PLANNED_LEAVE]: 'PL',
  [STATUS.COMP_OFF]: 'CO',
  [STATUS.UNAVAILABLE]: 'UA',
  [STATUS.REST]: 'R',
}

export default function RosterGrid({ org, roster, validation, employees, onSelectCell, selectedCell }) {
  if (!roster) return <p className="hint">Generate a roster to see the schedule.</p>
  const gapDates = new Set(
    (validation?.issues ?? [])
      .filter((i) => i.code === 'COVERAGE_GAP')
      .map((i) => i.date),
  )
  const pods = Object.fromEntries(org.pods.map((p) => [p.id, p.name]))

  return (
    <div className="grid-wrap">
      <table className="roster">
        <thead>
          <tr>
            <th className="sticky">Employee</th>
            {roster.dates.map((date) => (
              <th key={date} className={weekday(date) === 0 ? 'weekend' : ''}>
                <div>{date.slice(8)}</div>
                <div>{WEEKDAY_SHORT[weekday(date)]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td className="sticky">
                <strong>{emp.name}</strong>
                <div className="hint">{pods[emp.podId]?.split('·')[0]} · {emp.role.replace('_', ' ')}</div>
              </td>
              {roster.dates.map((date) => {
                const status = roster.employeeDays[emp.id][date].status
                const selected = selectedCell?.employeeId === emp.id && selectedCell?.date === date
                return (
                  <td key={date} className={weekday(date) === 0 ? 'weekend' : ''}>
                    <button
                      className={`cell ${status}${gapDates.has(date) && status !== STATUS.WORKING ? ' gap' : ''}`}
                      style={selected ? { boxShadow: '0 0 0 2px #172033' } : undefined}
                      onClick={() => onSelectCell?.({ employeeId: emp.id, date, status })}
                      title={`${emp.name} · ${date} · ${status}`}
                    >
                      {SHORT[status] ?? '?'}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatusLegend() {
  return (
    <div className="legend">
      <span><i className="swatch" style={{ background: '#dff3e7' }} /> Working</span>
      <span><i className="swatch" style={{ background: '#eceff4' }} /> Weekly off</span>
      <span><i className="swatch" style={{ background: '#e4e8fb' }} /> Public holiday</span>
      <span><i className="swatch" style={{ background: '#f8e4cf' }} /> Leave / comp-off</span>
      <span><i className="swatch" style={{ background: '#f3eee6' }} /> Rest</span>
    </div>
  )
}
