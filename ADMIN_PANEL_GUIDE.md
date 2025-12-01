# Admin Panel Access Guide

## How to Access the Admin Panel

### Step 1: Find or Create a Super Admin User

#### Finding Your Super Admin Credentials

If you already have a super admin user but forgot the email/password:

1. **List all super admin users:**
   ```bash
   npm run admin:list
   ```
   This will show you all super admin email addresses in your system.

2. **Reset the password:**
   ```bash
   npm run admin:reset
   ```
   This will prompt you for the email and let you set a new password.

#### Creating a New Super Admin

If you don't have a super admin user yet, you can create one using:

**Option 1: Setup script (creates tenant + super admin)**
```bash
npm run setup
```

**Option 2: Admin management script (more flexible)**
```bash
npm run admin:create
```

Both will prompt you to:
1. Create or select a tenant (clinic)
2. Create a super admin user with email and password

### Step 2: Login as Super Admin

1. Navigate to the login page: `http://localhost:3000/login`
2. Enter your super admin email and password
3. Click "Sign In"

### Step 3: Access Admin Panel

Once logged in as a super admin, you'll see:

1. **Admin Panel Link in Sidebar** - Look for the "Admin Panel" link in the left sidebar (with a shield icon)
2. **Direct URLs**:
   - Admin Dashboard: `http://localhost:3000/admin`
   - Clients List: `http://localhost:3000/admin/clients`
   - Subscription Plans: `http://localhost:3000/admin/subscriptions`

## Admin Panel Features

### 1. Admin Dashboard (`/admin`)
- Overview statistics:
  - Total clients
  - Active subscriptions
  - Monthly revenue
  - System health
- Quick access cards to:
  - Manage Clients
  - Manage Subscription Plans
  - System Settings

### 2. Clients Management (`/admin/clients`)
- View all clinic clients (tenants)
- See subscription status for each client
- View client information (name, region, status)
- See next billing dates

### 3. Subscription Plans (`/admin/subscriptions`)
- Create new subscription plans
- View all existing plans
- Set pricing, features, and limits
- Mark plans as popular

## Creating Subscription Plans

1. Go to `/admin/subscriptions`
2. Click "Create Plan" button
3. Fill in the form:
   - Plan Name (e.g., "Basic", "Professional", "Enterprise")
   - Description (optional)
   - Price (in dollars, e.g., 29.99)
   - Currency (USD, EUR, etc.)
   - Billing Cycle (Monthly or Yearly)
   - Features (one per line)
   - Limits (max users, patients, storage)
   - Mark as popular (optional)
4. Click "Create Plan"
5. The plan will automatically be created in PayPal and linked

## Viewing Client List

1. Go to `/admin/clients`
2. You'll see a table with:
   - Client Name
   - Region
   - Status (Active/Inactive)
   - Subscription Plan
   - Subscription Status
   - Next Billing Date
   - Created Date

## Important Notes

- **Only super_admin users** can access the admin panel
- Regular clinic_admin users will be redirected to their dashboard
- The admin panel requires authentication
- All admin actions are logged for audit purposes

