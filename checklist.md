# Doctor's Clinic Management System - Dashboard Checklist

## 1. SUPER ADMIN DASHBOARD

### 1.1 Overview Tab

| #      | Item                                                         | Status                      |
| ------ | ------------------------------------------------------------ | --------------------------- |
| 1.1.1  | Total clinics count (Active/Inactive)                        | [x] Implemented             |
| 1.1.2  | Total clinics – Suspended as separate status                 | [x] Implemented             |
| 1.1.3  | Total revenue (This Month/Total)                             | [x] Implemented             |
| 1.1.4  | Total revenue – Today/This Year breakdown                    | [x] Implemented             |
| 1.1.5  | Active subscriptions breakdown (by status)                   | [x] Implemented             |
| 1.1.6  | New signups this month (tenants, users, patients)            | [x] Implemented             |
| 1.1.7  | Subscription renewal alerts                                  | [x] Implemented             |
| 1.1.8  | Platform health metrics (API, DB, Payment, Video, Email)     | [x] Implemented (static OK) |
| 1.1.9  | Revenue trend chart (Last 6–12 months)                       | [x] Implemented             |
| 1.1.10 | Quick stats cards (Doctors, Patients, Appointments, Revenue) | [x] Implemented             |
| 1.1.11 | Recent activity feed (New tenants, users, patients)          | [x] Implemented             |
| 1.1.12 | Expiring subscriptions alert (Next 7 days)                   | [x] Implemented             |

### 1.2 Clinics Management Tab (`/admin/clients`)

| #      | Item                                               | Status          |
| ------ | -------------------------------------------------- | --------------- |
| 1.2.1  | Data table (Name, Region, Status, Plan, Created)   | [x] Implemented |
| 1.2.2  | Search and filter options                          | [x] Implemented |
| 1.2.3  | View clinic details modal                          | [x] Implemented |
| 1.2.4  | Activate/Deactivate clinic button                  | [x] Implemented |
| 1.2.5  | Suspend clinic with reason                         | [x] Implemented |
| 1.2.6  | Change subscription plan manually                  | [x] Implemented |
| 1.2.7  | View clinic usage stats (Patients, Managers count) | [x] Implemented |
| 1.2.8  | Login as clinic (impersonate for support)          | [x] Implemented |
| 1.2.9  | Send notification to clinic                        | [x] Implemented |
| 1.2.10 | Export clinics list to CSV                         | [x] Implemented |
| 1.2.11 | Bulk actions (Activate, Suspend, Delete)           | [x] Implemented |

### 1.3 Subscription Plans Tab (`/admin/subscriptions`)

| #      | Item                                                  | Status               |
| ------ | ----------------------------------------------------- | -------------------- |
| 1.3.1  | List all available plans                              | [x] Implemented      |
| 1.3.2  | Create new plan form                                  | [x] Implemented      |
| 1.3.3  | Edit existing plan                                    | [x] Implemented      |
| 1.3.4  | Set plan features (checkboxes)                        | [x] Implemented      |
| 1.3.5  | Set plan limits (maxUsers, maxPatients, maxStorageGB) | [x] Implemented      |
| 1.3.6  | Set pricing (monthly/yearly)                          | [x] Implemented      |
| 1.3.7  | Enable/Disable plan (isHidden)                        | [x] Implemented      |
| 1.3.8  | Plan comparison table                                 | [x] Implemented      |
| 1.3.9  | Assign custom plan to specific clinic                 | [x] Via clients page |
| 1.3.10 | View clinics on each plan                             | [x] Implemented      |

### 1.4 Users Management Tab (`/admin/users`)

| #     | Item                                          | Status                |
| ----- | --------------------------------------------- | --------------------- |
| 1.4.1 | All users table (Email, Role, Tenant, Status) | [x] Implemented       |
| 1.4.2 | Filter by role                                | [x] Implemented       |
| 1.4.3 | Search users                                  | [x] Implemented       |
| 1.4.4 | View user details                             | [x] Implemented       |
| 1.4.5 | Suspend/Activate user                         | [x] Implemented       |
| 1.4.6 | Reset user password                           | [x] Implemented       |
| 1.4.7 | View user activity log                        | [x] Implemented       |
| 1.4.8 | Delete user (with confirmation)               | [ ] Deactivate covers |
| 1.4.9 | Export users list                             | [x] Implemented       |

### 1.5 Analytics Tab (`/admin/analytics`)

| #      | Item                                | Status                |
| ------ | ----------------------------------- | --------------------- |
| 1.5.1  | Total revenue chart with date range | [x] Implemented       |
| 1.5.2  | Subscription growth chart           | [x] Implemented       |
| 1.5.3  | Plan distribution pie chart         | [x] Implemented       |
| 1.5.4  | Churn rate metric                   | [x] Implemented       |
| 1.5.5  | Average revenue per clinic          | [x] Implemented       |
| 1.5.6  | New vs cancelled subscriptions      | [x] Implemented       |
| 1.5.7  | Payment success/failure rates       | [x] Implemented       |
| 1.5.8  | Top performing clinics by revenue   | [x] Implemented       |
| 1.5.9  | Geographic distribution             | [x] On admin overview |
| 1.5.10 | Custom date range selector          | [x] Implemented       |
| 1.5.11 | Export analytics to CSV             | [x] Implemented       |

### 1.6 Support Tickets Tab

| #     | Item                   | Status                                   |
| ----- | ---------------------- | ---------------------------------------- |
| 1.6.1 | Support tickets module | [x] Placeholder page at `/admin/support` |

### 1.7 System Settings Tab (`/admin/settings`)

| #      | Item                                       | Status             |
| ------ | ------------------------------------------ | ------------------ |
| 1.7.1  | Settings hub with sub-pages                | [x] Implemented    |
| 1.7.2  | General (platform name, logo)              | [x] Implemented    |
| 1.7.3  | Email SMTP configuration                   | [x] email-sms page |
| 1.7.4  | SMS gateway settings                       | [x] email-sms page |
| 1.7.5  | Payment gateway (Stripe/PayPal)            | [x] payment page   |
| 1.7.6  | Tax settings (GST/VAT rates)               | [x] Implemented    |
| 1.7.7  | Currency settings                          | [x] Implemented    |
| 1.7.8  | Email templates editor                     | [x] Implemented    |
| 1.7.9  | SMS templates editor                       | [x] Implemented    |
| 1.7.10 | Terms & conditions editor                  | [x] Implemented    |
| 1.7.11 | Privacy policy editor                      | [x] Implemented    |
| 1.7.12 | Maintenance mode toggle                    | [x] Implemented    |
| 1.7.13 | Backup database option                     | [x] Implemented    |
| 1.7.14 | Security, Notification, Booking, SEO pages | [x] Implemented    |

### 1.8 Audit Logs Tab (`/admin/activity-logs`)

| #      | Item                          | Status          |
| ------ | ----------------------------- | --------------- |
| 1.8.1  | All admin actions log         | [x] Implemented |
| 1.8.2  | Filter by admin user          | [x] Implemented |
| 1.8.3  | Filter by action type         | [x] Implemented |
| 1.8.4  | Filter by resource            | [x] Implemented |
| 1.8.5  | Date range filter             | [x] Implemented |
| 1.8.6  | Search logs                   | [x] Implemented |
| 1.8.7  | View action details           | [x] Implemented |
| 1.8.8  | Export logs to CSV            | [x] Implemented |
| 1.8.9  | IP address tracking           | [x] Implemented |
| 1.8.10 | Auto-cleanup old logs setting | [x] Implemented |

### 1.9 Content Management (`/admin/content`)

| #      | Item                                                   | Status          |
| ------ | ------------------------------------------------------ | --------------- |
| 1.9.1  | Content hub with sub-sections                          | [x] Implemented |
| 1.9.2  | Blog posts — list, create, edit, delete                | [x] Implemented |
| 1.9.3  | FAQs — list, create, edit, delete                      | [x] Implemented |
| 1.9.4  | Banners — list, create, edit, delete                   | [x] Implemented |
| 1.9.5  | Static pages — list, create, edit, delete              | [x] Implemented |
| 1.9.6  | Specialties — list, create, edit, delete               | [x] Implemented |
| 1.9.7  | Doctor verification workflow (`/admin/doctors/verify`) | [x] Implemented |
| 1.9.8  | Publish / draft / archive status per content item      | [ ] Verify      |
| 1.9.9  | Rich text editor for blog/pages                        | [ ] Verify      |
| 1.9.10 | Image upload for banners/blog                          | [ ] Verify      |

### 1.10 Financial Management (`/admin/financial`)

| #       | Item                                                  | Status          |
| ------- | ----------------------------------------------------- | --------------- |
| 1.10.1  | Financial hub with sub-sections                       | [x] Implemented |
| 1.10.2  | Revenue overview (`/admin/financial/revenue`)         | [x] Implemented |
| 1.10.3  | Disputes management (`/admin/financial/disputes`)     | [x] Implemented |
| 1.10.4  | Settlements tracking (`/admin/financial/settlements`) | [x] Implemented |
| 1.10.5  | Commission management (`/admin/financial/commission`) | [x] Implemented |
| 1.10.6  | Invoicing overview (`/admin/financial/invoicing`)     | [x] Implemented |
| 1.10.7  | Revenue API (`/api/admin/financial/revenue`)          | [x] Implemented |
| 1.10.8  | Disputes API (`/api/admin/financial/disputes`)        | [x] Implemented |
| 1.10.9  | Date range filter on all financial views              | [ ] Verify      |
| 1.10.10 | Export financial data to CSV                          | [ ] Verify      |

### 1.11 Admin Appointments Module (`/admin/appointments`)

| #       | Item                                                                | Status              |
| ------- | ------------------------------------------------------------------- | ------------------- |
| 1.11.1  | All appointments list across all clinics                            | [x] Implemented     |
| 1.11.2  | Filter by status, date range, clinic                                | [x] Implemented     |
| 1.11.3  | Search appointments                                                 | [x] Implemented     |
| 1.11.4  | View appointment details                                            | [x] Implemented     |
| 1.11.5  | Update appointment status (`/api/admin/appointments/[id]/status`)   | [x] Implemented     |
| 1.11.6  | Generate appointment report (`/api/admin/appointments/[id]/report`) | [x] Implemented     |
| 1.11.7  | Appointment analytics dashboard (`/admin/appointments/analytics`)   | [x] Implemented     |
| 1.11.8  | Analytics API (`/api/admin/appointments/analytics`)                 | [x] Implemented     |
| 1.11.9  | Export appointments list                                            | [ ] Verify          |
| 1.11.10 | Bulk status update                                                  | [ ] Not implemented |

