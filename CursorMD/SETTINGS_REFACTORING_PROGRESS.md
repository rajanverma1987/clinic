# Settings Page Refactoring Progress

## ✅ Completed Components

### 1. **SettingsTabs.jsx** ✓

- Tab navigation component with icons
- Role-based tab filtering
- Located: `components/settings/SettingsTabs.jsx`

### 2. **ProfileTab.jsx** ✓

- User profile display
- Account information
- Password change form
- Status toggle
- Located: `components/settings/ProfileTab.jsx`

### 3. **AvailabilityForm.jsx** ✓

- Day off settings
- Emergency unavailable settings
- Located: `components/settings/AvailabilityForm.jsx`

### 4. **GeneralSettingsTab.jsx** ✓

- Clinic information form
- Regional settings
- Located: `components/settings/GeneralSettingsTab.jsx`

## 🔄 Remaining Components to Create

### 5. **ComplianceTab.jsx** (Pending)

- Compliance standards checkboxes (HIPAA, GDPR, PIPEDA, Privacy Act)
- Data retention settings
- Location: `components/settings/ComplianceTab.jsx`
- Props needed: `isClinicAdmin`, `complianceForm`, `setComplianceForm`, `saving`, `onSave`

### 6. **ClinicHoursTab.jsx** (Pending)

- Day-by-day hours management
- Time slots per day
- Add/remove time slots
- Location: `components/settings/ClinicHoursTab.jsx`
- Props needed: `clinicHours`, `setClinicHours`, `saving`, `onSave`, `updateClinicHour`, `addTimeSlot`, `removeTimeSlot`, `updateTimeSlot`

### 7. **QueueSettingsTab.jsx** (Pending)

- Queue configuration
- Display options
- Location: `components/settings/QueueSettingsTab.jsx`
- Props needed: `queueForm`, `setQueueForm`, `saving`, `onSave`

### 8. **TaxSettingsTab.jsx** (Pending)

- Tax configuration form
- Location: `components/settings/TaxSettingsTab.jsx`
- Props needed: `taxForm`, `setTaxForm`, `saving`, `onSave`

### 9. **SMTPSettingsTab.jsx** (Pending)

- SMTP configuration
- Email settings
- Location: `components/settings/SMTPSettingsTab.jsx`
- Props needed: `smtpForm`, `setSmtpForm`, `saving`, `onSave`

### 10. **DoctorsTab.jsx** (Pending)

- User management table
- Add new user form
- Toggle user status
- Location: `components/settings/DoctorsTab.jsx`
- Props needed: `isClinicAdmin`, `users`, `newUserForm`, `setNewUserForm`, `showNewUserForm`, `setShowNewUserForm`, `generatedPassword`, `setGeneratedPassword`, `onCreateUser`, `onToggleUserStatus`, `onGeneratePassword`

## 📝 Next Steps

### Step 1: Create Remaining Tab Components

Follow the pattern established in `GeneralSettingsTab.jsx`:

- Extract the JSX from `app/settings/page.jsx`
- Create component file in `components/settings/`
- Accept props for form state and handlers
- Include admin-only checks where needed

### Step 2: Refactor Main Settings Page

Update `app/settings/page.jsx` to:

1. Import all tab components
2. Replace inline tab content with component calls
3. Pass necessary props to each component
4. Keep state management and API calls in the main page

### Step 3: Example Refactored Main Page Structure

```jsx
'use client';

import { Layout } from '@/components/layout/Layout';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { GeneralSettingsTab } from '@/components/settings/GeneralSettingsTab';
// ... import other tabs

export default function SettingsPage() {
  // ... state declarations
  // ... useEffect hooks
  // ... handler functions

  return (
    <Layout>
      {/* Header */}
      {/* Error/Success messages */}
      <SettingsTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isClinicAdmin={isClinicAdmin}
      />

      {activeTab === 'profile' && (
        <ProfileTab
          currentUser={currentUser}
          logout={logout}
          saving={saving}
          onToggleStatus={handleToggleMyStatus}
          availabilityForm={availabilityForm}
          setAvailabilityForm={setAvailabilityForm}
        />
      )}

      {activeTab === 'general' && (
        <GeneralSettingsTab
          isClinicAdmin={isClinicAdmin}
          clinicForm={clinicForm}
          setClinicForm={setClinicForm}
          saving={saving}
          onSave={handleSaveGeneral}
        />
      )}

      {/* ... other tabs */}
    </Layout>
  );
}
```

## 📊 Progress Summary

- **Completed**: 4 components (SettingsTabs, ProfileTab, AvailabilityForm, GeneralSettingsTab)
- **Remaining**: 6 components (ComplianceTab, ClinicHoursTab, QueueSettingsTab, TaxSettingsTab, SMTPSettingsTab, DoctorsTab)
- **Main Page Refactoring**: Pending

## 🎯 Benefits Achieved So Far

1. ✅ Tab navigation extracted and reusable
2. ✅ Profile section modularized
3. ✅ Availability form reusable
4. ✅ General settings isolated
5. ⏳ Main page will be ~500 lines instead of 2,853 lines
6. ⏳ Each component will be independently testable
7. ⏳ Better code organization and maintainability

## 📚 Component Patterns

All tab components should follow this pattern:

```jsx
'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// ... other imports

export function TabName({
  // Props for form state
  formState,
  setFormState,
  // Props for handlers
  onSave,
  // Props for flags
  saving,
  isClinicAdmin,
}) {
  // Admin check if needed
  if (!isClinicAdmin) {
    return <AccessDeniedCard />;
  }

  return (
    <Card elevated={true}>
      {/* Tab content */}
      <Button onClick={onSave} isLoading={saving}>
        Save
      </Button>
    </Card>
  );
}
```
