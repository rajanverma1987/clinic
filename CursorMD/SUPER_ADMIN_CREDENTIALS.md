# Super Admin Credentials

I've created a script to generate a super admin account with default credentials.

## Default Credentials

After running the script, you'll have:

**Email:** `admin@clinic-tool.com`  
**Password:** `Admin@1234`

## Quick Setup

Run this command:

```bash
npm run admin:quick
```

If that doesn't work due to environment variable loading, use the interactive script:

```bash
npm run admin:create
```

Then enter:
- **Email:** `admin@clinic-tool.com`
- **Password:** `Admin@1234` (or your preferred password)
- **First Name:** `Super`
- **Last Name:** `Admin`

## Login Instructions

1. Go to: `http://localhost:3000/login`
2. Enter the email and password above
3. Click "Sign In"
4. You'll see the Admin Panel navigation in the sidebar

## Change Password

After first login, you can change the password by running:

```bash
npm run admin:reset
```

---

**Note:** If you already have a super admin account, you can list all super admins with:

```bash
npm run admin:list
```

