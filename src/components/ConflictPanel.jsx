import { recommendCoverageFixes } from '../engine/recommendations.js'

export default function ConflictPanel({ org, roster, validation, showPreferences }) {
  if (!validation) return null
  const issues = (validation.issues ?? []).filter((i) => showPreferences || i.severity === 'mandatory')
  const recs = roster ? recommendCoverageFixes(org, roster, validation) : []
  const recKey = (r) => `${r.date}::${r.brandId}::${r.processId}`
  const recMap = Object.fromEntries(recs.map((r) => [recKey(r), r]))

  if (issues.length === 0) {
    return (
      <div className="panel">
        <h2>Conflict report</h2>
        <p className="hint">
          {validation.isValid
            ? 'No mandatory constraint violations. Coverage is independently confirmed.'
            : 'No issues in the current filter.'}
        </p>
      </div>
    )
  }

  return (
    <div className="panel">
      <h2>Conflict report</h2>
      <p className="hint">
        Mandatory issues block a valid roster. Preference notes are informational and never flip validity.
      </p>
      <div style={{ marginTop: 12, maxHeight: 480, overflow: 'auto' }}>
        {issues.map((issue, idx) => {
          const rec = issue.code === 'COVERAGE_GAP' ? recMap[`${issue.date}::${issue.brandId}::${issue.processId}`] : null
          return (
            <article key={`${issue.code}-${issue.date}-${issue.employeeId}-${idx}`} className={`issue ${issue.severity}`}>
              <h3>
                <span className={`pill ${issue.severity === 'mandatory' ? 'bad' : 'warn'}`}>{issue.severity}</span>{' '}
                {issue.code.replaceAll('_', ' ')}
              </h3>
              <p>{issue.message}</p>
              {rec && (
                <p>
                  {rec.explanation}
                  {rec.suggestions.length > 0 && (
                    <>
                      {' '}Possible resolution:{' '}
                      {rec.suggestions
                        .slice(0, 4)
                        .map((s) => `${s.name} (${s.kind}, currently ${s.status})`)
                        .join('; ')}
                      .
                    </>
                  )}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
