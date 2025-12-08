# Complete TURN Server Setup on OVH Linux VPS

## Overview

This guide will help you set up a production-ready TURN server on your OVH Linux VPS using Coturn (the most popular open-source TURN server).

## Prerequisites

- OVH Linux VPS (Ubuntu 20.04/22.04 or Debian 11/12 recommended)
- SSH access to your VPS
- Root or sudo access
- Your VPS public IP address
- Domain name pointing to your VPS (optional but recommended)

## Step 1: Initial Server Setup

### 1.1 Connect to Your VPS

```bash
ssh root@your-vps-ip
# Or if using a user account:
ssh username@your-vps-ip
```

### 1.2 Update System Packages

```bash
# For Ubuntu/Debian
sudo apt-get update
sudo apt-get upgrade -y

# For CentOS/RHEL
sudo yum update -y
```

### 1.3 Install Basic Tools

```bash
# Ubuntu/Debian
sudo apt-get install -y curl wget nano ufw

# CentOS/RHEL
sudo yum install -y curl wget nano firewalld
```

## Step 2: Install Coturn

### 2.1 Install Coturn Package

```bash
# Ubuntu/Debian
sudo apt-get install -y coturn

# CentOS/RHEL (requires EPEL)
sudo yum install -y epel-release
sudo yum install -y coturn
```

### 2.2 Verify Installation

```bash
which turnserver
turnserver --version
```

You should see Coturn version information.

## Step 3: Configure Coturn

### 3.1 Backup Default Config

```bash
sudo cp /etc/turnserver.conf /etc/turnserver.conf.backup
```

### 3.2 Edit Coturn Configuration

```bash
sudo nano /etc/turnserver.conf
```

### 3.3 Basic Configuration

Find and uncomment/modify these settings in the config file:

```conf
# ===========================================
# Basic TURN Server Configuration
# ===========================================

# Listening ports
listening-port=3478
tls-listening-port=5349

# Listening IP (0.0.0.0 = all interfaces)
listening-ip=0.0.0.0

# External IP (REPLACE WITH YOUR VPS PUBLIC IP)
external-ip=YOUR_VPS_PUBLIC_IP

# Domain/realmuse
realm=yourdomain.com
server-name=yourdomain.com

# ===========================================
# Authentication
# ===========================================

# Username and password (REPLACE WITH SECURE CREDENTIALS)
user=telemedicine:your_secure_password_here

# Use long-term credentials mechanism
lt-cred-mech

# ===========================================
# Security Settings
# ===========================================

# Disable CLI (command line interface) for security
no-cli

# Disable TLS/DTLS (enable if you have SSL certificates)
no-tls
no-dtls

# ===========================================
# Relay Ports (for media relay)
# ===========================================

# Port range for relayed connections
min-port=49152
max-port=65535

# ===========================================
# Logging
# ===========================================verb

# Log file location
log-file=/var/log/turn.log

# Verbose logging (disable in production for better performance)
verbose

# ===========================================
# Performance & Limits
# ===========================================

# Maximum bandwidth per session (1 Mbps)
max-bps=1000000

# Maximum number of sessions per user
max-sessions-per-user=100
```

### 3.4 Important: Replace These Values

1. **YOUR_VPS_PUBLIC_IP**: Your OVH VPS public IP address
   ```bash
   # Find your public IP
   curl ifconfig.me
   # Or
   hostname -I
   ```

2. **yourdomain.com**: Your domain name (or use IP if no domain)
   - If you have a domain: `turn.yourdomain.com`
   - If no domain: Use your VPS IP or leave as is

3. **telemedicine**: Username (can be anything, but keep it simple)
4. **your_secure_password_here**: Generate a strong password
   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```

**Save this password** - you'll need it for your `.env.local` file!

### 3.5 Save and Exit

Press `Ctrl+X`, then `Y`, then `Enter` to save.

## Step 4: Configure Firewall

### 4.1 Ubuntu/Debian (UFW)

```bash
# Allow TURN server port
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp

# Allow TURN relay port range
sudo ufw allow 49152:65535/udp

# Enable firewall (if not already enabled)
sudo ufw enable

# Check status
sudo ufw status
```

### 4.2 CentOS/RHEL (firewalld)

```bash
# Allow TURN server port
sudo firewall-cmd --permanent --add-port=3478/udp
sudo firewall-cmd --permanent --add-port=3478/tcp

# Allow TURN relay port range
sudo firewall-cmd --permanent --add-port=49152-65535/udp

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

### 4.3 OVH Firewall (If Enabled)

If you have OVH firewall enabled in the control panel:

1. Log into OVH Control Panel
2. Go to your VPS → Firewall
3. Add rules:
   - UDP 3478 (TURN)
   - TCP 3478 (TURN)
   - UDP 49152-65535 (TURN relay range)

## Step 5: Start Coturn Service

### 5.1 Enable Coturn Service

```bash
# Enable Coturn to start on boot
sudo systemctl enable coturn

# Start Coturn service
sudo systemctl start coturn

# Check status
sudo systemctl status coturn
```

