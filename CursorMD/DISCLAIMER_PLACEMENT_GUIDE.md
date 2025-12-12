# Disclaimer Placement Guide

## Overview
This document outlines the optimal placement and styling for mandatory disclaimers throughout the clinic management system.

## Design System Specifications

### Typography
- **Title**: `text-body-sm` (14px / 20px line-height) / `font-semibold` (600) / `text-neutral-900`
- **Content**: `text-body-sm` (14px / 20px line-height) / `font-regular` (400) / `text-neutral-700`

### Colors
- **Background**: `bg-primary-100` (#E6F7FE)
- **Border**: `border-primary-500` (#2D9CDB) - 4px left border
- **Icon**: `text-primary-500` (#2D9CDB)
- **Title Text**: `text-neutral-900` (#1A1A1A)
- **Content Text**: `text-neutral-700` (#4F4F4F)

### Spacing
- **Padding**: `p-3` (12px)
- **Gap**: `gap-3` (12px)
- **Item Spacing**: `space-y-1.5` (6px between items)

### Border Radius
- **Container**: `rounded-lg` (8px)

## Optimal Placement Locations

### 1. Login Page ✅ (Already Implemented)
**Location**: Before the login form
**Type**: `general` (HIPAA Compliance)
**Reason**: Users must acknowledge HIPAA compliance before accessing PHI

```jsx
<form onSubmit={handleSubmit}>
  <Disclaimer type='general' className='mb-4' />
  {/* Form fields */}
</form>
```

### 2. Patient Registration Page ⚠️ (Needs Implementation)
**Location**: Before the submit button, after all form fields
**Type**: `general` (HIPAA Compliance)
**Reason**: Critical notice before creating account that will handle PHI

**Recommended Placement**:
```jsx
{/* All registration form fields */}
<Disclaimer type='general' className='mb-4' />
<Button type='submit'>Create Account</Button>
```

### 3. Prescription Creation/Edit Forms ✅ (Already Implemented)
**Location**: Before the prescription details section
**Type**: `prescription`
**Reason**: Legal requirement before issuing prescriptions

**Current Placement**:
```jsx
<div className='prescription-form-section mb-4'>
  <Disclaimer type='prescription' />
</div>
```

### 4. Telemedicine Session Page ✅ (Already Implemented)
**Location**: Before the "Join Session" button
**Type**: `telemedicine`
**Reason**: Critical safety notice before video consultation

**Current Placement**:
```jsx
<Disclaimer type='telemedicine' className='bg-white/95' />
<Button onClick={handleConnect}>Join Session</Button>
```

### 5. Settings - Data & Privacy Section ⚠️ (Recommended)
**Location**: At the top of data/privacy settings section
**Type**: `data` (HIPAA Compliance)
**Reason**: Remind users about data protection when configuring settings

**Recommended Placement**:
```jsx
<Card>
  <h2>Data & Privacy Settings</h2>
  <Disclaimer type='data' className='mb-4' />
  {/* Settings fields */}
</Card>
```

### 6. Appointment Booking Forms ⚠️ (Recommended)
**Location**: Before submit button (if medical consultation)
**Type**: `medical`
**Reason**: Medical disclaimer for appointment bookings

**Recommended Placement**:
```jsx
{/* Appointment form fields */}
<Disclaimer type='medical' className='mb-4' />
<Button type='submit'>Book Appointment</Button>
```

### 7. Clinical Notes/Patient Records ⚠️ (Recommended)
**Location**: At the top of patient record view/edit pages
**Type**: `general` (HIPAA Compliance)
**Reason**: PHI access reminder

**Recommended Placement**:
```jsx
<Card>
  <Disclaimer type='general' className='mb-4' />
  {/* Patient record content */}
</Card>
```

## Placement Rules

### DO ✅
- Place disclaimers **before** critical actions (submit buttons, join buttons)
- Use appropriate disclaimer type for context
- Keep disclaimers visible but not intrusive
- Use consistent spacing (`mb-4` typically)

### DON'T ❌
- Don't place disclaimers after submit buttons (users won't see them)
- Don't use multiple disclaimers on the same page (choose the most relevant)
- Don't make disclaimers too large or distracting
- Don't use disclaimers for non-mandatory information

## Disclaimer Types

| Type | Use Case | When to Show |
|------|----------|--------------|
| `general` | HIPAA compliance | Login, registration, PHI access pages |
| `medical` | Medical advice disclaimer | Appointment booking, general medical pages |
| `prescription` | Prescription legal notice | Prescription creation/edit forms |
| `telemedicine` | Telemedicine limitations | Before joining video sessions |
| `data` | Data protection notice | Settings pages, data export features |

## Implementation Checklist

- [x] Login page - `general` disclaimer
- [x] Prescription forms - `prescription` disclaimer
- [x] Telemedicine sessions - `telemedicine` disclaimer
- [ ] Patient registration - `general` disclaimer
- [ ] Settings data section - `data` disclaimer
- [ ] Appointment booking - `medical` disclaimer (if needed)
- [ ] Patient record pages - `general` disclaimer (if needed)

## Notes

- All disclaimers are **mandatory/required** - no optional disclaimers
- Keep text concise and legally accurate
- Follow design system tokens exactly for consistency
- Test on mobile devices to ensure readability

