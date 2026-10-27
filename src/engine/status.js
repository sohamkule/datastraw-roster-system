export const STATUS = {
  WORKING: 'WORKING',
  WEEKLY_OFF: 'WEEKLY_OFF',
  PUBLIC_HOLIDAY: 'PUBLIC_HOLIDAY',
  PLANNED_LEAVE: 'PLANNED_LEAVE',
  COMP_OFF: 'COMP_OFF',
  UNAVAILABLE: 'UNAVAILABLE',
  REST: 'REST',
}

export const HARD_UNAVAILABLE = new Set([
  STATUS.PLANNED_LEAVE,
  STATUS.COMP_OFF,
  STATUS.UNAVAILABLE,
])

export const TIME_OFF_TO_STATUS = {
  planned_leave: STATUS.PLANNED_LEAVE,
  comp_off: STATUS.COMP_OFF,
  unavailable: STATUS.UNAVAILABLE,
}

export function isAvailableToWork(status) {
  return status === STATUS.WORKING || status === undefined || status === null
}

export function canCountTowardCoverage(status) {
  return status === STATUS.WORKING
}

export const STATUS_LABELS = {
  [STATUS.WORKING]: 'Working',
  [STATUS.WEEKLY_OFF]: 'Weekly off',
  [STATUS.PUBLIC_HOLIDAY]: 'Public holiday',
  [STATUS.PLANNED_LEAVE]: 'Planned leave',
  [STATUS.COMP_OFF]: 'Comp-off',
  [STATUS.UNAVAILABLE]: 'Unavailable',
  [STATUS.REST]: 'Rest (calendars off)',
}
