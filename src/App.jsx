import { useMemo, useState } from 'react'
import { createSampleOrg, uniqueBrandCountByStaffing } from './data/sampleData.js'
import ChangeLab from './components/ChangeLab.jsx'
import ConflictPanel from './components/ConflictPanel.jsx'
import CoverageTable from './components/CoverageTable.jsx'
import Directory from './components/Directory.jsx'
import RosterGrid, { StatusLegend } from './components/RosterGrid.jsx'
import {
  STATUS,
  STATUS_LABELS,
  applyManualChange,
  applyTimeOffAndReconcile,
  formatMonthLabel,
  generateRoster,
  validateRoster,
} from './engine/index.js'
import { downloadCsv, rosterToCsv } from './engine/exportCsv.js'

const VIEWS = [
  { id: 'company', label: 'Company roster' },
  { id: 'pod', label: 'Pod view' },
  { id: 'brand', label: 'Brand coverage' },
  { id: 'process', label: 'Process view' },
  { id: 'employee', label: 'Employee view' },
  { id: 'conflicts', label: 'Conflicts' },
  { id: 'changes', label: 'Handle a change' },
  { id: 'directory', label: 'Directory' },
]

const initialOrg = createSampleOrg()
const initialRoster = generateRoster(initialOrg, 2026, 10)
const initialValidation = validateRoster(initialOrg, initialRoster)