### 1.12 Admin Patients Module (`/admin/patients`)

| #      | Item                                                | Status          |
| ------ | --------------------------------------------------- | --------------- |
| 1.12.1 | All patients across clinics list                    | [x] Implemented |
| 1.12.2 | Search and filter patients                          | [x] Implemented |
| 1.12.3 | View patient detail (`/admin/patients/[id]`)        | [x] Implemented |
| 1.12.4 | Edit patient record (`/api/admin/patients/[id]`)    | [x] Implemented |
| 1.12.5 | Export patients list (`/api/admin/patients/export`) | [x] Implemented |
| 1.12.6 | Filter by clinic/tenant                             | [ ] Verify      |
| 1.12.7 | Delete patient record (super admin only)            | [ ] Verify      |

### 1.13 Admin Doctors Management (`/admin/doctors`)

| #      | Item                                                                  | Status          |
| ------ | --------------------------------------------------------------------- | --------------- |
| 1.13.1 | All doctors list table across platform                                | [x] Implemented |
| 1.13.2 | Doctor verification queue (`/admin/doctors/verify`)                   | [x] Implemented |
| 1.13.3 | Verify doctor (`/api/admin/doctors/[id]/verify`)                      | [x] Implemented |
| 1.13.4 | Request additional docs (`/api/admin/doctors/[id]/request-documents`) | [x] Implemented |
| 1.13.5 | View doctor documents (`/api/admin/doctors/[id]/documents`)           | [x] Implemented |
| 1.13.6 | Bulk action on doctors (`/api/admin/doctors/bulk-action`)             | [x] Implemented |
| 1.13.7 | Doctor profile view/edit (`/api/admin/doctors/[id]`)                  | [x] Implemented |
| 1.13.8 | Filter by verification status                                         | [x] Implemented |
| 1.13.9 | Export doctors list                                                   | [ ] Verify      |

### 1.14 Admin Reviews Module (`/admin/reviews`)

| #      | Item                                                 | Status          |
| ------ | ---------------------------------------------------- | --------------- |
| 1.14.1 | Reviews dashboard (`/admin/reviews/dashboard`)       | [x] Implemented |
| 1.14.2 | All reviews list (`/admin/reviews`)                  | [x] Implemented |
| 1.14.3 | Reviews analytics (`/admin/reviews/analytics`)       | [x] Implemented |
| 1.14.4 | Review actions/moderation (`/admin/reviews/actions`) | [x] Implemented |
| 1.14.5 | Approve / reject reviews                             | [x] Implemented |
| 1.14.6 | Flag / unflag reviews                                | [ ] Verify      |
| 1.14.7 | Filter reviews by clinic, doctor, rating             | [ ] Verify      |
| 1.14.8 | Export reviews data                                  | [ ] Verify      |

### 1.15 Admin Reports Module (`/admin/reports`)

| #      | Item                                                 | Status          |
| ------ | ---------------------------------------------------- | --------------- |
| 1.15.1 | Reports hub (`/admin/reports`)                       | [x] Implemented |
| 1.15.2 | Appointment reports (`/admin/reports/appointments`)  | [x] Implemented |
| 1.15.3 | Financial reports (`/admin/reports/financial`)       | [x] Implemented |
| 1.15.4 | Performance reports (`/admin/reports/performance`)   | [x] Implemented |
| 1.15.5 | User reports (`/admin/reports/user`)                 | [x] Implemented |
| 1.15.6 | Export reports page (`/admin/reports/export`)        | [x] Implemented |
| 1.15.7 | Analytics export API (`/api/admin/analytics/export`) | [x] Implemented |
| 1.15.8 | Date range filtering on all report pages             | [ ] Verify      |
| 1.15.9 | CSV / PDF export per report type                     | [ ] Verify      |

---

## 2. DOCTOR/CLINIC DASHBOARD

### 2.1 Dashboard Tab (`/dashboard`)

| #      | Item                                                                                                   | Status                               |
| ------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| 2.1.1  | Today's appointments count                                                                             | [x] Implemented                      |
| 2.1.2  | Total patients count                                                                                   | [x] Implemented                      |
| 2.1.3  | This month's revenue                                                                                   | [x] Implemented                      |
| 2.1.4  | Pending payments / overdue invoices count                                                              | [x] Implemented                      |
| 2.1.5  | Today's appointment timeline/list                                                                      | [x] Implemented                      |
| 2.1.6  | Recent patients (Last 5)                                                                               | [x] Implemented                      |
| 2.1.7  | Upcoming appointments (Next 3)                                                                         | [x] Implemented                      |
| 2.1.8  | Revenue chart (Last 7/14 days)                                                                         | [x] Implemented                      |
| 2.1.9  | Popular services/treatments                                                                            | [ ] Not on dashboard                 |
| 2.1.10 | Low stock medicines alert                                                                              | [x] Implemented                      |
| 2.1.11 | Subscription status widget (Overlay, ExpiredBanner)                                                    | [x] Implemented                      |
| 2.1.12 | Quick action buttons filtered by role (Add Patient, Book Appointment, New Prescription, Queue, Report) | [x] Role-filtered `QuickActions.jsx` |
| 2.1.13 | Calendar widget (date picker → /appointments)                                                          | [x] Implemented                      |
| 2.1.14 | Critical alerts section                                                                                | [x] Implemented                      |

### 2.2 Appointments Tab (`/appointments`, `/doctors/appointments`)

| #      | Item                                                         | Status                                 |
| ------ | ------------------------------------------------------------ | -------------------------------------- |
| 2.2.1  | Monthly calendar view                                        | [x] Implemented                        |
| 2.2.2  | Daily list view toggle                                       | [x] Implemented                        |
| 2.2.3  | Weekly view option                                           | [x] Implemented                        |
| 2.2.4  | Book new appointment form                                    | [x] Implemented                        |
| 2.2.5  | Patient selection dropdown (search)                          | [x] Implemented                        |
| 2.2.6  | Date and time picker                                         | [x] Implemented                        |
| 2.2.7  | Service/treatment selection                                  | [ ] Verify                             |
| 2.2.8  | Duration selector                                            | [ ] Verify                             |
| 2.2.9  | Appointment status (Scheduled/Confirmed/Completed/Cancelled) | [x] Implemented                        |
| 2.2.10 | Edit appointment                                             | [x] Implemented                        |
| 2.2.11 | Cancel appointment with reason                               | [x] Implemented — `CancelAppointmentModal`  |
| 2.2.12 | Mark as completed                                            | [x] Implemented                        |
| 2.2.13 | Add appointment notes                                        | [ ] Verify                             |
| 2.2.14 | Send reminder (Email/SMS)                                    | [ ] Verify                             |
| 2.2.15 | View appointment history                                     | [x] Implemented                        |
| 2.2.16 | Filter by status/date range                                  | [x] Implemented                        |
| 2.2.17 | Color-coded appointments                                     | [x] Implemented                        |
| 2.2.18 | Drag and drop to reschedule                                  | [x] Implemented (EnhancedCalendarView) |
| 2.2.19 | Check-in patient option                                      | [x] Queue page                         |
| 2.2.20 | Print appointment details                                    | [ ] Verify                             |

### 2.3 Patients Tab (`/patients`)

| #      | Item                                                       | Status          |
| ------ | ---------------------------------------------------------- | --------------- |
| 2.3.1  | All patients list table                                    | [x] Implemented |
| 2.3.2  | Add new patient form (Name, Age, Gender, Contact, Address) | [x] Implemented |
| 2.3.3  | Patient ID auto-generation                                 | [x] Implemented |
| 2.3.4  | Search patients (by name, phone, patient ID)               | [x] Implemented |
| 2.3.5  | Filter by gender/age group                                 | [x] Implemented |
| 2.3.6  | View patient profile                                       | [x] Implemented |
| 2.3.7  | Edit patient details                                       | [x] Implemented |
| 2.3.8  | Delete patient (with confirmation)                         | [x] Implemented |
| 2.3.9  | Patient medical history                                    | [x] Implemented |
| 2.3.10 | Previous visit records                                     | [ ] Verify      |
| 2.3.11 | Upload documents (reports, prescriptions)                  | [ ] Verify      |
| 2.3.12 | Add allergies information                                  | [x] Implemented — `patients/[id]/page.jsx` |
| 2.3.13 | Add chronic conditions                                     | [x] Implemented — `chronicConditions` field added |
| 2.3.14 | Emergency contact details                                  | [ ] Verify      |
| 2.3.15 | Patient notes section                                      | [ ] Verify      |
| 2.3.16 | Export patient list to CSV                                 | [x] Implemented |
| 2.3.17 | Print patient card                                         | [ ] Verify      |

### 2.4 Billing & Invoices Tab (`/invoices`)

| #      | Item                                   | Status                   |
| ------ | -------------------------------------- | ------------------------ |
| 2.4.1  | Create new invoice                     | [x] Implemented          |
| 2.4.2  | Select patient                         | [x] Implemented          |
| 2.4.3  | Add services/items with prices         | [x] Implemented          |
| 2.4.4  | Apply discount (% or fixed)            | [x] Implemented          |
| 2.4.5  | Calculate tax automatically            | [x] Implemented          |
| 2.4.6  | Payment method selection               | [x] Implemented          |
| 2.4.7  | Partial payment option                 | [x] Record Payment modal |
| 2.4.8  | Generate and print invoice             | [ ] Verify               |
| 2.4.9  | Email invoice to patient               | [ ] Verify               |
| 2.4.10 | View all invoices list                 | [x] Implemented          |
| 2.4.11 | Filter by status (Paid/Unpaid/Partial) | [x] Implemented          |
| 2.4.12 | Search invoices                        | [x] Implemented          |
| 2.4.13 | Mark as paid                           | [x] Implemented          |
| 2.4.14 | Send payment reminder                  | [ ] Verify               |
| 2.4.15 | Revenue summary (Today/Week/Month)     | [x] Reports tab          |
| 2.4.16 | Payment mode breakdown                 | [ ] Verify               |
| 2.4.17 | Outstanding payments list              | [x] Overdue on dashboard |
| 2.4.18 | Export to PDF/Excel                    | [x] CSV export           |

### 2.5 Inventory Tab (`/inventory`)

