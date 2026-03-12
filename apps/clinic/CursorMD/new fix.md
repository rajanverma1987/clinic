# Full Project Audit — doctorsclinic.services
**Date:** 2026-02-19 | **Auditor:** Claude Sonnet 4.6 | **Monorepo:** `/Users/shivramrana/Documents/clinic`

> Single source of truth for all known issues. Issues ordered by severity.
> Address all P1s before next production deploy.

---

## QUICK REFERENCE — PRIORITY MATRIX

| Priority | Count | Examples |
|---|---|---|
| 🔴 P1 — Critical / Security | 6 | Secrets in git, localhost in prod routes, virus scanner fake |
| 🟠 P2 — High / Correctness | 6 | TS/lint errors hidden, encryption TODO, mic blocked globally |
| 🟡 P3 — Medium / Code Quality | 8 | Unmaintained packages, console.logs, empty catch, dual libs |
| 🟢 P4 — Low / Housekeeping | 4 | Backup file, dummy API keys, strict mode off in dev |

---

## SECTION 1 — PROJECT STRUCTURE

### Monorepo Layout

```
clinic-saas/                        (root — npm workspaces)
  apps/
    clinic/                         Main SaaS platform (accounts.doctorsclinic.services, port 5053)
    website/                        Public marketing site (doctorsclinic.services)
  packages/
    config/                         Shared eslint/prettier/tsconfig
    dashboard-engine/               Pure logic: metrics, trends, actions (no DB, v0.0.1)
    shared-config/
    ui/                             Shared React component library
    utils/                          Shared utilities
```

### Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Framework | Next.js | ^15.5.10 |
| UI | React / React DOM | ^18.3.0 |
| Language | JavaScript (JSX) + TypeScript (devDep) | TS ^5.0.0 |
| Database | MongoDB via Mongoose | ^8.3.0 |
| Cache | Redis (optional) | ^4.6.0 |
| Search | Elasticsearch (optional) | ^9.2.0 |
| Real-time | Socket.IO server + client | ^4.8.1 |
| Auth | JWT + bcryptjs + speakeasy (TOTP) | jwt ^9.0.2 |
| Payments | Stripe + PayPal REST | stripe ^20.2.0 |
| Email | Nodemailer | ^7.0.11 |
| SMS/Push | AWS SNS | ^3.992.0 |
| Video | WebRTC via simple-peer | ^9.11.1 |
| Scheduling | node-cron | ^3.0.3 |
| Validation | joi ^17.13.0 **AND** zod ^3.23.0 | ⚠ both present |
| State | Zustand + SWR + React hooks | |
| CSS | Tailwind CSS v3 + CSS variables | v3.4.0 |
| Animation | Framer Motion | ^12.23.26 |
| Virtualisation | react-window **AND** @tanstack/react-virtual | ⚠ both present |

### All Pages/Routes (`apps/clinic/app/`)

<details>
<summary>~100 routes — expand</summary>

```
(website)/blog/[slug], /legal/, /pricing/, /privacy/, /support/contact/, /terms/
about/
admin/
  activity-logs/, analytics/, appointments/ (+ analytics/),
  clients/, content/ (banners/ blog/ faqs/ pages/ specialties/),
  create-admin/, doctors/ (+ verify/),
  financial/ (commission/ disputes/ invoicing/ revenue/ settlements/),
  patients/[id]/,
  reports/ (appointments/ export/ financial/ performance/ user/),
  reviews/ (actions/ analytics/ dashboard/),
  settings/ (backup/ booking/ currency/ email-sms/ general/ maintenance/
             notification/ payment/ privacy/ security/ seo/ tax/ templates/ terms/),
  subscriptions/, support/, users/ (create-manager/)
api-docs/
appointments/[id]/, [id]/edit/, new/, slots/
auth/impersonate/
blog/[slug]/
change-password/, contact/
dashboard/  (_components/ _tabs/ components/ hooks/ sections/ styles/)
doctors/[id]/leaves/, analytics/, appointments/, earnings/,
  messages/, patients/[id]/, profile/, register/, reviews/, schedule/
forgot-password/
inventory/items/, items/[id]/, items/new/, lots/
invoices/[id]/, [id]/edit/, new/
legal/, login/, maintenance/, patients/[id]/
payment-history/
prescriptions/[id]/, [id]/edit/, [id]/print/
pricing/, privacy/, queue/, register/, reports/
settings/branding/, create-manager/, locations/, white-label/
staff/, subscription/cancel/, return/
support/
telemedicine/[id]/, [id]/summary/
terms/, try-for-free/
```
</details>