export default function App() {
  const [org, setOrg] = useState(initialOrg)
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(10)
  const [roster, setRoster] = useState(initialRoster)
  const [validation, setValidation] = useState(initialValidation)
  const [view, setView] = useState('company')
  const [podId, setPodId] = useState(org.pods[0].id)
  const [brandId, setBrandId] = useState(org.brands[0].id)
  const [processId, setProcessId] = useState(org.processes[0].id)
  const [employeeId, setEmployeeId] = useState(org.employees[1].id)
  const [selectedCell, setSelectedCell] = useState(null)
  const [showPreferences, setShowPreferences] = useState(false)

  const stats = useMemo(() => uniqueBrandCountByStaffing(org), [org])

  function runGenerate(nextOrg = org, y = year, m = month) {
    const nextRoster = generateRoster(nextOrg, y, m)
    const nextValidation = validateRoster(nextOrg, nextRoster)
    setRoster(nextRoster)
    setValidation(nextValidation)
    setSelectedCell(null)
  }

  function onChangeOrg(nextOrg) {
    setOrg(nextOrg)
  }

  function editCell(status) {
    if (!selectedCell || !roster) return
    const next = applyManualChange(org, roster, selectedCell.employeeId, selectedCell.date, status, 'Manual edit')
    setRoster(next)
    setValidation(validateRoster(org, next))
    setSelectedCell({ ...selectedCell, status })
  }

  function applyLeave(entry) {
    if (!roster) return { org, roster, validation }
    const { org: nextOrg, roster: nextRoster } = applyTimeOffAndReconcile(org, roster, entry)
    const nextValidation = validateRoster(nextOrg, nextRoster)
    setOrg(nextOrg)
    setRoster(nextRoster)
    setValidation(nextValidation)
    return { org: nextOrg, roster: nextRoster, validation: nextValidation }
  }

  const selectedEmp = selectedCell ? org.employees.find((e) => e.id === selectedCell.employeeId) : null

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">DataStraw <span>Roster</span></div>
          <div className="brand-sub">{org.companyName}</div>
        </div>
        <div className="nav">
          <p className="nav-label">Views</p>
          {VIEWS.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div>
          <p className="nav-label">Pods</p>
          {org.pods.map((pod) => (
            <button
              key={pod.id}
              className={`sub-btn ${podId === pod.id ? 'active' : ''}`}
              onClick={() => { setPodId(pod.id); setView('pod') }}
            >
              {pod.name.replace('Pod ', '')}
            </button>
          ))}
        </div>
        <div className="sidebar-foot">
          Scheduling engine is pure JavaScript. Validity is decided only by the independent validator.
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{formatMonthLabel(year, month)}</h1>
            <p className="lede">
              Plan coverage across brands, processes and pods. Client operating calendars are mandatory;
              weekly offs are preferences.
            </p>
          </div>
          <div className="toolbar">
            <select
              value={`${year}-${month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number)
                setYear(y)
                setMonth(m)
              }}
            >
              {[8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={`2026-${m}`}>{formatMonthLabel(2026, m)}</option>
              ))}
            </select>
            <button className="btn primary" onClick={() => runGenerate()}>Generate roster</button>
            <button
              className="btn"
              onClick={() => roster && downloadCsv(`roster-${year}-${month}.csv`, rosterToCsv(org, roster))}
            >
              Export CSV
            </button>
          </div>
        </header>

        <section className="stats">
          <div className="stat"><b>{stats.employees}</b> employees</div>
          <div className="stat"><b>{stats.brands}</b> brands · {stats.single} single / {stats.multi} multi</div>
          <div className="stat"><b>{org.pods.length}</b> pods</div>
          <div className={`stat ${validation?.isValid ? 'valid' : 'invalid'}`}>
            <b>{validation?.isValid ? 'Valid' : 'Invalid'}</b>
            {validation?.mandatoryCount ?? 0} mandatory · {validation?.preferenceCount ?? 0} preference
          </div>
        </section>

        {view === 'company' && (
          <div className="two-col">
            <div className="panel">
              <h2>Company-wide roster</h2>
              <StatusLegend />
              <RosterGrid
                org={org}
                roster={roster}
                validation={validation}
                employees={org.employees}
                selectedCell={selectedCell}
                onSelectCell={setSelectedCell}
              />
            </div>
            <Inspector
              org={org}
              roster={roster}
              selectedEmp={selectedEmp}
              selectedCell={selectedCell}
              onEdit={editCell}
            />
          </div>
        )}

        {view === 'pod' && (
          <div className="panel">
            <h2>{org.pods.find((p) => p.id === podId)?.name}</h2>
            <p className="hint">
              Lead: {org.employees.find((e) => e.id === org.pods.find((p) => p.id === podId)?.leadEmployeeId)?.name}
            </p>
            <StatusLegend />
            <RosterGrid
              org={org}
              roster={roster}
              validation={validation}
              employees={org.employees.filter((e) => e.podId === podId)}
              selectedCell={selectedCell}
              onSelectCell={setSelectedCell}
            />
          </div>
        )}

        {view === 'brand' && (
          <div className="panel">
            <h2>Brand coverage</h2>
            <label style={{ maxWidth: 280, margin: '8px 0 12px' }}>
              Brand
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                {org.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <CoverageTable org={org} roster={roster} validation={validation} brandIds={[brandId]} />
            <h3 style={{ marginTop: 18 }}>Assigned people</h3>
            <RosterGrid
              org={org}
              roster={roster}
              validation={validation}
              employees={org.employees.filter((e) =>
                org.assignments.some((a) => a.brandId === brandId && a.employeeId === e.id),
              )}
              selectedCell={selectedCell}
              onSelectCell={setSelectedCell}
            />
          </div>
        )}

        {view === 'process' && (
          <div className="panel">
            <h2>Process staffing</h2>
            <label style={{ maxWidth: 280, margin: '8px 0 12px' }}>
              Process
              <select value={processId} onChange={(e) => setProcessId(e.target.value)}>
                {org.processes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <CoverageTable org={org} roster={roster} validation={validation} processIds={[processId]} />
          </div>
        )}

        {view === 'employee' && (
          <div className="panel">
            <h2>Employee diary</h2>
            <label style={{ maxWidth: 280, margin: '8px 0 12px' }}>
              Employee
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                {org.employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </label>
            <EmployeeDiary org={org} roster={roster} employeeId={employeeId} onSelectCell={setSelectedCell} />
          </div>
        )}

        {view === 'conflicts' && (
          <>
            <label className="hint">
              <input type="checkbox" checked={showPreferences} onChange={(e) => setShowPreferences(e.target.checked)} />
              {' '}Show preference notes (weekly offs deferred to protect coverage)
            </label>
            <div style={{ height: 10 }} />
            <ConflictPanel org={org} roster={roster} validation={validation} showPreferences={showPreferences} />
          </>
        )}

        {view === 'changes' && (
          <ChangeLab org={org} roster={roster} onApplyLeave={applyLeave} />
        )}

        {view === 'directory' && (
          <Directory org={org} onChangeOrg={onChangeOrg} />
        )}
      </main>
    </div>
  )
}

function Inspector({ org, roster, selectedEmp, selectedCell, onEdit }) {
  return (
    <div className="panel inspector">
      <h2>Day inspector</h2>
      {!selectedCell && <p className="hint">Select a cell to change working / off / leave. Revalidation runs immediately.</p>}
      {selectedCell && selectedEmp && (
        <>
          <p><strong>{selectedEmp.name}</strong></p>
          <p className="hint">{selectedCell.date} · currently {STATUS_LABELS[selectedCell.status]}</p>
          <div className="toolbar" style={{ marginTop: 10 }}>
            {Object.values(STATUS).map((status) => (
              <button key={status} className="btn" type="button" onClick={() => onEdit(status)}>
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
          <AssignmentList org={org} roster={roster} employeeId={selectedEmp.id} date={selectedCell.date} />
        </>
      )}
    </div>
  )
}

function AssignmentList({ org, roster, employeeId, date }) {
  const assigned = org.assignments.filter((a) => a.employeeId === employeeId)
  const backups = (roster?.backupAssignments ?? []).filter((b) => b.employeeId === employeeId && b.date === date)
  return (
    <div style={{ marginTop: 14 }}>
      <p className="nav-label">Assignments</p>
      {assigned.map((a) => {
        const brand = org.brands.find((b) => b.id === a.brandId)
        const process = org.processes.find((p) => p.id === a.processId)
        return <div key={a.id} className="hint">{brand?.name} · {process?.name}</div>
      })}
      {backups.map((b) => (
        <div key={`${b.brandId}-${b.processId}`} className="hint">
          Backup · {org.brands.find((x) => x.id === b.brandId)?.name} / {org.processes.find((x) => x.id === b.processId)?.name}
        </div>
      ))}
    </div>
  )
}

function EmployeeDiary({ org, roster, employeeId, onSelectCell }) {
  if (!roster) return null
  const emp = org.employees.find((e) => e.id === employeeId)
  const counts = {}
  for (const date of roster.dates) {
    const s = roster.employeeDays[employeeId][date].status
    counts[s] = (counts[s] ?? 0) + 1
  }
  return (
    <>
      <p className="hint">
        {emp.role.replace('_', ' ')} · preferred weekly off:{' '}
        {(emp.preferredWeeklyOffs ?? []).map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') || 'none'}
      </p>
      <div className="stats">
        {Object.entries(counts).map(([k, v]) => (
          <div className="stat" key={k}><b>{v}</b> {STATUS_LABELS[k]}</div>
        ))}
      </div>
      <RosterGrid
        org={org}
        roster={roster}
        employees={[emp]}
        onSelectCell={onSelectCell}
      />
    </>
  )
}