| #      | Item                         | Status                           |
| ------ | ---------------------------- | -------------------------------- |
| 2.5.1  | All medicines/items list     | [x] Implemented                  |
| 2.5.2  | Add new item form            | [x] Implemented                  |
| 2.5.3  | Edit item details            | [x] Implemented                  |
| 2.5.4  | Delete item                  | [x] Implemented                  |
| 2.5.5  | Search items                 | [x] Implemented                  |
| 2.5.6  | Filter by category           | [x] Implemented                  |
| 2.5.7  | Low stock alerts (threshold) | [x] Implemented                  |
| 2.5.8  | Expired items alert          | [ ] Verify (expiring lots exist) |
| 2.5.9  | Expiry date tracking         | [x] Lots page                    |
| 2.5.10 | Batch number tracking        | [x] Lots page                    |
| 2.5.11 | Add stock (purchase entry)   | [ ] Verify                       |
| 2.5.12 | Reduce stock (sale entry)    | [ ] Verify                       |
| 2.5.13 | Supplier management          | [ ] Verify                       |
| 2.5.14 | Purchase order generation    | [ ] Verify                       |
| 2.5.15 | Stock value calculation      | [ ] Verify                       |
| 2.5.16 | Inventory report             | [x] Reports tab                  |
| 2.5.17 | Export inventory to CSV      | [x] Implemented                  |

### 2.6 Staff Management Tab (`/staff`)

| #     | Item                                       | Status                      |
| ----- | ------------------------------------------ | --------------------------- |
| 2.6.1 | All staff/managers list                    | [x] Implemented             |
| 2.6.2 | Add new staff form                         | [x] Implemented             |
| 2.6.3 | Manager limit indicator (e.g., "2/5 used") | [x] Implemented (X/Y users) |
| 2.6.4 | Set role/permissions (role dropdown)       | [x] Implemented             |
| 2.6.5 | Edit staff details                         | [x] Implemented             |
| 2.6.6 | Deactivate staff                           | [x] Implemented (isActive)  |
| 2.6.7 | Delete staff                               | [x] Implemented (Remove)    |
| 2.6.8 | View staff activity log                    | [ ] Not implemented         |
| 2.6.9 | Upgrade plan prompt (if limit reached)     | [x] Implemented             |

### 2.7 Reports Tab (`/reports`)

| #      | Item                                             | Status                        |
| ------ | ------------------------------------------------ | ----------------------------- |
| 2.7.1  | Date range selector                              | [x] Implemented               |
| 2.7.2  | Appointment report (Total, Completed, Cancelled) | [x] Implemented               |
| 2.7.3  | Revenue report with chart                        | [x] Implemented               |
| 2.7.4  | Patient report (New, Total visits)               | [x] Implemented               |
| 2.7.5  | Inventory report                                 | [x] Implemented               |
| 2.7.6  | Service-wise revenue                             | [ ] Verify                    |
| 2.7.7  | Payment mode report                              | [x] Implemented (Revenue tab) |
| 2.7.8  | Doctor performance (if multiple doctors)         | [x] Implemented (Doctors tab) |
| 2.7.9  | Daily collection summary                         | [ ] Verify                    |
| 2.7.10 | Monthly comparison chart                         | [ ] Verify                    |
| 2.7.11 | Export all reports to PDF                        | [ ] Verify (CSV exists)       |
| 2.7.12 | Print reports                                    | [x] Implemented (Print btn)   |

### 2.8 My Subscription Tab (`/subscription`)

| #      | Item                                        | Status                                         |
| ------ | ------------------------------------------- | ---------------------------------------------- |
| 2.8.1  | Current plan display                        | [x] Implemented                                |
| 2.8.2  | Plan features list                          | [x] `CARD_FEATURES_BY_PLAN` per plan           |
| 2.8.3  | Usage statistics (Patients/Managers limits) | [ ] Verify (no progress bar on sub page)       |
| 2.8.4  | Progress bars for limits                    | [ ] Verify                                     |
| 2.8.5  | Billing history                             | [x] `/payment-history` link in sidebar         |
| 2.8.6  | Next billing date                           | [x] Implemented                                |
| 2.8.7  | Payment method on file                      | [ ] Verify                                     |
| 2.8.8  | Upgrade / switch plan button                | [x] Implemented — `subscription/page.jsx`      |
| 2.8.9  | Downgrade plan option                       | [x] Same flow as upgrade (switch plan)         |
| 2.8.10 | Cancel subscription                         | [x] `/subscription/cancel` + inline cancel btn |
| 2.8.11 | View invoices                               | [x] `/payment-history` page                    |
| 2.8.12 | Update payment method                       | [ ] Verify (PayPal redirect only)              |
| 2.8.13 | Plan comparison table                       | [x] `COMPARISON_TABLE_ROWS` modal in sub page  |
| 2.8.14 | Add-ons available                           | [x] `ADDONS` rendered in subscription page     |

### 2.9 Clinic Settings Tab (`/settings`)

| #      | Item                                    | Status                                      |
| ------ | --------------------------------------- | ------------------------------------------- |
| 2.9.1  | Settings hub with sub-pages             | [x] Implemented                             |
| 2.9.2  | Clinic name and logo                    | [x] General/branding                        |
| 2.9.3  | Contact details (Phone, Email, Address) | [ ] Verify                                  |
| 2.9.4  | Operating hours (days and timings)      | [x] Settings `hours` tab — `settings/[tab]` |
| 2.9.5  | Services offered (add/remove)           | [ ] Verify                                  |
| 2.9.6  | Consultation fees                       | [ ] Verify                                  |
| 2.9.7  | Appointment duration default            | [ ] Verify                                  |
| 2.9.8  | Tax registration (GST number)           | [ ] Verify                                  |
| 2.9.9  | Bank account details                    | [ ] Verify                                  |
| 2.9.10 | Letterhead/stamp upload                 | [ ] Verify                                  |
| 2.9.11 | Notification preferences                | [x] Notification page                       |
| 2.9.12 | SMS/Email toggle                        | [ ] Verify                                  |
| 2.9.13 | Timezone setting                        | [ ] Verify                                  |
| 2.9.14 | Language preference                     | [ ] Verify                                  |
| 2.9.15 | Change password                         | [x] /change-password                        |

### 2.10 Templates Tab

| #      | Item                                     | Status     |
| ------ | ---------------------------------------- | ---------- |
| 2.10.1 | Prescription templates list              | [ ] Verify |
| 2.10.2 | Create/Edit/Delete prescription template | [ ] Verify |
| 2.10.3 | Template preview                         | [ ] Verify |
| 2.10.4 | Set as default template                  | [ ] Verify |
| 2.10.5 | Invoice template customization           | [ ] Verify |
| 2.10.6 | Report templates                         | [ ] Verify |
| 2.10.7 | Certificate templates (Fitness, Medical) | [ ] Verify |
| 2.10.8 | Template variables guide                 | [ ] Verify |
| 2.10.9 | Duplicate template                       | [ ] Verify |

---

## 3. SUB-MANAGER DASHBOARD

> Manager role shares clinic dashboard with permission-based restrictions. `managerAccess` controls sidebar visibility; `MANAGER_RESTRICTIONS` blocks /staff, /settings, /reports, /prescriptions/new, /inventory/lots.

### 3.1 Dashboard Tab (Managers)

| #     | Item                           | Status                                        |
| ----- | ------------------------------ | --------------------------------------------- |
| 3.1.1 | Today's appointments (view)    | [x] Via managerAccess.appointments            |
| 3.1.2 | Recent patients                | [x] Via managerAccess.patients                |
| 3.1.3 | Today's revenue (if permitted) | [x] Revenue card & reports blocked — API + UI |
| 3.1.4 | Quick stats (limited)          | [x] Dashboard shown per managerAccess         |
| 3.1.5 | Upcoming appointments          | [x] Via appointments access                   |
| 3.1.6 | Pending tasks                  | [x] Same as clinic                            |
| 3.1.7 | Welcome message with role info | [ ] Verify                                    |

### 3.2 Appointments Tab (Limited Access)

| #     | Item                      | Status                                          |
| ----- | ------------------------- | ----------------------------------------------- |
| 3.2.1 | View today's appointments | [x] CREATE, READ, UPDATE, CANCEL on APPOINTMENT |
| 3.2.2 | Book new appointment      | [x] Permitted                                   |
| 3.2.3 | View appointment details  | [x] Permitted                                   |
| 3.2.4 | Check-in patient (Queue)  | [x] READ, UPDATE on QUEUE                       |
| 3.2.5 | Edit appointment          | [x] Permitted                                   |
| 3.2.6 | Cancel appointment        | [x] Permitted                                   |
| 3.2.7 | Send appointment reminder | [ ] Verify                                      |
| 3.2.8 | Filter by date            | [x] Same as clinic                              |
| 3.2.9 | Search appointments       | [x] Same as clinic                              |

### 3.3 Patients Tab (Limited Access)

| #     | Item                             | Status                              |
| ----- | -------------------------------- | ----------------------------------- |
| 3.3.1 | View all patients                | [x] CREATE, READ, UPDATE on PATIENT |
| 3.3.2 | Add new patient                  | [x] Permitted                       |
| 3.3.3 | View patient details             | [x] Permitted                       |
| 3.3.4 | Edit patient info                | [x] Permitted                       |
| 3.3.5 | Search patients                  | [x] Same as clinic                  |
| 3.3.6 | View medical history (read-only) | [ ] CLINICAL_NOTE: [] – no access   |
| 3.3.7 | Upload documents                 | [ ] Verify                          |

### 3.4 Billing Tab (Conditional)

| #     | Item                  | Status                                           |
| ----- | --------------------- | ------------------------------------------------ |
| 3.4.1 | Generate invoice      | [x] CREATE on INVOICE (limitedWrite: no pricing) |
| 3.4.2 | View invoices list    | [x] Permitted                                    |
| 3.4.3 | Print invoice         | [ ] Verify                                       |
| 3.4.4 | Mark payment received | [x] CREATE, READ, UPDATE on PAYMENT              |
| 3.4.5 | View payment summary  | [ ] Reports blocked for manager                  |

### 3.5 Reports Tab (Limited)

| #     | Item                       | Status                                                  |
| ----- | -------------------------- | ------------------------------------------------------- |
| 3.5.1 | Reports access for manager | [ ] MANAGER_RESTRICTIONS.cannotAccess includes /reports |
| 3.5.2 | Daily appointment report   | [ ] Blocked                                             |
| 3.5.3 | Patient visit report       | [ ] Blocked                                             |
| 3.5.4 | Basic revenue summary      | [ ] Blocked                                             |
| 3.5.5 | Export to PDF              | [ ] Blocked                                             |

