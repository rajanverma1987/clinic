# UI Components Documentation

This document describes the modern UI components created based on the DocAround design system.

## New Components

### 1. Button Component (`components/ui/Button.tsx`)
Enhanced button component with multiple variants matching DocAround design.

**Variants:**
- `primary`: Blue background with white text (default)
- `secondary`: Gray background
- `danger`: Red background
- `outline`: White background with border

**Sizes:**
- `sm`: Small
- `md`: Medium (default)
- `lg`: Large

**Features:**
- Loading state support
- Disabled state
- Active states
- Smooth transitions

**Usage:**
```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="md" isLoading={false}>
  Click Me
</Button>
```

---

### 2. Input Component (`components/ui/Input.tsx`)
Enhanced input field with better styling and error handling.

**Features:**
- Label support
- Error message display
- Helper text
- Hover states
- Focus ring

**Usage:**
```tsx
import { Input } from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  error={error}
  helperText="Enter your email address"
  placeholder="you@example.com"
/>
```

---

### 3. SearchBar Component (`components/ui/SearchBar.tsx`)
Modern search input with icon support.

**Features:**
- Built-in search icon
- Minimal variant option
- Real-time search callback
- Clean, modern design

**Usage:**
```tsx
import { SearchBar } from '@/components/ui/SearchBar';

<SearchBar
  placeholder="Search..."
  onSearch={(value) => handleSearch(value)}
  showIcon={true}
/>
```

---

### 4. PhoneInput Component (`components/ui/PhoneInput.tsx`)
Specialized phone number input with country code dropdown.

**Features:**
- Country code selector
- Phone number validation (digits only)
- Modern dropdown interface
- Error handling
- Required field support

**Country Codes Supported:**
- +1 (US)
- +44 (UK)
- +91 (IN)
- +86 (CN)
- +61 (AU)
- +33 (FR)
- +49 (DE)
- +81 (JP)
- +82 (KR)
- +971 (AE)

**Usage:**
```tsx
import { PhoneInput } from '@/components/ui/PhoneInput';

<PhoneInput
  label="Phone Number"
  value={phone}
  onChange={(value) => setPhone(value)}
  countryCode="+1"
  onCountryCodeChange={(code) => setCountryCode(code)}
  required
/>
```

---

### 5. DatePicker Component (`components/ui/DatePicker.tsx`)
Enhanced date input with calendar icon.

**Features:**
- Calendar icon indicator
- Label support
- Error handling
- Custom styling
- All standard date input attributes

**Usage:**
```tsx
import { DatePicker } from '@/components/ui/DatePicker';

<DatePicker
  label="Select Date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  min={new Date().toISOString().split('T')[0]}
  required
/>
```

---

### 6. Textarea Component (`components/ui/Textarea.tsx`)
Enhanced textarea with character count and better styling.

**Features:**
- Label support
- Error handling
- Helper text
- Character counter (optional)
- Clean, modern design

**Usage:**
```tsx
import { Textarea } from '@/components/ui/Textarea';

<Textarea
  label="Notes"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  rows={4}
  showCount={true}
  maxLength={500}
  placeholder="Enter your notes..."
/>
```

---

### 7. Tabs Component (`components/ui/Tabs.tsx`)
Horizontal tab navigation component.

**Variants:**
- `default`: Standard tabs with underline indicator
- `pills`: Pill-shaped tabs (perfect for category filters)

**Features:**
- Active tab highlighting
- Count badges
- Smooth transitions
- Horizontal scrolling support

**Usage:**
```tsx
import { Tabs } from '@/components/ui/Tabs';

const tabs = [
  { id: 'all', label: 'All', count: 10 },
  { id: 'active', label: 'Active', count: 5 },
];

<Tabs
  tabs={tabs}
  activeTab={activeTab}
  onChange={(tabId) => setActiveTab(tabId)}
  variant="pills"
/>
```

---

### 8. Tag Component (`components/ui/Tag.tsx`)
Pill-shaped tag/badge component for categories and labels.

**Variants:**
- `default`: Gray
- `primary`: Blue
- `success`: Green
- `warning`: Yellow
- `danger`: Red

**Sizes:**
- `sm`: Small
- `md`: Medium (default)
- `lg`: Large

**Features:**
- Clickable support
- Multiple color variants
- Rounded pill design

**Usage:**
```tsx
import { Tag } from '@/components/ui/Tag';

<Tag variant="primary" size="sm">
  Cardiology
</Tag>
```

---

### 9. Card Component (`components/ui/Card.tsx`)
Enhanced card container with modern styling.

**Features:**
- Title support
- Action buttons area
- Hover effects
- Clean shadows
- Rounded corners

**Usage:**
```tsx
import { Card } from '@/components/ui/Card';

<Card title="Card Title" actions={<Button>Action</Button>}>
  Card content goes here
</Card>
```

---

## Design System Features

All components follow the DocAround design principles:

1. **Color Palette:**
   - Primary: Blue (#007AFF / blue-600)
   - Success: Green (green-100/green-700)
   - Warning: Yellow (yellow-100/yellow-700)
   - Danger: Red (red-100/red-700)
   - Neutral: Gray (gray-100/gray-900)

2. **Typography:**
   - Font weights: medium (500), semibold (600), bold (700)
   - Consistent text sizes across components

3. **Spacing:**
   - Consistent padding: 4px, 8px, 12px, 16px, 24px
   - Standard gaps between elements

4. **Border Radius:**
   - Small: 0.375rem (6px) - inputs, buttons
   - Medium: 0.5rem (8px) - cards
   - Large: 0.75rem (12px) - large cards
   - Full: 9999px - pills, tags

5. **Shadows:**
   - Subtle shadows for depth
   - Hover effects with shadow transitions

## Updated Pages

The following pages have been updated to use the new components:

1. **Appointments Page** (`app/appointments/page.tsx`)
   - Uses `DatePicker` for date filtering
   - Uses `Tag` for status labels
   - Enhanced visual appearance

2. **Patients Page** (`app/patients/page.tsx`)
   - Uses `SearchBar` for patient search
   - Uses `PhoneInput` for phone number entry
   - Uses `DatePicker` for date of birth

3. **New Appointment Page** (`app/appointments/new/page.tsx`)
   - Uses `DatePicker` for appointment date
   - Uses `Textarea` for notes

## Import Helper

All components can be imported from a single file:

```tsx
import {
  Button,
  Input,
  Card,
  SearchBar,
  PhoneInput,
  DatePicker,
  Textarea,
  Tabs,
  Tag,
} from '@/components/ui';
```

## Future Enhancements

Potential improvements for future iterations:

1. Add Select/Dropdown component matching DocAround style
2. Add Radio button component
3. Add Checkbox component
4. Add Modal/Dialog component
5. Add Toast notification component
6. Add Loading spinner component
7. Add Avatar component
8. Add Badge component variants

