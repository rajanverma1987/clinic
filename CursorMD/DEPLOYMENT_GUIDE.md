# Deployment Guide

**Date:** January 2025  
**Status:** Production Deployment Instructions

## Pre-Deployment Checklist

### Environment Variables
Ensure all required environment variables are set:

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/clinic?retryWrites=true&w=majority
MONGODB_MAX_POOL_SIZE=20
MONGODB_MIN_POOL_SIZE=5

# Authentication
JWT_SECRET=<64-character-hex-string>
JWT_REFRESH_SECRET=<64-character-hex-string>
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=<64-character-hex-string>

# Server
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=noreply@yourdomain.com

# SMS/WhatsApp (Twilio - Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Redis (Optional - for caching)
REDIS_URL=redis://localhost:6379

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Security Checklist
- [ ] All secrets are strong (64+ characters)
- [ ] Encryption key is unique and secure
- [ ] MongoDB connection uses SSL
- [ ] IP whitelist configured on MongoDB Atlas
- [ ] SSL certificate installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS configured for production domains only

---

## Deployment Platforms

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Configure Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables

4. **Configure Custom Domain:**
   - Add domain in Vercel Dashboard
   - Update DNS records as instructed

### Option 2: AWS EC2 / DigitalOcean

1. **Server Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

2. **Clone and Setup:**
```bash
git clone <your-repo>
cd clinic
npm install
npm run build
```

3. **Configure PM2:**
```bash
pm2 start npm --name "clinic-app" -- start
pm2 save
pm2 startup
```

4. **Configure Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### Option 3: Docker Deployment

1. **Create Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

2. **Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    restart: unless-stopped
```

3. **Deploy:**
```bash
docker-compose up -d
```

---

## Database Setup

### MongoDB Atlas Configuration

1. **Create Cluster:**
   - Minimum: M10 cluster (recommended for production)
   - Enable multi-region replication
   - Enable automated backups

2. **Network Access:**
   - Whitelist application server IPs
   - Remove 0.0.0.0/0 (allow all) in production

3. **Database User:**
   - Create dedicated user per environment
   - Use strong password
   - Grant minimum required permissions

4. **Connection String:**
   - Use connection string with SSL
   - Include retryWrites and w=majority

### Database Indexes

All indexes are automatically created by Mongoose. Verify in MongoDB Atlas:
- Check index usage in Performance Advisor
- Monitor slow queries (> 100ms)
- Review index recommendations

---

## Monitoring Setup

### Health Check Endpoint

```http
GET /api/health
```

Returns system status including:
- Database connectivity
- Memory usage
- Uptime

### Error Tracking (Sentry)

1. **Install Sentry:**
```bash
npm install @sentry/nextjs
```

2. **Configure:**
```javascript
// sentry.client.config.js
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring

- **New Relic / DataDog:** Set up APM
- **MongoDB Atlas:** Enable performance monitoring
- **Uptime Monitoring:** Use Pingdom or UptimeRobot

---

## Backup Strategy

### Database Backups

1. **MongoDB Atlas:**
   - Enable automated backups (daily)
   - Point-in-time recovery enabled
   - 30-day retention minimum

2. **Manual Backups:**
```bash
mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)
```

### Application Backups

- Code: Git repository (GitHub/GitLab)
- Environment variables: Secure vault (1Password, AWS Secrets Manager)
- Files: AWS S3 with versioning

---

## Security Hardening

### 1. Remove Development Code
```bash
# Remove console.log statements (use production logger)
# Remove source maps from production build
# Disable stack traces in error responses
```

### 2. Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### 3. SSL/TLS
- Use Let's Encrypt or commercial certificate
- Enable HSTS header
- Redirect HTTP to HTTPS

### 4. Security Headers
Already implemented in `middleware/security-headers.js`

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, AWS ALB)
- Multiple app instances
- Session storage in Redis (if using sessions)

### Database Scaling
- Read replicas for read-heavy operations
- Sharding for very large datasets
- Connection pooling (already configured)

### Caching
- Redis for frequently accessed data
- CDN for static assets
- Browser caching headers

---

## Post-Deployment

### 1. Verify Deployment
```bash
# Health check
curl https://your-domain.com/api/health

# Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. Monitor Logs
```bash
# PM2 logs
pm2 logs clinic-app

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. Set Up Cron Jobs
```bash
# Add to crontab
crontab -e

# Process reminders every 15 minutes
*/15 * * * * curl -X POST https://your-domain.com/api/reminders/process \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Rollback Procedure

1. **Code Rollback:**
```bash
git checkout <previous-commit>
npm run build
pm2 restart clinic-app
```

2. **Database Rollback:**
   - Use MongoDB Atlas point-in-time recovery
   - Restore from backup if needed

---

## Maintenance

### Regular Tasks
- [ ] Weekly: Review error logs
- [ ] Monthly: Update dependencies (`npm audit`)
- [ ] Quarterly: Security audit
- [ ] Quarterly: Backup restoration test
- [ ] Annually: Penetration testing

### Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit
npm audit fix

# Rebuild and restart
npm run build
pm2 restart clinic-app
```

---

## Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string
   - Check network connectivity

2. **Memory Issues:**
   - Increase server RAM
   - Optimize queries
   - Enable Redis caching

3. **Slow Performance:**
   - Check database indexes
   - Review slow queries
   - Enable query profiling

4. **Rate Limiting:**
   - Adjust rate limits in `middleware/rate-limit.js`
   - Use Redis for distributed rate limiting

---

## Support

For deployment issues, refer to:
- `PERFORMANCE_OPTIMIZATION.md` - Performance tuning
- `SECURITY_IMPLEMENTATION.md` - Security measures
- `API_DOCUMENTATION.md` - API reference