---

## SECTION 2 — ARCHITECTURE

### Authentication Flow

1. `POST /api/auth/login` → returns short-lived `accessToken` (JWT) + `refreshToken` (HTTP-only cookie)
2. Middleware does **not** enforce auth — every protected API route calls `lib/auth/jwt.js:verifyToken()` independently
3. Client-side guards use `AuthContext` (polls `/api/auth/me`) + redirect if unauthenticated
4. 2FA: TOTP via `speakeasy` (⚠ unmaintained — see P2-C)
5. Admin impersonation: `/api/admin/clients/[id]/impersonate`

### Real-time

- Socket.IO runs on same HTTP server as Next.js (`server.js`)
- SSE fallback at `/api/sse/route.js` for environments blocking WebSocket
- Dashboard subscribes via `lib/realtime/useDashboardRealtime.js`

### State Tree

```
RootProviders
  ThemeProvider          → dark/light mode
  I18nProvider           → translations (lib/i18n/)
  AuthProvider           → current user, role, clinic
  NotificationProvider   → toast system (DOM-based, showSuccess/Warning/Error)
  ConfirmationProvider   → global confirm modal (useConfirmation hook)
  SocketProvider         → Socket.IO client
  SWRConfig              → global fetcher / revalidation config
```

Dashboard-specific:
- `useDashboardRealtime` — socket event subscriptions
- Zustand `dashboard-ui-store.js` — active tab (UI-only)
- `lib/dashboard-tab-cache.js` — stale-while-revalidate per tab (`REVALIDATE_DELAY_MS: 2000`)

### API Layer

```
Client Component
  → lib/api/ (apiClient fetch wrapper)
  → apps/clinic/app/api/ (Next.js route handlers)
  → lib/services/ (business logic layer)
  → Mongoose models (MongoDB)
```

---

## SECTION 3 — 🔴 P1 CRITICAL ISSUES

### P1-A — Secrets Committed to Git

**File:** `apps/clinic/.env.local`

This file contains live production secrets. Verify if it was ever tracked:

```bash
git log --all --full-history -- apps/clinic/.env.local
git ls-files apps/clinic/.env.local
```

If it returns output, these are **compromised** — rotate immediately:
- `MONGODB_URI` password
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`

**Fix:** See Task 1 + Task 2 in Section 9.

---

### P1-B — `NODE_ENV=development` on Production Server

**File:** `apps/clinic/.env.local` (on OVH server)

Setting `NODE_ENV=development` in production causes:
- CORS falling back to localhost origins (see P1-C)
- Next.js running in dev mode — no build optimizations
- `reactStrictMode: false` (next.config.js gates this on `NODE_ENV === 'production'`)
- Console logs NOT stripped by the `removeConsole` compiler option

**Fix:** See Task 3 in Section 9.

---

### P1-C — CORS Header Falls Back to `localhost` in Production

**File:** `apps/clinic/next.config.js`

```js
// PROBLEMATIC: when NODE_ENV != 'production', dev branch fires in prod:
value: process.env.CORS_ORIGINS ||
  (process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://localhost'
    : 'http://localhost:5053, http://localhost:3000, ...')
```

**Fix:** Remove the NODE_ENV branch entirely (already done in this session):
```js
value:
  process.env.CORS_ORIGINS ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://accounts.doctorsclinic.services',
```

---

### P1-D — Virus Scanner is a Placeholder (Zero Malware Protection)

**File:** `apps/clinic/lib/security/virus-scanner.js`

This file always returns `{ clean: true }` without performing any scan. Any API route calling `virusScanner.scan(file)` before accepting uploads provides **zero protection** — all files pass unconditionally.

**Affected:** All patient document, prescription, and profile image upload endpoints.

**Fix (choose one):**
- Integrate VirusTotal API (key is referenced in webpack externals) or ClamAV daemon
- Remove the false-security call and add a `// NOTE: virus scanning not implemented` comment so devs don't assume it works

---

### P1-E — `localhost` Hardcoded in Production API Routes

