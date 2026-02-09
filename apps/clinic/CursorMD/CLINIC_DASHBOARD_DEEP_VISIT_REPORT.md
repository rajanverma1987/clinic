# Cursor AI Prompt: Clinic Dashboard System (Doctor + Admin Only)

## 🎯 Project Overview

Build a comprehensive **internal clinic management dashboard** with two portals: **Doctor Dashboard** and **Admin Dashboard**. This is NOT a public platform - it's for clinic staff only. Doctors can add patients from their accounts, and there's one Super Admin.

---

## 🏗️ Architecture

### Two-Portal System

```
┌─────────────────────────────────────────────────────────┐
│              CLINIC MANAGEMENT PLATFORM                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────────┐      ┌───────────────────┐      │
│  │  DOCTOR DASHBOARD │      │  ADMIN DASHBOARD  │      │
│  │  (Multiple Users) │      │  (Super Admin)    │      │
│  └───────────────────┘      └───────────────────┘      │
│            │                          │                 │
│            └──────────┬───────────────┘                 │
│                       │                                 │
│              ┌────────▼────────┐                        │
│              │  SHARED LAYER   │                        │
│              │  - Components   │                        │
│              │  - State Mgmt   │                        │
│              │  - API Client   │                        │
│              └─────────────────┘                        │
│                       │                                 │
│              ┌────────▼────────┐                        │
│              │  BACKEND API    │                        │
│              │  - Auth/RBAC    │                        │
│              │  - Business     │                        │
│              │  - Database     │                        │
│              └─────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

### User Roles

1. **Doctor** - Can manage patients, appointments, prescriptions, schedule
2. **Staff** - Added by doctor, limited permissions
3. **Super Admin** - Full system access, doctor verification, analytics

---

## 👨‍⚕️ DOCTOR DASHBOARD

### Layout Structure

```
┌────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ [ClinicLogo] Dr. Name | [Search] [🔔] [💬] [👤]       │
├────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────────────────────────────────┐│
│ │ SIDEBAR  │  │     MAIN CONTENT AREA                ││
│ │          │  │                                       ││
│ │Dashboard │  │  [Stats Cards Row]                   ││
│ │Schedule  │  │  [Today's Schedule]                  ││
│ │Patients  │  │  [Quick Actions]                     ││
│ │Records   │  │  [Recent Activity]                   ││
│ │Prescribe │  │                                       ││
│ │Calendar  │  │                                       ││
│ │Staff     │  │                                       ││
│ │Settings  │  │                                       ││
│ └──────────┘  └──────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
```

### 1. Doctor Dashboard Home

**Requirements:**

- Welcome banner: "Welcome back, Dr. [Name]" + current date
- 8 KPI stat cards (2 rows of 4):
  - Today's Appointments (with pending count)
  - This Week Appointments
  - This Month Appointments (with % growth)
  - Monthly Earnings (with $ change)
  - Average Rating (⭐ with review count)
  - Total Active Patients (with new count)
  - Video Calls This Month
  - Current Queue / Waiting Patients

**Today's Schedule Section:**

- Show appointments chronologically
- Highlight current/in-progress appointment
- Each appointment card shows:
  - Time + Patient name + Age/Gender
  - Contact info (phone, email)
  - Visit type (New/Follow-up/Video)
  - Chief complaint
  - Action buttons: [View History] [Start Consultation] [Reschedule] [Cancel]
  - For current: Show timer "Started X mins ago"
- [Add Emergency Slot] button at bottom

**Pending Actions Widget:**

- Lab reports to review (count)
- New patient messages (count)
- Prescriptions to approve
- [View All] link

**Recent Activity Feed:**

- Last 5 actions with timestamps
- "Prescription sent to John Doe (5 mins ago)"
- "Completed consultation with Jane Smith (1 hour ago)"

### 2. Patient Management

**Patient List View:**

- Search bar with filters: [All] [Active] [New] [Inactive]
- Sort options: Last Visit, Name, Date Added
- [+ Add Patient] button (primary action)
- Display count: "342 total patients, showing 10"

**Each Patient Card:**

```
┌─────────────────────────────────────────────┐
│ 👤 John Doe, 32M                            │
│ 📞 +1-234-567-8900 | john@email.com         │
│                                              │
│ Last Visit: Today, 9:00 AM                  │
│ Total Visits: 12                            │
│                                              │
│ Current Conditions:                         │
│ • Hypertension (controlled)                 │
│ • Type 2 Diabetes                           │
│                                              │
│ Active Prescriptions: 3                     │
│ Allergies: Penicillin ⚠️                    │
│ Last Lab: Jan 20, 2026                      │
│                                              │
│ [View Record] [Book Appointment] [Message]  │
│ [Add Notes]                                 │
└─────────────────────────────────────────────┘
```

### 3. Patient Detail View (EHR)

**Tabs:** Timeline | Vitals | Prescriptions | Lab Results | Imaging | Allergies | Conditions | Notes

**Demographics Section:**

- Age, Gender, DOB
- Contact: Phone, Email, Address
- Emergency Contact
- Insurance details
- Blood Type
- Height, Weight, BMI

**Timeline View (Primary):**
Show chronological medical history:

```
┌─────────────────────────────────────────────┐
│ TODAY - Jan 28, 2026 - 10:00 AM            │
│ 📋 CONSULTATION (Scheduled)                │
│ Chief Complaint: Follow-up - Hypertension  │
│ [Start Consultation]                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Jan 20, 2026 - Lab Results                 │
│ 🧪 BLOOD TEST - Complete Metabolic Panel   │
│                                             │
│ Key Results:                                │
│ ✓ Glucose: 105 mg/dL [Normal]              │
│ ⚠️ LDL Cholesterol: 145 [High]             │
│ ✓ Blood Pressure: 128/82 mmHg              │
│                                             │
│ Doctor Notes: "BP slightly elevated..."    │
│                                             │
│ [View Full] [View Trends] [Order Retest]   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Jan 14, 2026 - 10:00 AM                    │
│ 📋 CONSULTATION (Completed) - 25 minutes   │
│                                             │
│ Chief Complaint: Routine follow-up         │
│                                             │
│ Vitals: BP 132/84 | HR 78 | Temp 98.6°F   │
│                                             │
│ Assessment:                                 │
│ • Hypertension - controlled on meds        │
│ • Type 2 Diabetes - improving              │
│                                             │
│ Plan:                                       │
│ • Continue Lisinopril 10mg daily           │
│ • Continue Metformin 1000mg BID            │
│ • Order lab tests                          │
│ • Follow-up in 2 weeks                     │
│                                             │
│ 💊 Prescription Written                    │
│ 🧪 Lab Orders: HbA1c, Lipid panel          │
│                                             │
│ [View Complete Note] [Edit]                │
└─────────────────────────────────────────────┘
```

### 4. Smart Prescription Creator

**CRITICAL FEATURES:**

- Patient info header showing: Name, Age, Allergies ⚠️, Current Medications
- Real-time drug interaction checking
- Allergy conflict detection
- Clinical decision support alerts

**Form Sections:**

**A. Diagnosis**

```
Primary Diagnosis (ICD-10): [Search/Autocomplete]
Suggestions:
○ I10 - Essential hypertension
○ E11.9 - Type 2 diabetes mellitus

Chief Complaint: [Textbox]
```

**B. Medications** (Repeatable)

```
Medicine 1:
┌─────────────────────────────────────────┐
│ Name: [Lisinopril___________] 🔍       │
│                                         │
│ Autocomplete suggestions:               │
│ • Lisinopril 5mg Tablet                │
│ • Lisinopril 10mg Tablet ✓ (Current)   │
│ • Lisinopril 20mg Tablet               │
└─────────────────────────────────────────┘

Selected: Lisinopril 20mg Tablet
Generic Available: Yes

⚠️ DOSE CHANGE ALERT:
Patient currently on 10mg, prescribing 20mg
Reason for change: [BP control inadequate____]

Dosage: [1] tablet(s)
Frequency: [Once daily ▼]
Route: [Oral ▼]
Duration: [30] days
Quantity: [30] tablets (auto-calculated)

Instructions:
☑ Take with food
☑ Take in the morning
☐ Take at bedtime
☑ Do not skip doses

Custom Instructions:
[Monitor blood pressure weekly_____________]

Refills: [3] refills (Total: 120 days supply)

✓ No drug interactions detected
✓ No allergy conflicts

[+ Add Another Medicine] [Remove Medicine]
```

**C. Clinical Decision Support Alerts**

```
ℹ️ RECOMMENDATION:
Consider potassium monitoring for patients on
ACE inhibitors (Lisinopril)
[Order K+ Level Test]

ℹ️ PREVENTIVE CARE:
Patient due for annual eye exam (diabetic screening)
[Order Ophthalmology Referral]
```

**D. Lab Tests/Investigations**

```
☑ Fasting Blood Glucose
☑ HbA1c
☑ Lipid Panel
☑ Serum Potassium
☐ Liver Function Test
☐ Kidney Function Test

Lab: [Quest Diagnostics ▼]
Priority: [Routine ▼]
```

**E. Advice/Precautions**

```
• Continue low sodium diet (<2000mg/day)
• Regular exercise 30 mins daily
• Monitor blood glucose before meals
• Monitor BP weekly at home
• Avoid grapefruit juice
• Report dizziness or lightheadedness
```

**F. Follow-up**

```
Schedule follow-up in: [2 weeks ▼]
Type: [In-person ▼] [Video] [Phone]
[Auto-schedule appointment]
```

**G. Digital Signature**

```
Dr. Sarah Johnson, MD
Cardiologist
License #: MD123456
Date: Jan 28, 2026 10:45 AM

[Sign Electronically]
```

**Action Buttons:**
[Save as Draft] [Cancel] [Sign & Send to Patient]

### 5. Schedule/Calendar Management

**Weekly Calendar View:**

```
< January 22-28, 2026 >          [Today] [Week] [Month]

Clinic: [City Medical Center ▼] [Add Clinic]

┌─────────────────────────────────────────────┐
│     Mon  Tue  Wed  Thu  Fri  Sat  Sun      │
│09:00 ■    ■    ■    ■    ■    □    □       │
│10:00 ■    ■    ■    ■    ■    ■    □       │
│11:00 ■    □    ■    ■    ■    ■    □       │
│12:00 ─────── LUNCH BREAK ──────────────     │
│13:00 ■    ■    ■    ■    ■    □    □       │
│14:00 ■    ■    ■    ■    ■    □    □       │
│15:00 ■    ■    ■    ■    ■    ■    □       │
│16:00 ■    □    ■    ■    ■    ■    □       │
│17:00 □    □    □    □    □    □    □       │
│                                             │
│ Legend: ■ Booked  □ Available  ⊗ Blocked   │
└─────────────────────────────────────────────┘
```

**Daily Detail View:**

```
TODAY - Wednesday, Jan 28

09:00-09:30  John Doe (New)          In-clinic
             Chief: Chest pain
             [Start] [Reschedule] [Cancel]
─────────────────────────────────────────────
10:00-10:30  Jane Smith (Follow-up)  In-clinic
             Chief: Hypertension follow-up
             [Start] [View History]
─────────────────────────────────────────────
10:30-11:00  Robert J. (New)         Video 🎥
             Chief: Skin rash
             [Join Call] [Cancel]
─────────────────────────────────────────────
11:00-11:30  [BLOCKED] Personal Time ⊗
─────────────────────────────────────────────

[+ Add Emergency Slot] [Block Time] [Set as Unavailable]
```

**Availability Settings:**

```
Working Hours (City Medical Center):

Monday:    [09:00] to [17:00]  [☐ Closed]
Tuesday:   [09:00] to [17:00]  [☐ Closed]
Wednesday: [09:00] to [17:00]  [☐ Closed]
Thursday:  [09:00] to [17:00]  [☐ Closed]
Friday:    [09:00] to [17:00]  [☐ Closed]
Saturday:  [10:00] to [15:00]  [☐ Closed]
Sunday:    [──────────────]    [☑ Closed]

Appointment Duration: [30 mins ▼]
Buffer Between Appointments: [0 mins ▼]
Lunch Break: [12:00] to [13:00]

Video Consultation:
☑ Accept video appointments
Time Slots: Same as in-clinic

Emergency Slots:
☑ Allow emergency bookings
Reserve slots: [2] per day

Advance Booking:
Minimum: [2 hours] before appointment
Maximum: [30 days] in advance

[Save Settings] [Apply to All Clinics]
```

### 6. Staff Management (Doctor can add staff)

**Staff List:**

```
[+ Add Staff Member]

┌─────────────────────────────────────────────┐
│ 👤 Sarah Williams - Nurse                  │
│ 📧 sarah.w@clinic.com | 📞 +1-234-567-8900 │
│                                             │
│ Role: Nurse                                 │
│ Permissions:                                │
│ ✓ View patient records                     │
│ ✓ Schedule appointments                    │
│ ✓ Update vitals                            │
│ ✗ Prescribe medications                    │
│ ✗ Access financial data                    │
│                                             │
│ Status: Active | Added: Jan 15, 2026       │
│                                             │
│ [Edit Permissions] [Deactivate] [Remove]   │
└─────────────────────────────────────────────┘
```

**Add Staff Modal:**

```
Full Name: [________________]
Email: [________________]
Phone: [________________]
Role: [Nurse ▼] [Receptionist] [Medical Assistant]

Permissions:
☑ View patient records
☑ Schedule appointments
☑ Update vitals
☐ Create prescriptions
☐ View financial data
☐ Manage other staff

[Cancel] [Send Invitation]
```

---

## 👑 ADMIN DASHBOARD

### Layout Structure

```
┌────────────────────────────────────────────────────────┐
│ ADMIN PANEL - CLINIC SYSTEM        [🔔] [⚙️] [👤]     │
├────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────────────────────────────────┐│
│ │ SIDEBAR  │  │     MAIN DASHBOARD                   ││
│ │          │  │                                       ││
│ │Dashboard │  │  [Platform KPIs - 8 cards]           ││
│ │Doctors   │  │  [Charts: User Growth | Revenue]     ││
│ │Patients  │  │  [Pending Actions Alert Box]         ││
│ │Appts     │  │  [Popular Specialties | System ]     ││
│ │Finance   │  │                                       ││
│ │Analytics │  │                                       ││
│ │Clinics   │  │                                       ││
│ │Settings  │  │                                       ││
│ │Security  │  │                                       ││
│ └──────────┘  └──────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
```

### 1. Admin Dashboard Home

**Platform Overview KPIs (8 cards):**

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ TOTAL    │ │ VERIFIED │ │ TOTAL    │ │ ACTIVE   │
│ DOCTORS  │ │ DOCTORS  │ │ PATIENTS │ │ PATIENTS │
│          │ │          │ │          │ │          │
│  1,234   │ │  1,189   │ │ 45,678   │ │ 38,456   │
│ +12 today│ │ +5 today │ │+234 today│ │+189 today│
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ TODAY    │ │THIS MONTH│ │ REVENUE  │ │COMMISSION│
│ APPTS    │ │ APPTS    │ │THIS MONTH│ │ EARNED   │
│          │ │          │ │          │ │          │
│   856    │ │ 24,567   │ │$456,789  │ │ $45,679  │
│+45 vs yday│ │ +15% MoM │ │+$45k MoM │ │ +$5k MoM │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Charts Section:**

```
┌─────────────────────┐  ┌─────────────────────┐
│ USER GROWTH         │  │ REVENUE TREND       │
│                     │  │                     │
│  [Line Chart]       │  │  [Line Chart]       │
│                     │  │                     │
│ Patients: 45,678    │  │ Revenue: $456k      │
│ Doctors: 1,234      │  │ Commission: $45k    │
│ (+15% / +8%)        │  │ (+12% / +12%)       │
└─────────────────────┘  └─────────────────────┘
```

**Pending Actions (Alert Box):**

```
┌─────────────────────────────────────────────┐
│ PENDING ACTIONS                   [View All]│
├─────────────────────────────────────────────┤
│ ⚠️ 5 Doctor Verifications Pending           │
│ ⚠️ 12 Flagged Reviews to Moderate           │
│ ⚠️ 3 Payment Disputes                       │
│ ⚠️ 8 Patient Complaints                     │
│ ℹ️ 15 Content Updates Pending Approval      │
└─────────────────────────────────────────────┘
```

**Side Widgets:**

```
┌─────────────────────┐  ┌─────────────────────┐
│ POPULAR SPECIALTIES │  │ SYSTEM HEALTH       │
│                     │  │                     │
│ 1. Cardiology (234) │  │ 🟢 API: 99.9%       │
│ 2. General (189)    │  │ 🟢 Database: Healthy│
│ 3. Dermatology(156) │  │ 🟢 Payment: Active  │
│ 4. Pediatrics (142) │  │ 🟢 Video: Running   │
│ 5. Orthopedics(128) │  │ 🟡 Email: 45 pending│
│                     │  │                     │
│ [View All]          │  │ [View Details]      │
└─────────────────────┘  └─────────────────────┘
```

### 2. Doctor Verification Dashboard

**CRITICAL FEATURE** - This is the most important admin function

**Filters:**

```
Status: [Pending ▼] [Verified] [Rejected] [All]
Sort: [Newest First ▼]
Search: [______________] 🔍
```

**Pending Verification Card (Detailed):**

```
┌─────────────────────────────────────────────────────┐
│ Dr. Michael Chen                      [Priority]    │
│ Cardiologist | 15 years experience                  │
│ Applied: 2 days ago                                 │
│                                                      │
│ 📋 VERIFICATION CHECKLIST:                          │
│ ✓ Personal Information Complete                     │
│ ✓ Medical License Uploaded                          │
│ ⏳ NPI Verification: In Progress                    │
│ ✓ Degree Certificates Uploaded                      │
│ ☐ Background Check: Not Started                     │
│ ✓ Bank Details Provided                             │
│                                                      │
│ 📄 SUBMITTED DOCUMENTS (5):                         │
│ • Medical License (CA) - Exp: 2027                 │
│   [View Document] [Download]                        │
│ • MBBS Certificate - Harvard Medical School         │
│   [View Document] [Download]                        │
│ • MD Cardiology - Johns Hopkins                     │
│   [View Document] [Download]                        │
│ • Driver's License (ID Proof)                       │
│   [View Document] [Download]                        │
│ • Malpractice Insurance Certificate                 │
│   [View Document] [Download]                        │
│                                                      │
│ 🔍 NPI VERIFICATION RESULTS:                        │
│ NPI Number: 1234567890                              │
│ Status: ✓ Active                                    │
│ ✓ Name matches application                          │
│ ✓ Specialty matches (Cardiology)                    │
│ ✓ No disciplinary actions found                     │
│ ⚠️ Manual review recommended:                       │
│    License expiration within 12 months              │
│                                                      │
│ 💬 ADMIN NOTES:                                     │
│ [All documents verified. License expires 2027.      │
│  Recommend conditional approval with re-verify      │
│  notification set for Nov 2026.]                    │
│                                                      │
│ ACTIONS:                                            │
│ [View All Documents] [Run Background Check]         │
│ [✓ Approve] [✗ Reject] [Request More Info]         │
│                                                      │
│ Approval Options:                                   │
│ ○ Full Approval                                     │
│ ● Conditional Approval (with conditions below)      │
│ ☐ Set re-verification date: [Nov 2026]             │
│ ☐ Require malpractice insurance renewal             │
│ ☐ Require additional training certificate           │
│                                                      │
│ Send notification to doctor: ☑                      │
│ [Confirm Approval] [Cancel]                         │
└─────────────────────────────────────────────────────┘
```

**Verification with Issues:**

```
┌─────────────────────────────────────────────────────┐
│ Dr. Sarah Thompson                                   │
│ Dermatologist | 8 years experience                   │
│ Applied: 5 days ago                                  │
│                                                      │
│ ⚠️ ISSUES DETECTED:                                 │
│ • License number doesn't match NPI database         │
│ • Degree certificate image unclear                  │
│ • Missing malpractice insurance                     │
│                                                      │
│ 📧 REQUESTED MORE INFORMATION (3 days ago):         │
│ "Please provide a clearer copy of your medical      │
│  degree and upload your malpractice insurance."     │
│                                                      │
│ Status: Awaiting doctor response...                 │
│ Auto-reject in: 4 days                              │
│                                                      │
│ [View Details] [Send Reminder] [Extend Deadline]    │
│ [Reject Application]                                │
└─────────────────────────────────────────────────────┘
```

**Request More Info Modal:**

```
┌─────────────────────────────────────────────┐
│ Request Additional Information        [X]   │
├─────────────────────────────────────────────┤
│ Doctor: Dr. Sarah Thompson                  │
│                                             │
│ Select missing/unclear items:               │
│ ☑ Medical License                           │
│ ☑ Degree Certificates                       │
│ ☐ NPI Verification                          │
│ ☑ Malpractice Insurance                     │
│ ☐ Background Check                          │
│ ☐ Other (specify)                           │
│                                             │
│ Additional Message:                         │
│ ┌─────────────────────────────────────────┐│
│ │ Please provide clearer copies of your   ││
│ │ medical license and degree certificates.││
│ │ Also upload proof of malpractice        ││
│ │ insurance valid through 2026.           ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Response deadline: [7 days ▼]              │
│ Send email notification: ☑                 │
│ Send SMS notification: ☑                   │
│                                             │
│ [Cancel]  [Send Request]                   │
└─────────────────────────────────────────────┘
```

**Approval Confirmation:**

```
┌─────────────────────────────────────────────┐
│ Approve Doctor Application           [X]   │
├─────────────────────────────────────────────┤
│ Doctor: Dr. Michael Chen                    │
│ Specialty: Cardiology                       │
│                                             │
│ Approval Type:                              │
│ ● Full Approval                             │
│ ○ Conditional Approval                      │
│                                             │
│ Account Status after approval:              │
│ ● Active (can start accepting patients)    │
│ ○ Active with restrictions                 │
│                                             │
│ Initial Permissions:                        │
│ ☑ Accept appointments                       │
│ ☑ Create prescriptions                      │
│ ☑ Access patient records                   │
│ ☑ Generate reports                          │
│ ☑ Add staff members                         │
│                                             │
│ Welcome Email Template:                     │
│ [Standard Welcome ▼]                        │
│                                             │
│ Admin Notes (internal):                     │
│ ┌─────────────────────────────────────────┐│
│ │ All verification complete. Approved on  ││
│ │ Jan 28, 2026. License valid until 2027. ││
│ └─────────────────────────────────────────┘│
│                                             │
│ [Cancel]  [Confirm & Approve]              │
└─────────────────────────────────────────────┘
```

### 3. Patient Management (Admin View)

**Patient List with Advanced Filters:**

```
Search: [________________] 🔍

Filters:
Registration Date: [All Time ▼]
Doctor: [All Doctors ▼]
Status: [Active ▼] [Inactive] [Flagged]
Has Appointments: [Any ▼]

Sort: [Recent Activity ▼]

[Export to CSV] [Generate Report]

Showing 1-20 of 45,678 patients
```

**Patient Card (Admin View):**

```
┌─────────────────────────────────────────────────────┐
│ 👤 Jane Smith, 45F                   ID: PAT-001234 │
│ 📧 jane@email.com | 📞 +1-234-567-8900              │
│                                                      │
│ Primary Doctor: Dr. Sarah Johnson (Cardiologist)    │
│ Registered: Jan 15, 2025 | Last Visit: Jan 28, 2026│
│                                                      │
│ Activity Summary:                                   │
│ • Total Appointments: 24 (18 completed, 6 upcoming) │
│ • Total Spent: $3,450                               │
│ • Active Prescriptions: 3                           │
│ • Lab Tests: 12                                     │
│                                                      │
│ Flags: None                                         │
│                                                      │
│ [View Full Record] [Activity Log] [Send Message]    │
│ [Flag Account] [Deactivate]                         │
└─────────────────────────────────────────────────────┘
```

### 4. Appointments Management

**Appointment List:**

```
Filters:
Date Range: [Last 30 days ▼]
Status: [All ▼] [Scheduled] [Completed] [Cancelled] [No-show]
Doctor: [All Doctors ▼]
Type: [All ▼] [In-clinic] [Video]

Statistics:
Total: 24,567 | Completed: 20,345 | Cancelled: 892 | No-show: 234

[Export Report] [Schedule Analysis]
```

**Appointment Card:**

```
┌─────────────────────────────────────────────────────┐
│ APT-789456 | Jan 28, 2026 - 10:00 AM   [Completed] │
│                                                      │
│ Patient: Jane Smith (45F)                           │
│ Doctor: Dr. Sarah Johnson (Cardiologist)            │
│ Type: In-clinic                                     │
│                                                      │
│ Duration: 25 minutes                                │
│ Fee: $150 (Paid ✓)                                  │
│                                                      │
│ Chief Complaint: Follow-up - Hypertension           │
│                                                      │
│ Outcome:                                            │
│ ✓ Prescription issued                               │
│ ✓ Lab tests ordered                                 │
│ ✓ Follow-up scheduled (Feb 11, 2026)                │
│                                                      │
│ [View Details] [Download Report]                    │
└─────────────────────────────────────────────────────┘
```

### 5. Financial Dashboard

**Revenue Overview:**

```
Period: [This Month ▼]

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ TOTAL    │ │ COLLECTED│ │ PENDING  │ │ REFUNDED │
│ REVENUE  │ │          │ │          │ │          │
│          │ │          │ │          │ │          │
│$456,789  │ │$420,123  │ │ $32,456  │ │ $4,210   │
│ +12% MoM │ │ +10% MoM │ │ +5% MoM  │ │ -2% MoM  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

Revenue Breakdown:
┌─────────────────────────────────────────────────────┐
│ Consultations: $320,450 (70%)  [████████████░░░]   │
│ Lab Tests: $89,234 (19.5%)     [███░░░░░░░░░░░░]   │
│ Prescriptions: $32,105 (7%)    [█░░░░░░░░░░░░░░]   │
│ Others: $15,000 (3.5%)         [░░░░░░░░░░░░░░░]   │
└─────────────────────────────────────────────────────┘

[Revenue Trends Chart - Line graph over 12 months]

Top Earning Doctors:
1. Dr. Sarah Johnson - $45,678 (234 appointments)
2. Dr. Michael Chen - $38,234 (189 appointments)
3. Dr. Emma Wilson - $32,456 (156 appointments)

[View Detailed Financial Report]
```

**Payment Disputes:**

```
┌─────────────────────────────────────────────────────┐
│ PAYMENT DISPUTE #PD-001234           [Open]        │
│                                                      │
│ Patient: John Doe                                   │
│ Doctor: Dr. Sarah Johnson                           │
│ Amount: $150                                        │
│ Date: Jan 25, 2026                                  │
│                                                      │
│ Reason: "Charged twice for same appointment"        │
│                                                      │
│ Evidence:                                           │
│ • Transaction ID: TXN-98765 ($150 - Jan 25)         │
│ • Transaction ID: TXN-98766 ($150 - Jan 25)         │
│                                                      │
│ Admin Review:                                       │
│ ┌───────────────────────────────────────────────┐  │
│ │ Confirmed duplicate charge. Issue refund for  │  │
│ │ TXN-98766. Update payment gateway logic.      │  │
│ └───────────────────────────────────────────────┘  │
│                                                      │
│ [Issue Refund] [Contact Patient] [Escalate]        │
│ [Mark Resolved] [Close Dispute]                    │
└─────────────────────────────────────────────────────┘
```

### 6. Analytics Dashboard

**Key Metrics:**

```
[Date Range Selector: Last 30 days ▼]

Platform Growth:
┌─────────────────────────────────────────────────────┐
│ [Line Chart - Dual Axis]                            │
│ - Patients (left axis)                              │
│ - Doctors (left axis)                               │
│ - Revenue (right axis)                              │
└─────────────────────────────────────────────────────┘

Appointment Statistics:
┌─────────────────────────────────────────────────────┐
│ [Bar Chart]                                         │
│ Completed | Cancelled | No-show | Rescheduled       │
│ by week                                             │
└─────────────────────────────────────────────────────┘

Specialty Distribution:
┌─────────────────────────────────────────────────────┐
│ [Pie Chart]                                         │
│ Cardiology: 25% | General: 20% | Dermatology: 15%  │
│ Pediatrics: 12% | Orthopedics: 10% | Others: 18%   │
└─────────────────────────────────────────────────────┘

Peak Hours Analysis:
┌─────────────────────────────────────────────────────┐
│ [Heatmap]                                           │
│ Shows appointment density by hour and day           │
└─────────────────────────────────────────────────────┘

[Export All Analytics] [Schedule Report Email]
```

### 7. System Settings

**General Settings:**

```
Platform Name: [Clinic Management System____]
Support Email: [support@clinic.com__________]
Support Phone: [+1-800-123-4567_____________]

Business Hours:
Mon-Fri: [09:00] to [18:00]
Sat: [10:00] to [15:00]
Sun: [Closed]

Time Zone: [EST (UTC-5) ▼]
Date Format: [MM/DD/YYYY ▼]
Currency: [USD ($) ▼]

[Save Settings]
```

**Security Settings:**

```
Session Timeout: [30 minutes ▼]
Password Policy:
☑ Minimum 8 characters
☑ Require uppercase letter
☑ Require number
☑ Require special character
☐ Expire passwords every 90 days

Two-Factor Authentication:
● Required for all admins
○ Required for all users
○ Optional

Failed Login Attempts:
Lock account after [5] failed attempts
Lock duration: [30 minutes ▼]

IP Whitelist (Admin Access):
[Add IP Address]
• 192.168.1.100 (Office) [Remove]
• 10.0.0.50 (VPN) [Remove]

Audit Log Retention: [1 year ▼]

[Save Security Settings]
```

---

## 🔧 TECHNICAL REQUIREMENTS

### Frontend Stack

```javascript
// Required Dependencies
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "lucide-react": "^0.300.0",    // Icons
    "recharts": "^2.10.0",          // Charts
    "date-fns": "^3.0.0",           // Date handling
    "react-hook-form": "^7.49.0",   // Form management
    "zod": "^3.22.0",               // Validation
    "zustand": "^4.4.0",            // State management (lightweight)
    "react-query": "^3.39.0",       // Data fetching
    "tailwindcss": "^3.4.0",        // Styling
    "@tanstack/react-table": "^8.11.0", // Tables
    "react-hot-toast": "^2.4.1"     // Notifications
  }
}
```

### Component Architecture

```
src/
├── components/
│   ├── shared/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── LoadingSpinner.jsx
│   ├── doctor/
│   │   ├── DashboardHome.jsx
│   │   ├── PatientList.jsx
│   │   ├── PatientDetail.jsx
│   │   ├── PrescriptionCreator.jsx
│   │   ├── ScheduleCalendar.jsx
│   │   ├── AppointmentCard.jsx
│   │   └── StaffManagement.jsx
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── DoctorVerification.jsx
│       ├── PatientManagement.jsx
│       ├── FinancialDashboard.jsx
│       ├── AnalyticsDashboard.jsx
│       └── SystemSettings.jsx
├── pages/
│   ├── doctor/
│   │   ├── Dashboard.jsx
│   │   ├── Patients.jsx
│   │   ├── Schedule.jsx
│   │   └── Settings.jsx
│   └── admin/
│       ├── Dashboard.jsx
│       ├── Doctors.jsx
│       ├── Finance.jsx
│       └── Analytics.jsx
├── hooks/
│   ├── useAuth.js
│   ├── usePatients.js
│   ├── useAppointments.js
│   ├── usePrescriptions.js
│   └── useAnalytics.js
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── patients.js
│   ├── appointments.js
│   └── prescriptions.js
├── store/
│   ├── authStore.js
│   ├── patientStore.js
│   └── uiStore.js
├── utils/
│   ├── formatters.js
│   ├── validators.js
│   └── constants.js
└── App.jsx
```

### State Management Strategy

```javascript
// Using Zustand for global state
// Example: authStore.js

