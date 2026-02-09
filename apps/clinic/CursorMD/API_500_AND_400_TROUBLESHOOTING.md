# API 500 and 400 Errors – Troubleshooting

**Date:** January 2026

## Common causes

### 1. **GET /api/features 400**

- **Cause:** Exception in feature-access or subscription service (e.g. DB not connected, missing tenant).
- **Fix applied:** Tenant guard: if user is not super_admin and `user.tenantId` is missing, return 400 "Tenant context required". Server errors now return 500 with the actual error message.
- **Check:** Log in as a **clinic user** (not super_admin without a tenant). Ensure `.env.local` has `MONGODB_URI` and the app was started with `npm run dev` (so `server.js` loads env).

### 2. **GET /api/settings 500**

- **Cause:** Often missing `user.tenantId` (e.g. super_admin) or DB/connection error.
- **Fix applied:** Guard: if no `user.tenantId` and not super_admin, return 400. If super_admin with no tenant, return 400 "Super admin has no tenant context". In development, 500 responses include the real error message.
- **Check:** Use a clinic account with a tenant. If you use super_admin, you need a tenant context for settings.

### 3. **GET /api/reports/\* 500** (revenue, appointments, etc.)

- **Cause:** Missing `user.tenantId` (reports require a tenant).
- **Fix applied:** Guard at the start of report handlers: if `!user.tenantId`, return 400 "Tenant context required for reports".
- **Check:** Log in as a clinic user (with tenantId in the token). Do not use super_admin without a tenant for dashboard reports.

### 4. **Many 500s at once (appointments, patients, invoices, queue, etc.)**

- **Likely cause:** Either **MongoDB not connected** (e.g. `MONGODB_URI` missing or wrong in `.env.local`) or **user has no tenantId** (e.g. super_admin or bad token).
- **Check:**
  1. **Env:** Copy `.env.example` to `.env.local`, set `MONGODB_URI`, and run `npm run dev` (so `server.js` loads `.env.local`).
  2. **User:** Log in with a **clinic admin/doctor/receptionist** account that belongs to a tenant. Avoid using super_admin for the dashboard unless that role has a tenant in your setup.
  3. **Response body:** In development, 500 responses include `error.message`. Open Network tab, click a failing request, and read the response body to see the exact error (e.g. "Please define the MONGODB_URI environment variable").

### 5. **"[API Client] No token available for request to /auth/login"**

- **Expected:** Login and register do not send a token. This warning is now suppressed for `/auth/login`, `/auth/register`, and `/auth/forgot*`.

### 6. **WebSocket / Socket.IO "closed before the connection is established"**

- **Cause:** Page navigates or unmounts before the Socket.IO connection completes, or the socket URL is wrong.
- **Check:** Ensure `NEXT_PUBLIC_SOCKET_URL` in `.env.local` matches your app (e.g. `http://localhost:5053`). Ignore this if it only happens during hot reload or redirect.

## Summary of code changes

- **api/settings/route.js:** Tenant guard + 500 response includes error message in development.
- **api/features/route.js:** Tenant guard for non–super_admin; server errors return 500 with message.
- **api/reports/revenue/route.js:** Guard: `!user.tenantId` → 400 "Tenant context required for reports".
- **api/reports/appointments/route.js:** Same guard as revenue.
- **lib/api/client.js:** No "No token" warning for login/register/forgot-password.

## If 500s persist

1. Inspect one failing request in the browser Network tab and read the JSON response body (`error.message`).
2. Confirm MongoDB is running and `MONGODB_URI` in `.env.local` is correct.
3. Restart the dev server after changing `.env.local` (`npm run dev`).
4. Log in with a clinic user account that has a tenant and retry the dashboard.
