# PayPal Integration Setup Guide

## 🚨 CRITICAL: Payment Security Issue Found & Fixed

### The Problem:
Your subscription plans are switching **WITHOUT requiring payment** because PayPal integration is not configured.

### The Fix Applied:
✅ Added strict validation - paid plans now **BLOCK** upgrades without PayPal
✅ Users see clear error message instead of getting free access
✅ Revenue is protected until PayPal is configured

---

## Current Status

### ❌ PayPal NOT Configured:
```
Error: Client Authentication failed
Reason: PayPal credentials missing or invalid
Impact: Users CANNOT upgrade to paid plans (PROTECTED)
```

### What Happens Now:
- ✅ Users trying to upgrade to paid plans see error message
- ✅ "This plan requires payment but PayPal integration is not configured"
- ✅ They're instructed to contact support or choose free plan
- ✅ **NO FREE ACCESS TO PAID PLANS** (Revenue protected)

---

## How to Enable PayPal Integration

### Step 1: Get PayPal Credentials

1. **Go to PayPal Developer Portal**:
   - Sandbox (Testing): https://developer.paypal.com/dashboard/
   - Production (Live): https://developer.paypal.com/dashboard/

2. **Create App** (if not exists):
   - Click "Create App"
   - Name: "ClinicHub Subscriptions"
   - App Type: "Merchant"

3. **Get Credentials**:
   - Client ID: `AXxxx...` (visible on app page)
   - Secret: Click "Show" to reveal (keep this SECRET!)

### Step 2: Add to Environment Variables

Edit your `.env.local` file:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_actual_client_id_here
PAYPAL_CLIENT_SECRET=your_actual_client_secret_here

# Use SANDBOX for testing, PRODUCTION for live
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

# Your app URL (for PayPal redirects)
NEXT_PUBLIC_APP_URL=http://localhost:5053
```

**Important**:
- Use **sandbox** credentials for testing
- Use **production** credentials for live payments
- Never commit these credentials to git!

### Step 3: Configure PayPal Plans

Run the setup script:

```bash
npm run setup:paypal-plans
```

This script will:
1. ✅ Check if PayPal credentials are configured
2. ✅ Find all paid plans without PayPal integration
3. ✅ Create PayPal billing plans for each
4. ✅ Link PayPal plan IDs to database plans
5. ✅ Show summary of results

**Expected Output**:
```
✅ PayPal plan created for: Basic ($49.99/month)
✅ PayPal plan created for: Professional ($99.99/month)
✅ PayPal plan created for: Enterprise ($199.99/month)
```

### Step 4: Test Payment Flow

1. **Login** as a regular user (not super_admin)
2. **Go to** `/subscription`
3. **Click** "Switch to this Plan" on Basic plan
4. **Expected**:
   - Alert: "You will be redirected to PayPal..."
   - Redirect to PayPal Sandbox
   - Mock payment page (use sandbox test account)
   - Complete payment
   - Redirect back to app
   - Subscription activated

### Step 5: Set Up Webhooks (Important!)

PayPal needs to notify your app about payment events:

1. **Go to**: PayPal Developer Dashboard → Apps → Your App → Webhooks
2. **Add Webhook URL**: `https://your-domain.com/api/webhooks/paypal`
3. **Select Events**:
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `PAYMENT.SALE.COMPLETED`
   - `PAYMENT.SALE.DENIED`

4. **Save** and note the Webhook ID

---

## Testing with PayPal Sandbox

### Sandbox Test Accounts:

PayPal provides test accounts for sandbox testing:

**Buyer Account (Customer)**:
- Email: (create in sandbox or use provided)
- Use this to test payments

**Seller Account (You)**:
- This is your PayPal Business account in sandbox
- Receives test payments

### How to Test:

1. **Get Test Account**:
   - Go to: https://developer.paypal.com/dashboard/accounts
   - Create sandbox account or use existing
   - Note the email and password

2. **Make Test Payment**:
   - In your app, upgrade to paid plan
   - Redirects to PayPal sandbox
   - Login with TEST buyer account
   - Approve payment
   - Redirects back to your app

3. **Verify**:
   - Subscription shows as ACTIVE
   - Features are enabled
   - Payment recorded in database

---

## Production Deployment

### When Ready for Live Payments:

1. **Switch to Production Credentials**:
   ```env
   PAYPAL_BASE_URL=https://api-m.paypal.com  # Remove -sandbox
   PAYPAL_CLIENT_ID=production_client_id
   PAYPAL_CLIENT_SECRET=production_client_secret
   ```

2. **Re-run Setup**:
   ```bash
   npm run setup:paypal-plans
   ```

3. **Update Webhooks**:
   - Add production webhook URL
   - Same events as sandbox

4. **Test Thoroughly**:
   - Test with small amount first
   - Verify payments arrive in your PayPal account
   - Test cancellation flow
   - Test failed payment handling

---

## Current Security Status

### ✅ SECURED (Without PayPal):
```
User tries to upgrade to paid plan
    ↓
System checks: Does plan have PayPal integration?
    ↓
NO → ERROR: "Plan requires payment but PayPal not configured"
    ↓
User CANNOT upgrade without payment ✅
Revenue PROTECTED ✅
```

### ✅ SECURE (With PayPal Configured):
```
User tries to upgrade to paid plan
    ↓
System checks: Does plan have PayPal integration?
    ↓
YES → Create PayPal subscription
    ↓
Redirect to PayPal ✅
    ↓
User MUST complete payment ✅
    ↓
Only after payment → Access granted ✅
```

---

## Summary

### Current State:
- ❌ PayPal NOT configured (credentials missing/invalid)
- ✅ Paid plans BLOCKED (users can't upgrade without payment)
- ✅ Revenue PROTECTED (no free access)

### To Enable Payments:
1. Add valid PayPal credentials to `.env.local`
2. Run `npm run setup:paypal-plans`
3. Test with sandbox account
4. Configure webhooks
5. Switch to production when ready

### Security:
- ✅ Paid plans cannot be activated without payment
- ✅ Clear error messages guide users
- ✅ No revenue loss

---

## Quick Setup Checklist

- [ ] Create PayPal Developer account
- [ ] Get sandbox credentials (Client ID & Secret)
- [ ] Add credentials to `.env.local`
- [ ] Run `npm run setup:paypal-plans`
- [ ] Test payment with sandbox account
- [ ] Configure webhook URL
- [ ] Test complete flow
- [ ] Switch to production credentials
- [ ] Re-run setup for production
- [ ] Test live payments

---

## Need Help?

**PayPal Documentation**:
- Getting Started: https://developer.paypal.com/docs/api/overview/
- Subscriptions API: https://developer.paypal.com/docs/subscriptions/
- Sandbox Testing: https://developer.paypal.com/tools/sandbox/

**Support**:
If you need help setting this up, the error in the console shows exactly what's needed.

---

**IMPORTANT**: Until PayPal is configured, users CANNOT upgrade to paid plans (by design - this protects your revenue). Free Trial still works normally.