import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  role: null, // 'doctor' | 'staff' | 'admin'
  isAuthenticated: false,

  login: (user) =>
    set({
      user,
      role: user.role,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      user: null,
      role: null,
      isAuthenticated: false,
    }),

  updateProfile: (updates) =>
    set((state) => ({
      user: { ...state.user, ...updates },
    })),
}));
```

### API Integration Pattern

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5053/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 640px; /* Small devices */
--breakpoint-md: 768px; /* Tablets */
--breakpoint-lg: 1024px; /* Laptops */
--breakpoint-xl: 1280px; /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### Mobile Optimizations

1. **Touch-Friendly Buttons**
   - Minimum 44x44px tap targets
   - Adequate spacing between interactive elements

2. **Navigation**
   - Bottom navigation bar on mobile
   - Hamburger menu for sidebar
   - Swipeable tabs where applicable

3. **Tables**
   - Horizontal scroll on small screens
   - Card view alternative for mobile
   - Collapsible rows for details

4. **Forms**
   - Stack form fields vertically on mobile
   - Large input fields for touch
   - Appropriate keyboard types (email, tel, number)

5. **Modals**
   - Full-screen on mobile
   - Easy close button (top-right)
   - Smooth transitions

---

## 🔐 SECURITY REQUIREMENTS

### Authentication & Authorization

```javascript
// Role-Based Access Control (RBAC)
const permissions = {
  admin: {
    doctors: ['view', 'create', 'edit', 'delete', 'verify'],
    patients: ['view', 'edit', 'delete', 'export'],
    appointments: ['view', 'edit', 'cancel'],
    finance: ['view', 'export', 'refund'],
    settings: ['view', 'edit'],
    analytics: ['view', 'export'],
  },
  doctor: {
    patients: ['view', 'create', 'edit'],
    appointments: ['view', 'create', 'edit', 'cancel'],
    prescriptions: ['view', 'create', 'edit'],
    schedule: ['view', 'edit'],
    staff: ['view', 'create', 'edit', 'delete'],
    records: ['view', 'create', 'edit'],
  },
  staff: {
    patients: ['view'],
    appointments: ['view', 'create', 'edit'],
    schedule: ['view'],
    records: ['view'],
  },
};
```

### Data Security

1. **Encryption**
   - All PHI (Protected Health Information) encrypted at rest
   - TLS 1.3 for data in transit
   - Encrypt sensitive fields in database

2. **Session Management**
   - 30-minute session timeout
   - Secure, httpOnly cookies
   - CSRF protection
   - Auto-logout on inactivity

3. **Audit Logging**
   - Log all patient record access
   - Track prescription creation/modification
   - Record financial transactions
   - Monitor failed login attempts

4. **HIPAA Compliance**
   - Minimum necessary access
   - Audit trails
   - Data backup and recovery
   - Business Associate Agreements (BAA)

---

## 🎯 KEY FEATURES TO IMPLEMENT

### Priority 1 (MVP Features)

✅ **Authentication System**

- Login for Doctor, Staff, Admin
- Role-based access control
- Password reset flow
- Two-factor authentication (Admin mandatory)

✅ **Doctor Dashboard**

- Dashboard home with KPIs
- Patient list and search
- Patient detail view (EHR)
- Prescription creator with drug interaction checking
- Schedule/calendar management
- Today's appointments view

✅ **Admin Dashboard**

- Admin dashboard home with platform KPIs
- Doctor verification workflow (CRITICAL)
- Patient management overview
- Appointment management
- Basic financial dashboard

### Priority 2 (Enhanced Features)

✅ **Advanced Prescription Features**

- Drug interaction checking
- Allergy conflict detection
- ICD-10 code autocomplete
- Clinical decision support alerts
- E-prescription signing

✅ **Enhanced Scheduling**

- Multiple clinic support
- Recurring appointments
- Appointment reminders (email/SMS)
- Video consultation integration

✅ **Analytics**

- Revenue trends
- Appointment analytics
- Doctor performance metrics
- Patient demographics
- Peak hours analysis

### Priority 3 (Nice to Have)

- **Staff Management** (doctors can add staff)
- **Lab Integration** (order tests, view results)
- **Imaging Integration** (X-rays, MRIs)
- **Billing & Invoicing**
- **Insurance Management**
- **Patient Communication** (messaging, notifications)
- **Mobile Apps** (iOS/Android)
- **Telemedicine** (video consultations)

---

## 📊 DATABASE SCHEMA (Suggested)

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'doctor', 'staff') NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Doctors Table

```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  specialty VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  npi_number VARCHAR(20),
  years_experience INT,
  bio TEXT,
  education JSONB,
  certifications JSONB,
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verification_date TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Patients Table

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  added_by UUID REFERENCES users(id), -- Doctor who added
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male', 'female', 'other'),
  blood_type VARCHAR(5),
  address TEXT,
  emergency_contact JSONB,
  insurance_info JSONB,
  allergies JSONB,
  medical_conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Appointments Table

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INT DEFAULT 30,
  type ENUM('in-clinic', 'video', 'phone') DEFAULT 'in-clinic',
  status ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
  chief_complaint TEXT,
  notes TEXT,
  prescription_id UUID,
  fee DECIMAL(10, 2),
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Prescriptions Table