### 3.6 My Profile Tab

| #     | Item                                      | Status                                 |
| ----- | ----------------------------------------- | -------------------------------------- |
| 3.6.1 | View personal details                     | [x] Same as other users                |
| 3.6.2 | Edit profile                              | [x] Same                               |
| 3.6.3 | Change password                           | [x] /change-password                   |
| 3.6.4 | View assigned permissions (managerAccess) | [ ] Verify                             |
| 3.6.5 | Activity log (own actions)                | [ ] Audit logs blocked (AUDIT_LOG: []) |
| 3.6.6 | Notification preferences                  | [x] READ, UPDATE on NOTIFICATION       |

### 3.7 Permission Matrix (Doctor/Admin Controls)

| #      | Permission               | Status                                 |
| ------ | ------------------------ | -------------------------------------- |
| 3.7.1  | Can book appointments    | [x] In constants                       |
| 3.7.2  | Can cancel appointments  | [x] In constants                       |
| 3.7.3  | Can add patients         | [x] In constants                       |
| 3.7.4  | Can edit patients        | [x] In constants                       |
| 3.7.5  | Can delete patients      | [ ] No DELETE on PATIENT               |
| 3.7.6  | Can generate invoices    | [x] In constants (limited: no pricing) |
| 3.7.7  | Can view revenue reports | [ ] Reports blocked                    |
| 3.7.8  | Can manage inventory     | [ ] READ only on INVENTORY             |
| 3.7.9  | Can view medical history | [ ] CLINICAL_NOTE: []                  |
| 3.7.10 | Can upload documents     | [ ] Verify                             |
| 3.7.11 | Can send notifications   | [ ] Verify                             |
| 3.7.12 | Can print prescriptions  | [ ] PRESCRIPTION: [] – no access       |

---

## 4. COMMON COMPONENTS ACROSS ALL DASHBOARDS

### 4.1 Header

| #     | Item                          | Status                                       |
| ----- | ----------------------------- | -------------------------------------------- |
| 4.1.1 | User name and role display    | [x] ProfileMenu, Sidebar                     |
| 4.1.2 | Profile dropdown menu         | [x] ProfileMenu                              |
| 4.1.3 | Notifications icon with badge | [x] NotificationCenter, NotificationDropdown |
| 4.1.4 | Settings link                 | [x] Sidebar, ProfileMenu                     |
| 4.1.5 | Logout button                 | [x] ProfileMenu                              |
| 4.1.6 | Search bar (global)           | [x] GlobalSearch                             |

### 4.2 Sidebar Navigation

| #     | Item                        | Status                                 |
| ----- | --------------------------- | -------------------------------------- |
| 4.2.1 | Logo and app name           | [x] Implemented                        |
| 4.2.2 | Menu items with icons       | [x] Implemented                        |
| 4.2.3 | Active state highlighting   | [x] Implemented                        |
| 4.2.4 | Collapsible sidebar         | [x] localStorage persistence           |
| 4.2.5 | Role-based menu items       | [x] dashboard-structure, managerAccess |
| 4.2.6 | Mobile hamburger + backdrop | [x] Layout, Sidebar                    |

### 4.3 Notifications Panel

| #     | Item                                               | Status                                  |
| ----- | -------------------------------------------------- | --------------------------------------- |
| 4.3.1 | Unread notifications count                         | [x] Implemented                         |
| 4.3.2 | Notification list with timestamps                  | [x] Implemented                         |
| 4.3.3 | Mark as read                                       | [x] `POST /api/notifications/[id]/read` |
| 4.3.4 | Clear all notifications                            | [x] `POST /api/notifications/read-all`  |
| 4.3.5 | Notification types (info, warning, success, error) | [ ] Verify                              |

### 4.4 Profile Settings (All Users)

| #     | Item                             | Status                                   |
| ----- | -------------------------------- | ---------------------------------------- |
| 4.4.1 | View profile details             | [x] Profile pages exist                  |
| 4.4.2 | Edit personal info               | [x] Implemented                          |
| 4.4.3 | Upload profile picture           | [ ] Verify                               |
| 4.4.4 | Change password                  | [x] /change-password                     |
| 4.4.5 | Email preferences                | [ ] Verify                               |
| 4.4.6 | Two-factor authentication toggle | [ ] Verify (schema has twoFactorEnabled) |
| 4.4.7 | Session management               | [ ] Verify                               |
| 4.4.8 | Login history                    | [ ] Verify                               |

---

## 5. RESPONSIVE DESIGN CHECKLIST

| #   | Item                                               | Status                |
| --- | -------------------------------------------------- | --------------------- |
| 5.1 | Mobile-friendly navigation (hamburger menu)        | [x] Layout + Sidebar  |
| 5.2 | Responsive tables (horizontal scroll or card view) | [ ] Verify            |
| 5.3 | Touch-friendly buttons and inputs                  | [ ] Verify            |
| 5.4 | Tablet layout optimization                         | [ ] Verify            |
| 5.5 | Desktop full-width utilization                     | [x] Layout uses grid  |
| 5.6 | Consistent breakpoints                             | [ ] Verify (Tailwind) |
| 5.7 | Mobile-specific components where needed            | [ ] Verify            |

---

## 6. ACCESSIBILITY CHECKLIST

| #   | Item                        | Status                                  |
| --- | --------------------------- | --------------------------------------- |
| 6.1 | Keyboard navigation support | [ ] Verify                              |
| 6.2 | Screen reader labels        | [x] ARIA used in multiple components    |
| 6.3 | Color contrast compliance   | [ ] Verify                              |
| 6.4 | Focus indicators            | [ ] Verify                              |
| 6.5 | Alt text for images         | [ ] Verify                              |
| 6.6 | ARIA labels where needed    | [x] Partial (Tabs, Button, Modal, etc.) |
| 6.7 | Skip to content link        | [ ] Verify                              |

---

## 7. PERFORMANCE CHECKLIST

| #   | Item                                | Status                                |
| --- | ----------------------------------- | ------------------------------------- |
| 7.1 | Lazy loading for tables             | [x] Virtualization where used         |
| 7.2 | Pagination for large datasets       | [x] API pagination                    |
| 7.3 | Image optimization                  | [ ] Verify (OptimizedImage exists)    |
| 7.4 | API response caching                | [x] SWR, React Query, dashboard cache |
| 7.5 | Loading states for async operations | [x] Loader, skeletons                 |
| 7.6 | Debounced search inputs             | [x] useDebouncedValue                 |
| 7.7 | Optimized database queries          | [ ] Verify (lean, indexes)            |

---

## 8. SECURITY CHECKLIST

| #   | Item                               | Status                                        |
| --- | ---------------------------------- | --------------------------------------------- |
| 8.1 | Role-based route protection        | [x] ProtectedRoute, middleware                |
| 8.2 | Input validation on all forms      | [ ] Verify                                    |
| 8.3 | XSS prevention                     | [ ] Verify                                    |
| 8.4 | CSRF tokens                        | [ ] Verify                                    |
| 8.5 | SQL injection prevention           | [ ] N/A (MongoDB) – injection handled         |
| 8.6 | Rate limiting on sensitive actions | [x] `apiRateLimit` middleware on all routes   |
| 8.7 | Secure password requirements       | [ ] Verify                                    |
| 8.8 | Session timeout handling           | [x] `SESSION_CONFIG.inactivityTimeout = 1800` |
| 8.9 | Audit logging for critical actions | [x] Activity logs API                         |

---

## 9. ENTERPRISE RBAC

### 9.1 Role Status

| #     | Role                   | Tier     | Status                                              |
| ----- | ---------------------- | -------- | --------------------------------------------------- |
| 9.1.1 | `super_admin`          | Platform | [x] Full platform access, no tenant PHI             |
| 9.1.2 | `clinic_admin`/`admin` | Clinic   | [x] Full clinic access, 2FA enforced                |
| 9.1.3 | `doctor`               | Clinic   | [x] Clinical + staff management, 2FA enforced       |
| 9.1.4 | `manager`              | Clinic   | [x] Configurable via managerAccess, API-level block |
| 9.1.5 | `nurse`                | Clinic   | [x] Nav filtered by permission, revenue hidden      |
| 9.1.6 | `receptionist`         | Clinic   | [x] Nav filtered by permission, revenue hidden      |
| 9.1.7 | `accountant`           | Clinic   | [x] Nav filtered by permission, subscription r/o    |
| 9.1.8 | `pharmacist`           | Clinic   | [x] Nav filtered by permission, lots visible        |

### 9.2 Sidebar Navigation — Per-Role Visibility

| #     | Item                                                               | Status                    |
| ----- | ------------------------------------------------------------------ | ------------------------- |
| 9.2.1 | Telemedicine nav requires `TELEMEDICINE:READ` permission           | [x] Fixed — `Sidebar.jsx` |
| 9.2.2 | Queue nav requires `QUEUE:READ` permission                         | [x] Fixed — `Sidebar.jsx` |
| 9.2.3 | Staff nav allows `admin` role (was missing from `requiredRoles`)   | [x] Fixed — `Sidebar.jsx` |
| 9.2.4 | Inventory/Lots nav requires `INVENTORY:UPDATE` permission          | [x] Fixed — `Sidebar.jsx` |
| 9.2.5 | Nurse: Lots hidden, revenue card hidden, no New Prescription btn   | [x] Fixed                 |
| 9.2.6 | Receptionist: Lots hidden, revenue card hidden                     | [x] Fixed                 |
| 9.2.7 | Accountant: Queue hidden, Telemedicine hidden, revenue card hidden | [x] Fixed                 |
| 9.2.8 | Pharmacist: Telemedicine hidden, Lots visible (manages stock)      | [x] Fixed                 |

### 9.3 Dashboard — Role-Filtered Quick Actions

| #     | Item                                                             | Status                           |
| ----- | ---------------------------------------------------------------- | -------------------------------- |
| 9.3.1 | "New Appointment" shown only if `APPOINTMENT:CREATE`             | [x] Fixed — `QuickActions.jsx`   |
| 9.3.2 | "Add Patient" shown only if `PATIENT:CREATE`                     | [x] Fixed — `QuickActions.jsx`   |
| 9.3.3 | "Emergency Check-in" shown only if `QUEUE:CREATE`                | [x] Fixed — `QuickActions.jsx`   |
| 9.3.4 | "New Prescription" shown only if `PRESCRIPTION:CREATE`           | [x] Fixed — `QuickActions.jsx`   |
| 9.3.5 | "Generate Report" shown only if `REPORT:READ`                    | [x] Fixed — `QuickActions.jsx`   |
| 9.3.6 | Today Revenue KPI card hidden from nurse/receptionist/pharmacist | [x] Fixed — `dashboard/page.jsx` |

