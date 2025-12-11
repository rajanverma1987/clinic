# Notification System

## Overview

A comprehensive notification system that provides toast notifications throughout the application. The system includes:

1. **NotificationContext** - React context wrapper for easy access to notifications
2. **WelcomeNotification** - Automatic welcome message after login
3. **Toast Manager** - Underlying toast notification system

## Features

- ✅ Premium toast notifications with animations
- ✅ Multiple notification types (success, error, warning, info)
- ✅ Automatic welcome message after login
- ✅ Customizable duration
- ✅ Auto-dismiss with manual close option
- ✅ Responsive design
- ✅ High z-index to appear above all content

## Usage

### Using the Notification Context Hook

```javascript
import { useNotifications } from '@/contexts/NotificationContext';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo, showWelcome } = useNotifications();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!');
    } catch (error) {
      showError('Failed to save data');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Available Methods

- `showNotification(message, type, duration)` - Generic notification
- `showSuccess(message, duration)` - Success notification (green)
- `showError(message, duration)` - Error notification (red)
- `showWarning(message, duration)` - Warning notification (yellow)
- `showInfo(message, duration)` - Info notification (blue)
- `showWelcome(userName, duration)` - Welcome notification with user's name

### Parameters

- `message` (string) - The notification message to display
- `type` (string) - One of: 'success', 'error', 'warning', 'info'
- `duration` (number) - Auto-dismiss time in milliseconds (default: 5000ms)

### Examples

```javascript
// Success notification
showSuccess('Appointment created successfully!', 5000);

// Error notification
showError('Failed to load data. Please try again.');

// Warning notification
showWarning('Your subscription expires in 3 days', 7000);

// Info notification
showInfo('New features available in settings');

// Welcome notification (automatically shown after login)
showWelcome('John Doe', 6000);
```

## Automatic Welcome Notification

The `WelcomeNotification` component automatically shows a welcome message when a user logs in. It:

- Detects when a user successfully logs in
- Extracts the user's name from their profile
- Shows a personalized welcome message
- Only shows once per login session
- Doesn't show on login/register pages

## Integration

The notification system is already integrated into the app:

1. **NotificationProvider** - Added to `components/providers/Providers.jsx`
2. **WelcomeNotification** - Added to `components/layout/Layout.jsx`

## Styling

Notifications use the premium toast design with:

- Glassmorphism effect (backdrop blur)
- Smooth slide-in animations
- Color-coded borders based on type
- Professional icons for each type
- Responsive sizing

## Z-Index Management

Notifications use CSS variables for z-index:

- `--z-toast` (default: 10060) - Toast container z-index

This ensures notifications appear above all other content including modals and dropdowns.

## Migration from Old Toast System

The old toast system (`lib/utils/toast.js`) is still available and functional. However, for new code, prefer using the `useNotifications` hook for better React integration.

**Old way:**

```javascript
import { showError } from '@/lib/utils/toast';
showError('Error message');
```

**New way (recommended):**

```javascript
import { useNotifications } from '@/contexts/NotificationContext';
const { showError } = useNotifications();
showError('Error message');
```
