# Comprehensive Error Handling Guide

This guide explains how to use the comprehensive error handling system throughout the application.

## Overview

The error handling system provides:

- **Error Classification**: Automatically categorizes errors (Network, Validation, Auth, etc.)
- **User-Friendly Messages**: Converts technical errors to readable messages
- **Safe Wrappers**: Prevents crashes from undefined/null access
- **Retry Logic**: Automatic retry for transient errors
- **React Integration**: Hooks and components for React error handling

## Core Utilities

### 1. Error Classification

```javascript
import { classifyError, ErrorTypes } from '@/lib/utils/error-handler';

const errorType = classifyError(error);
// Returns: RUNTIME_ERROR, NETWORK_ERROR, VALIDATION_ERROR, etc.
```

### 2. User-Friendly Messages

```javascript
import { getUserFriendlyMessage } from '@/lib/utils/error-handler';

const message = getUserFriendlyMessage(error, 'Default fallback message');
// Returns user-friendly message based on error type
```

### 3. Safe Async Operations

```javascript
import { safeAsync } from '@/lib/utils/error-handler';

// Wrap promises with automatic error handling
const result = await safeAsync(apiClient.get('/api/data'), {
  context: 'Fetching data',
  fallback: null, // Return value on error
});
```

### 4. Safe Property Access

```javascript
import { safeGet } from '@/lib/utils/error-handler';

// Safe nested property access
const name = safeGet(user, 'profile.name', 'Unknown');
// Returns 'Unknown' if any part of path is undefined/null
```

### 5. Safe Array Operations

```javascript
import { safeArray } from '@/lib/utils/error-handler';

// Safe array operations with fallbacks
const mapped = safeArray.map(users, (u) => u.name, []);
const filtered = safeArray.filter(users, (u) => u.active, []);
const found = safeArray.find(users, (u) => u.id === id, null);
```

### 6. Safe Translation

```javascript
import { safeTranslate } from '@/lib/utils/error-handler';

const text = safeTranslate(t, 'common.save', 'Save');
// Returns translation or fallback if translation fails
```

## React Hook: useErrorHandler

```javascript
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useI18n } from '@/contexts/I18nContext';

function MyComponent() {
  const { t } = useI18n();
  const { handleError, safeAsyncOperation, safeTranslate } = useErrorHandler({
    t,
    showToast: true, // Show toast notifications
    onError: (error, type, message) => {
      // Custom error handler
    },
  });

  const fetchData = async () => {
    const result = await safeAsyncOperation(apiClient.get('/api/data'), 'Loading data');
    // result is null if error occurred
  };

  return <div>{safeTranslate('common.title', 'Title')}</div>;
}
```

## Error Boundary Usage

```javascript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function MyPage() {
  return (
    <ErrorBoundary
      variant='card'
      name='MyComponent'
      showRetry={true}
      title='Something went wrong'
      message='Please try again'
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## API Route Error Handling

```javascript
import { withErrorHandler } from '@/middleware/error-handler';

export const GET = withErrorHandler(async (req) => {
  // Your route handler
  // Errors are automatically caught and formatted
  return NextResponse.json({ data: result });
});
```

## Retry Logic

```javascript
import { withRetry } from '@/lib/utils/error-handler';

// Automatically retry failed operations
const result = await withRetry(() => apiClient.get('/api/data'), {
  maxRetries: 3,
  delay: 1000, // ms
  shouldRetry: (error) => {
    // Only retry network/server errors
    const type = classifyError(error);
    return type === ErrorTypes.NETWORK || type === ErrorTypes.SERVER;
  },
});
```

## Safe Function Wrapper

```javascript
import { safeWrapper } from '@/lib/utils/error-handler';

const safeFetch = safeWrapper(
  async (url) => {
    const response = await fetch(url);
    return response.json();
  },
  {
    context: 'Fetch data',
    onError: (error) => {
      console.error('Fetch failed:', error);
      return null;
    },
  },
);

// Use it - errors are automatically handled
const data = await safeFetch('/api/data');
```

## Best Practices

### 1. Always Use Safe Wrappers for External Calls

```javascript
// ❌ Bad
const data = await apiClient.get('/api/data');

// ✅ Good
const data = await safeAsync(apiClient.get('/api/data'), { context: 'Fetch data', fallback: null });
```

### 2. Use Safe Property Access for Nested Objects

```javascript
// ❌ Bad
const name = user.profile.name;

// ✅ Good
const name = safeGet(user, 'profile.name', 'Unknown');
```

### 3. Use Safe Array Operations

```javascript
// ❌ Bad
const names = users.map((u) => u.name);

// ✅ Good
const names = safeArray.map(users, (u) => u.name, []);
```

### 4. Wrap Components in Error Boundaries

```javascript
// ✅ Good
<ErrorBoundary variant='card' name='DataSection'>
  <DataComponent />
</ErrorBoundary>
```

### 5. Use useErrorHandler Hook in Components

```javascript
// ✅ Good
const { handleError, safeTranslate } = useErrorHandler({ t });
```

## Error Types

- `RUNTIME_ERROR`: TypeError, ReferenceError, SyntaxError
- `NETWORK_ERROR`: Connection failures, timeouts
- `VALIDATION_ERROR`: Input validation failures
- `AUTHENTICATION_ERROR`: 401 Unauthorized
- `AUTHORIZATION_ERROR`: 403 Forbidden
- `NOT_FOUND_ERROR`: 404 Not Found
- `SERVER_ERROR`: 500+ Server errors
- `DATABASE_ERROR`: MongoDB/Mongoose errors
- `UNKNOWN_ERROR`: Unclassified errors

## Migration Guide

### Before

```javascript
try {
  const data = await apiClient.get('/api/data');
  setData(data.data);
} catch (error) {
  console.error(error);
  setError('Something went wrong');
}
```

### After

```javascript
const { safeAsyncOperation } = useErrorHandler();

const data = await safeAsyncOperation(apiClient.get('/api/data'), 'Loading data');
if (data) {
  setData(data.data);
}
```

## Summary

The error handling system provides:

1. **Automatic error classification** - Know what type of error occurred
2. **User-friendly messages** - Show readable errors to users
3. **Safe operations** - Prevent crashes from undefined/null
4. **Retry logic** - Automatically retry transient failures
5. **React integration** - Hooks and components for React apps
6. **Consistent handling** - Same error handling pattern everywhere

Use these utilities throughout your codebase to ensure robust error handling!
