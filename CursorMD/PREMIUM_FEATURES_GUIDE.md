# Premium Features System - Implementation Guide

**Date:** December 10, 2024
**Status:** ✅ Implemented
**Location:** `lib/utils/premium-features.js`, `hooks/usePremiumFeatures.js`, `components/ui/PremiumFeatureGuard.jsx`

---

## 📚 Overview

The Premium Features System allows you to control access to features based on user subscription tiers. It provides:

- ✅ Feature access control
- ✅ Tier-based permissions
- ✅ Automatic upgrade prompts
- ✅ React hooks for easy integration
- ✅ Guard components for wrapping premium content

---

## 🎯 Feature Tiers

### FREE Tier (Level 0)
- Custom pricing page
- Basic features
- Limited access

### BASIC Tier (Level 1)
- All Free features
- Appointment reminders
- Premium theme

### PROFESSIONAL Tier (Level 2)
- All Basic features
- Telemedicine
- Advanced analytics
- Custom reports
- Export reports
- Advanced prescriptions
- Inventory management
- SMS notifications

### ENTERPRISE Tier (Level 3)
- All Professional features
- White label
- Custom branding
- Multi-location
- API access
- Third-party integrations
- Custom webhooks
- Advanced security
- Audit logs
- Two-factor authentication
- Single sign-on (SSO)
- E-prescriptions

---

## 🔧 Usage

### 1. Using the Hook

```jsx
'use client';

import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';

export default function MyComponent() {
  const { hasAccess, FEATURES, getCurrentTier } = usePremiumFeatures();

  // Check if user has access to a feature
  const canUseTelemedicine = hasAccess(FEATURES.TELEMEDICINE);
  const currentTier = getCurrentTier();

  return (
    <div>
      {canUseTelemedicine ? (
        <TelemedicineFeature />
      ) : (
        <UpgradePrompt feature={FEATURES.TELEMEDICINE} />
      )}
    </div>
  );
}
```

### 2. Using the Guard Component

```jsx
'use client';

import { PremiumFeatureGuard } from '@/components/ui/PremiumFeatureGuard';
import { PREMIUM_FEATURES } from '@/lib/utils/premium-features';

export default function MyPage() {
  return (
    <PremiumFeatureGuard feature={PREMIUM_FEATURES.TELEMEDICINE}>
      <TelemedicineInterface />
    </PremiumFeatureGuard>
  );
}
```

### 3. Custom Fallback

```jsx
<PremiumFeatureGuard
  feature={PREMIUM_FEATURES.ADVANCED_ANALYTICS}
  fallback={<BasicAnalytics />}
>
  <AdvancedAnalytics />
</PremiumFeatureGuard>
```

### 4. Hiding Without Prompt

```jsx
<PremiumFeatureGuard
  feature={PREMIUM_FEATURES.WHITE_LABEL}
  showUpgradePrompt={false}
>
  <WhiteLabelSettings />
</PremiumFeatureGuard>
```

---

## 📋 Complete Feature List

### UI/UX Features
- `CUSTOM_PRICING_PAGE` - Premium pricing page design (FREE)
- `PREMIUM_THEME` - Premium theme colors (BASIC)
- `CUSTOM_BRANDING` - Custom colors and logos (ENTERPRISE)
- `WHITE_LABEL` - Remove all branding (ENTERPRISE)

### Analytics Features
- `ADVANCED_ANALYTICS` - Detailed insights (PROFESSIONAL)
- `CUSTOM_REPORTS` - Create custom reports (PROFESSIONAL)
- `EXPORT_REPORTS` - Export reports to CSV/PDF (PROFESSIONAL)

### Clinical Features
- `TELEMEDICINE` - Video consultations (PROFESSIONAL)
- `ADVANCED_PRESCRIPTIONS` - Advanced prescription features (PROFESSIONAL)
- `E_PRESCRIPTIONS` - Electronic prescriptions (ENTERPRISE)

### Management Features
- `MULTI_LOCATION` - Multiple clinic locations (ENTERPRISE)
- `INVENTORY_MANAGEMENT` - Inventory tracking (PROFESSIONAL)
- `APPOINTMENT_REMINDERS` - Automated reminders (BASIC)
- `SMS_NOTIFICATIONS` - SMS alerts (PROFESSIONAL)

### Integration Features
- `API_ACCESS` - Full REST API (ENTERPRISE)
- `THIRD_PARTY_INTEGRATIONS` - External integrations (ENTERPRISE)
- `CUSTOM_WEBHOOKS` - Webhook support (ENTERPRISE)

### Security Features
- `ADVANCED_SECURITY` - Enhanced security features (ENTERPRISE)
- `AUDIT_LOGS` - Activity audit logs (ENTERPRISE)
- `TWO_FACTOR_AUTH` - 2FA authentication (ENTERPRISE)
- `SSO` - Single sign-on (ENTERPRISE)

---

## 🎨 Pricing Page Implementation

The pricing page (`app/pricing/page.jsx`) is now:

✅ **Fully theme-compliant** - All colors use theme tokens
✅ **Premium design** - Enhanced with hover effects and animations
✅ **Premium features ready** - Listed as FREE tier feature (accessible to all)
✅ **SubscriptionCard updated** - All hardcoded colors replaced with theme colors

