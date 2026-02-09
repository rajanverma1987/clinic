/**
 * Loading state architecture per CursorMD/CLAUDE-AI.md (Complete Enterprise Dashboard Loading Strategy).
 * Single source for loading states, skeleton types, and priorities.
 */

export const LOADING_STATES = {
  IDLE: 'idle',
  INITIAL: 'initial',
  REFRESHING: 'refreshing',
  PAGINATING: 'paginating',
  MUTATING: 'mutating',
  BACKGROUND: 'background',
  OPTIMISTIC: 'optimistic',
  STREAMING: 'streaming',
  ERROR: 'error',
  SUCCESS: 'success',
};

export const SKELETON_TYPES = {
  DASHBOARD: 'dashboard',
  TABLE: 'table',
  FORM: 'form',
  DETAIL: 'detail',
  CHART: 'chart',
  CARD: 'card',
  LIST: 'list',
  GRID: 'grid',
  CALENDAR: 'calendar',
  KANBAN: 'kanban',
};

export const LOADING_PRIORITIES = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
  LAZY: 5,
};
