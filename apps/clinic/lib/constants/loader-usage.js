/**
 * Enterprise Loader Usage – which loader type to use where.
 * Single source of truth for dashboard and app loading states.
 *
 * Use with Loader: <Loader type="page" text={t('common.loading')} />
 * Or use preset props directly when you need to override.
 */

/** @typedef {'page'|'section'|'inline'|'button'|'skeleton'} LoaderType */

/**
 * Loader type presets – map type to Loader props (fullScreen, inline, size, default message key).
 * Use these so all loaders are consistent across the app.
 */
export const LOADER_PRESETS = {
  /**
   * Page loader – full-screen, logo + message below.
   * Use for: initial route load, auth check, redirects.
   * Example: auth loading, "Redirecting to login", "Loading dashboard".
   */
  page: {
    fullScreen: true,
    inline: false,
    size: 'lg',
    defaultMessageKey: 'common.loading',
  },

  /**
   * Section loader – inline in a content block (e.g. below tabs).
   * Use for: tab content loading, modal body loading, a section of the page.
   * Brand loader (logo + progress bar).
   */
  section: {
    fullScreen: false,
    inline: true,
    size: 'md',
    defaultMessageKey: 'common.loading',
  },

  /**
   * Card loader – progress bar only, no logo. Same bar as brand loader.
   * Use for: cards, small widgets, list items. Brand loader unchanged.
   */
  card: {
    fullScreen: false,
    inline: true,
    size: 'sm',
    defaultMessageKey: null,
    useCardLoader: true,
  },

  /**
   * Inline loader – small block (e.g. inside a card or list area).
   * Use for: card content loading, list refresh, single widget.
   * Brand loader (logo + progress bar).
   */
  inline: {
    fullScreen: false,
    inline: true,
    size: 'sm',
    defaultMessageKey: null,
  },

  /**
   * Button loader – use CompactLoader inside buttons, no logo.
   * Use for: form submit, action button loading state.
   * Component: CompactLoader from Loader.jsx.
   */
  button: {
    fullScreen: false,
    inline: true,
    size: 'xs',
    defaultMessageKey: null,
    useCompact: true,
  },

  /**
   * Skeleton – placeholder shapes, no spinner.
   * Use for: tables (TableSkeleton), cards (skeleton classes), list rows.
   * Components: TableSkeleton, or .skeleton / .skeleton-card classes.
   */
  skeleton: {
    fullScreen: false,
    inline: false,
    size: null,
    defaultMessageKey: null,
    useSkeleton: true,
  },
};

/**
 * Default messages per context (i18n keys or fallback text).
 * Pass to Loader via text prop; use t(key) when possible.
 */
export const LOADER_MESSAGES = {
  page: {
    loading: 'common.loading', // "Loading..."
    redirecting: 'auth.redirectingToLogin', // "Redirecting to login"
    loadingDashboard: 'dashboard.loading',
    loadingDetails: 'common.loadingDetails',
  },
  section: {
    loadingReport: 'reports.loadingReportData',
    loadingSlots: 'appointments.loadingSlots',
    loadingData: 'common.loading',
  },
};

/**
 * When to use which loader (enterprise dashboard standard).
 *
 * | Type     | Where to use                          | Component / class              |
 * |----------|--------------------------------------|-------------------------------|
 * | page     | Auth, initial route, redirect        | <Loader type="page" text={} /> |
 * | section  | Tab content, modal body, data block  | .tab-content-loading + <Loader type="section" /> |
 * | card     | Cards, small widgets (progress bar only) | <Loader type="card" />     |
 * | inline   | Card body, single widget             | <Loader type="inline" />      |
 * | button   | Buttons (submit, action)             | <CompactLoader />             |
 * | skeleton | Tables, card grids, list rows        | <TableSkeleton />, .skeleton  |
 */
export const LOADER_USAGE_GUIDE = LOADER_PRESETS;