```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES doctors(id),
  appointment_id UUID REFERENCES appointments(id),
  diagnosis_codes JSONB, -- ICD-10 codes
  chief_complaint TEXT,
  medications JSONB, -- Array of medication objects
  lab_tests JSONB,
  advice TEXT,
  follow_up_date DATE,
  signed_at TIMESTAMP,
  signature_data TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Staff Table

```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  added_by UUID REFERENCES doctors(id),
  role VARCHAR(50), -- 'nurse', 'receptionist', 'medical_assistant'
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Verification Documents Table

```sql
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id),
  document_type VARCHAR(50), -- 'license', 'degree', 'insurance', etc.
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 IMPLEMENTATION GUIDE

### Phase 1: Setup & Authentication (Week 1)

1. Initialize React project with Vite
2. Set up Tailwind CSS
3. Create project structure
4. Implement authentication (login, logout, protected routes)
5. Create base layout components (Sidebar, Header, Card)
6. Set up routing for Doctor and Admin dashboards

### Phase 2: Doctor Dashboard Core (Week 2-3)

1. Doctor dashboard home with KPIs
2. Patient list with search/filter
3. Patient detail view (basic EHR)
4. Basic appointment scheduling
5. Schedule/calendar view
6. Staff management (basic)

### Phase 3: Prescription System (Week 4)

1. Prescription creator UI
2. Medicine autocomplete
3. Drug interaction checking API integration
4. Allergy checking
5. ICD-10 code autocomplete
6. E-signature functionality

### Phase 4: Admin Dashboard (Week 5-6)

1. Admin dashboard home with platform KPIs
2. **Doctor verification workflow** (MOST CRITICAL)
3. Patient management overview
4. Appointment management
5. Financial dashboard (basic)
6. System settings

### Phase 5: Analytics & Reports (Week 7)

1. Revenue analytics
2. Appointment analytics
3. Doctor performance metrics
4. Export functionality
5. Report generation

### Phase 6: Polish & Optimization (Week 8)

1. Mobile responsiveness
2. Loading states and error handling
3. Performance optimization
4. Security hardening
5. Testing (unit, integration)
6. Documentation

---

## 📝 TESTING REQUIREMENTS

### Unit Tests

- Component rendering
- Form validation
- Utility functions
- State management

### Integration Tests

- API calls
- Authentication flow
- Form submissions
- Navigation

### E2E Tests (Critical Flows)

1. Doctor login → View patients → Create prescription
2. Admin login → Verify doctor → Approve
3. Doctor → Schedule appointment → Complete consultation
4. Admin → View analytics → Export report

---

## 📦 DEPLOYMENT

### Environment Variables

```env
REACT_APP_API_URL=https://api.clinic.com
REACT_APP_ENV=production
REACT_APP_ENABLE_2FA=true
REACT_APP_SESSION_TIMEOUT=1800000
```

### Build Optimization

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "analyze": "vite-bundle-visualizer"
  }
}
```