### 9.4 Reports Page — Role-Segmented Content

| #     | Item                                                             | Status                                     |
| ----- | ---------------------------------------------------------------- | ------------------------------------------ |
| 9.4.1 | Revenue tab hidden from nurse, receptionist, pharmacist, manager | [x] Fixed — `reports/page.jsx`             |
| 9.4.2 | Default tab auto-selects first permitted tab per role            | [x] Fixed — `reports/page.jsx`             |
| 9.4.3 | Export CSV buttons hidden from roles without `REPORT:EXPORT`     | [x] Fixed — `reports/page.jsx`             |
| 9.4.4 | Revenue API blocks manager at server level (403)                 | [x] Fixed — `api/reports/revenue/route.js` |

### 9.5 Patient Detail Page — Tab Enforcement

| #     | Item                                                      | Status                                      |
| ----- | --------------------------------------------------------- | ------------------------------------------- |
| 9.5.1 | Tabs filtered by `hasPermission(role, resource, action)`  | [x] Enforced — `patients/[id]/page.jsx:203` |
| 9.5.2 | Clinical Notes tab `doctorOnly: true` enforced            | [x] Enforced — `patients/[id]/page.jsx:213` |
| 9.5.3 | Active tab auto-resets to first visible if current hidden | [x] Enforced — `patients/[id]/page.jsx:228` |

### 9.6 Settings — Non-Admin Role Access

| #     | Item                                                          | Status                             |
| ----- | ------------------------------------------------------------- | ---------------------------------- |
| 9.6.1 | Nurse/Receptionist/Pharmacist redirected from admin-only tabs | [x] Enforced — `settings/page.jsx` |
| 9.6.2 | Manager blocked from all settings (no `SETTINGS:READ`)        | [x] Enforced — `settings/page.jsx` |
| 9.6.3 | Profile tab accessible to all roles with `SETTINGS:READ`      | [x] Enforced — `settings/page.jsx` |

### 9.7 Subscription Page — Role-Based Access

| #     | Item                                                 | Status                                |
| ----- | ---------------------------------------------------- | ------------------------------------- |
| 9.7.1 | Accountant can view subscription details (read-only) | [x] Fixed — `subscription/page.jsx`   |
| 9.7.2 | Upgrade / Cancel buttons hidden for accountant       | [x] Fixed — `subscription/page.jsx`   |
| 9.7.3 | Add-on purchase buttons hidden for accountant        | [x] Fixed — `subscription/page.jsx`   |
| 9.7.4 | `viewOnly` i18n key added (en, ar, fr, es)           | [x] Fixed — `lib/i18n/locales/*.json` |

### 9.8 API Security — Server-Side Enforcement

| #     | Item                                                             | Status                                       |
| ----- | ---------------------------------------------------------------- | -------------------------------------------- |
| 9.8.1 | Manager blocked from `/api/reports/revenue` at server level      | [x] Fixed — `api/reports/revenue/route.js`   |
| 9.8.2 | `requirePermission` middleware on all user CRUD routes           | [x] In place — `api/users/route.js`          |
| 9.8.3 | Permission matrix blocks nurse/receptionist from `USER:CREATE`   | [x] Enforced via permission middleware       |
| 9.8.4 | Manager can't call `POST /api/prescriptions/new` (no permission) | [x] Enforced — `PRESCRIPTION:[]` for manager |
| 9.8.5 | Manager can't call `GET /api/staff` (no `USER:READ`)             | [x] Enforced — `USER:[]` for manager         |

---

## 10. COMPLIANCE & SESSION MANAGEMENT

| #     | Item                                                               | Status                                           |
| ----- | ------------------------------------------------------------------ | ------------------------------------------------ |
| 10.1  | 2FA required for `super_admin` and `doctor`                        | [x] `SESSION_CONFIG.require2FA`                  |
| 10.2  | 2FA required for `admin` and `clinic_admin`                        | [x] Fixed — `lib/constants/route-security.js`    |
| 10.3  | Session inactivity timeout (30 min)                                | [x] `SESSION_CONFIG.inactivityTimeout = 1800`    |
| 10.4  | Max concurrent sessions (3 per user)                               | [x] `SESSION_CONFIG.maxConcurrentSessions = 3`   |
| 10.5  | Access token TTL 15 min, refresh token TTL 7 days                  | [x] `SESSION_CONFIG` defined                     |
| 10.6  | Multi-tenant isolation enforced on all routes                      | [x] `TENANT_ISOLATION.enforceOnAllRoutes = true` |
| 10.7  | PHI data classification (`/patients/:id` high, `/invoices` medium) | [x] `DATA_CLASSIFICATION` defined                |
| 10.8  | Audit log retention 7 years (2555 days)                            | [x] `AUDIT_CONFIG.retentionDays = 2555`          |
| 10.9  | Audit always-on for patients, prescriptions, invoices              | [x] `AUDIT_CONFIG.alwaysAudit`                   |
| 10.10 | Rate limiting on login (5/15 min), patients API (1000/hr)          | [x] `RATE_LIMITS` defined                        |
| 10.11 | Account lock after 5 failed login attempts (30 min)                | [x] Enforced — `auth.service.js`                 |
| 10.12 | Remember-me extends refresh token to 30 days                       | [x] Enforced — `auth.service.js`                 |

---

## 11. PRESCRIPTIONS MODULE

### 11.1 Prescriptions List (`/prescriptions`)

| #      | Item                                  | Status          |
| ------ | ------------------------------------- | --------------- |
| 11.1.1 | All prescriptions list                | [x] Implemented |
| 11.1.2 | Filter by date range, patient, status | [ ] Verify      |
| 11.1.3 | Search prescriptions                  | [ ] Verify      |
| 11.1.4 | Pagination                            | [x] Implemented |

### 11.2 New Prescription (`/prescriptions/new`)

| #      | Item                                              | Status          |
| ------ | ------------------------------------------------- | --------------- |
| 11.2.1 | Patient selection                                 | [x] Implemented |
| 11.2.2 | Add medicines with dosage, frequency, duration    | [x] Implemented |
| 11.2.3 | Add diagnosis / notes                             | [x] Implemented |
| 11.2.4 | Template selection (pre-fill from note-templates) | [ ] Verify      |
| 11.2.5 | Save prescription                                 | [x] Implemented |
| 11.2.6 | Role guard: only doctor/clinic_admin/admin        | [ ] Verify      |

### 11.3 Prescription Detail (`/prescriptions/[id]`)

| #      | Item                                             | Status          |
| ------ | ------------------------------------------------ | --------------- |
| 11.3.1 | View full prescription detail                    | [x] Implemented |
| 11.3.2 | Edit prescription (`/prescriptions/[id]/edit`)   | [x] Implemented |
| 11.3.3 | Print prescription (`/prescriptions/[id]/print`) | [x] Implemented |
| 11.3.4 | Prescription status display                      | [ ] Verify      |
| 11.3.5 | Linked patient / appointment                     | [ ] Verify      |

---

## 12. QUEUE MANAGEMENT

### 12.1 Queue Page (`/queue`)

| #      | Item                                               | Status                                                |
| ------ | -------------------------------------------------- | ----------------------------------------------------- |
| 12.1.1 | Live queue list (patients waiting)                 | [x] Implemented                                       |
| 12.1.2 | Add patient to queue (Emergency Check-in)          | [x] Implemented                                       |
| 12.1.3 | Update queue status (Waiting → In Progress → Done) | [x] Implemented                                       |
| 12.1.4 | Remove from queue                                  | [x] Implemented                                       |
| 12.1.5 | Queue position / estimated wait time               | [ ] Verify                                            |
| 12.1.6 | Real-time updates (polling or websocket)           | [ ] Verify                                            |
| 12.1.7 | Filter by status                                   | [ ] Verify                                            |
| 12.1.8 | Role guard: QUEUE:READ permission required         | [x] Fixed — `Sidebar.jsx`, `permissions/constants.js` |

---

## 13. TELEMEDICINE MODULE

### 13.1 Telemedicine List (`/telemedicine`)

| #      | Item                                              | Status          |
| ------ | ------------------------------------------------- | --------------- |
| 13.1.1 | All telemedicine sessions list                    | [x] Implemented |
| 13.1.2 | Start new session button                          | [x] Implemented |
| 13.1.3 | Filter by status, date                            | [ ] Verify      |
| 13.1.4 | Feature flag guard: telemedicine feature required | [x] Implemented |

### 13.2 Telemedicine Session (`/telemedicine/[id]`)

| #       | Item                                         | Status          |
| ------- | -------------------------------------------- | --------------- |
| 13.2.1  | Video call (WebRTC / SimplePeer)             | [x] Implemented |
| 13.2.2  | Audio controls (mute/unmute)                 | [x] Implemented |
| 13.2.3  | Video controls (camera on/off)               | [x] Implemented |
| 13.2.4  | Screen sharing                               | [x] Implemented |
| 13.2.5  | In-call chat (text messages)                 | [x] Implemented |
| 13.2.6  | File sharing during session                  | [x] Implemented |
| 13.2.7  | Session recording toggle                     | [x] Implemented |
| 13.2.8  | End call / leave session                     | [x] Implemented |
| 13.2.9  | Waiting room for patient before doctor joins | [ ] Verify      |
| 13.2.10 | Connection quality indicator                 | [ ] Verify      |
| 13.2.11 | Reconnect on disconnect                      | [ ] Verify      |

### 13.3 Session Summary (`/telemedicine/[id]/summary`)

| #      | Item                                    | Status          |
| ------ | --------------------------------------- | --------------- |
| 13.3.1 | Session duration display                | [x] Implemented |
| 13.3.2 | Prescription generated during session   | [ ] Verify      |
| 13.3.3 | Notes from session                      | [ ] Verify      |
| 13.3.4 | Follow-up appointment scheduling        | [ ] Verify      |
| 13.3.5 | Session recording download (if enabled) | [ ] Verify      |

---

## 14. LAB MANAGEMENT

### 14.1 Lab Tests (`/api/lab-tests`)

| #      | Item                              | Status                           |
| ------ | --------------------------------- | -------------------------------- |
| 14.1.1 | List all available lab test types | [x] `GET /api/lab-tests`         |
| 14.1.2 | Create new lab test type          | [x] `POST /api/lab-tests`        |
| 14.1.3 | Update lab test                   | [x] `PUT /api/lab-tests/[id]`    |
| 14.1.4 | Delete lab test                   | [x] `DELETE /api/lab-tests/[id]` |