| File | Line | Hardcoded Value | Impact |
|---|---|---|---|
| `app/api/appointments/route.js` | 304 | `'http://localhost:5053'` | Appointment email links broken in prod |
| `app/api/batch/route.js` | 26 | `'http://localhost:5053'` | Batch requests use wrong base URL |
| `app/api/admin/analytics/export/route.js` | 29 | `'localhost:5053'` | Export CORS check fails |
| `app/api/admin/clients/[id]/impersonate/route.js` | 51 | `'localhost:3000'` | **Wrong port** — redirect fails (app is 5053) |

**Fix for each:**
```js
const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL env var is required');
```

---

### P1-F — Socket.IO CORS Falls Back to Wildcard `'*'`

**File:** `apps/clinic/server.js`

```js
// BEFORE (bad):
origin: process.env.NEXT_PUBLIC_APP_URL || '*',
```

If `NEXT_PUBLIC_APP_URL` is unset, Socket.IO accepts connections from **any origin**.

**Fixed this session** — verify it's deployed. Correct version:
```js
const getAllowedOrigins = () => {
  if (process.env.CORS_ORIGINS) return process.env.CORS_ORIGINS.split(',').map(o => o.trim());
  if (process.env.NEXT_PUBLIC_APP_URL) return [process.env.NEXT_PUBLIC_APP_URL];
  return ['http://localhost:5053', 'http://localhost:3000']; // dev only
};
```

---

## SECTION 4 — 🟠 P2 HIGH ISSUES

### P2-A — TypeScript and ESLint Errors Do Not Fail the Build

**File:** `apps/clinic/next.config.js`

```js
typescript: { ignoreBuildErrors: true },  // line ~11
eslint: { ignoreDuringBuilds: true },      // line ~12
```

Broken TypeScript and lint errors silently ship to production. Type bugs that would be caught at compile time become runtime crashes.

**Fix:** Remove both flags. Fix any TS/lint errors surfaced when doing so.

---

### P2-B — Telemedicine Encryption Not Implemented

**File:** `apps/clinic/services/telemedicine.service.js:238`

```js
isEncrypted: false, // TODO: Implement encryption
```

Telemedicine sessions are marked as unencrypted in the DB. For a healthcare platform, E2EE for telemedicine chat and metadata is a compliance requirement (HIPAA/GDPR context).

**Fix:** Implement AES-256-GCM encryption for message content using `ENCRYPTION_KEY`. Update `isEncrypted: true` only after real implementation.

---

### P2-C — `speakeasy` (2FA Library) is Unmaintained

**Package:** `speakeasy ^2.0.0`

Last published ~2017. npm marks it deprecated. Used in auth API routes for TOTP 2FA generation and verification.

**Fix:**
```bash
npm uninstall speakeasy
npm install otplib
```
```js
// Migration:
// Before: speakeasy.totp.verify({ secret, encoding: 'base32', token })
// After:
import { authenticator } from 'otplib';
authenticator.verify({ token, secret });
```

---

### P2-D — Middleware Blocks Camera + Microphone Globally (Breaks Telemedicine)

**File:** `apps/clinic/middleware.js`

```js
'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
```

`camera=()` and `microphone=()` block WebRTC access on **all pages** — telemedicine video calls will fail to request camera/mic in the browser.

**Fix:**
```js
'camera=(self), microphone=(self), geolocation=(), payment=()'
```

Or: exclude `/telemedicine/*` routes from the middleware `matcher`.

---

### P2-E — `reactStrictMode` Disabled in Development

**File:** `apps/clinic/next.config.js`

```js
reactStrictMode: process.env.NODE_ENV === 'production', // wrong — defeats the purpose
```

Strict mode's double-invoke is meant to catch side-effect bugs **during development**. Setting it only in production means devs never see StrictMode warnings locally.

**Fix:**
```js
reactStrictMode: true, // always on
```

---

### P2-F — Twilio and Sentry in Webpack Externals But Not Installed

**File:** `apps/clinic/next.config.js` webpack config:
```js
twilio: 'commonjs twilio'
'@sentry/nextjs': 'commonjs @sentry/nextjs'
```

Both are externalised in webpack but absent from `package.json`. Any import that reaches these will throw `MODULE_NOT_FOUND` at runtime.

**Fix:** Either `npm install twilio @sentry/nextjs` (recommended — Sentry is valuable for error tracking), or remove the externals entries if truly unused.

---

## SECTION 5 — 🟡 P3 MEDIUM ISSUES

### P3-A — `console.*` Bypassing Central Logger

These should use `logger.*` from `lib/utils/logger.js`:

