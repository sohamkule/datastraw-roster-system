# DataStraw Smart Roster Management System

Browser-based operations tool for monthly roster planning across employees, pods, brands and processes. The scheduling engine is plain JavaScript with no React dependency. The UI never decides whether a roster is valid — `validateRoster` recomputes coverage from statuses, assignments and backups.

**Company in sample data:** Northline CX Operations (fictional).

## Requirements checklist

| Requirement | Status |
| --- | --- |
| 30+ realistic fictional employees | Done (33) |
| Multiple pods and pod leads | Done (4 pods) |
| Multiple brands and processes (CS, ACC, NDR, Retention) | Done |
| ~80% single-employee brands, rest 2–3 people | Done (16 single / 4 multi) |
| Split processes and overlapping process staffing | Done (Nova split; Ember/Summit/Harbor overlap) |
| Employees on multiple brands/processes | Done |
| Configurable operating calendars per brand/process | Done + editable in Directory |
| Weekly offs, public holidays, planned leave, comp-offs, availability | Done |
| Minimum staffing | Done |
| Monthly roster generation | Done |
| Company / pod / brand / process / employee views | Done |
| Manual edits then automatic revalidation | Done (day inspector) |
| Conflict reports for uncovered processes and unavailable resources | Done |
| Post-generation change handling | Done (Handle a change) |
| Engine separate from UI; independent validation | Done |
| Vitest coverage of engine | Done (`npm test`) |
| Directory edits without code changes | Done |

## Run locally

Requires Node.js 20.19+ or 22.12+

```bash
npm install
npm test
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

No environment variables are required. See `.env.example`.

## How it works

1. **Generate** walks each day of the month: apply approved time off, grant preferred weekly offs only if remaining assigned staff still meet minima, fill remaining statuses, then assign same-pod backups where a gap remains.
2. **Validate** rebuilds covering employees from WORKING statuses. `isValid` is true only when mandatory issues = 0. Deferred weekly offs are preferences.
3. **Change lab** applies leave to an existing roster (other days stay put), retries backups, and lists people who could cover a remaining gap.

## Assumptions

- A WORKING employee covers every assigned process that operates that day (shared CX shift, not exclusive time slices).
- Weekly off is a preference. Client coverage is mandatory.
- Backups come from the same pod and must list the process in `backupSkills`.
- Sample holidays follow a typical India operations calendar for 2026.
- Default demo month is October 2026.

## Approach note (assessment questions)

1. **Model.** Employees belong to a pod. Brands belong to a pod. Assignments are a many-to-many of employee × brand × process. Operating rules hang off brand × process (calendar type + min staffing). Time off and holidays are date records. Pod leads are employees with `role: pod_lead`.
2. **Generation vs validity.** `generateRoster` produces statuses and backup rows. `validateRoster` ignores any stored “valid” flag and re-counts coverage. If a mandatory rule fails, `isValid` is false.
3. **Single vs multi-employee brands.** Single-resource 365-day brands almost never receive a preferred weekly off; a leave day needs a backup or it is a gap. Multi-employee brands can absorb one absence when remaining primaries still meet `minStaffing` (for example min 1 with two CS agents). Ember/Summit/Harbor CS use min 2, so one leave without a backup is a gap.
4. **Sole owner unavailable on a required day.** Status becomes planned leave (they cannot cover). The generator searches same-pod backups. If one is found they are marked WORKING as backup and the roster can stay valid. If not, conflict report explains the sole-resource failure and lists swap/backup names when any exist.
5. **Conflicts / short staff.** Mandatory issues: coverage gap, time off ignored, unavailable person counted as covering, missing day status. Preferences never flip validity. The UI surfaces explanations and suggested people.
6. **Automated vs human.** Automated: monthly draft, weekly-off deferral, backup fill, validation, CSV export. Human: publishing judgement, directory edits, manual cell overrides, approving leave, choosing among backup suggestions. Ops still owns client commitments the algorithm cannot invent people for.
7. **If the team doubled.** Keep the engine pure but move org data to a database, add shift/capacity (hours) instead of boolean WORKING, index coverage by day, and consider a solver for weekly-off fairness. The current O(days × rules × employees) pass is fine into the low hundreds.
8. **Extra week.** Fair weekly-off rotation with backup reservation, undo history, pod-lead approval, and Excel export with coverage sheets.

## Tests

```bash
npm test
```

Engine tests cover calendars, determinism, single-resource leave, overlapping staff, min staffing 2, manual invalidation, and post-generation leave.

## Stack

React 19, Vite, Vitest. No backend.
