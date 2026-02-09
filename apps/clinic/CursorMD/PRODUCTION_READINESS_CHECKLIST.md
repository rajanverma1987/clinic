# Production Readiness Checklist

**Purpose:** Confirm the clinic app is ready for production (build green, config set, smoke tests planned).  
**Last build:** Passing (`npm run build` exit code 0).  
**Scope:** Clinic service for doctors and staff (all doctor types via role + tenant + profile metadata).

---

## 1. Build Status

- **Command:** `npm run build` (uses `node -r ./lib/run-self-polyfill.cjs ./node_modules/next/dist/bin/next build`)
- **Expected:** Exit code 0, “Generating static pages (207/207)”, “Finalizing page optimization”
- **Applied fixes:**
  - **`self` in server bundle:** `lib/run-self-polyfill.cjs` sets `global.self = global` before Next runs; build script uses `node -r ./lib/run-self-polyfill.cjs`.
  - **Stripe at build time:** `/api/webhooks/stripe` uses `getStripe()` inside the handler so Stripe is not constructed when env has no `STRIPE_SECRET_KEY`.
  - **useSearchParams prerender:** `/login` and `/admin/doctors/verify` wrap the content that uses `useSearchParams()` in `<Suspense>`.
  - **Health route timeout:** `/api/health` has `export const dynamic = 'force-dynamic'` and `revalidate = 0` so it is not statically generated.
  - **Server chunking:** Custom `splitChunks` in `next.config.js` applies only when `!isServer` to avoid breaking server runtime.

---

## 2. Environment & Config

Use **CursorMD/ENV_CONFIGURATION.md** and **CursorMD/DEPLOYMENT_GUIDE.md** for full detail. Summary for production:

| Area | Required / checklist |
|------|------------------------|
| **Database** | `MONGODB_URI` set and reachable from deployment; SSL where applicable. |
| **Auth** | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` — strong, unique, not shared. |
| **App URLs** | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL` point to production origin. |
| **Stripe** (if used) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; webhook URL registered in Stripe. |
| **PayPal** (if used) | `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_BASE_URL` (prod vs sandbox). |
| **Email** | SMTP vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`) for prod. |
| **SMS/WhatsApp** (optional) | Twilio vars if reminders/notifications use SMS/WhatsApp. |
| **Redis** (optional) | `REDIS_URL` if caching/sessions use Redis; build and runtime tolerate Redis down. |
| **CORS / security** | `next.config.js` `headers()` and any API CORS/origins include production domain(s). |

---

## 3. Smoke Tests (Manual)

Run these after deploy to confirm core flows.

**As staff/doctor (or admin):**

1. **Login** – `/login` → credentials → redirect to `/dashboard`.
2. **Dashboard** – Stats, lists, and quick actions load without errors.
3. **Patients** – List and open a patient; confirm data and layout.
4. **Appointments** – List, open one, create new (if permissions allow).
5. **Prescriptions** – List, open one, create new (if permissions allow).
6. **Queue** – Queue page loads and reflects current queue.
7. **Telemedicine** – Start or join a session; confirm video/audio and layout (see VIDEO_QUALITY / WEBRTC docs if needed).

**As super_admin (if applicable):**

8. **Admin** – `/admin` and key sub-pages (users, doctors, subscriptions, settings) load and behave as in staging.
9. **Doctor verification** – `/admin/doctors/verify` (and `?doctorId=...`) load and actions work.

**Technical checks:**

10. **Health** – `GET /api/health` returns 200 and expected `checks` (e.g. database, cache).
11. **Auth** – Logout, then access a protected route; expect redirect to login.
12. **i18n** – Switch language and confirm critical strings (login, dashboard, nav) update.

---

## 4. Optional Hardening

- **Mongoose duplicate-index warnings:** “Duplicate schema index” on `expiresAt`, `rating`, `status` — safe to clean up in models to reduce log noise.
- **Redis during build:** Redis connection errors during “Generating static pages” are non-fatal; ensure Redis is available in production if the app uses it at runtime.
- **Static generation timeout:** If any route hits “Static page generation timeout”, add `export const dynamic = 'force-dynamic'` (and `revalidate = 0` if desired) to that route.

---

## 5. “Ready for All Types of Doctors” — Scope

- **Product:** Single clinic app for doctors and staff; “type” of doctor = role + tenant + profile (e.g. specialty, department).
- **No separate app per type:** One codebase, one deploy; differentiation via permissions and metadata.
- **Doctor features:** Dashboard, patients, appointments, prescriptions, queue, telemedicine, profile, schedule, earnings, reviews, etc., as per **CursorMD/Doctor_Dashboard.md** and sidebar logic.

**“Full functionality”** here means: feature set and build align with the above; “production ready” still requires env/config (Section 2) and smoke tests (Section 3) on the target environment.
