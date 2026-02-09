# Terminal & API Fixes (Dashboard / Dev Server)

**Date:** January 2026
**Status:** Applied

## Fixes applied

### 1. GET /api/appointments?status=pending → 400

- **Cause:** `lib/validations/appointment.js` did not allow `status=pending` in the query schema; the Appointment model uses `scheduled`, `confirmed`, etc., not `pending`.
- **Change:**
  - Added `'pending'` to the `appointmentQuerySchema.status` enum in `lib/validations/appointment.js`.
  - In `app/api/appointments/route.js`, after validation, map `status === 'pending'` to `status = 'scheduled'` before calling `listAppointments()`.
- **Result:** Dashboard “Appointment Requests” (`/appointments?status=pending&limit=5`) returns 200 and lists scheduled (pending confirmation) appointments.

### 2. MODULE_TYPELESS_PACKAGE_JSON (realtime-manager)

- **Cause:** `lib/realtime/realtime-manager.js` used ESM (`import`/`export`) while `package.json` has no `"type": "module"`, so Node reparsed and warned.
- **Change:** Converted `lib/realtime/realtime-manager.js` to CommonJS (`require`/`module.exports`). Updated `server.js` to use `require('./lib/realtime/realtime-manager.js')` instead of dynamic `import()`.
- **Result:** Warning no longer appears on `npm run dev`. Callers that use dynamic `import('@/lib/realtime/realtime-manager.js')` or ESM `import` from integration-helpers continue to work (Node supports importing CommonJS from ESM).

## Expected / acceptable behavior (no code change)

- **GET /api/invoices?status=pending&overdue=true&limit=5 → 403**
  Invoices route uses `requireFeature(req, user, 'Invoice & Billing')`. 403 means the tenant does not have that feature or the request is unauthenticated. Ensure the tenant has “Invoice & Billing” and the client sends a valid auth token. If the plan does not include billing, the dashboard can hide the “Overdue Invoices” card when the feature is disabled.

- **Redis not available**
  Expected when Redis is not running. Set `DISABLE_REDIS=true` to silence the warning, or start Redis for caching.

- **Slow API (2–7+ s)**
  Often from cold compile and first DB access. See `CursorMD/PERFORMANCE_OPTIMIZATION.md` for indexes and tuning.