### 14.2 Lab Orders (`/api/lab-orders`)

| #      | Item                                                  | Status                            |
| ------ | ----------------------------------------------------- | --------------------------------- |
| 14.2.1 | Create lab order for patient                          | [x] `POST /api/lab-orders`        |
| 14.2.2 | List lab orders (filtered by patient/date)            | [x] `GET /api/lab-orders`         |
| 14.2.3 | View lab order detail                                 | [x] `GET /api/lab-orders/[id]`    |
| 14.2.4 | Update lab order                                      | [x] `PUT /api/lab-orders/[id]`    |
| 14.2.5 | Delete lab order                                      | [x] `DELETE /api/lab-orders/[id]` |
| 14.2.6 | Add results to order (`/api/lab-orders/[id]/results`) | [x] Implemented                   |
| 14.2.7 | Lab orders tab in patient detail page                 | [ ] Verify                        |

### 14.3 Lab Results (`/api/lab-results`)

| #      | Item                                               | Status                          |
| ------ | -------------------------------------------------- | ------------------------------- |
| 14.3.1 | List lab results                                   | [x] `GET /api/lab-results`      |
| 14.3.2 | Create lab result entry                            | [x] `POST /api/lab-results`     |
| 14.3.3 | View lab result detail                             | [x] `GET /api/lab-results/[id]` |
| 14.3.4 | Update lab result                                  | [x] `PUT /api/lab-results/[id]` |
| 14.3.5 | Verify lab result (`/api/lab-results/[id]/verify`) | [x] Implemented                 |
| 14.3.6 | Out-of-range value highlighting                    | [ ] Verify                      |
| 14.3.7 | Lab results tab in patient detail page             | [ ] Verify                      |
| 14.3.8 | Print / export lab report                          | [ ] Verify                      |

---

## 15. CLINICAL NOTES

### 15.1 Clinical Notes APIs

| #      | Item                                                  | Status                                      |
| ------ | ----------------------------------------------------- | ------------------------------------------- |
| 15.1.1 | List clinical notes for patient                       | [x] `GET /api/clinical-notes`               |
| 15.1.2 | Create clinical note                                  | [x] `POST /api/clinical-notes`              |
| 15.1.3 | View clinical note detail                             | [x] `GET /api/clinical-notes/[id]`          |
| 15.1.4 | Update clinical note                                  | [x] `PUT /api/clinical-notes/[id]`          |
| 15.1.5 | Delete clinical note                                  | [x] `DELETE /api/clinical-notes/[id]`       |
| 15.1.6 | Version history (`/api/clinical-notes/[id]/versions`) | [x] Implemented                             |
| 15.1.7 | `doctorOnly: true` tab enforcement in patient page    | [x] Enforced — `patients/[id]/page.jsx:213` |

### 15.2 Note Templates

| #      | Item                                              | Status                                |
| ------ | ------------------------------------------------- | ------------------------------------- |
| 15.2.1 | List note templates                               | [x] `GET /api/note-templates`         |
| 15.2.2 | Create note template                              | [x] `POST /api/note-templates`        |
| 15.2.3 | Update note template                              | [x] `PUT /api/note-templates/[id]`    |
| 15.2.4 | Delete note template                              | [x] `DELETE /api/note-templates/[id]` |
| 15.2.5 | Apply template (`/api/note-templates/[id]/apply`) | [x] Implemented                       |
| 15.2.6 | UI for template selection in clinical notes form  | [ ] Verify                            |

---

## 16. IMAGING / RADIOLOGY

### 16.1 Imaging APIs

| #      | Item                                                   | Status                         |
| ------ | ------------------------------------------------------ | ------------------------------ |
| 16.1.1 | List imaging records for patient                       | [x] `GET /api/imaging`         |
| 16.1.2 | Create imaging record (order)                          | [x] `POST /api/imaging`        |
| 16.1.3 | View imaging detail                                    | [x] `GET /api/imaging/[id]`    |
| 16.1.4 | Update imaging record                                  | [x] `PUT /api/imaging/[id]`    |
| 16.1.5 | Delete imaging record                                  | [x] `DELETE /api/imaging/[id]` |
| 16.1.6 | Add / view imaging report (`/api/imaging/[id]/report`) | [x] Implemented                |
| 16.1.7 | Imaging tab in patient detail page                     | [ ] Verify                     |
| 16.1.8 | DICOM viewer integration                               | [ ] Not implemented            |
| 16.1.9 | Image file upload (X-ray, MRI, CT, etc.)               | [ ] Verify                     |

---

## 17. INSURANCE CLAIMS

### 17.1 Insurance APIs

| #       | Item                                                          | Status                                  |
| ------- | ------------------------------------------------------------- | --------------------------------------- |
| 17.1.1  | List insurance claims                                         | [x] `GET /api/insurance/claims`         |
| 17.1.2  | Create insurance claim                                        | [x] `POST /api/insurance/claims`        |
| 17.1.3  | View claim detail                                             | [x] `GET /api/insurance/claims/[id]`    |
| 17.1.4  | Update claim                                                  | [x] `PUT /api/insurance/claims/[id]`    |
| 17.1.5  | Delete claim                                                  | [x] `DELETE /api/insurance/claims/[id]` |
| 17.1.6  | Update claim status (`/api/insurance/claims/[id]/status`)     | [x] Implemented                         |
| 17.1.7  | Submit claim to insurer (`/api/insurance/claims/[id]/submit`) | [x] Implemented                         |
| 17.1.8  | Verify insurance coverage (`/api/insurance/verify`)           | [x] Implemented                         |
| 17.1.9  | Insurance tab in patient detail page                          | [ ] Verify                              |
| 17.1.10 | Claim status tracking UI                                      | [ ] Verify                              |

---

## 18. DEPARTMENTS

### 18.1 Departments APIs

| #      | Item                                                     | Status                             |
| ------ | -------------------------------------------------------- | ---------------------------------- |
| 18.1.1 | List departments                                         | [x] `GET /api/departments`         |
| 18.1.2 | Create department                                        | [x] `POST /api/departments`        |
| 18.1.3 | View department detail                                   | [x] `GET /api/departments/[id]`    |
| 18.1.4 | Update department                                        | [x] `PUT /api/departments/[id]`    |
| 18.1.5 | Delete department                                        | [x] `DELETE /api/departments/[id]` |
| 18.1.6 | Assign head doctor (`/api/departments/[id]/head-doctor`) | [x] Implemented                    |
| 18.1.7 | Departments management UI in settings                    | [ ] Verify                         |
| 18.1.8 | Department-based appointment routing                     | [ ] Verify                         |

---

## 19. DOCTOR PORTAL

### 19.1 Doctor Profile & Registration

| #      | Item                                              | Status          |
| ------ | ------------------------------------------------- | --------------- |
| 19.1.1 | Doctor registration form (`/doctors/register`)    | [x] Implemented |
| 19.1.2 | Doctor registration API (`/api/doctors/register`) | [x] Implemented |
| 19.1.3 | Doctor profile page (`/doctors/profile`)          | [x] Implemented |
| 19.1.4 | Edit profile (bio, specialties, languages)        | [x] Implemented |
| 19.1.5 | Profile photo upload                              | [ ] Verify      |
| 19.1.6 | Document upload for verification                  | [x] Implemented |
| 19.1.7 | Verification status display                       | [x] Implemented |
| 19.1.8 | Doctor search API (`/api/doctors/search`)         | [x] Implemented |
| 19.1.9 | Doctor by userId (`/api/doctors/user/[userId]`)   | [x] Implemented |

### 19.2 Doctor Schedule & Leaves

| #      | Item                                            | Status          |
| ------ | ----------------------------------------------- | --------------- |
| 19.2.1 | Schedule management page (`/doctors/schedule`)  | [x] Implemented |
| 19.2.2 | Schedule API (`/api/doctors/[id]/schedule`)     | [x] Implemented |
| 19.2.3 | Set available days and time slots               | [x] Implemented |
| 19.2.4 | Available slots API (`/api/appointments/slots`) | [x] Implemented |
| 19.2.5 | Leaves management (`/doctors/[id]/leaves`)      | [x] Implemented |
| 19.2.6 | Leaves API (`/api/doctors/[id]/leaves`)         | [x] Implemented |
| 19.2.7 | Apply for leave (date range + reason)           | [x] Implemented |
| 19.2.8 | Leave approval workflow (admin/clinic_admin)    | [ ] Verify      |
| 19.2.9 | Blocked slots on calendar for approved leaves   | [ ] Verify      |

### 19.3 Doctor Appointments

| #      | Item                                               | Status          |
| ------ | -------------------------------------------------- | --------------- |
| 19.3.1 | Doctor appointments view (`/doctors/appointments`) | [x] Implemented |
| 19.3.2 | Calendar / list view toggle                        | [x] Implemented |
| 19.3.3 | Doctor dashboard data (`/api/doctors/dashboard`)   | [x] Implemented |
| 19.3.4 | Filter appointments by date/status                 | [x] Implemented |
| 19.3.5 | Patient detail access from appointment             | [x] Implemented |

### 19.4 Doctor Analytics & Earnings

| #      | Item                                         | Status          |
| ------ | -------------------------------------------- | --------------- |
| 19.4.1 | Doctor analytics page (`/doctors/analytics`) | [x] Implemented |
| 19.4.2 | Earnings page (`/doctors/earnings`)          | [x] Implemented |
| 19.4.3 | Revenue breakdown by period                  | [x] Implemented |
| 19.4.4 | Patient visit counts                         | [x] Implemented |
| 19.4.5 | Appointment completion rate                  | [ ] Verify      |
| 19.4.6 | Export earnings report                       | [ ] Verify      |

### 19.5 Doctor Messages

| #      | Item                                             | Status          |
| ------ | ------------------------------------------------ | --------------- |
| 19.5.1 | Messages page (`/doctors/messages`)              | [x] Implemented |
| 19.5.2 | Messages API (`/api/messages`)                   | [x] Implemented |
| 19.5.3 | Send message to patient/staff                    | [x] Implemented |
| 19.5.4 | Mark message as read (`/api/messages/[id]/read`) | [x] Implemented |
| 19.5.5 | Message thread view                              | [ ] Verify      |
| 19.5.6 | File attachments in messages                     | [ ] Verify      |

### 19.6 Doctor Reviews

