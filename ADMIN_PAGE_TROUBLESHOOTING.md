# Admin Page Troubleshooting Guide

## Issue: Can't Visit `/admin/subscriptions`

### Common Causes and Solutions

#### 1. **Not Logged In**
- **Symptom**: Page redirects to `/login` or shows "Access Denied"
- **Solution**: 
  1. Go to `http://localhost:3000/login`
  2. Log in with your super admin credentials
  3. Then try accessing `/admin/subscriptions` again

#### 2. **Not Logged In as Super Admin**
- **Symptom**: Page redirects to `/dashboard` or shows "Access Denied - You need super admin privileges"
- **Solution**:
  1. Log out from your current account
  2. Log in with a super admin account
  3. To find/create super admin: Run `npm run admin:list`

#### 3. **Page Not Found (404)**
- **Symptom**: Browser shows "404 - Page Not Found"
- **Solution**: 
  - Make sure the dev server is running: `npm run dev`
  - The page should be at: `app/admin/subscriptions/page.tsx`
  - Try rebuilding: `npm run build`

#### 4. **Blank Page**
- **Symptom**: Page loads but shows nothing
- **Solution**:
  - Open browser console (F12) to see any JavaScript errors
  - Check if you're logged in and have super admin role
  - Try refreshing the page (Ctrl+R or Cmd+R)

#### 5. **API Error**
- **Symptom**: Page loads but shows errors fetching subscription plans
- **Solution**:
  - Check browser console for API errors
  - Verify API endpoint `/api/admin/subscription-plans` is working
  - Make sure MongoDB is running and connected

---

## How to Verify Your Setup

### Step 1: Check if you're logged in
1. Open `http://localhost:3000/admin/subscriptions`
2. If redirected to `/login`, you're not logged in
3. Log in first

### Step 2: Check if you're super admin
1. After logging in, check your user role
2. Run this in browser console:
   ```javascript
   // Open browser console (F12) and check localStorage
   JSON.parse(localStorage.getItem('user') || '{}')
   ```
3. Or check the API response from `/api/auth/me`

### Step 3: Verify super admin account exists
```bash
npm run admin:list
```

This will show all super admin email addresses.

### Step 4: Create super admin if needed
```bash
npm run admin:create
```

---

## Expected Behavior

When you visit `http://localhost:3000/admin/subscriptions` as a super admin:

1. ✅ Page should load and show "Subscription Plans" heading
2. ✅ You should see a "+ Create Plan" button
3. ✅ You should see a table listing existing subscription plans (if any)
4. ✅ No redirects or error messages

---

## Quick Checklist

- [ ] Dev server is running (`npm run dev`)
- [ ] MongoDB is running and connected
- [ ] You're logged in (check `/login`)
- [ ] Your user role is `super_admin`
- [ ] No errors in browser console (F12)
- [ ] No errors in terminal/console

---

## Still Having Issues?

1. **Check browser console** (F12 → Console tab) for JavaScript errors
2. **Check Network tab** (F12 → Network tab) for failed API requests
3. **Check terminal** where `npm run dev` is running for server errors
4. **Try accessing other admin pages**:
   - `/admin` (dashboard)
   - `/admin/clients` (clients list)

If other admin pages work but subscriptions doesn't, there might be a specific issue with that page.

