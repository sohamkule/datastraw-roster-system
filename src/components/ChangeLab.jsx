import { useState } from 'react'
import ConflictPanel from './ConflictPanel.jsx'

export default function ChangeLab({ org, roster, onApplyLeave }) {
  const assigned = org.employees.filter((e) => org.assignments.some((a) => a.employeeId === e.id))
  const [employeeId, setEmployeeId] = useState(assigned[0]?.id ?? org.employees[0].id)
  const [date, setDate] = useState(roster?.dates?.[15] ?? '2026-10-16')
  const [type, setType] = useState('planned_leave')
  const [result, setResult] = useState(null)

  function apply(e) {
    e.preventDefault()
    const next = onApplyLeave({ employeeId, date, type, reason: 'Change-lab scenario' })
    setResult(next)
  }

  const emp = org.employees.find((e) => e.id === employeeId)

  return (
    <div className="two-col">
      <div className="panel">
        <h2>Change after publish</h2>
        <p className="hint">
          Apply leave on the existing roster without rebuilding every other day. The engine re-checks coverage,
          tries same-pod backups, and reports anything still uncovered.
        </p>
        <form className="form-grid" onSubmit={apply}>
          <label>Employee
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {assigned.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </label>
          <label>Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="planned_leave">Planned leave</option>
              <option value="comp_off">Comp-off</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
          <label>&nbsp;<button className="btn primary" type="submit">Apply change &amp; revalidate</button></label>
        </form>
        <p className="hint">
          Try Aditi Rao (sole owner of Lumen Skincare, 365-day CS) or Sameer Khan (Nova Apparel CS) to see
          single-resource versus multi-employee behaviour.
        </p>
        {result && (
          <p>
            Last change: <strong>{emp?.name}</strong> on {date} → {type.replace('_', ' ')}. Roster valid?{' '}
            <span className={`pill ${result.validation.isValid ? 'ok' : 'bad'}`}>
              {result.validation.isValid ? 'yes' : 'no'}
            </span>
          </p>
        )}
      </div>
      {result ? (
        <ConflictPanel org={result.org} roster={result.roster} validation={result.validation} showPreferences={false} />
      ) : (
        <div className="panel">
          <h2>Impact</h2>
          <p className="hint">Run a change to see coverage gaps and backup suggestions here.</p>
        </div>
      )}
    </div>
  )
}
