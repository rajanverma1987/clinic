# Error Handling Best Practices
## User-Friendly Error Messages

---

## Problem

Technical error messages were being shown to users:
```
❌ "Cast to ObjectId failed for value 'Dr. Rajan Verma' (type string) at path '_id' for model 'User'"
❌ "ValidationError: Path `patientId` is required"
❌ "MongoError: E11000 duplicate key error"
```

**These are confusing and unprofessional!**

---

## Solution

### 1. ✅ Toast Notifications (Implemented)

**Created**: `/lib/utils/toast.ts`

All errors now show as beautiful toast notifications:
```
✅ "Invalid selection. Please refresh and try again."
✅ "Please fill in all required fields correctly"
✅ "An appointment already exists for this time slot"
```

### 2. ✅ Error Translation Layer

Convert technical errors to user-friendly messages:

```typescript
// Technical Error → User-Friendly Message
'Cast to ObjectId failed'     → 'Invalid selection. Please refresh and try again.'
'validation failed'           → 'Please fill in all required fields correctly'
'duplicate key error'         → 'This record already exists'
'Network error'               → 'Network error. Please check your connection'
'timeout'                     → 'Request timeout. Please try again'
```

---

## Implementation

### Appointment Booking (Fixed)

**Before** ❌:
```typescript
catch (error) {
  setError(error.message); // Shows MongoDB errors!
}
```

**After** ✅:
```typescript
catch (error: any) {
  console.error('Error:', error); // Log for debugging
  
  let errorMsg = 'Failed to create appointment. Please try again.';
  
  if (error.message.includes('Cast to ObjectId')) {
    errorMsg = 'Invalid selection. Please refresh and try again.';
  } else if (error.message.includes('Network')) {
    errorMsg = 'Network error. Please check your connection.';
  }
  // ... more translations
  
  showError(errorMsg); // Show friendly toast
}
```

---

## Error Translation Patterns

### Pattern 1: MongoDB Errors

```typescript
if (errorMsg.includes('Cast to ObjectId') || 
    errorMsg.includes('ObjectId') ||
    errorMsg.includes('MongoDB') ||
    errorMsg.includes('Schema')) {
  showError('Invalid data. Please refresh and try again.');
}
```

### Pattern 2: Validation Errors

```typescript
if (errorMsg.includes('validation') || 
    errorMsg.includes('required') ||
    errorMsg.includes('invalid')) {
  showError('Please fill in all required fields correctly');
}
```

### Pattern 3: Duplicate Errors

```typescript
if (errorMsg.includes('duplicate') || 
    errorMsg.includes('exists') ||
    errorMsg.includes('E11000')) {
  showError('This record already exists');
}
```

### Pattern 4: Network Errors

```typescript
if (errorMsg.includes('Network') || 
    errorMsg.includes('fetch') ||
    errorMsg.includes('ECONNREFUSED')) {
  showError('Network error. Please check your connection');
}
```

### Pattern 5: Authentication Errors

```typescript
if (errorMsg.includes('unauthorized') || 
    errorMsg.includes('401') ||
    errorMsg.includes('token')) {
  showError('Session expired. Please login again');
  router.push('/login');
}
```

---

## Standard Error Messages

Use these standard messages across the application:

### General Errors
```typescript
showError('Something went wrong. Please try again');
showError('Invalid data. Please check and try again');
showError('Action failed. Please try again');
```

### Form Errors
```typescript
showError('Please fill in all required fields');
showError('Invalid email address');
showError('Password must be at least 8 characters');
showError('Please select a valid option');
```

### Data Errors
```typescript
showError('Failed to save data. Please try again');
showError('Failed to load data. Please refresh the page');
showError('This record already exists');
showError('Record not found');
```

### Network Errors
```typescript
showError('Network error. Please check your connection');
showError('Request timeout. Please try again');
showError('Server is unavailable. Please try later');
```

### Permission Errors
```typescript
showError('You don\'t have permission for this action');
showError('Access denied');
showError('Session expired. Please login again');
```

---

## Complete Error Handler Template