You should see `active (running)` in green.

### 5.2 Verify Coturn is Running

```bash
# Check if Coturn is listening on port 3478
sudo netstat -tulpn | grep 3478
# Or
sudo ss -tulpn | grep 3478

# Check Coturn process
ps aux | grep turnserver

# Check logs
sudo tail -f /var/log/turn.log
```

You should see Coturn listening on port 3478.

## Step 6: Test TURN Server

### 6.1 Test from Your Local Machine

Install turnutils (testing tools) on your local machine:

```bash
# On your local machine (not VPS)
# Ubuntu/Debian
sudo apt-get install coturn

# macOS
brew install coturn

# Windows
# Download from: https://github.com/coturn/coturn/releases
```

### 6.2 Test STUN (Basic Connectivity)

```bash
# Replace with your VPS IP or domain
turnutils_stunclient YOUR_VPS_IP
```

Expected output:
```
0: log file opened: /tmp/turnutils_stunclient.log
0: 
0: IPv4. WebRTC STUN test
0: stun server addr: YOUR_VPS_IP:3478
0: (If you see this message, STUN is working!)
```

### 6.3 Test TURN (Full Relay Test)

```bash
# Test TURN relay functionality
turnutils_peer -L YOUR_VPS_IP -U telemedicine -P your_secure_password_here
```

### 6.4 Online TURN Testing Tools

Use online tools to test your TURN server:

- **WebRTC Trickle ICE**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
  1. Click "Add Server"
  2. Enter your TURN server details
  3. Click "Gather candidates"
  4. Look for `relay` type candidates (means TURN is working)

## Step 7: Configure Domain (Optional but Recommended)

### 7.1 Add DNS Record

If you have a domain:

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add A record:
   - **Name**: `turn` (or `stun-turn`)
   - **Type**: `A`
   - **Value**: Your VPS public IP
   - **TTL**: 3600

Example:
```
turn.yourdomain.com → YOUR_VPS_IP
```

### 7.2 Update Coturn Config

If using domain, update `/etc/turnserver.conf`:
```conf
realm=turn.yourdomain.com
server-name=turn.yourdomain.com
```

Restart Coturn:
```bash
sudo systemctl restart coturn
```

## Step 8: Integrate with Your Next.js App

### 8.1 Add to `.env.local`

Open your `.env.local` file in your Next.js project root and add:

```bash
# TURN Server Configuration
NEXT_PUBLIC_TURN_SERVER_URL=turn:YOUR_VPS_IP:3478
# Or if using domain:
# NEXT_PUBLIC_TURN_SERVER_URL=turn:turn.yourdomain.com:3478

NEXT_PUBLIC_TURN_USERNAME=telemedicine
NEXT_PUBLIC_TURN_CREDENTIAL=your_secure_password_here
```

**Important**: 
- Replace `YOUR_VPS_IP` with your actual VPS IP
- Replace `your_secure_password_here` with the password you generated in Step 3.4
- Use the same username (`telemedicine`) that you set in the Coturn config

### 8.2 Restart Next.js App

```bash
# Stop your Next.js app (Ctrl+C)
# Then restart it to load new environment variables
npm run dev
# Or in production:
npm start
```

### 8.3 Verify in Browser Console

1. Open your telemedicine page in browser
2. Open browser console (F12)
3. Click "Join Video Call"
4. Look for this log message:
```
[WebRTC] Adding TURN server for proxy/NAT traversal: turn:YOUR_VPS_IP:3478
```

If you see this, TURN server is configured correctly!

## Step 9: Security Hardening

### 9.1 Generate Strong Password

If you haven't already, generate a secure password:

```bash
openssl rand -base64 32
```

Update `/etc/turnserver.conf` with the new password and restart:
```bash
sudo systemctl restart coturn
```

### 9.2 Restrict Access (Optional)

If you want to restrict TURN to specific IPs (e.g., only your Next.js server):

```conf
# In /etc/turnserver.conf
allowed-peer-ip=YOUR_NEXTJS_SERVER_IP
# Add more IPs as needed
```

### 9.3 Enable TLS (Production - Optional)

For production, you can enable TLS for encrypted TURN:

