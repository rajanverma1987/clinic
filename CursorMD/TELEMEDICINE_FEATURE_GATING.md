# Telemedicine Feature Gating
## Subscription-Based Video Consultation Access

---

## Overview

Video consultations are now properly gated based on subscription plan. Users without the "Telemedicine" feature in their plan can only book in-person appointments.

---

## Implementation

### Feature Check

```typescript
import { useFeatures } from '@/hooks/useFeatures';

const { hasFeature } = useFeatures();
const hasTelemedicine = hasFeature('Telemedicine');
```

### Logic Flow

```
1. Check if "Telemedicine" is in subscription plan
   ↓
2a. YES → Show both options (In-Person + Video)
2b. NO  → Show only In-Person (selected, disabled)
   ↓
3. If NO → Display upgrade notice with CTA
```

---

## Visual States

### State 1: Telemedicine Available ✅

**User has Telemedicine in their plan**

```
┌─────────────────────────────────────────────────┐
│ Consultation Method *                           │
│                                                 │
│ ┌──────────────────┐  ┌──────────────────────┐ │
│ │ 🏥 In-Person     │  │ 🎥 Video             │ │
│ │ Patient visits   │  │ Remote via video     │ │
│ │ clinic           │  │ call                 │ │
│ └──────────────────┘  └──────────────────────┘ │
│      ↑ Clickable          ↑ Clickable          │
└─────────────────────────────────────────────────┘
```

**Behavior**:
- Both buttons are clickable
- User can select either option
- Video option shows email field when selected
- Full telemedicine features available

---

### State 2: Telemedicine NOT Available ❌

**User does NOT have Telemedicine in their plan**

```
┌─────────────────────────────────────────────────┐
│ Consultation Method *                           │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ 🏥 In-Person Visit          ✓ Selected   │   │
│ │ Patient visits clinic                     │   │
│ └───────────────────────────────────────────┘   │
│      ↑ Disabled / Not clickable                 │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🎥 Video Consultations Not Available        │ │
│ │                                             │ │
│ │ Upgrade your subscription to enable         │ │
│ │ secure video consultations with patients.   │ │
│ │                                             │ │
│ │          [✨ Upgrade Plan]                   │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Behavior**:
- Only In-Person option shown (selected)
- Option is disabled (not clickable)
- Upgrade notice displayed below
- "Upgrade Plan" button redirects to `/subscription`
- User CANNOT book video consultations

---

## Detailed Visual Design

### Without Telemedicine Feature:

**In-Person Card** (Selected, Disabled):
```
┌─────────────────────────────────────────────┐
│   🏥   In-Person Visit      ✓ Selected     │
│        Patient visits clinic                │
└─────────────────────────────────────────────┘
         ↑ Blue border, slightly faded
         ↑ cursor: not-allowed
```

**Upgrade Notice**:
```
┌─────────────────────────────────────────────┐
│ 🎥  Video Consultations Not Available       │
│                                             │
│ Upgrade your subscription to enable secure  │
│ video consultations with patients remotely. │
│                                             │
│        [✨ Upgrade Plan] ← Purple button    │
└─────────────────────────────────────────────┘
    ↑ Gradient background (purple to blue)
```

---

## Feature Detection

### How It Works

```typescript
// 1. useFeatures hook fetches subscription features
const { hasFeature, features } = useFeatures();

// 2. Check if Telemedicine is in the list
const hasTelemedicine = hasFeature('Telemedicine');

// 3. Conditionally render UI
{!hasTelemedicine ? (
  // Show only in-person + upgrade notice
) : (
  // Show both options
)}
```

### Features List Example

**User with Telemedicine**:
```json
{
  "features": [
    "Patient Management",
    "Appointment Scheduling",
    "Queue Management",
    "Telemedicine",  ← Feature present
    "Prescriptions Management",
    "Invoice & Billing"
  ]
}
```

**User without Telemedicine**:
```json
{
  "features": [
    "Patient Management",
    "Appointment Scheduling",
    "Queue Management",
    // "Telemedicine" ← Feature missing
    "Prescriptions Management"
  ]
}
```

---

## User Experience

### Scenario 1: Basic Plan User

```
1. Opens /appointments/new
2. Fills patient, doctor, date, time
3. Sees consultation method section
4. ONLY In-Person option visible (selected, disabled)
5. Sees upgrade notice below
6. Clicks "Upgrade Plan"
7. Redirected to /subscription
8. Selects plan with Telemedicine
9. After upgrade, can book video consultations
```

### Scenario 2: Premium Plan User

```
1. Opens /appointments/new
2. Fills patient, doctor, date, time
3. Sees consultation method section
4. Sees BOTH options (In-Person + Video)
5. Clicks "Video Consultation"
6. Email field appears
7. Fills email + checks consent
8. Books video appointment
9. Email sent to patient with link
```

---

## Code Implementation

### Appointment Booking Page

```tsx
import { useFeatures } from '@/hooks/useFeatures';

