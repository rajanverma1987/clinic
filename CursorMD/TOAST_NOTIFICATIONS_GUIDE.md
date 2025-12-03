# Toast Notifications Guide
## Modern User Feedback System

---

## Overview

Toast notifications provide non-intrusive, temporary messages to users about actions, errors, warnings, and informational updates.

**Created**: `/lib/utils/toast.ts`

---

## Features

✅ **4 Types**: Success, Error, Warning, Info  
✅ **Auto-dismiss**: Configurable duration  
✅ **Manual dismiss**: Click X button  
✅ **Animations**: Smooth slide-in/out  
✅ **Stacking**: Multiple toasts stack vertically  
✅ **Non-blocking**: Doesn't interrupt user flow  
✅ **Beautiful**: Tailwind-styled with icons  

---

## Usage

### Basic Import

```typescript
import { showSuccess, showError, showWarning, showInfo } from '@/lib/utils/toast';
```

### Quick Examples

```typescript
// Success message
showSuccess('Appointment created successfully!');

// Error message
showError('Failed to save patient');

// Warning message
showWarning('Please fill all required fields');

// Info message
showInfo('Data is syncing...');
```

---

## API Reference

### Method 1: Simple Functions (Recommended)

```typescript
showSuccess(message: string, duration?: number)
showError(message: string, duration?: number)
showWarning(message: string, duration?: number)
showInfo(message: string, duration?: number)
```

**Parameters**:
- `message`: The text to display
- `duration`: Auto-dismiss after milliseconds (default: 5000, 0 = never)

**Example**:
```typescript
showSuccess('User created!', 3000); // Show for 3 seconds
showError('Network error', 0); // Show until manually closed
```

### Method 2: Advanced (toast object)

```typescript
import { toast } from '@/lib/utils/toast';

toast.show({
  message: 'Custom notification',
  type: 'success', // 'success' | 'error' | 'warning' | 'info'
  duration: 4000,
  position: 'top-right' // Position (future feature)
});
```

---

## Visual Design

### Success Toast
```
┌────────────────────────────────────────┐
│ ✓  Patient added successfully!      ✕ │
└────────────────────────────────────────┘
   ↑ Green background with checkmark
```

### Error Toast
```
┌────────────────────────────────────────┐
│ ✗  Failed to save data              ✕ │
└────────────────────────────────────────┘
   ↑ Red background with X icon
```

### Warning Toast
```
┌────────────────────────────────────────┐
│ ⚠  Please verify patient information ✕ │
└────────────────────────────────────────┘
   ↑ Yellow background with warning icon
```

### Info Toast
```
┌────────────────────────────────────────┐
│ ℹ  Syncing data...                  ✕ │
└────────────────────────────────────────┘
   ↑ Blue background with info icon
```

---

## Implementation Examples

### 1. Form Submission

**Before** (using error state):
```typescript
❌ const [error, setError] = useState('');

const handleSubmit = async () => {
  try {
    await apiClient.post('/patients', data);
    router.push('/patients'); // No feedback!
  } catch (error) {
    setError(error.message); // Red box at top
  }
};

// In JSX:
{error && <div className="bg-red-50">{error}</div>}
```

**After** (using toast):
```typescript
✅ import { showSuccess, showError } from '@/lib/utils/toast';

const handleSubmit = async () => {
  try {
    await apiClient.post('/patients', data);
    showSuccess('Patient added successfully!');
    setTimeout(() => router.push('/patients'), 1500);
  } catch (error) {
    showError(error.message || 'Failed to add patient');
  }
};

// No JSX needed!
```

### 2. Data Deletion

```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure?')) return;
  
  try {
    await apiClient.delete(`/patients/${id}`);
    showSuccess('Patient deleted');
    fetchPatients(); // Refresh list
  } catch (error) {
    showError('Failed to delete patient');
  }
};
```

### 3. Validation Errors

```typescript
const validateForm = () => {
  if (!formData.firstName) {
    showWarning('First name is required');
    return false;
  }
  if (!formData.phone) {
    showWarning('Phone number is required');
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  // ... continue
};
```

### 4. Background Operations

```typescript
const handleSync = async () => {
  showInfo('Syncing data...', 0); // Show indefinitely
  
  try {
    await syncData();
    showSuccess('Data synced successfully!');
  } catch (error) {
    showError('Sync failed');
  }
};
```

### 5. Multi-step Process

```typescript
const handleImport = async () => {
  showInfo('Importing patients...', 0);
  
  try {
    const result = await importPatients(file);
    showSuccess(`Imported ${result.count} patients successfully!`);
  } catch (error) {
    showError(`Import failed: ${error.message}`);
  }
};
```

---

## Migration Guide

### Pages to Update

Replace error/success divs with toasts in:

#### 1. **Appointments** (`/app/appointments/new/page.tsx`) ✅ DONE
- ~~Error div~~ → Toast
- Added validation toasts
- Success toast on creation

#### 2. **Patients** (`/app/patients/page.tsx`)
```typescript
// Replace:
{error && <div className="bg-red-50">{error}</div>}
{success && <div className="bg-green-50">{success}</div>}

// With:
import { showSuccess, showError } from '@/lib/utils/toast';
// Use showSuccess() and showError() in functions
```

#### 3. **Settings** (`/app/settings/page.tsx`)
```typescript
// Replace state-based messages:
const [error, setError] = useState('');
const [success, setSuccess] = useState('');

// With toasts:
import { showSuccess, showError } from '@/lib/utils/toast';
```