### Hosting Recommendations

- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: AWS EC2, DigitalOcean, Heroku
- **Database**: PostgreSQL on AWS RDS or DigitalOcean
- **File Storage**: AWS S3 or Cloudinary (for documents)

---

## 🎯 SUCCESS CRITERIA

### Doctor Dashboard

✅ Doctors can view all patients in a searchable/filterable list
✅ Doctors can view complete patient EHR with timeline
✅ Doctors can create prescriptions with drug interaction checking
✅ Doctors can manage their schedule and appointments
✅ Doctors can add and manage staff members
✅ All actions log properly in audit trail

### Admin Dashboard

✅ Admin can view platform-wide analytics and KPIs
✅ Admin can verify doctors with document review
✅ Admin can manage all patients and appointments
✅ Admin can view financial reports and handle disputes
✅ Admin can configure system settings
✅ Admin has comprehensive audit logging

### Performance

✅ Page load time < 2 seconds
✅ Time to interactive < 3 seconds
✅ 90+ Lighthouse performance score
✅ Responsive on mobile, tablet, desktop

### Security

✅ All API calls authenticated
✅ RBAC enforced on all routes
✅ PHI encrypted at rest and in transit
✅ Session timeout after 30 minutes
✅ Audit logs for all sensitive actions

---

## 💡 ADDITIONAL NOTES