export default function NewAppointmentPage() {
  const { hasFeature } = useFeatures();
  const hasTelemedicine = hasFeature('Telemedicine');

  return (
    <form>
      {/* Consultation Method */}
      {!hasTelemedicine ? (
        <>
          {/* In-Person Only (Disabled) */}
          <div className="border-2 border-blue-500 bg-blue-50 opacity-75 cursor-not-allowed">
            {/* In-person card with checkmark */}
          </div>
          
          {/* Upgrade Notice */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50">
            <h4>Video Consultations Not Available</h4>
            <p>Upgrade to enable video consultations</p>
            <button onClick={() => router.push('/subscription')}>
              Upgrade Plan
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Both Options */}
          <button onClick={() => setIsTelemedicine(false)}>
            In-Person
          </button>
          <button onClick={() => setIsTelemedicine(true)}>
            Video
          </button>
        </>
      )}
    </form>
  );
}
```

---

## Upgrade Flow

### Step-by-Step

```
User without Telemedicine:
  ↓
Sees "Upgrade Plan" button
  ↓
Clicks button
  ↓
Redirected to /subscription
  ↓
Sees available plans:
  - Basic (no video)
  - Professional (✓ Telemedicine)
  - Enterprise (✓ Telemedicine)
  ↓
Clicks "Switch to this Plan"
  ↓
Completes PayPal payment
  ↓
Subscription updated
  ↓
Returns to appointments
  ↓
Now sees BOTH options!
  ↓
Can book video consultations ✅
```

---

## Feature Matrix

| Plan | Telemedicine | What User Sees |
|------|-------------|----------------|
| Free Trial | ✅ Yes | Both options available |
| Basic | ❌ No | Only in-person, upgrade notice |
| Professional | ✅ Yes | Both options available |
| Enterprise | ✅ Yes | Both options available |

---

## Benefits

### 1. Clear Monetization
- Users understand what they're missing
- Direct upgrade path
- Increases conversions

### 2. Better UX
- No confusing disabled video option
- Clear explanation of why not available
- One-click upgrade

### 3. Compliance
- Only paying users get telemedicine
- Proper licensing alignment
- Prevents unauthorized use

### 4. Smooth Upgrade
- User can upgrade mid-flow
- Returns to appointment booking
- Immediately sees new features

---

## Edge Cases

### 1. Subscription Expires During Booking

```
User starts booking → Selects video → Subscription expires
→ On submit, API validates → Returns error
→ Frontend shows: "Telemedicine no longer available"
→ Prompts to renew or switch to in-person
```

### 2. User Switches to Lower Plan

```
User had Telemedicine → Downgrades to Basic
→ Next visit to /appointments/new
→ Sees only in-person option
→ Previous video appointments still visible
→ Cannot book NEW video appointments
```

### 3. Admin Creates Appointment for User

```
Admin has access → Creates appointment for basic user
→ Admin CANNOT select video if user's plan doesn't have it
→ API validates and rejects video booking for non-telemedicine plans
```

---

## API Validation

### Backend Check

Even if frontend is bypassed, API validates:

```typescript
// POST /api/appointments
async function postHandler(req, user) {
  const { isTelemedicine } = req.body;
  
  if (isTelemedicine) {
    // Check if user has Telemedicine feature
    const hasFeature = await checkFeature(user.tenantId, 'Telemedicine');
    
    if (!hasFeature) {
      return errorResponse(
        'Telemedicine feature not available in your subscription plan',
        'FEATURE_NOT_AVAILABLE'
      );
    }
  }
  
  // Continue with booking...
}
```

**Security**: Always validate on backend, never trust frontend!

---

## Testing

### Test Scenarios

#### Test 1: User WITHOUT Telemedicine
```
1. Login as basic plan user
2. Go to /appointments/new
3. ✅ Verify only In-Person shown
4. ✅ Verify it's selected by default
5. ✅ Verify it's disabled (not clickable)
6. ✅ Verify upgrade notice displayed
7. Click "Upgrade Plan"
8. ✅ Verify redirects to /subscription
```

#### Test 2: User WITH Telemedicine
```
1. Login as professional plan user
2. Go to /appointments/new
3. ✅ Verify both options shown
4. ✅ Verify both are clickable
5. Click "Video Consultation"
6. ✅ Verify email field appears
7. ✅ Can book video appointment
```

#### Test 3: Upgrade Flow
```
1. Start with basic plan
2. See upgrade notice
3. Click upgrade
4. Complete payment
5. Return to appointments
6. ✅ Now see both options
7. ✅ Can select video
```

#### Test 4: API Validation
```
1. Try to POST video appointment without feature
2. ✅ API returns 403 error
3. ✅ Error message: "Feature not available"
```

---

## Styling Details

### Colors Used

**In-Person Card (Disabled)**:
- Border: `border-blue-500`
- Background: `bg-blue-50`
- Opacity: `opacity-75`
- Cursor: `cursor-not-allowed`

**Upgrade Notice**:
- Background: `bg-gradient-to-r from-purple-50 to-blue-50`
- Border: `border-purple-200`
- Button: `bg-purple-600 hover:bg-purple-700`

**Selected Badge**:
- Background: `bg-blue-600`
- Text: `text-white`
- Style: Rounded pill with checkmark

---

## Summary

### What Changed:

✅ **Feature Detection**: Uses `useFeatures` hook  
✅ **Conditional Rendering**: Shows different UI based on plan  
✅ **Default State**: In-person selected and disabled if no telemedicine  
✅ **Upgrade CTA**: Clear call-to-action to upgrade  
✅ **API Validation**: Backend enforces feature access  

### Result:

- **Clear monetization** strategy
- **Better user experience** 
- **Prevents unauthorized** video consultations
- **Smooth upgrade** path
- **Fully compliant** with licensing

---

**Telemedicine feature gating is now live on the appointments page!** 🎉🔒

