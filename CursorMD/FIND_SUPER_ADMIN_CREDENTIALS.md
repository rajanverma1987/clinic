# How to Find Your Super Admin Credentials

## ⚠️ Important: Passwords Cannot Be Retrieved

**Passwords are encrypted and cannot be retrieved.** However, you can:
- ✅ Find your super admin email addresses
- ✅ Reset the password to a new one
- ✅ Create a new super admin account

---

## Step-by-Step Guide

### Option 1: List Existing Super Admins

To see all super admin email addresses in your system:

```bash
npm run admin:list
```

This will show:
- All super admin email addresses
- Their names
- Which tenant they belong to
- When they were created

### Option 2: Reset Password

If you know the email but forgot the password:

```bash
npm run admin:reset
```

This will:
1. Ask for the super admin email
2. Let you set a new password
3. Confirm the change

### Option 3: Create New Super Admin

If you don't have a super admin account:

```bash
npm run admin:create
```

Or use the full setup script (creates tenant + super admin):

```bash
npm run setup
```

---

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run admin:list` | List all super admin users and their emails |
| `npm run admin:reset` | Reset password for existing super admin |
| `npm run admin:create` | Create a new super admin user |
| `npm run setup` | Initial setup (creates tenant + super admin) |

---

## After Finding/Resetting

1. Go to: `http://localhost:3000/login`
2. Enter your super admin email
3. Enter your password (the one you set or reset)
4. Click "Sign In"
5. You'll see "Admin Panel" link in the sidebar

---

## Troubleshooting

### "MONGODB_URI environment variable not found"
- Make sure `.env.local` file exists in the project root
- Check that it contains: `MONGODB_URI=mongodb://...`

### "No super admin users found"
- Run `npm run admin:create` to create one

### "User not found"
- Run `npm run admin:list` to see all available emails
- Make sure you're using the correct email address

---

## Security Note

Passwords are stored using bcrypt hashing - they cannot be retrieved or viewed. You can only reset them to new values.

