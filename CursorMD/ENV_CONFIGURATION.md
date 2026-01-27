# Environment Configuration Guide

## Backend Connection Configuration

This document describes the backend connection settings in `.env.local`.

### Required Environment Variables

#### Database Connection
```env
MONGODB_URI=mongodb://remoteUser:password@sql.infodatixhosting.com:27017/clinic?authSource=admin
```
- **Purpose**: MongoDB connection string for database access
- **Format**: `mongodb://username:password@host:port/database?authSource=admin`
- **Note**: Currently using remote MongoDB server

#### Authentication & Security
```env
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```
- **JWT_SECRET**: Secret key for signing access tokens (generate with `openssl rand -hex 32`)
- **JWT_REFRESH_SECRET**: Secret key for signing refresh tokens (should be different from JWT_SECRET)
- **ENCRYPTION_KEY**: Key for encrypting PHI data (32-byte hex string)
- **Security Note**: ⚠️ These should all be unique, random values. Never use the same value for all three.

#### Application URLs
```env
NODE_ENV=development
PORT=5053
NEXT_PUBLIC_API_URL=http://localhost:5053/api
NEXT_PUBLIC_APP_URL=http://localhost:5053
NEXT_PUBLIC_SOCKET_URL=http://localhost:5053/socket.io/
```
- **PORT**: Server port (default: 5053)
- **NEXT_PUBLIC_API_URL**: Base URL for API endpoints
- **NEXT_PUBLIC_APP_URL**: Base URL for the application (used in redirects, emails)
- **NEXT_PUBLIC_SOCKET_URL**: Socket.IO server URL

#### PayPal Integration
```env
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
PAYPAL_BASE_URL=https://api-m.paypal.com
```
- **PAYPAL_BASE_URL**: Use `https://api-m.sandbox.paypal.com` for sandbox, `https://api-m.paypal.com` for production

#### SMTP Email Configuration
```env
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@doctorsclinic.services
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM="Doctor's Clinic <support@doctorsclinic.services>"
SMTP_REJECT_UNAUTHORIZED=true
```
- **SMTP_SECURE**: Use `true` for port 465 (SSL), `false` for port 587 (TLS)
- **SMTP_PORT**: 465 for SSL, 587 for TLS

#### WebRTC TURN Server
```env
NEXT_PUBLIC_TURN_SERVER_URL=turn:51.178.54.165:3478
NEXT_PUBLIC_TURN_USERNAME=telemedicine
NEXT_PUBLIC_TURN_CREDENTIAL=your-turn-password
```
- **Purpose**: TURN server for WebRTC video calls (telemedicine)
- **Format**: `turn:host:port`

### Optional Variables

#### MongoDB Connection Pool (Optional)
```env
MONGODB_MAX_POOL_SIZE=20
MONGODB_MIN_POOL_SIZE=5
```
- Defaults are set in `lib/db/connection.js` if not specified

### Security Best Practices

1. **Never commit `.env.local` to git** - It's already in `.gitignore`
2. **Use unique secrets**: Generate different values for JWT_SECRET, JWT_REFRESH_SECRET, and ENCRYPTION_KEY
3. **Rotate secrets regularly**: Especially in production
4. **Use strong passwords**: For MongoDB, SMTP, and TURN server
5. **Environment-specific configs**: Use different values for development, staging, and production

### Generating Secure Keys

```bash
# Generate JWT secrets (32+ characters recommended)
openssl rand -hex 32

# Generate encryption key (32-byte hex)
openssl rand -hex 32
```

### Current Configuration Status

✅ **Configured:**
- MongoDB connection
- JWT secrets (⚠️ should be unique)
- PayPal credentials
- SMTP settings
- TURN server

✅ **Added:**
- PORT
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_SOCKET_URL
- JWT_EXPIRES_IN
- JWT_REFRESH_EXPIRES_IN

⚠️ **Security Recommendations:**
1. Generate unique values for JWT_SECRET, JWT_REFRESH_SECRET, and ENCRYPTION_KEY
2. Use environment-specific configurations for production
3. Consider using a secrets manager for production deployments
