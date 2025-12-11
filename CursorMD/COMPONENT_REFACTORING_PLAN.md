# Component Refactoring Plan - Large JSX Files

## Analysis Summary

Based on line count analysis, here are the files that need to be broken down into smaller components:

## 🔴 Critical Priority (2000+ lines)

### 1. **app/settings/page.jsx** - 2,853 lines ⚠️ CRITICAL

**Current Structure:**

- Single massive component with 8+ tabs/sections
- Multiple form states (clinicForm, complianceForm, queueForm, taxForm, smtpForm, availabilityForm, clinicHours, newUserForm)
- All save handlers in one file
- All UI rendering in one file

**Recommended Breakdown:**

```
components/settings/
├── SettingsTabs.jsx              # Tab navigation component
├── ProfileTab.jsx                 # Profile settings (~300 lines)
├── GeneralSettingsTab.jsx         # Clinic info settings (~250 lines)
├── ComplianceTab.jsx              # Compliance settings (~200 lines)
├── ClinicHoursTab.jsx             # Hours management (~300 lines)
├── QueueSettingsTab.jsx           # Queue configuration (~200 lines)
├── TaxSettingsTab.jsx             # Tax configuration (~150 lines)
├── SMTPSettingsTab.jsx             # SMTP configuration (~200 lines)
├── DoctorsTab.jsx                 # User management (~400 lines)
├── AvailabilityForm.jsx           # Doctor availability form (~200 lines)
└── SettingsLayout.jsx             # Main layout wrapper
```

**Benefits:**

- Each tab becomes independently maintainable
- Easier to test individual sections
- Better code organization
- Reduced bundle size per route

---

### 2. **app/page.jsx** - 2,300 lines ⚠️ CRITICAL

**Current Structure:**

- Marketing homepage with multiple sections
- Hero, Features, Testimonials, FAQ, Pricing, CTA sections
- All in one massive component

**Recommended Breakdown:**

```
components/marketing/
├── HeroSection.jsx                 # Hero banner (~200 lines)
├── FeaturesSection.jsx             # Features grid (~300 lines)
├── TestimonialsSection.jsx         # Testimonials carousel (~250 lines)
├── PricingSection.jsx              # Pricing cards (~300 lines)
├── FAQSection.jsx                  # FAQ accordion (~200 lines)
├── CTASection.jsx                  # Call-to-action (~100 lines)
└── HomePage.jsx                    # Main page orchestrator (~200 lines)
```

**Benefits:**

- Reusable marketing components
- Easier A/B testing
- Better performance (code splitting)
- Cleaner structure

---

## 🟠 High Priority (1500-2000 lines)

### 3. **app/telemedicine/[id]/page.jsx** - 1,982 lines

**Current Structure:**

- Video consultation room with all features
- WebRTC, chat, file transfer, waiting room, recording
- Complex state management

**Recommended Breakdown:**

```
components/telemedicine/
├── VideoCallRoom.jsx              # Main room orchestrator (~300 lines)
├── VideoControls.jsx               # Video controls bar (~200 lines)
├── VideoDisplay.jsx                # Video grid/display (~150 lines)
├── SessionInfo.jsx                 # Session duration, quality (~100 lines)
├── ShareModal.jsx                  # Share link modal (~150 lines)
├── RecordingConsentModal.jsx       # Recording consent (~100 lines)
└── ConnectionStatus.jsx            # Connection quality indicator (~100 lines)
```

**Note:** ChatPanel, FileTransfer, and WaitingRoom already exist as separate components - good!

**Benefits:**

- Better separation of concerns
- Easier to maintain WebRTC logic
- Reusable video components

---

### 4. **app/dashboard/page.jsx** - 1,586 lines

**Current Structure:**

- Dashboard with stats, charts, notifications
- Multiple data fetching functions
- Complex chart rendering

**Recommended Breakdown:**

```
components/dashboard/
├── DashboardStats.jsx             # Stats cards grid (~200 lines)
├── RevenueChart.jsx                # Revenue chart component (~250 lines)
├── AppointmentsChart.jsx           # Appointments chart (~250 lines)
├── PatientsChart.jsx               # Patients chart (~250 lines)
├── RecentActivity.jsx              # Recent activity list (~200 lines)
├── QuickActions.jsx                # Quick action buttons (~150 lines)
└── DashboardFilters.jsx            # Date filter dropdown (~100 lines)
```

**Benefits:**

- Reusable chart components
- Better data fetching organization
- Easier to add new dashboard widgets

---

## 🟡 Medium Priority (700-1500 lines)

