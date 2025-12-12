# Unified Popup & Notification Components

## Overview

Created a unified, reusable popup and notification system using theme colors and design tokens. All components use CSS files instead of inline styles, making them globally usable and maintainable.

## Components Created

### 1. Alert Component (`components/ui/Alert.jsx` + `Alert.css`)

Unified popup dialog component for all alert types (info, success, warning, error, confirmation).

**Features:**
- Uses theme colors from CSS variables
- Supports custom icons
- Flexible action buttons
- Responsive design
- Clean, simple design matching the reference images

**Usage:**
```jsx
import { Alert } from '@/components/ui/Alert';
import { useState } from 'react';

function MyComponent() {
  const [showAlert, setShowAlert] = useState(false);

  return (
    <>
      <button onClick={() => setShowAlert(true)}>Show Alert</button>
      
      <Alert
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        type="info" // 'info' | 'success' | 'warning' | 'error' | 'confirm'
        title="Battery low!"
        message="Your battery is extremely low. Plug with a charger to prevent unwanted shutdown."
        actions={[
          { label: 'Ok', onClick: () => setShowAlert(false), variant: 'primary' }
        ]}
      />
    </>
  );
}
```

**Props:**
- `isOpen` (boolean) - Controls visibility
- `onClose` (function) - Called when closing
- `type` ('info' | 'success' | 'warning' | 'error' | 'confirm') - Alert type
- `icon` (ReactNode) - Custom icon (optional)
- `title` (string) - Alert title
- `message` (string) - Alert message
- `actions` (array) - Action buttons: `[{ label, onClick, variant, icon }]`
- `showCloseButton` (boolean) - Show close button (default: true)
- `size` ('sm' | 'md' | 'lg') - Alert size (default: 'md')

**Example with custom actions:**
```jsx
<Alert
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  type="confirm"
  title="Delete this item?"
  message="This item will be deleted from your device. You can restore this item from recycle bin."
  actions={[
    { 
      label: 'Cancel', 
      onClick: () => setShowConfirm(false), 
      variant: 'outline' 
    },
    { 
      label: 'Delete', 
      onClick: handleDelete, 
      variant: 'danger',
      icon: <TrashIcon />
    }
  ]}
/>
```

### 2. Modal Component (Updated)

Enhanced Modal component with premium styling using CSS classes.

**Features:**
- Premium gradient backdrop
- Pattern overlay
- Enhanced shadows and glows
- Smooth animations
- Uses theme colors

**Usage:**
```jsx
import { Modal } from '@/components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="lg" // 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'print'
>
  <p>Modal content goes here</p>
</Modal>
```

### 3. Toast Component (`components/ui/Toast.jsx` + `Toast.css`)

Reusable toast notification component.

**Features:**
- Uses theme colors
- Supports timestamp
- Auto-dismiss
- Smooth animations

**Usage:**
```jsx
import { Toast } from '@/components/ui/Toast';

<Toast
  message="Namaste! Welcome to Raavito Admin Dashboard 🙏"
  type="info" // 'info' | 'success' | 'warning' | 'error'
  duration={5000}
  timestamp={new Date()}
  onClose={() => console.log('Toast closed')}
/>
```

### 4. Toast System (Updated `lib/utils/toast.js`)

Updated the toast utility to use theme colors from CSS variables.

**Usage:**
```jsx
import { toast, showSuccess, showError, showWarning, showInfo } from '@/lib/utils/toast';

// Simple usage
toast.success('Operation completed successfully!');
toast.error('Something went wrong');
toast.warning('Please check your input');
toast.info('New update available');

// Or with duration
showSuccess('Saved!', 3000);
```

## Design System Integration

All components use:
- **Theme Colors**: CSS variables (`--color-primary-*`, `--color-secondary-*`, etc.)
- **Spacing**: Design tokens (`--space-*`, `--gap-*`)
- **Typography**: Token-based sizes (`--text-body-*`)
- **Shadows**: Token-based shadows (`--shadow-*`)
- **Border Radius**: Token-based (`--radius-*`)
- **Z-Index**: Proper layering (`--z-modal`, `--z-toast`)

## Benefits

1. **Unified Design**: All popups follow the same design language
2. **Theme Colors**: Automatically uses theme colors from CSS variables
3. **Maintainable**: CSS in separate files, not scattered in JSX
4. **Reusable**: One component for all popup types
5. **Responsive**: Works on all screen sizes
6. **Accessible**: Proper ARIA labels and keyboard support

## Migration Guide

### Replacing Old Popups

**Before:**
```jsx
// Old way - inline styles, different components
<div className="custom-popup" style={{ ... }}>
  <h2>Title</h2>
  <p>Message</p>
  <button>Ok</button>
</div>
```

**After:**
```jsx
// New way - unified component
<Alert
  isOpen={isOpen}
  onClose={handleClose}
  type="info"
  title="Title"
  message="Message"
/>
```

## Files Created/Modified

1. `components/ui/Alert.jsx` - New unified alert component
2. `components/ui/Alert.css` - Alert styles
3. `components/ui/Toast.jsx` - New toast component
4. `components/ui/Toast.css` - Toast styles
5. `components/ui/Modal.jsx` - Updated to use CSS classes
6. `components/ui/Modal.css` - New modal styles
7. `lib/utils/toast.js` - Updated to use theme colors
8. `app/globals.css` - Added shadow tokens

## Next Steps

1. Replace existing popup implementations with `Alert` component
2. Update toast notifications to use the new `Toast` component
3. Test all alert types and ensure proper theming
4. Add any missing variants or customization options as needed