| File | Line | Issue |
|---|---|---|
| `app/api/telemedicine/sessions/[id]/chat/route.js` | 76 | `.catch(console.error)` — no context, raw object to stdout |
| `app/dashboard/hooks/useDashboardStats.js` | 27, 38 | `console.error('Failed to fetch stats:', err)` |
| `app/dashboard/page.jsx` | 135 | `console.warn('[Dashboard] Slow tab switch...')` |
| `app/dashboard/components/QuickActions.jsx` | 63, 130 | `console.error(...)` |
| `app/subscription/page.jsx` | 353 | `console.error('Error rendering addon card:', ...)` |
| `lib/performance/monitor.js` | 30, 66 | `console.warn`, `console.log` (bypasses logger entirely) |
| `lib/cache/perf-markers.js` | 43-44 | `console.warn` |

**Fix:** `import logger from '@/lib/utils/logger'; logger.warn(...)` / `logger.error(...)`.

---

### P3-B — Silenced Catch Blocks With No Logging

| File | Line | Problem |
|---|---|---|
| `app/admin/patients/page.jsx` | 88 | `catch (_) { setDoctors([]); }` — silently clears doctors list, no log or user alert |
| `app/admin/analytics/page.jsx` | 78 | `catch (_) {}` — completely empty, swallows JSON parse error on export failure |

**Fix:** Add `logger.error(...)` and/or `showError(...)` so failures are observable.

---

### P3-C — Two Validation Libraries Installed

Both `joi` and `zod` are installed and used across different parts of the codebase. This doubles the validation surface and confuses onboarding.

**Fix:** Standardize on **zod** (TypeScript-native, better type inference). Migrate joi schemas gradually.

---

### P3-D — Two Virtualisation Libraries Installed

Both `react-window` and `@tanstack/react-virtual` are present.

**Fix:** Standardize on `@tanstack/react-virtual` (actively maintained). Remove `react-window`.

---

### P3-E — Hardcoded Placeholder API Keys in Source

| File | Lines | Value |
|---|---|---|
| `app/doctors/profile/page.jsx` | 674, 795 | `\|\| 'AIzaSyDummyKey'` |
| `app/doctors/register/page.jsx` | 847 | `\|\| 'YOUR_API_KEY'` |

These will silently fail to load Google Maps in production if `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is unset.

**Fix:** Remove the `|| 'placeholder'` fallback. If the key is absent, render an error state instead.

---

### P3-F — `speakeasy` and `simple-peer` Both Unmaintained

- `speakeasy ^2.0.0` — last published 2017, deprecated (fix: replace with `otplib` per P2-C)
- `simple-peer ^9.11.1` — last significant commit ~2022. Used for telemedicine WebRTC in `lib/webrtc/simple-peer-wrapper.js`. Consider `peerjs` or a managed WebRTC service when telemedicine is next iterated.

---

### P3-G — CSP Still Has `unsafe-inline` in Production

**File:** `apps/clinic/next.config.js`

```js
isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'"  // still unsafe in prod
```

`unsafe-inline` in `script-src` defeats XSS protection entirely. The correct fix is nonce-based CSP.

**Fix (medium-term):** Implement nonce in `middleware.js`, pass it to `<Script nonce={nonce}>` in layout, and remove `unsafe-inline`.

---

### P3-H — `bcryptjs` (Pure JS — Slow)

`bcryptjs ^2.4.3` is pure JavaScript — roughly 4-8x slower than native `bcrypt` for password hashing. At high auth load this matters.

**Fix:** Switch to native `bcrypt` or `argon2` (OWASP-recommended).

---

## SECTION 6 — 🟢 P4 HOUSEKEEPING

### P4-A — Backup File Committed to Repo

```bash
git rm apps/clinic/app/dashboard/page.jsx.backup
git commit -m "chore: remove stale backup file"
```

### P4-B — Missing from `.env.example`

These are used in code but not documented:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `ELASTICSEARCH_NODE`
- `DEFAULT_TENANT_ID`
- `APP_VERSION`
- `VIRUSTOTAL_API_KEY`
- `NEXT_PUBLIC_TURN_SERVER_URL/USERNAME/CREDENTIAL` (telemedicine TURN)

**Fix:** Add to `.env.example` with placeholder values and a comment for each.

### P4-C — Test Account Guard

✅ Already hardened:
```js
export const TEST_ACCOUNT_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.TEST_ACCOUNT_ENABLED === 'true';
```
No action needed.

### P4-D — `reactStrictMode` Off in Dev (See P2-E)

Tracked as P2-E above.

---

## SECTION 7 — CHANGES MADE THIS SESSION (Feb 2026)

### Dashboard UI Improvements

| Change | File | Detail |
|---|---|---|
| Removed frosted glass | `globals.css` | `.enterprise-header` → solid `var(--color-neutral-50)` bg, no `backdrop-filter` |
| Solid dashboard header card | `dashboard.css` | `background: #ffffff`, `border-radius: 12px`, no blur |
| Scroll-reactive shadow (CSS-only) | `dashboard.css` | `:has(.enterprise-header--scrolled)` — no JS needed |
| Tab animation | `dashboard.css` | `tabFadeIn` 0.1s opacity 0.4→1 only (no translateY = no layout shift) |
| Press states | `globals.css` | Icon buttons `scale(0.87)`, search pill `scale(0.98)` |
| Tab pill press state | `Tabs.jsx` | `active:scale-95`, `duration-150` |