1. Get SSL certificate (Let's Encrypt):
```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d turn.yourdomain.com
```

2. Update `/etc/turnserver.conf`:
```conf
tls-listening-port=5349
cert=/etc/letsencrypt/live/turn.yourdomain.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.yourdomain.com/privkey.pem
```

3. Update `.env.local`:
```bash
NEXT_PUBLIC_TURN_SERVER_URL=turns:turn.yourdomain.com:5349
```

4. Restart Coturn:
```bash
sudo systemctl restart coturn
```

### 9.4 Monitor Logs

```bash
# Watch TURN server logs in real-time
sudo tail -f /var/log/turn.log

# Check for errors
sudo grep "ERROR" /var/log/turn.log

# Check for suspicious activity
sudo grep "denied" /var/log/turn.log
```

## Step 10: Monitoring & Maintenance

### 10.1 Check TURN Server Status

```bash
# Service status
sudo systemctl status coturn

# Check if running
sudo systemctl is-active coturn

# View recent logs
sudo journalctl -u coturn -n 50

# Follow logs in real-time
sudo journalctl -u coturn -f
```

### 10.2 Restart TURN Server

```bash
# Restart service
sudo systemctl restart coturn

# Check status after restart
sudo systemctl status coturn
```

### 10.3 Update Coturn

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get upgrade coturn

# CentOS/RHEL
sudo yum update coturn

# Restart after update
sudo systemctl restart coturn
```

## Troubleshooting

### Issue: Coturn won't start

**Check logs:**
```bash
sudo journalctl -u coturn -n 50
sudo tail -f /var/log/turn.log
```

**Common fixes:**
- Check if port 3478 is already in use: `sudo netstat -tulpn | grep 3478`
- Verify config syntax: `sudo turnserver -c /etc/turnserver.conf --test`
- Check external-ip is correct (must be your VPS public IP)
- Make sure you uncommented the required lines in config

### Issue: Can't connect from browser

**Check firewall:**
```bash
# Ubuntu/Debian
sudo ufw status verbose

# Test from external machine
telnet YOUR_VPS_IP 3478
# Or
nc -zv YOUR_VPS_IP 3478
```

**Verify TURN is accessible:**
```bash
# From your local machine
turnutils_stunclient YOUR_VPS_IP
```

**Check OVH firewall:**
- Log into OVH Control Panel
- Check if firewall is blocking ports

### Issue: Connection still fails

**Check browser console:**
- Look for `[WebRTC] ICE connection state: failed`
- Verify TURN credentials are correct in `.env.local`
- Check TURN server logs: `sudo tail -f /var/log/turn.log`

**Test TURN manually:**
```bash
turnutils_peer -L YOUR_VPS_IP -U telemedicine -P your_password
```

**Verify credentials:**
- Username and password in `.env.local` must match `/etc/turnserver.conf`
- Check for typos or extra spaces

### Issue: High CPU/Memory Usage

**Optimize config:**
```conf
# Reduce verbose logging (comment out or remove)
# verbose

# Limit sessions
max-sessions-per-user=50
max-bps=500000
```

**Monitor resource usage:**
```bash
# Check CPU and memory
top
# Or
htop
```

## Quick Reference Commands

```bash
# Start TURN server
sudo systemctl start coturn

# Stop TURN server
sudo systemctl stop coturn

# Restart TURN server
sudo systemctl restart coturn

# Check status
sudo systemctl status coturn

# View logs
sudo tail -f /var/log/turn.log

# View recent logs
sudo journalctl -u coturn -n 50

# Test STUN
turnutils_stunclient YOUR_VPS_IP

# Test TURN
turnutils_peer -L YOUR_VPS_IP -U username -P password

# Check listening ports
sudo netstat -tulpn | grep 3478
# Or
sudo ss -tulpn | grep 3478

# Check firewall
sudo ufw status
```

## Production Checklist

- [ ] Coturn installed and running
- [ ] Firewall configured (ports 3478, 49152-65535)
- [ ] Strong password set and saved securely
- [ ] External IP configured correctly in config
- [ ] TURN server tested with `turnutils_stunclient`
- [ ] Domain configured (optional)
- [ ] `.env.local` updated with TURN credentials
- [ ] Next.js app restarted
- [ ] Browser console shows TURN server connection
- [ ] Video calls working from different networks
- [ ] Logs monitored for errors
- [ ] TLS enabled (optional, for production)

## Cost Estimate

- **OVH VPS**: ~$5-10/month (smallest plan is sufficient for TURN)
- **Domain**: ~$10-15/year (optional)
- **Total**: ~$5-10/month

**Note**: TURN server doesn't need much resources. A small VPS (1GB RAM, 1 CPU) is sufficient for many concurrent connections.

## Next Steps

1. ✅ Complete the setup steps above
2. ✅ Test TURN server from your local machine
3. ✅ Update `.env.local` in your Next.js app
4. ✅ Test video calls from different networks
5. ✅ Monitor logs for any issues
6. ✅ Set up monitoring/alerting (optional)

## Support & Troubleshooting

If you encounter issues:

1. **Check TURN server logs**: `sudo tail -f /var/log/turn.log`
2. **Check browser console** for WebRTC errors
3. **Verify firewall rules** are correct
4. **Test TURN server manually** with `turnutils_stunclient`
5. **Verify credentials** match between config and `.env.local`

## Security Notes

- **Never share your TURN credentials publicly**
- **Use strong passwords** (32+ characters recommended)
- **Monitor logs** for suspicious activity
- **Keep Coturn updated** for security patches
- **Consider IP whitelisting** for additional security (optional)
- **Enable TLS** for production (optional but recommended)

## Additional Resources

- **Coturn Documentation**: https://github.com/coturn/coturn
- **WebRTC Testing Tools**: https://webrtc.github.io/samples/
- **TURN Server Best Practices**: See Coturn wiki

---

Your TURN server is now ready for production use! 🎉

After setup, your telemedicine video calls should work reliably even when both users are behind NAT/firewalls.