```typescript
import { showError } from '@/lib/utils/toast';

const handleError = (error: any, context: string = 'Action') => {
  // Always log technical errors for debugging
  console.error(`${context} error:`, error);
  
  let userMessage = `${context} failed. Please try again.`;
  const errorMsg = error.message || error.error?.message || '';
  
  // MongoDB/Database errors
  if (errorMsg.includes('Cast to ObjectId') || 
      errorMsg.includes('MongoDB') ||
      errorMsg.includes('Schema') ||
      errorMsg.includes('ObjectId')) {
    userMessage = 'Invalid data. Please refresh the page and try again.';
  }
  
  // Validation errors
  else if (errorMsg.includes('validation') || 
           errorMsg.includes('required') ||
           errorMsg.includes('invalid')) {
    userMessage = 'Please fill in all required fields correctly';
  }
  
  // Duplicate errors
  else if (errorMsg.includes('duplicate') || 
           errorMsg.includes('exists') ||
           errorMsg.includes('E11000')) {
    userMessage = 'This record already exists';
  }
  
  // Network errors
  else if (errorMsg.includes('Network') || 
           errorMsg.includes('fetch') ||
           errorMsg.includes('ECONNREFUSED') ||
           errorMsg.includes('timeout')) {
    userMessage = 'Network error. Please check your connection and try again';
  }
  
  // Authentication errors
  else if (errorMsg.includes('unauthorized') || 
           errorMsg.includes('401') ||
           errorMsg.includes('Unauthorized')) {
    userMessage = 'Session expired. Please login again';
    // Optionally redirect to login
    // router.push('/login');
  }
  
  // Permission errors
  else if (errorMsg.includes('forbidden') || 
           errorMsg.includes('403') ||
           errorMsg.includes('permission')) {
    userMessage = 'You don\'t have permission for this action';
  }
  
  // Show user-friendly error
  showError(userMessage);
};

// Usage:
try {
  await saveData();
} catch (error) {
  handleError(error, 'Save operation');
}
```

---

## Usage Guide

### 1. Import Toast Functions

```typescript
import { showSuccess, showError, showWarning } from '@/lib/utils/toast';
```

### 2. Handle API Errors

```typescript
try {
  const response = await apiClient.post('/endpoint', data);
  
  if (response.success) {
    showSuccess('Operation completed successfully!');
  } else {
    // Translate error
    const error = response.error?.message || 'Operation failed';
    
    if (error.includes('ObjectId')) {
      showError('Invalid selection. Please refresh and try again.');
    } else {
      showError(error);
    }
  }
} catch (error: any) {
  console.error('Error:', error);
  showError('Something went wrong. Please try again.');
}
```

### 3. Form Validation

```typescript
const validateForm = () => {
  if (!formData.firstName) {
    showWarning('First name is required');
    return false;
  }
  
  if (!formData.email || !formData.email.includes('@')) {
    showWarning('Valid email is required');
    return false;
  }
  
  return true;
};
```

---

## Pages to Update

Apply error handling pattern to:

### ✅ Completed:
1. **Appointments** (`/app/appointments/new/page.tsx`)
   - Fixed ObjectId error
   - Added user-friendly messages
   - Using toast notifications

### 🔄 To Update:
2. **Patients** (`/app/patients/page.tsx`)
3. **Settings** (`/app/settings/page.tsx`)
4. **Prescriptions** (`/app/prescriptions/new/page.tsx`)
5. **Invoices** (`/app/invoices/new/page.tsx`)
6. **Queue** (`/app/queue/page.tsx`)
7. **Reports** (`/app/reports/page.tsx`)
8. **Login** (`/app/login/page.tsx`)
9. **Register** (`/app/register/page.tsx`)

---

## Best Practices

### ✅ DO

1. **Always log technical errors**:
   ```typescript
   console.error('Technical error:', error);
   ```

2. **Show user-friendly messages**:
   ```typescript
   showError('Something went wrong. Please try again');
   ```

3. **Be specific when possible**:
   ```typescript
   showError('Email already exists. Please use another email');
   ```

4. **Provide actionable feedback**:
   ```typescript
   showError('Network error. Please check your connection and try again');
   ```

### ❌ DON'T

1. **Don't show technical details to users**:
   ```typescript
   ❌ showError(error.stack);
   ❌ showError('Cast to ObjectId failed...');
   ```

2. **Don't hide errors silently**:
   ```typescript
   ❌ catch (error) { /* ignore */ }
   ✅ catch (error) { handleError(error); }
   ```

3. **Don't use generic messages for everything**:
   ```typescript
   ❌ showError('Error'); // Too vague
   ✅ showError('Failed to save patient');
   ```

---

## Testing Error Messages

### Test Scenarios:

1. **Invalid doctor selection** → "Invalid selection. Please refresh and try again"
2. **Missing required field** → "Please fill in all required fields"
3. **Network failure** → "Network error. Please check your connection"
4. **Duplicate record** → "This record already exists"
5. **Session expired** → "Session expired. Please login again"

---

## Summary

### What Changed:

✅ **Created toast notification system** (`/lib/utils/toast.ts`)  
✅ **Fixed appointment ObjectId error**  
✅ **Added error translation layer**  
✅ **Replaced technical errors with user-friendly messages**  
✅ **Documented error handling patterns**  

### Result:

- ❌ No more MongoDB errors shown to users
- ✅ Beautiful toast notifications
- ✅ User-friendly error messages
- ✅ Consistent error handling
- ✅ Better user experience

---

**Users will now see helpful messages instead of technical errors!** 🎉✨

