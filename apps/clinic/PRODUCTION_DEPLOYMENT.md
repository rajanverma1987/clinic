# Production Deployment Guide

Complete guide for deploying the Clinic SaaS application to production.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
4. [Post-Deployment](#post-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ✅ Code & Build

- [ ] All tests passing: `npm test`
- [ ] Production build successful: `npm run build`
- [ ] No console errors in build output
- [ ] TypeScript types validated
- [ ] ESLint warnings reviewed
- [ ] Git repository clean (no uncommitted changes)
- [ ] Version tagged: `git tag v1.0.0`

### ✅ Environment Configuration

- [ ] `.env.production` created from template
- [ ] All `<REPLACE_WITH_...>` values filled in
- [ ] Secrets moved to secrets manager (AWS Secrets Manager, Vault, etc.)
- [ ] Production database credentials configured
- [ ] JWT secrets generated (256-bit, unique)
- [ ] Encryption key generated (256-bit, unique)
- [ ] Redis URL configured
- [ ] SMTP credentials configured
- [ ] Payment processor keys configured (Stripe/PayPal)
- [ ] TURN server configured for telemedicine

### ✅ Infrastructure

- [ ] Production database provisioned (MongoDB Atlas, AWS DocumentDB, etc.)
- [ ] Database SSL/TLS enabled
- [ ] Redis instance provisioned (AWS ElastiCache, Redis Cloud, etc.)
- [ ] SSL certificates obtained (Let's Encrypt, ACM, etc.)
- [ ] DNS records configured
- [ ] CDN configured (optional but recommended)
- [ ] Load balancer configured (if multi-instance)
- [ ] Firewall rules configured
- [ ] Backup strategy configured

### ✅ Security

- [ ] Environment variables secured (not in code)
- [ ] Database credentials rotated
- [ ] Admin IP whitelist configured
- [ ] Rate limiting enabled
- [ ] CORS origins restricted
- [ ] CSP headers configured
- [ ] Security headers enabled
- [ ] Test account disabled (`TEST_ACCOUNT_ENABLED=false`)

### ✅ Third-Party Services

- [ ] Stripe webhook endpoint registered
- [ ] PayPal webhook endpoint registered
- [ ] SMTP server tested (send test email)
- [ ] Twilio configured (if using SMS)
- [ ] WhatsApp Business API configured (if using)
- [ ] S3 bucket created (if using file storage)
- [ ] Sentry project created (if using error tracking)

---

## Environment Setup

### 1. Clone and Build

```bash
# Clone repository
git clone <your-repo-url>
cd clinic/apps/clinic

# Install dependencies
npm install

# Create production environment file
cp .env.production.template .env.production

# Edit .env.production with production values
nano .env.production
```

### 2. Generate Secrets

```bash
# Generate JWT Secret
openssl rand -hex 32

# Generate JWT Refresh Secret
openssl rand -hex 32

# Generate Encryption Key
openssl rand -hex 32
```

Add these to your `.env.production` file or secrets manager.

### 3. Build for Production

```bash
# Build the application
npm run build

# Verify build output
ls -la .next/standalone/
```

### 4. Fix Encryption Warnings (if applicable)

If you changed the `ENCRYPTION_KEY`:

```bash
# Dry run - see what would be affected
npm run fix:encryption -- --dry-run

# Clear encrypted fields (recommended for fresh start)
npm run fix:encryption -- --clear-encrypted
```

---

## Deployment Options

### Option 1: Node.js Server (Traditional)

**Best for:** VPS, EC2, dedicated servers

```bash
# Build
npm run build

# Start production server
NODE_ENV=production node .next/standalone/apps/clinic/server.js
```

**With PM2 (recommended):**

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start .next/standalone/apps/clinic/server.js --name clinic-app

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Systemd Service (Linux):**

Create `/etc/systemd/system/clinic.service`:

```ini
[Unit]
Description=Clinic SaaS Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/clinic/apps/clinic
Environment=NODE_ENV=production
ExecStart=/usr/bin/node .next/standalone/apps/clinic/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable clinic
sudo systemctl start clinic
sudo systemctl status clinic
```

---

### Option 2: Docker (Recommended)

**Best for:** Kubernetes, ECS, Cloud Run, containerized deployments

See `Dockerfile` and `docker-compose.yml` in the repository.

```bash
# Build Docker image
docker build -t clinic-app:latest .

# Run container
docker run -p 5053:5053 \
  --env-file .env.production \
  --name clinic-app \
  clinic-app:latest

# Or use docker-compose
docker-compose up -d
```

**Push to registry:**

```bash
# Tag for ECR/GCR/Docker Hub
docker tag clinic-app:latest your-registry.com/clinic-app:v1.0.0

# Push
docker push your-registry.com/clinic-app:v1.0.0
```

---

### Option 3: Vercel (Easiest)

**Best for:** Quick deployment, automatic scaling

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Configure environment variables in Vercel dashboard:**
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.production`
3. Redeploy

**Note:** Some features may be limited on Vercel (WebSocket, custom TURN server).

---

### Option 4: AWS Elastic Beanstalk

**Best for:** AWS infrastructure

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create production-env

# Deploy
eb deploy
```

Configure environment variables in Elastic Beanstalk console.

---

### Option 5: Google Cloud Run

**Best for:** Google Cloud infrastructure

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/clinic-app

# Deploy to Cloud Run
gcloud run deploy clinic-app \
  --image gcr.io/PROJECT_ID/clinic-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

### Option 6: Azure App Service

**Best for:** Azure infrastructure

```bash
# Create App Service
az webapp create \
  --resource-group myResourceGroup \
  --plan myAppServicePlan \
  --name clinic-app \
  --runtime "NODE|18-lts"

# Deploy
az webapp deployment source config-zip \
  --resource-group myResourceGroup \
  --name clinic-app \
  --src clinic-app.zip
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Health check
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-02-09T...",
  "checks": {
    "database": "connected",
    "cache": "operational"
  }
}
```

### 2. Create Super Admin

```bash
# SSH into server or run in container
npm run admin:create

# Follow prompts to create super admin account
```

### 3. Run Smoke Tests

**As Super Admin:**

- [ ] Login at `/login`
- [ ] Dashboard loads at `/dashboard`
- [ ] Navigate to `/admin`
- [ ] Create a test doctor account
- [ ] Create a test patient
- [ ] Create a test appointment
- [ ] Test telemedicine (video/audio)
- [ ] Test prescription creation
- [ ] Verify language switching works
- [ ] Test logout and re-login

**Technical Checks:**

- [ ] `/api/health` returns 200
- [ ] No console errors in browser
- [ ] WebSocket connection established
- [ ] Real-time updates working
- [ ] Images loading correctly
- [ ] PDF generation working (prescriptions)
- [ ] Email sending working (password reset)

### 4. Configure Monitoring

**Sentry (Error Tracking):**

```bash
# Already configured in .env.production
# Verify errors are being captured:
# 1. Trigger a test error
# 2. Check Sentry dashboard
```

**CloudWatch / StackDriver / Azure Monitor:**

- Set up log collection
- Create dashboards for key metrics
- Set up alerts for errors

**Uptime Monitoring:**

- UptimeRobot
- Pingdom
- StatusCake

### 5. Set Up Backups

```bash
# Manual backup
npm run backup:db

# Automated backups (configure cron)
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /var/www/clinic/apps/clinic && npm run backup:db
```

### 6. Configure SSL/TLS

**With Nginx:**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5053;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5053;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

**With Caddy (automatic SSL):**

```caddy
your-domain.com {
    reverse_proxy localhost:5053
}
```

---

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Application Health**
   - Uptime percentage
   - Response time
   - Error rate

2. **Database**
   - Connection pool utilization
   - Query performance
   - Disk usage

3. **Redis**
   - Memory usage
   - Cache hit rate
   - Connection count

4. **Server**
   - CPU usage
   - Memory usage
   - Disk I/O

5. **Business Metrics**
   - Active users
   - Appointments created
   - Telemedicine sessions

### Maintenance Tasks

**Daily:**
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Review automated backups

**Weekly:**
- [ ] Review performance metrics
- [ ] Check database size
- [ ] Review security logs

**Monthly:**
- [ ] Rotate credentials
- [ ] Update dependencies
- [ ] Review backup retention
- [ ] Test disaster recovery

**Quarterly:**
- [ ] Security audit
- [ ] Performance optimization
- [ ] Cost optimization

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs clinic-app

# Check environment variables
printenv | grep MONGODB_URI

# Test database connection
npm run admin:health
```

### Database Connection Errors

```bash
# Verify connection string
echo $MONGODB_URI

# Test connectivity
mongosh "$MONGODB_URI" --eval "db.runCommand({ ping: 1 })"

# Check firewall rules
telnet your-mongodb-host 27017
```

### Redis Connection Errors

```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping

# Should return: PONG
```

### SSL/TLS Certificate Issues

```bash
# Check certificate expiration
openssl s_client -connect your-domain.com:443 -servername your-domain.com | openssl x509 -noout -dates

# Renew Let's Encrypt certificate
certbot renew
```

### High Memory Usage

```bash
# Check Node.js memory
node --max-old-space-size=4096 server.js

# Monitor with PM2
pm2 monit
```

### Slow Performance

1. **Enable Redis** if not already
2. **Check database indexes**: `npm run create:indexes`
3. **Review slow queries** in database logs
4. **Enable CDN** for static assets
5. **Optimize images** (already using AVIF/WebP)

### Encryption Warnings

```bash
# See affected data
npm run fix:encryption -- --dry-run

# Clear encrypted fields
npm run fix:encryption -- --clear-encrypted
```

---

## Scaling

### Horizontal Scaling

**Requirements:**
- Redis for shared cache
- Redis for rate limiting
- Shared file storage (S3 or NFS)
- Load balancer

**Setup:**

1. Deploy multiple instances
2. Configure load balancer (ALB, nginx, HAProxy)
3. Enable sticky sessions for WebSocket
4. Use Redis for session storage

**Example (AWS ALB):**

```bash
# Create target group
aws elbv2 create-target-group \
  --name clinic-app-targets \
  --protocol HTTP \
  --port 5053 \
  --vpc-id vpc-xxxxx

# Register targets (instances)
aws elbv2 register-targets \
  --target-group-arn arn:... \
  --targets Id=i-xxxxx Id=i-yyyyy

# Create load balancer
aws elbv2 create-load-balancer \
  --name clinic-app-lb \
  --subnets subnet-xxxxx subnet-yyyyy
```

### Vertical Scaling

**Database:**
- Increase MongoDB instance size
- Add read replicas
- Enable sharding (for very large deployments)

**Application:**
- Increase server resources (CPU, RAM)
- Optimize Node.js memory: `--max-old-space-size=8192`

---

## Security Hardening

### 1. Enable WAF (Web Application Firewall)

- AWS WAF
- Cloudflare
- Imperva

### 2. DDoS Protection

- Cloudflare
- AWS Shield
- Akamai

### 3. Intrusion Detection

- Fail2ban
- OSSEC
- Snort

### 4. Regular Security Audits

```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Update all dependencies
npm update
```

### 5. Implement 2FA for Admins

Already implemented in the application. Ensure all super_admin accounts have 2FA enabled.

---

## Rollback Procedure

If deployment fails:

```bash
# With PM2
pm2 stop clinic-app
git checkout v1.0.0  # Previous version
npm install
npm run build
pm2 start clinic-app

# With Docker
docker stop clinic-app
docker run -d --name clinic-app clinic-app:v1.0.0

# Restore database (if needed)
npm run backup:restore
```

---

## Support

For production support:
- Check logs first
- Review this guide
- Check GitHub issues
- Contact your DevOps team

---

## Appendix

### A. Required Ports

- **3000-5053**: Application (HTTP)
- **443**: HTTPS
- **27017**: MongoDB
- **6379**: Redis
- **3478**: TURN server (UDP/TCP)
- **49152-65535**: WebRTC media (UDP)

### B. Environment Variables Reference

See `.env.production.template` for complete list.

### C. Health Check Endpoints

- `GET /api/health` - Application health
- `GET /api/auth/me` - Authentication check

### D. Useful Commands

```bash
# Check application logs
pm2 logs clinic-app

# Restart application
pm2 restart clinic-app

# Monitor resources
pm2 monit

# Database backup
npm run backup:db

# Check database stats
npm run backup:stats

# Create admin
npm run admin:create

# Reset admin password
npm run reset:password
```

---

**Last Updated:** 2026-02-09
**Version:** 1.0.0