### Dashboard Performance

| Change | File | Detail |
|---|---|---|
| Chart defer | `dashboard/page.jsx` | `setTimeout(200ms)` → `requestAnimationFrame` (~16ms) |
| Memoized handlers | `dashboard/page.jsx` | `handleNotificationClick`, `handleMarkAsRead`, `handleMarkAllAsRead` wrapped in `useCallback` |
| Memoized action button | `dashboard/page.jsx` | `actionButton` JSX → `useMemo` |
| Faster revalidation | `lib/dashboard-tab-cache.js` | `REVALIDATE_DELAY_MS: 5000` → `2000` |

### Error Handling & UX

| Change | File | Detail |
|---|---|---|
| Consecutive failure warning | `dashboard/page.jsx` | `consecutiveFailsRef` — `showWarning` toast after 3 silent auto-refresh failures |
| Confirm before mark-all-read | `dashboard/page.jsx` | `useConfirmation` → confirm dialog before marking all notifications read |
| Success toast | `dashboard/page.jsx` | `showSuccess` fired after confirm |

### Security (Deployed via This Session)

| Change | File | Detail |
|---|---|---|
| CORS header fix | `next.config.js` | Removed `NODE_ENV` branch, always use `CORS_ORIGINS` env var |
| Socket.IO CORS fix | `server.js` | `getAllowedOrigins()` — never falls back to `'*'` |
| Security headers | `middleware.js` | HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| CSP improvement | `next.config.js` | Removed `unsafe-eval` in prod, added `base-uri`, `form-action`, `object-src`, explicit `connect-src` WSS |

---

## SECTION 8 — EXTERNAL SERVICES MAP

| Service | Env Var | Used For | Status |
|---|---|---|---|
| MongoDB | `MONGODB_URI` | Primary DB | ✅ Active |
| Redis | `REDIS_URL` | Cache (optional) | ✅ Active |
| Elasticsearch | `ELASTICSEARCH_NODE` | Search (optional) | ⚠ Undocumented in .env.example |
| Stripe | `STRIPE_SECRET_KEY` | Payments | ✅ Active |
| PayPal | `PAYPAL_CLIENT_ID/SECRET` | Subscriptions | ✅ Active |
| AWS SNS | AWS SDK env vars | SMS/push | ✅ Active |
| Nodemailer | `SMTP_*` | Email | ✅ Active |
| Google Maps | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Doctor profile maps | ⚠ Undocumented, dummy fallback in JSX |
| WebRTC TURN | `NEXT_PUBLIC_TURN_SERVER_*` | Telemedicine | ⚠ Undocumented |
| VirusTotal | `VIRUSTOTAL_API_KEY` | File scanning | ❌ Placeholder only — not scanning |
| Twilio | (not in package.json) | SMS? | ❌ Not installed, in webpack externals |
| Sentry | (not in package.json) | Error tracking | ❌ Not installed, in webpack externals |
| WhatsApp | `DEFAULT_TENANT_ID` | Messaging | ⚠ Undocumented |

---

## SECTION 9 — EXECUTION ORDER