#### 4. **Prescriptions** (`/app/prescriptions/new/page.tsx`)
#### 5. **Invoices** (`/app/invoices/new/page.tsx`)
#### 6. **Queue** (`/app/queue/page.tsx`)
#### 7. **Reports** (`/app/reports/page.tsx`)
#### 8. **Login/Register** (`/app/login/page.tsx`, `/app/register/page.tsx`)

---

## Best Practices

### ✅ DO

1. **Use appropriate types**:
   ```typescript
   showSuccess('Data saved')     // Success actions
   showError('Failed to load')   // Errors
   showWarning('Invalid input')  // User mistakes
   showInfo('Processing...')     // Background tasks
   ```

2. **Be specific**:
   ```typescript
   ✅ showSuccess('Patient John Doe added successfully')
   ❌ showSuccess('Success')
   ```

3. **Show feedback immediately**:
   ```typescript
   ✅ showSuccess('Appointment created!');
      setTimeout(() => router.push(...), 1500);
   
   ❌ router.push(...); // No feedback!
   ```

4. **Use short, clear messages**:
   ```typescript
   ✅ showError('Email already exists')
   ❌ showError('An error occurred while trying to create a new user account because the email address you provided is already registered in our system')
   ```

### ❌ DON'T

1. **Don't use for long content**:
   ```typescript
   ❌ showInfo('Lorem ipsum dolor sit amet...' + 200 words)
   ```

2. **Don't spam toasts**:
   ```typescript
   ❌ for (let i = 0; i < 10; i++) {
        showSuccess(`Item ${i} added`);
      }
   ✅ showSuccess(`${items.length} items added`);
   ```

3. **Don't use for critical alerts**:
   ```typescript
   ❌ showWarning('Your session will expire');
   ✅ Use modal dialog for critical alerts
   ```

4. **Don't hide errors silently**:
   ```typescript
   ❌ catch (error) { console.log(error); }
   ✅ catch (error) { showError(error.message); }
   ```

---

## Customization

### Change Default Duration

```typescript
// In toast.ts, modify default:
duration = 5000  // 5 seconds (current)
duration = 3000  // 3 seconds (shorter)
duration = 10000 // 10 seconds (longer)
```

### Change Position

Currently: `top-right`

To change (future enhancement):
```typescript
toast.show({
  message: 'Hello',
  position: 'bottom-center' // or 'top-left', etc.
});
```

### Custom Colors

Edit `getBackgroundColor()` in `toast.ts`:
```typescript
case 'success':
  return 'bg-green-50 border-green-200'; // Change colors
```

---

## Animation

### Slide In (Right to Left)
```
[Toast] ←←← Slides in from right
```

### Slide Out (Left to Right)
```
Toast →→→ [Gone] Slides out to right
```

### Duration: 300ms (smooth)

---

## Stacking

Multiple toasts stack vertically:

```
┌────────────────────────┐
│ ✓ Appointment saved ✕ │
└────────────────────────┘

┌────────────────────────┐
│ ℹ Sending email...  ✕ │
└────────────────────────┘

┌────────────────────────┐
│ ✓ Email sent        ✕ │
└────────────────────────┘
```

**Auto-dismiss**: Oldest toast removes first

---

## Real-World Examples

### Appointment Booking
```typescript
const handleSubmit = async () => {
  // Validation
  if (!formData.patientId) {
    showError('Please select a patient');
    return;
  }

  // Create appointment
  try {
    await apiClient.post('/appointments', data);
    
    if (formData.isTelemedicine) {
      showSuccess('Video consultation scheduled! Email sent to patient.');
    } else {
      showSuccess('Appointment scheduled successfully!');
    }
    
    setTimeout(() => router.push('/appointments'), 1500);
  } catch (error) {
    showError('Failed to schedule appointment');
  }
};
```

### Patient Registration
```typescript
const handleRegister = async () => {
  try {
    showInfo('Creating patient record...', 0);
    
    const response = await apiClient.post('/patients', formData);
    
    showSuccess(`Patient ${response.data.patientId} registered successfully!`);
    
    // Reset form
    setFormData(initialState);
  } catch (error) {
    if (error.code === 'DUPLICATE_PHONE') {
      showWarning('Phone number already registered');
    } else {
      showError('Failed to register patient');
    }
  }
};
```

### Settings Update
```typescript
const handleSave = async () => {
  try {
    await apiClient.put('/settings', settings);
    showSuccess('Settings saved successfully');
  } catch (error) {
    showError('Failed to save settings');
  }
};
```

---

## Accessibility

- ✅ High contrast colors
- ✅ Clear icons
- ✅ Readable font size
- ✅ Manual dismiss option
- ✅ Auto-dismiss with timeout
- 🔄 Screen reader support (future enhancement)

---

## Browser Support

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

---

## Summary

### Benefits:

✅ **Better UX**: Non-intrusive feedback  
✅ **Consistency**: Same style everywhere  
✅ **Simple API**: One import, easy to use  
✅ **Beautiful**: Modern design with icons  
✅ **Flexible**: 4 types, custom duration  
✅ **Stacking**: Multiple messages supported  

### Result:

Replace all error divs and success messages with toast notifications for a modern, professional user experience!

---

**Toast notifications are now available throughout the application!** 🎉🔔

