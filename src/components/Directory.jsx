import { useState } from 'react'
import { CALENDAR_LABELS, CALENDAR_TYPE } from '../engine/index.js'

export default function Directory({ org, onChangeOrg }) {
  const [empName, setEmpName] = useState('')
  const [empPod, setEmpPod] = useState(org.pods[0].id)
  const [brandName, setBrandName] = useState('')
  const [brandPod, setBrandPod] = useState(org.pods[0].id)
  const [asgEmp, setAsgEmp] = useState(org.employees[0].id)
  const [asgBrand, setAsgBrand] = useState(org.brands[0].id)
  const [asgProcess, setAsgProcess] = useState(org.processes[0].id)
  const [ruleBrand, setRuleBrand] = useState(org.brands[0].id)
  const [ruleProcess, setRuleProcess] = useState(org.processes[0].id)
  const [ruleCal, setRuleCal] = useState(CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF)
  const [ruleMin, setRuleMin] = useState(1)

  function addEmployee(e) {
    e.preventDefault()
    if (!empName.trim()) return
    const id = `e${Date.now()}`
    onChangeOrg({
      ...org,
      employees: [
        ...org.employees,
        {
          id,
          name: empName.trim(),
          podId: empPod,
          role: 'associate',
          preferredWeeklyOffs: [0],
          backupSkills: ['cs'],
        },
      ],
    })
    setEmpName('')
  }

  function addBrand(e) {
    e.preventDefault()
    if (!brandName.trim()) return
    const id = `b-${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 18)}-${Date.now().toString().slice(-4)}`
    onChangeOrg({
      ...org,
      brands: [...org.brands, { id, name: brandName.trim(), podId: brandPod }],
    })
    setBrandName('')
  }

  function addAssignment(e) {
    e.preventDefault()
    const exists = org.assignments.some(
      (a) => a.employeeId === asgEmp && a.brandId === asgBrand && a.processId === asgProcess,
    )
    if (exists) return
    const hasRule = org.operatingRules.some((r) => r.brandId === asgBrand && r.processId === asgProcess)
    onChangeOrg({
      ...org,
      operatingRules: hasRule
        ? org.operatingRules
        : [
            ...org.operatingRules,
            { brandId: asgBrand, processId: asgProcess, calendarType: CALENDAR_TYPE.SUNDAYS_AND_HOLIDAYS_OFF, minStaffing: 1 },
          ],
      assignments: [
        ...org.assignments,
        { id: `asg-${Date.now()}`, employeeId: asgEmp, brandId: asgBrand, processId: asgProcess, isPrimary: true },
      ],
    })
  }

  function upsertRule(e) {
    e.preventDefault()
    const next = org.operatingRules.filter((r) => !(r.brandId === ruleBrand && r.processId === ruleProcess))
    onChangeOrg({
      ...org,
      operatingRules: [
        ...next,
        { brandId: ruleBrand, processId: ruleProcess, calendarType: ruleCal, minStaffing: Number(ruleMin) || 1 },
      ],
    })
  }

  function removeAssignment(id) {
    onChangeOrg({ ...org, assignments: org.assignments.filter((a) => a.id !== id) })
  }

  return (
    <div className="two-col">
      <div className="panel">
        <h2>Resource directory</h2>
        <p className="hint">Add people, brands, assignments and calendars without changing code. Regenerate the roster afterwards.</p>

        <form className="form-grid" onSubmit={addEmployee}>
          <label>New employee
            <input value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="Full name" />
          </label>
          <label>Pod
            <select value={empPod} onChange={(e) => setEmpPod(e.target.value)}>
              {org.pods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>&nbsp;<button className="btn primary" type="submit">Add employee</button></label>
        </form>

        <form className="form-grid" onSubmit={addBrand}>
          <label>New brand
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Brand name" />
          </label>
          <label>Pod
            <select value={brandPod} onChange={(e) => setBrandPod(e.target.value)}>
              {org.pods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>&nbsp;<button className="btn" type="submit">Add brand</button></label>
        </form>

        <form className="form-grid" onSubmit={addAssignment}>
          <label>Assign employee
            <select value={asgEmp} onChange={(e) => setAsgEmp(e.target.value)}>
              {org.employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </label>
          <label>Brand
            <select value={asgBrand} onChange={(e) => setAsgBrand(e.target.value)}>
              {org.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label>Process
            <select value={asgProcess} onChange={(e) => setAsgProcess(e.target.value)}>
              {org.processes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>&nbsp;<button className="btn" type="submit">Add assignment</button></label>
        </form>

        <form className="form-grid" onSubmit={upsertRule}>
          <label>Operating calendar · brand
            <select value={ruleBrand} onChange={(e) => setRuleBrand(e.target.value)}>
              {org.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label>Process
            <select value={ruleProcess} onChange={(e) => setRuleProcess(e.target.value)}>
              {org.processes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>Calendar
            <select value={ruleCal} onChange={(e) => setRuleCal(e.target.value)}>
              {Object.entries(CALENDAR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Min staffing
            <input type="number" min="1" value={ruleMin} onChange={(e) => setRuleMin(e.target.value)} />
          </label>
          <label>&nbsp;<button className="btn" type="submit">Save rule</button></label>
        </form>
      </div>

      <div className="panel">
        <h2>Current assignments</h2>
        <div className="card-list" style={{ maxHeight: 640, overflow: 'auto' }}>
          {org.assignments.map((a) => {
            const emp = org.employees.find((e) => e.id === a.employeeId)
            const brand = org.brands.find((b) => b.id === a.brandId)
            const process = org.processes.find((p) => p.id === a.processId)
            return (
              <div className="card" key={a.id}>
                <strong>{emp?.name}</strong>
                <div className="hint">{brand?.name} · {process?.name}</div>
                <button className="btn ghost" type="button" onClick={() => removeAssignment(a.id)}>Remove</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
