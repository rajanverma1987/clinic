# Dashboard & Sidebar Sync – Production Clinic UX

**Date:** January 2026  
**Status:** Single source for clinic nav order and dashboard/sidebar alignment

## Sidebar tab order (production)

Order is optimized for daily clinic workflow and matches dashboard quick actions and "See All" links.

### For all clinic users (staff + doctors)

1. **Dashboard** – Overview, stats, today’s appointments, alerts  
2. **Appointments** – Schedule and manage appointments  
3. **Queue** – Waiting room and queue management  
4. **Patients** – Patient records and search  
5. **Prescriptions** – Create and manage prescriptions  
6. **Invoices** – Billing and invoices  
7. **Inventory** – Items and stock  
8. **Lots** – Batches and expiry (under Inventory)  
9. **Reports** – Analytics and reports  
10. **Telemedicine** – Video consultations  
11. **Locations** – Multi-location (feature-gated)  
12. **API Docs** – API access (feature-gated)  
13. **Branding** – Custom branding (feature-gated)  
14. **White Label** – White label (feature-gated)  
15. **Settings** – Clinic settings (always last)

### For doctors only (inserted after Dashboard)

- **Profile** – Doctor profile  
- **Schedule** – Availability  
- **Appointments** – Appointments calendar  
- **Earnings** – Revenue and earnings  
- **Reviews** – Patient reviews  

So for a doctor the order is: **Dashboard → Profile → Schedule → Appointments → Earnings → Reviews →** then the rest (Appointments, Queue, Patients, …).

## Dashboard ↔ Sidebar alignment

- **Quick Actions** (header): New Appointment → `/appointments/new`, Add Patient → `/patients?new=true`, Emergency Check-in → `/queue`, New Prescription → `/prescriptions/new`, Generate Report → `/reports`. All match sidebar routes.  
- **Today’s Appointments** “See All” → `/appointments`.  
- **Appointment Requests** “See All” → `/appointments?status=pending`.  
- **Recent Patients** “See All” → `/patients`.  
- **Overdue Invoices** list → `/invoices`, item click → `/invoices/[id]`.  
- **Low Stock** list → `/inventory`, item click → `/inventory/items/[id]`.  
- **Critical Alerts** “View” → `/inventory`, `/appointments`, or `/reports` by alert type.  
- **Stats cards** (clicks): Patients → `/patients`, Appointments → `/appointments`, Queue → `/appointments?status=in_queue,arrived`, Completed → `/appointments?status=completed`, Reviews → `/doctors/reviews`, Earnings → `/doctors/earnings`.  
- **Calendar** date click → `/appointments?date=YYYY-MM-DD`.

All dashboard links use the same paths as the sidebar; no orphan routes.

## i18n (sidebar labels)

All sidebar labels use `labelKey` and `t()`:

- **Common:** `dashboard.title`, `appointments.title`, `queue.title`, `patients.title`, `prescriptions.title`, `invoices.title`, `inventory.title`, `reports.title`, `settings.title`.  
- **Nav:** `nav.lots`, `nav.locations`, `nav.branding`, `nav.whiteLabel`, `nav.apiDocs`.  
- **Telemedicine:** `telemedicine.title`.  
- **Doctors:** `doctors.profile`, `doctors.schedule`, `doctors.appointmentsCalendar`, `doctors.earnings`, `doctors.reviews`.  
- **Sidebar control:** `common.expandSidebar`, `common.collapseSidebar`, `common.collapseMenu`.

## Implementation

- **Sidebar:** `components/layout/Sidebar.jsx` – `menuItemsWithFeatures` defines the order above; `menuItems` is built with Dashboard first, then doctor items (if role is doctor), then the rest (feature-filtered).  
- **Dashboard:** `app/dashboard/page.jsx` – All `router.push` and `onSeeAll`/onClick targets use the same paths as sidebar hrefs.  
- **Quick Actions:** `app/dashboard/components/QuickActions.jsx` – Paths match sidebar routes.

## UI/UX notes

- Dashboard is always the first tab so users land on overview first.  
- Appointments and Queue follow immediately for daily workflow.  
- Patients, Prescriptions, Invoices, Inventory, Reports follow in a logical clinical/business order.  
- Settings and feature-gated items (Locations, API Docs, Branding, White Label) are at the end.  
- Active state uses `pathname === item.href || pathname?.startsWith(item.href + '/')` with longer-match rule so child routes (e.g. `/inventory/lots`) highlight only the correct item.