### Critical Implementation Tips

1. **Doctor Verification is THE MOST IMPORTANT admin feature**
   - Make it comprehensive and detailed
   - Include document upload viewer
   - NPI verification integration
   - Clear approval/rejection workflow
   - Email notifications at each step

2. **Prescription Creator needs special attention**
   - Drug interaction checking is critical for safety
   - Allergy checking is mandatory
   - ICD-10 autocomplete improves workflow significantly
   - E-signature for legal compliance

3. **Patient EHR should be comprehensive**
   - Timeline view is most intuitive
   - Easy navigation between tabs
   - Quick access to vitals, labs, prescriptions
   - Trend visualization for recurring tests

4. **Mobile responsiveness is critical**
   - Doctors often use tablets/phones
   - Touch-friendly interfaces
   - Simplified mobile views for complex tables

5. **Performance matters**
   - Lazy load patient lists (virtualization)
   - Cache frequently accessed data
   - Optimize images and assets
   - Use skeleton loaders

---

## 📚 RESOURCES

### Technical References

- React Documentation
- Tailwind CSS Documentation
- Lucide Icons Library
- Recharts Documentation

### Healthcare Standards

- HIPAA Compliance Guidelines
- ICD-10 Code Standards
- HL7 FHIR Standards
- NCPDP SCRIPT Standards (E-Prescribing)

---

## 🏁 FINAL CHECKLIST

Before marking the project as complete:

- [ ] All authentication flows working
- [ ] RBAC enforced on all routes
- [ ] Doctor dashboard fully functional
- [ ] Admin dashboard fully functional
- [ ] Doctor verification workflow complete
- [ ] Prescription creator with safety checks
- [ ] Patient EHR comprehensive
- [ ] Schedule management working
- [ ] Mobile responsive
- [ ] Error handling implemented
- [ ] Loading states everywhere
- [ ] Form validation complete
- [ ] Audit logging active
- [ ] Security measures in place
- [ ] Performance optimized
- [ ] Accessibility compliance
- [ ] Documentation complete
- [ ] Tests passing

---

## 🎯 START HERE

Begin with:

1. Create project structure
2. Set up authentication
3. Build base layout (Sidebar, Header)
4. Implement Doctor Dashboard Home
5. Create Patient List
6. Build Patient Detail View
7. Implement Prescription Creator
8. Build Admin Dashboard
9. **Implement Doctor Verification (CRITICAL)**
10. Add Analytics
11. Polish & optimize

**Focus on building a solid, secure, and user-friendly clinic management system that doctors and admins will love to use every day!**

---

**Good luck building an amazing clinic dashboard! 🚀**
