import { CALENDAR_LABELS, ruleKey } from '../engine/index.js'

export default function CoverageTable({ org, roster, validation, brandIds, processIds, dates }) {
  if (!roster) return null
  const brands = org.brands.filter((b) => !brandIds || brandIds.includes(b.id))
  const processes = org.processes.filter((p) => !processIds || processIds.includes(p.id))
  const gapSet = new Set(
    (validation?.issues ?? [])
      .filter((i) => i.code === 'COVERAGE_GAP')
      .map((i) => `${i.date}::${i.brandId}::${i.processId}`),
  )
  const dayList = dates ?? roster.dates

  return (
    <div className="grid-wrap">
      <table className="roster">
        <thead>
          <tr>
            <th className="sticky">Brand / process</th>
            {dayList.map((d) => (
              <th key={d}>{d.slice(8)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {brands.flatMap((brand) =>
            processes
              .map((process) => {
                const rule = org.operatingRules.find((r) => r.brandId === brand.id && r.processId === process.id)
                if (!rule) return null
                return (
                  <tr key={ruleKey(brand.id, process.id)}>
                    <td className="sticky">
                      <strong>{brand.name}</strong>
                      <div className="hint">
                        {process.code} · min {rule.minStaffing} · {CALENDAR_LABELS[rule.calendarType]}
                      </div>
                    </td>
                    {dayList.map((date) => {
                      const cell = roster.coverage[date][ruleKey(brand.id, process.id)]
                      if (!cell.required) {
                        return (
                          <td key={date}>
                            <span className="cell REST">—</span>
                          </td>
                        )
                      }
                      const gap = gapSet.has(`${date}::${brand.id}::${process.id}`)
                      return (
                        <td key={date}>
                          <span className={`cell ${gap ? 'PLANNED_LEAVE' : 'WORKING'}`}>
                            {cell.staffing}/{cell.minStaffing}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })
              .filter(Boolean),
          )}
        </tbody>
      </table>
    </div>
  )
}