### 5. **app/patients/[id]/page.jsx** - 882 lines

**Recommended Breakdown:**

```
components/patients/
├── PatientHeader.jsx               # Patient info header (~150 lines)
├── PatientTabs.jsx                 # Tab navigation (~50 lines)
├── PatientOverview.jsx             # Overview tab (~200 lines)
├── PatientAppointments.jsx         # Appointments list (~200 lines)
├── PatientPrescriptions.jsx        # Prescriptions list (~150 lines)
├── PatientInvoices.jsx             # Invoices list (~150 lines)
└── PatientNotes.jsx                # Clinical notes (~100 lines)
```

### 6. **app/reports/page.jsx** - 840 lines

**Recommended Breakdown:**

```
components/reports/
├── ReportsFilters.jsx              # Filter controls (~150 lines)
├── RevenueReport.jsx               # Revenue report view (~200 lines)
├── AppointmentsReport.jsx          # Appointments report (~200 lines)
├── PatientsReport.jsx             # Patients report (~150 lines)
└── ReportExport.jsx                # Export functionality (~100 lines)
```

### 7. **app/prescriptions/new/page.jsx** - 761 lines

**Recommended Breakdown:**

```
components/prescriptions/
├── PrescriptionForm.jsx           # Main form wrapper (~200 lines)
├── PatientSelector.jsx            # Already exists, reuse
├── PrescriptionItemsForm.jsx      # Items table form (~250 lines)
├── PrescriptionNotesForm.jsx      # Notes and instructions (~150 lines)
└── PrescriptionActions.jsx        # Save/cancel buttons (~100 lines)
```

### 8. **app/appointments/page.jsx** - 757 lines

**Recommended Breakdown:**

```
components/appointments/
├── AppointmentsFilters.jsx        # Filter controls (~150 lines)
├── AppointmentsList.jsx            # Appointments table (~250 lines)
├── AppointmentsStats.jsx           # Stats cards (~150 lines)
└── AppointmentActions.jsx          # Bulk actions (~100 lines)
```

### 9. **components/layout/Sidebar.jsx** - 725 lines

**Recommended Breakdown:**

```
components/layout/sidebar/
├── Sidebar.jsx                     # Main sidebar wrapper (~150 lines)
├── SidebarHeader.jsx               # Logo and user info (~100 lines)
├── SidebarNav.jsx                  # Navigation items (~200 lines)
├── SidebarNavItem.jsx              # Individual nav item (~50 lines)
├── SidebarFooter.jsx               # Logout button (~50 lines)
└── SidebarMenuItems.jsx            # Menu items data/config (~100 lines)
```

---

## 📋 Refactoring Guidelines

### 1. **Extract by Feature/Functionality**

- Group related functionality together
- Each component should have a single responsibility
- Keep related state and handlers together

### 2. **Extract Reusable UI Patterns**

- Forms with similar structure → Form components
- Lists with similar structure → List components
- Modals → Modal components

### 3. **Extract Data Fetching Logic**

- Move API calls to custom hooks
- Example: `useSettings.js`, `usePatients.js`, etc.

### 4. **Component Size Guidelines**

- **Ideal**: 100-300 lines per component
- **Acceptable**: 300-500 lines
- **Refactor needed**: 500+ lines

### 5. **File Organization**

```
components/
├── [feature]/
│   ├── [Feature]Page.jsx          # Main page component
│   ├── [Feature]Header.jsx        # Header section
│   ├── [Feature]List.jsx          # List view
│   ├── [Feature]Form.jsx          # Form component
│   └── [Feature]Card.jsx          # Card/item component
```

---

## 🎯 Priority Order

1. **app/settings/page.jsx** (2,853 lines) - Start here
2. **app/page.jsx** (2,300 lines) - Marketing page
3. **app/telemedicine/[id]/page.jsx** (1,982 lines) - Video call
4. **app/dashboard/page.jsx** (1,586 lines) - Dashboard
5. **components/layout/Sidebar.jsx** (725 lines) - Navigation

---

## ✅ Benefits of Refactoring

1. **Maintainability**: Easier to find and fix bugs
2. **Testability**: Smaller components are easier to test
3. **Reusability**: Components can be reused across pages
4. **Performance**: Better code splitting and lazy loading
5. **Collaboration**: Multiple developers can work on different components
6. **Readability**: Smaller files are easier to understand

---

## 📝 Next Steps

1. Start with `app/settings/page.jsx` - highest priority
2. Extract one tab at a time
3. Test after each extraction
4. Update imports and routes
5. Move to next file once complete