| #      | Item                                      | Status          |
| ------ | ----------------------------------------- | --------------- |
| 19.6.1 | Doctor reviews page (`/doctors/reviews`)  | [x] Implemented |
| 19.6.2 | Reviews API (`/api/doctors/[id]/reviews`) | [x] Implemented |
| 19.6.3 | Rating summary (average, distribution)    | [x] Implemented |
| 19.6.4 | Reply to review                           | [ ] Verify      |
| 19.6.5 | Flag inappropriate review                 | [ ] Verify      |

### 19.7 Doctor Patient Access

| #      | Item                                                    | Status          |
| ------ | ------------------------------------------------------- | --------------- |
| 19.7.1 | Doctor's patient detail view (`/doctors/patients/[id]`) | [x] Implemented |
| 19.7.2 | Doctors list API (`/api/doctors`)                       | [x] Implemented |
| 19.7.3 | Doctor detail API (`/api/doctors/[id]`)                 | [x] Implemented |

---

## 20. CLINIC SETTINGS — EXTENDED

### 20.1 Dynamic Settings Tab (`/settings/[tab]`)

| #      | Item                                       | Status                             |
| ------ | ------------------------------------------ | ---------------------------------- |
| 20.1.1 | Dynamic tab routing `/settings/[tab]`      | [x] Implemented                    |
| 20.1.2 | General settings tab                       | [x] Implemented                    |
| 20.1.3 | Hours / Operating hours tab                | [x] Implemented                    |
| 20.1.4 | Notifications tab                          | [x] Implemented                    |
| 20.1.5 | Password / security tab                    | [x] Implemented                    |
| 20.1.6 | Profile tab (all roles with SETTINGS:READ) | [x] Enforced — `settings/page.jsx` |
| 20.1.7 | Tab access per role enforced               | [x] Enforced — `settings/page.jsx` |

### 20.2 Branding Settings (`/settings/branding`)

| #      | Item                                    | Status          |
| ------ | --------------------------------------- | --------------- |
| 20.2.1 | Clinic logo upload                      | [x] Implemented |
| 20.2.2 | Primary / secondary color customization | [x] Implemented |
| 20.2.3 | Favicon upload                          | [ ] Verify      |
| 20.2.4 | Preview branded UI                      | [ ] Verify      |

### 20.3 White-Label Settings (`/settings/white-label`)

| #      | Item                                           | Status          |
| ------ | ---------------------------------------------- | --------------- |
| 20.3.1 | Custom domain configuration                    | [x] Implemented |
| 20.3.2 | Custom app name                                | [x] Implemented |
| 20.3.3 | Remove "Powered by" branding                   | [x] Implemented |
| 20.3.4 | Custom login page customization                | [ ] Verify      |
| 20.3.5 | White-label feature gated by subscription plan | [x] Implemented |

### 20.4 Locations Settings (`/settings/locations`)

| #      | Item                                          | Status          |
| ------ | --------------------------------------------- | --------------- |
| 20.4.1 | Add clinic location / branch                  | [x] Implemented |
| 20.4.2 | Edit location details (address, phone, hours) | [x] Implemented |
| 20.4.3 | Delete location                               | [x] Implemented |
| 20.4.4 | Set primary location                          | [ ] Verify      |
| 20.4.5 | Map integration for location display          | [ ] Verify      |
| 20.4.6 | Assign staff to location                      | [ ] Verify      |

### 20.5 Create Manager (`/settings/create-manager`)

| #      | Item                                   | Status          |
| ------ | -------------------------------------- | --------------- |
| 20.5.1 | Create manager user form               | [x] Implemented |
| 20.5.2 | Set managerAccess permissions          | [x] Implemented |
| 20.5.3 | Manager limit enforcement (plan-based) | [ ] Verify      |
| 20.5.4 | Invite by email option                 | [ ] Verify      |

---

## 21. AUTHENTICATION FLOWS

### 21.1 Login & Registration

| #      | Item                                     | Status                           |
| ------ | ---------------------------------------- | -------------------------------- |
| 21.1.1 | Login page (`/login`)                    | [x] Implemented                  |
| 21.1.2 | Login API (`/api/auth/login`)            | [x] Implemented                  |
| 21.1.3 | Registration page (`/register`)          | [x] Implemented                  |
| 21.1.4 | Registration API (`/api/auth/register`)  | [x] Implemented                  |
| 21.1.5 | Try-for-free page (`/try-for-free`)      | [x] Implemented                  |
| 21.1.6 | Remember-me (extends refresh to 30 days) | [x] Enforced — `auth.service.js` |
| 21.1.7 | Logout API (`/api/auth/logout`)          | [x] Implemented                  |
| 21.1.8 | Current user (`/api/auth/me`)            | [x] Implemented                  |
| 21.1.9 | Token refresh (`/api/auth/refresh`)      | [x] Implemented                  |

### 21.2 Password Management

| #      | Item                                              | Status          |
| ------ | ------------------------------------------------- | --------------- |
| 21.2.1 | Forgot password page (`/forgot-password`)         | [x] Implemented |
| 21.2.2 | Forgot password API (`/api/auth/forgot-password`) | [x] Implemented |
| 21.2.3 | Reset password API (`/api/auth/reset-password`)   | [x] Implemented |
| 21.2.4 | Change password page (`/change-password`)         | [x] Implemented |
| 21.2.5 | Change password API (`/api/auth/change-password`) | [x] Implemented |
| 21.2.6 | Password strength validation                      | [ ] Verify      |
| 21.2.7 | Password expiry enforcement                       | [ ] Verify      |

### 21.3 Two-Factor Authentication (2FA)

| #      | Item                                                      | Status                                     |
| ------ | --------------------------------------------------------- | ------------------------------------------ |
| 21.3.1 | 2FA setup API (`/api/auth/2fa/setup`)                     | [x] Implemented                            |
| 21.3.2 | 2FA verify API (`/api/auth/2fa/verify`)                   | [x] Implemented                            |
| 21.3.3 | 2FA disable API (`/api/auth/2fa/disable`)                 | [x] Implemented                            |
| 21.3.4 | Verify 2FA on login (`/api/auth/verify-2fa`)              | [x] Implemented                            |
| 21.3.5 | QR code generation for authenticator app                  | [x] Implemented                            |
| 21.3.6 | Backup / recovery codes                                   | [ ] Verify                                 |
| 21.3.7 | 2FA required for super_admin, doctor, admin, clinic_admin | [x] `SESSION_CONFIG.require2FA`            |
| 21.3.8 | 2FA toggle in profile settings UI                         | [ ] Verify (schema has `twoFactorEnabled`) |

### 21.4 Magic Link & OAuth

| #      | Item                                                | Status          |
| ------ | --------------------------------------------------- | --------------- |
| 21.4.1 | Magic link login (`/api/auth/magic-link`)           | [x] Implemented |
| 21.4.2 | Google OAuth initiation (`/api/auth/oauth/google`)  | [x] Implemented |
| 21.4.3 | OAuth callback handler (`/api/auth/oauth/callback`) | [x] Implemented |
| 21.4.4 | OAuth account linking (existing user)               | [ ] Verify      |
| 21.4.5 | OAuth profile sync (avatar, name)                   | [ ] Verify      |

### 21.5 Device & Session Management

| #      | Item                                       | Status                                         |
| ------ | ------------------------------------------ | ---------------------------------------------- |
| 21.5.1 | List trusted devices (`/api/auth/devices`) | [x] Implemented                                |
| 21.5.2 | Remove trusted device                      | [x] Implemented                                |
| 21.5.3 | Max concurrent sessions: 3                 | [x] `SESSION_CONFIG.maxConcurrentSessions = 3` |
| 21.5.4 | Inactivity timeout: 30 min                 | [x] `SESSION_CONFIG.inactivityTimeout = 1800`  |
| 21.5.5 | Session revocation on password change      | [ ] Verify                                     |
| 21.5.6 | Login history view in profile settings     | [ ] Verify                                     |

---

## 22. PAYMENT HISTORY & BILLING

### 22.1 Payment History (`/payment-history`)

| #      | Item                                      | Status          |
| ------ | ----------------------------------------- | --------------- |
| 22.1.1 | Payment history list page                 | [x] Implemented |
| 22.1.2 | View invoice details per payment          | [x] Implemented |
| 22.1.3 | Filter by date range / status             | [ ] Verify      |
| 22.1.4 | Download invoice PDF                      | [ ] Verify      |
| 22.1.5 | Invoice detail API (`/api/invoices/[id]`) | [x] Implemented |

### 22.2 Subscription Management (`/subscription`)

| #      | Item                                                                    | Status                                           |
| ------ | ----------------------------------------------------------------------- | ------------------------------------------------ |
| 22.2.1 | Current plan & features display                                         | [x] Implemented                                  |
| 22.2.2 | Plan comparison modal                                                   | [x] `COMPARISON_TABLE_ROWS` in subscription page |
| 22.2.3 | Upgrade / switch plan                                                   | [x] Implemented                                  |
| 22.2.4 | Cancel subscription (`/subscription/cancel`)                            | [x] Implemented                                  |
| 22.2.5 | Reactivate cancelled subscription                                       | [x] Implemented                                  |
| 22.2.6 | PayPal return handler (`/subscription/return`)                          | [x] Implemented                                  |
| 22.2.7 | Add-ons purchase                                                        | [x] Implemented                                  |
| 22.2.8 | Create PayPal plan (`/api/admin/subscription-plans/create-paypal-plan`) | [x] Implemented                                  |
| 22.2.9 | Accountant: view-only mode (no upgrade/cancel)                          | [x] Fixed — `subscription/page.jsx`              |

---

## 23. GDPR COMPLIANCE

| #    | Item                                         | Status          |
| ---- | -------------------------------------------- | --------------- |
| 23.1 | Export personal data (`/api/gdpr/export`)    | [x] Implemented |
| 23.2 | Anonymize data (`/api/gdpr/anonymize`)       | [x] Implemented |
| 23.3 | Delete personal data (`/api/gdpr/delete`)    | [x] Implemented |
| 23.4 | Rectify / correct data (`/api/gdpr/rectify`) | [x] Implemented |
| 23.5 | Data export in standard format (JSON/CSV)    | [ ] Verify      |
| 23.6 | Consent management (cookie / data consent)   | [ ] Verify      |
| 23.7 | Right-to-be-forgotten workflow               | [ ] Verify      |
| 23.8 | GDPR request audit trail                     | [ ] Verify      |

---

## 24. MOBILE API SUPPORT