```
IMMEDIATE — before next prod deploy:
  1. Rotate secrets (P1-A) — JWT, ENCRYPTION_KEY, MongoDB password
  2. git rm --cached apps/clinic/.env.local  (P1-A)
  3. Set NODE_ENV=production in server .env.local  (P1-B)
  4. Fix localhost fallbacks in 4 API routes (P1-E)
  5. Fix impersonate port 3000 → 5053 (P1-E)
  6. Fix Permissions-Policy blocking camera/mic (P2-D)

SHORT-TERM — this sprint:
  7. Remove typescript.ignoreBuildErrors + eslint.ignoreDuringBuilds (P2-A)
  8. Set reactStrictMode: true always (P2-E)
  9. Replace speakeasy → otplib (P2-C)
  10. Install Sentry + Twilio or remove from webpack externals (P2-F)
  11. Delete page.jsx.backup (P4-A)
  12. Replace console.* with logger.* in dashboard/performance files (P3-A)
  13. Add logging to silent catch blocks in admin pages (P3-B)
  14. Add missing env vars to .env.example (P4-B)

MEDIUM-TERM:
  15. Replace virus scanner placeholder with real implementation (P1-D)
  16. Remove placeholder Google Maps key fallbacks (P3-E)
  17. Consolidate joi + zod → zod only (P3-C)
  18. Consolidate react-window + @tanstack/react-virtual → @tanstack (P3-D)
  19. Implement telemedicine E2EE encryption (P2-B)
  20. Nonce-based CSP to replace unsafe-inline (P3-G)
  21. Add Cloudflare DNS proxying (hides OVH IP, adds WAF + DDoS protection)
```

---

## SECTION 10 — TASK SCRIPTS (Copy-Paste Ready)

### Task 1 — Rotate Secrets

```bash
openssl rand -hex 32  # new JWT_SECRET
openssl rand -hex 32  # new JWT_REFRESH_SECRET
openssl rand -hex 32  # new ENCRYPTION_KEY
# Change MongoDB password via DB admin panel at sql.infodatixhosting.com
```

### Task 2 — Remove .env.local From Git Tracking

```bash
git ls-files apps/clinic/.env.local   # if output → it's tracked

git rm --cached apps/clinic/.env.local
git commit -m "chore: remove .env.local from git tracking"

# Confirm .gitignore contains:
# .env
# .env.local
# .env.production
# .env.*.local
```

### Task 3 — Server .env.local (OVH Only — Never Commit)

```bash
# apps/clinic/.env.local  (edit on OVH server via SSH ONLY)
NODE_ENV=production
PORT=5053
HOSTNAME=0.0.0.0

NEXT_PUBLIC_APP_URL=https://accounts.doctorsclinic.services
NEXT_PUBLIC_API_URL=https://accounts.doctorsclinic.services/api
NEXT_PUBLIC_SOCKET_URL=https://accounts.doctorsclinic.services

CORS_ORIGINS=https://accounts.doctorsclinic.services,https://doctorsclinic.services

MONGODB_URI=mongodb://remoteUser:NEW_PASSWORD@sql.infodatixhosting.com:27017/clinic?authSource=admin
JWT_SECRET=<new_from_task1>
JWT_REFRESH_SECRET=<new_from_task1>
ENCRYPTION_KEY=<new_from_task1>

TEST_ACCOUNT_ENABLED=false
```

### Task 4 — Fix Permissions-Policy in middleware.js

```js
// apps/clinic/middleware.js
response.headers.set(
  'Permissions-Policy',
  'camera=(self), microphone=(self), geolocation=(), payment=()',
);
```

### Task 5 — Fix Impersonate Route Port

```js
// apps/clinic/app/api/admin/clients/[id]/impersonate/route.js ~line 51
// Change:
const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
// To:
const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5053';
```

### Task 6 — Replace speakeasy with otplib

```bash
npm uninstall speakeasy && npm install otplib
```

```js
// Before: speakeasy.totp.verify({ secret, encoding: 'base32', token })
// After:
import { authenticator } from 'otplib';
authenticator.verify({ token, secret }); // secret is base32 by default
```

### Task 7 — Verify After Deploy

```bash
# Should NOT show localhost in CORS header
curl -sI https://accounts.doctorsclinic.services/ | grep -i "access-control\|x-powered"

# Should show HSTS, nosniff, referrer
curl -sI https://accounts.doctorsclinic.services/ | grep -i "strict\|content-type-options\|referrer"

# Expected output:
# access-control-allow-origin: https://accounts.doctorsclinic.services
# strict-transport-security: max-age=31536000; includeSubDomains
# x-content-type-options: nosniff
# referrer-policy: strict-origin-when-cross-origin
# (x-powered-by should be absent)
```