### Changes Made:
1. **SubscriptionCard Component** (`components/ui/SubscriptionCard.jsx`)
   - Replaced all `blue-*` colors with `primary-*`
   - Replaced all `green-*` colors with `secondary-*`
   - Replaced all `gray-*` colors with `neutral-*`
   - Replaced `purple-*` with `primary-*`
   - Replaced `orange-*` with `status-warning`

2. **Pricing Page** (`app/pricing/page.jsx`)
   - Added hover effects to badge
   - Enhanced billing cycle toggle with scale and shadow effects
   - Added animate-pulse to "Save 20%" badge
   - Improved empty state with gradient backgrounds

---

## 🔐 Backend Integration

To fully enable this system, you need to:

### 1. Add Subscription Tier to User Model

```javascript
// In your User model
{
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'professional', 'enterprise'],
    default: 'free',
  },
  subscription: {
    tier: String,
    planId: String,
    status: String,
    startDate: Date,
    endDate: Date,
  }
}
```

### 2. API Endpoint Protection

```javascript
import { hasFeatureAccess, PREMIUM_FEATURES } from '@/lib/utils/premium-features';

// In your API route
export async function GET(request) {
  const user = await getCurrentUser(request);

  // Check feature access
  if (!hasFeatureAccess(PREMIUM_FEATURES.ADVANCED_ANALYTICS, user)) {
    return Response.json(
      { error: 'This feature requires a Professional subscription' },
      { status: 403 }
    );
  }

  // Feature logic...
}
```

### 3. Update User After Subscription

```javascript
// After successful subscription
await User.findByIdAndUpdate(userId, {
  subscriptionTier: 'professional', // or tier from subscription plan
  'subscription.tier': 'professional',
  'subscription.planId': planId,
  'subscription.status': 'active',
});
```

---

## 🧪 Testing

### Test Different Tiers

```jsx
// Mock different user tiers for testing
const testUsers = {
  free: { subscriptionTier: 'free' },
  basic: { subscriptionTier: 'basic' },
  professional: { subscriptionTier: 'professional' },
  enterprise: { subscriptionTier: 'enterprise' },
};

// Test component with different users
<MockAuthProvider user={testUsers.professional}>
  <MyComponent />
</MockAuthProvider>
```

---

## 📝 Examples

### Example 1: Conditional Rendering

```jsx
'use client';

import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';

export default function DashboardPage() {
  const { hasAccess, FEATURES, isAtLeastTier, TIERS } = usePremiumFeatures();

  return (
    <Layout>
      <h1>Dashboard</h1>

      {/* Basic stats - available to all */}
      <BasicStats />

      {/* Advanced analytics - Professional+ only */}
      {hasAccess(FEATURES.ADVANCED_ANALYTICS) && <AdvancedAnalytics />}

      {/* Telemedicine widget */}
      {hasAccess(FEATURES.TELEMEDICINE) && <TelemedicineWidget />}

      {/* Enterprise features */}
      {isAtLeastTier(TIERS.ENTERPRISE) && (
        <>
          <AuditLogs />
          <MultiLocationManager />
        </>
      )}
    </Layout>
  );
}
```

### Example 2: Navigation Menu

```jsx
'use client';

import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';

export function Navigation() {
  const { hasAccess, FEATURES } = usePremiumFeatures();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', requiredFeature: null },
    { label: 'Patients', path: '/patients', requiredFeature: null },
    { label: 'Appointments', path: '/appointments', requiredFeature: null },
    {
      label: 'Telemedicine',
      path: '/telemedicine',
      requiredFeature: FEATURES.TELEMEDICINE,
    },
    { label: 'Reports', path: '/reports', requiredFeature: FEATURES.ADVANCED_ANALYTICS },
    { label: 'Settings', path: '/settings', requiredFeature: null },
  ];

  return (
    <nav>
      {menuItems.map((item) => {
        // Skip if user doesn't have access
        if (item.requiredFeature && !hasAccess(item.requiredFeature)) {
          return null;
        }

        return (
          <Link key={item.path} href={item.path}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

### Example 3: Feature Badge

```jsx
'use client';

import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';

export function FeatureBadge({ feature, children }) {
  const { hasAccess, getFeatureInfo } = usePremiumFeatures();
  const featureInfo = getFeatureInfo(feature);
  const hasFeatureAccess = hasAccess(feature);

  return (
    <div className='relative inline-block'>
      {children}
      {!hasFeatureAccess && (
        <span className='absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md'>
          PRO
        </span>
      )}
    </div>
  );
}

// Usage
<FeatureBadge feature={FEATURES.TELEMEDICINE}>
  <Button>Start Video Call</Button>
</FeatureBadge>
```

---

## 🚀 Next Steps

1. ✅ **Created** - Premium features system
2. ✅ **Created** - React hook
3. ✅ **Created** - Guard component
4. ✅ **Updated** - Pricing page with premium design
5. ⏳ **TODO** - Add subscription tier to User model
6. ⏳ **TODO** - Protect API endpoints
7. ⏳ **TODO** - Update subscription flow to set tier
8. ⏳ **TODO** - Add feature badges to navigation
9. ⏳ **TODO** - Implement in all premium features

---

## 📚 Additional Resources

- **Feature Constants:** `lib/utils/premium-features.js`
- **React Hook:** `hooks/usePremiumFeatures.js`
- **Guard Component:** `components/ui/PremiumFeatureGuard.jsx`
- **Example Usage:** This guide

---

**Status:** ✅ System ready for use
**Last Updated:** December 10, 2024
