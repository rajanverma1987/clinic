# Recommended Architecture: Marketing vs Clinic (Best Safety)

## 1. Marketing Website (Public)

**Example:** `www.yoursite.com`  
**Codebase:** `website/` (standalone Next.js app in this repo)

### Contains

- Home
- Pricing
- Blog
- About
- Contact
- Privacy / Terms
- **Login** button → **redirect only** (no auth, no session)

### Does NOT contain

- No dashboard code
- No role logic
- No patient/clinic data
- No API calls to clinic backend
- No AuthContext or session

**Login / Get Started** → redirect to `NEXT_PUBLIC_CLINIC_APP_URL` (e.g. `https://accounts.yoursite.com`).

**Port (dev):** 3000  
**Deploy:** www.yoursite.com

---

## 2. Clinic Dashboard (Private)

**Example:** `accounts.yoursite.com`  
**Codebase:** This repo (clinic app) — **without** the `(website)` route group when using the standalone marketing app.

### Contains

- Login / Register / Forgot password
- Dashboard (all roles)
- Appointments, Patients, Prescriptions, Billing, Inventory, Reports, Telemedicine
- Settings, Subscription
- Admin (super admin)
- All API routes and services

### Does NOT contain (when marketing is separate)

- No public marketing pages (Home, Pricing, Blog, etc.) — those live on the `website/` app
- Root `/` can redirect to `/login`

**Port (dev):** 5053  
**Deploy:** accounts.yoursite.com

---

## Summary

| App       | URL example           | Port (dev) | Content                          |
| --------- | --------------------- | ---------- | -------------------------------- |
| Marketing | www.yoursite.com      | 3000       | Public pages, Login = redirect   |
| Clinic    | accounts.yoursite.com | 5053       | Dashboard, auth, API, all clinic |

**Safety:** Marketing site has zero access to clinic data or auth. Clinic app is only reachable at its subdomain.