| #    | Item                                                        | Status          |
| ---- | ----------------------------------------------------------- | --------------- |
| 24.1 | Upcoming appointments (`/api/mobile/appointments/upcoming`) | [x] Implemented |
| 24.2 | Device registration (`/api/mobile/devices`)                 | [x] Implemented |
| 24.3 | Recent prescriptions (`/api/mobile/prescriptions/recent`)   | [x] Implemented |
| 24.4 | Data sync (`/api/mobile/sync`)                              | [x] Implemented |
| 24.5 | Push notification support for mobile                        | [ ] Verify      |
| 24.6 | Offline sync conflict resolution                            | [ ] Verify      |
| 24.7 | Mobile-specific JWT token handling                          | [ ] Verify      |

---

## 25. PWA / OFFLINE SUPPORT

| #    | Item                                                        | Status                            |
| ---- | ----------------------------------------------------------- | --------------------------------- |
| 25.1 | Service worker (`public/sw.js`)                             | [x] Implemented                   |
| 25.2 | Offline banner when connection lost                         | [x] `OfflineBanner` component     |
| 25.3 | Replay pending actions on reconnect                         | [x] `OfflineReplay.jsx` component |
| 25.4 | Chunk recovery on load failure (`public/chunk-recovery.js`) | [x] Implemented                   |
| 25.5 | App installable (manifest.json / PWA manifest)              | [ ] Verify                        |
| 25.6 | Background sync for form submissions                        | [ ] Verify                        |
| 25.7 | Cache-first strategy for static assets                      | [ ] Verify                        |
| 25.8 | Offline fallback page                                       | [ ] Verify                        |

---

## 26. i18n / MULTI-LANGUAGE SUPPORT

| #     | Item                                               | Status                                |
| ----- | -------------------------------------------------- | ------------------------------------- |
| 26.1  | i18n context provider (`contexts/I18nContext.jsx`) | [x] Implemented                       |
| 26.2  | English locale (`lib/i18n/locales/en.json`)        | [x] Implemented                       |
| 26.3  | Arabic locale (`lib/i18n/locales/ar.json`)         | [x] Implemented                       |
| 26.4  | French locale (`lib/i18n/locales/fr.json`)         | [x] Implemented                       |
| 26.5  | Spanish locale (`lib/i18n/locales/es.json`)        | [x] Implemented                       |
| 26.6  | Language switcher UI in settings / header          | [ ] Verify                            |
| 26.7  | RTL layout support for Arabic                      | [ ] Verify                            |
| 26.8  | Date / number format per locale                    | [ ] Verify                            |
| 26.9  | `viewOnly` translation key added (en/ar/fr/es)     | [x] Fixed — `lib/i18n/locales/*.json` |
| 26.10 | All UI strings covered by translation keys         | [ ] Verify                            |

---

## 27. NOTIFICATIONS & TEMPLATES

### 27.1 Notifications

| #      | Item                                                 | Status          |
| ------ | ---------------------------------------------------- | --------------- |
| 27.1.1 | Notification list API (`/api/notifications`)         | [x] Implemented |
| 27.1.2 | Single notification (`/api/notifications/[id]`)      | [x] Implemented |
| 27.1.3 | Mark single as read (`/api/notifications/[id]/read`) | [x] Implemented |
| 27.1.4 | Mark all as read (`/api/notifications/read-all`)     | [x] Implemented |
| 27.1.5 | Real-time notification delivery (polling / WS)       | [ ] Verify      |
| 27.1.6 | Notification types (info, warning, success, error)   | [ ] Verify      |
| 27.1.7 | Email / SMS notification dispatch                    | [ ] Verify      |

### 27.2 Notification Templates

| #      | Item                                                        | Status                                        |
| ------ | ----------------------------------------------------------- | --------------------------------------------- |
| 27.2.1 | List notification templates (`/api/notification-templates`) | [x] Implemented                               |
| 27.2.2 | Create template                                             | [x] `POST /api/notification-templates`        |
| 27.2.3 | Update template                                             | [x] `PUT /api/notification-templates/[id]`    |
| 27.2.4 | Delete template                                             | [x] `DELETE /api/notification-templates/[id]` |
| 27.2.5 | Apply template (`/api/notification-templates/[id]/apply`)   | [x] Implemented                               |
| 27.2.6 | Template variable substitution                              | [ ] Verify                                    |
| 27.2.7 | Template management UI in admin settings                    | [ ] Verify                                    |

---

## 28. MESSAGES MODULE

| #    | Item                                             | Status          |
| ---- | ------------------------------------------------ | --------------- |
| 28.1 | Send / receive messages (`/api/messages`)        | [x] Implemented |
| 28.2 | Mark message as read (`/api/messages/[id]/read`) | [x] Implemented |
| 28.3 | Messages UI (`/doctors/messages`)                | [x] Implemented |
| 28.4 | Conversation threading                           | [ ] Verify      |
| 28.5 | File attachments in messages                     | [ ] Verify      |
| 28.6 | Unread message count badge                       | [ ] Verify      |
| 28.7 | Search messages                                  | [ ] Verify      |

---

## 29. EXTERNAL INTEGRATIONS

### 29.1 Payment Gateways

| #      | Item                                      | Status                       |
| ------ | ----------------------------------------- | ---------------------------- |
| 29.1.1 | Stripe integration (payment processing)   | [x] Implemented              |
| 29.1.2 | PayPal subscription integration           | [x] Implemented              |
| 29.1.3 | PayPal plan creation for subscriptions    | [x] `create-paypal-plan` API |
| 29.1.4 | Webhook handling (Stripe / PayPal events) | [ ] Verify                   |
| 29.1.5 | Payment failure retry logic               | [ ] Verify                   |
| 29.1.6 | Refund processing                         | [ ] Verify                   |

### 29.2 Communication

| #      | Item                                     | Status                                     |
| ------ | ---------------------------------------- | ------------------------------------------ |
| 29.2.1 | Twilio SMS integration                   | [ ] Verify (admin settings email-sms page) |
| 29.2.2 | Email via SMTP / provider (SendGrid/SES) | [ ] Verify (admin settings email-sms page) |
| 29.2.3 | WebRTC for telemedicine (SimplePeer)     | [x] Implemented                            |
| 29.2.4 | Push notifications (web push API)        | [ ] Verify                                 |

### 29.3 Infrastructure

| #      | Item                                                | Status          |
| ------ | --------------------------------------------------- | --------------- |
| 29.3.1 | Elasticsearch for search indexing                   | [ ] Verify      |
| 29.3.2 | Redis for caching and rate limiting                 | [ ] Verify      |
| 29.3.3 | Health check endpoint (`/api/health`)               | [x] Implemented |
| 29.3.4 | Batch API endpoint (`/api/batch`)                   | [x] Implemented |
| 29.3.5 | IP whitelist management (`/api/admin/ip-whitelist`) | [x] Implemented |
| 29.3.6 | Feature flags API (`/api/features`)                 | [x] Implemented |

---

## 30. PUBLIC / MARKETING PAGES

| #     | Item                                      | Status          |
| ----- | ----------------------------------------- | --------------- |
| 30.1  | Landing / home page (`/`)                 | [x] Implemented |
| 30.2  | About page (`/about`)                     | [x] Implemented |
| 30.3  | Pricing page (`/pricing`)                 | [x] Implemented |
| 30.4  | Contact page (`/contact`)                 | [x] Implemented |
| 30.5  | Blog list page (`/blog`)                  | [x] Implemented |
| 30.6  | Blog detail page (`/blog/[slug]`)         | [x] Implemented |
| 30.7  | Privacy policy page (`/privacy`)          | [x] Implemented |
| 30.8  | Terms of service page (`/terms`)          | [x] Implemented |
| 30.9  | Legal page (`/legal`)                     | [x] Implemented |
| 30.10 | Support hub (`/support`)                  | [x] Implemented |
| 30.11 | Support contact form (`/support/contact`) | [x] Implemented |
| 30.12 | API documentation page (`/api-docs`)      | [x] Implemented |
| 30.13 | SEO meta tags on all public pages         | [ ] Verify      |
| 30.14 | Sitemap generation                        | [ ] Verify      |
| 30.15 | Open Graph / social share meta tags       | [ ] Verify      |

---

## 31. KEYBOARD SHORTCUTS

| #    | Item                                                                | Status          |
| ---- | ------------------------------------------------------------------- | --------------- |
| 31.1 | Global keyboard shortcuts hook (`hooks/useAppKeyboardShortcuts.js`) | [x] Implemented |
| 31.2 | Navigation shortcuts (dashboard, patients, appointments, etc.)      | [ ] Verify      |
| 31.3 | Shortcut hint display (tooltip / modal)                             | [ ] Verify      |
| 31.4 | Conflict prevention with browser shortcuts                          | [ ] Verify      |
| 31.5 | No interaction requires keyboard shortcut only (accessibility)      | [ ] Verify      |

---

## 32. SYSTEM / UTILITY APIS

| #     | Item                                                              | Status          |
| ----- | ----------------------------------------------------------------- | --------------- |
| 32.1  | Health check (`/api/health`)                                      | [x] Implemented |
| 32.2  | Batch requests (`/api/batch`)                                     | [x] Implemented |
| 32.3  | Feature flags (`/api/features`)                                   | [x] Implemented |
| 32.4  | IP whitelist (`/api/admin/ip-whitelist`)                          | [x] Implemented |
| 32.5  | Admin general settings (`/api/admin/settings/general`)            | [x] Implemented |
| 32.6  | Admin security settings (`/api/admin/settings/security`)          | [x] Implemented |
| 32.7  | Inventory suppliers (`/api/inventory/suppliers`)                  | [x] Implemented |
| 32.8  | Inventory batches CRUD (`/api/inventory/batches`)                 | [x] Implemented |
| 32.9  | Inventory batch quantity (`/api/inventory/batches/[id]/quantity`) | [x] Implemented |
| 32.10 | Inventory transactions log (`/api/inventory/transactions`)        | [x] Implemented |
| 32.11 | Dashboard tab cache (`lib/dashboard-tab-cache.js`)                | [x] Implemented |
| 32.12 | Error boundary component (`components/ErrorBoundary.jsx`)         | [x] Implemented |
| 32.13 | Global error page (`app/global-error.jsx`)                        | [x] Implemented |
| 32.14 | Subscription overlay (`components/ui/SubscriptionOverlay.jsx`)    | [x] Implemented |
| 32.15 | Specialties API (`/api/admin/specialties`)                        | [x] Implemented |
| 32.16 | Subscription plans API (`/api/admin/subscription-plans`)          | [x] Implemented |
