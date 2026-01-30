# Setup Instructions

**Date:** January 2025  
**Status:** Complete Setup Guide

## Prerequisites

- **Node.js:** 18.x or higher
- **MongoDB:** 6.0 or higher (local or MongoDB Atlas)
- **npm:** 9.x or higher
- **Git:** For version control

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd clinic
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/clinic-tool
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/clinic

# Authentication Secrets (generate strong random strings)
JWT_SECRET=<generate-64-char-hex-string>
JWT_REFRESH_SECRET=<generate-64-char-hex-string>
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# Encryption Key (32-byte hex string for PHI encryption)
ENCRYPTION_KEY=<generate-64-char-hex-string>

# Server
NODE_ENV=development
PORT=3000

# Email (Optional - for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=noreply@yourdomain.com

# SMS/WhatsApp (Optional - for notifications)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Redis (Optional - for caching)
REDIS_URL=redis://localhost:6379

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Generate Secrets

Generate secure random strings:

```bash
# Generate JWT secrets (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Database Setup

#### Option A: Local MongoDB

```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:6
```

#### Option B: MongoDB Atlas

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0)
3. Create database user
4. Whitelist your IP address
5. Get connection string
6. Update `MONGODB_URI` in `.env.local`

### 6. Initialize Database

Run setup script to create initial tenant and super admin:

```bash
npm run setup
```

This will prompt you for:
- Tenant name
- Super admin email
- Super admin password

### 7. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

### 8. Verify Installation

```bash
# Health check
curl http://localhost:3000/api/health

# Should return:
# {"success":true,"data":{"status":"ok","database":"connected"}}
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

### Building for Production

```bash
# Build application
npm run build

# Start production server
npm start
```

## Common Issues

### MongoDB Connection Error

**Error:** `MongooseError: connect ECONNREFUSED`

**Solution:**
- Ensure MongoDB is running
- Check `MONGODB_URI` is correct
- For Atlas, verify IP whitelist

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

### Module Not Found

**Error:** `Cannot find module`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Create Test Data:**
   - Create patients
   - Create appointments
   - Test workflows

2. **Configure Email:**
   - Set up SMTP for notifications
   - Test email sending

3. **Configure SMS/WhatsApp:**
   - Set up Twilio account
   - Test SMS/WhatsApp sending

4. **Review Documentation:**
   - Read `API_DOCUMENTATION.md`
   - Review `DEVELOPER_GUIDE.md`
   - Check `SECURITY_IMPLEMENTATION.md`

## Development Tips

1. **Use Environment Variables:** Never commit secrets
2. **Check Logs:** Monitor console for errors
3. **Test Incrementally:** Test each feature as you build
4. **Use Git:** Commit frequently with meaningful messages
5. **Follow Patterns:** Use existing code as reference

## Getting Help

- Check documentation in `CursorMD/` folder
- Review error messages carefully
- Check MongoDB connection
- Verify environment variables
- Review audit logs for debugging
