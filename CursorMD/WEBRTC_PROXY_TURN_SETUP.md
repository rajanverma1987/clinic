# WebRTC Behind Proxy - TURN Server Setup

## Issue: Connection Stuck on "Connecting"

When your server is behind a proxy, WebRTC connections may fail because:

1. **Signaling works** ✅ - HTTP polling goes through proxy fine
2. **Peer-to-peer fails** ❌ - Direct connection blocked by NAT/firewalls

## Solution: Add TURN Server

TURN (Traversal Using Relays around NAT) servers relay media when direct peer-to-peer isn't possible.

### Option 1: Self-Hosted TURN Server (Recommended - Free & Full Control)

#### For Windows Server (IIS Reverse Proxy Setup)

Since you're on Windows Server, you have several options:

##### Option 1A: Coturn in WSL2 (Recommended for Windows)

1. **Install WSL2 and Ubuntu**:
```powershell
# Run PowerShell as Administrator
wsl --install
# Restart computer after installation
```

2. **Install Coturn in WSL**:
```bash
# In WSL Ubuntu terminal
sudo apt-get update
sudo apt-get install coturn
```

3. **Configure Coturn** (`/etc/turnserver.conf` in WSL):
```conf
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
external-ip=YOUR_WINDOWS_SERVER_PUBLIC_IP
realm=yourdomain.com
server-name=yourdomain.com
user=telemedicine:your_secure_password
lt-cred-mech
# Allow your Next.js app domain
allowed-peer=yourdomain.com
```

4. **Start Coturn in WSL**:
```bash
# In WSL terminal
sudo systemctl start coturn
sudo systemctl enable coturn
```

5. **Configure Windows Firewall**:
```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "TURN Server UDP 3478" -Direction Inbound -Protocol UDP -LocalPort 3478 -Action Allow
New-NetFirewallRule -DisplayName "TURN Server TCP 3478" -Direction Inbound -Protocol TCP -LocalPort 3478 -Action Allow
New-NetFirewallRule -DisplayName "TURN Server UDP 49152-65535" -Direction Inbound -Protocol UDP -LocalPort 49152-65535 -Action Allow
```

6. **Add to `.env.local`**:
```bash
NEXT_PUBLIC_TURN_SERVER_URL=turn:yourdomain.com:3478
NEXT_PUBLIC_TURN_USERNAME=telemedicine
NEXT_PUBLIC_TURN_CREDENTIAL=your_secure_password
```

##### Option 1B: Separate Linux VM/Container (Alternative)

If you prefer not to use WSL, run Coturn on a separate Linux VM or Docker container:

1. **Create a small Linux VM** (Ubuntu Server) on the same network
2. **Install Coturn** on the Linux VM (same steps as Option 1A)
3. **Point your TURN config to the Linux VM's IP**

##### Option 1C: Windows-Compatible TURN Server

**Restund** (Windows build available):
- Download from: https://github.com/coturn/coturn (check Windows builds)
- Or use **Pion TURN** (Go-based, cross-platform): https://github.com/pion/turn

**Note**: Coturn is the most popular and well-maintained option. WSL2 is the easiest way to run it on Windows Server.

### Option 2: Free Public TURN Servers (For Testing Only)

**⚠️ Important**: Google does NOT provide free public TURN servers. They only provide STUN servers (which we're already using).

**⚠️ Warning: Public TURN servers are for testing only. Not recommended for production.**

Some free public TURN servers (use at your own risk):
- `turn:openrelay.metered.ca:80` (no auth required, but unreliable)
- `turn:openrelay.metered.ca:443` (no auth required, but unreliable)

**Why Google doesn't offer TURN**:
- TURN servers relay actual media traffic (video/audio)
- Requires significant bandwidth and resources
- Would be expensive to provide for free
- STUN is lightweight (just IP discovery), so it's free

**Not recommended for production** - use self-hosted instead.

### Option 3: Metered.ca TURN Service (Paid)

- https://www.metered.ca/tools/openrelay/
- Offers free tier for testing
- Paid plans for production
- Simple setup

### Option 4: Cloudflare Calls (Beta)

Cloudflare offers TURN as a service:
- https://developers.cloudflare.com/calls/
- Currently in beta, may have free tier

## Configuration

### For Self-Hosted Coturn

Add these to your `.env.local`:

```bash
# TURN Server Configuration (for proxy/NAT scenarios)
# Format: turn:domain:port or turn:domain:port?transport=udp
NEXT_PUBLIC_TURN_SERVER_URL=turn:yourdomain.com:3478
NEXT_PUBLIC_TURN_USERNAME=your_username
NEXT_PUBLIC_TURN_CREDENTIAL=your_password
```

### For Testing (Public TURN - Not Recommended)

```bash
# Public TURN server (testing only - unreliable)
NEXT_PUBLIC_TURN_SERVER_URL=turn:openrelay.metered.ca:80
# No username/credential needed for open relay
```

### Without TURN (Direct Connection Only)

If you don't configure TURN, the system will try direct peer-to-peer connection only. This works if:
- Both users are on the same network, OR
- At least one user is not behind a NAT/firewall

If both are behind NAT/firewalls (common with proxies), connection will fail.

## STUN vs TURN

**STUN (Session Traversal Utilities for NAT)**:
- ✅ **Free** - Google provides free STUN servers (already configured)
- ✅ **Lightweight** - Only helps discover public IP addresses
- ❌ **No relay** - Cannot relay media traffic

**TURN (Traversal Using Relays around NAT)**:
- ❌ **Not free** - Requires significant bandwidth/resources
- ✅ **Relays media** - Can relay video/audio when direct connection fails
- ⚠️ **Google doesn't provide public TURN** - You need to set up your own or use a paid service

**Current Setup**:
- ✅ Using Google's free STUN servers (already configured)
- ❌ Need to add your own TURN server for proxy/NAT scenarios

## How It Works

1. **Without TURN** (Current Setup): 
   - Peer A → STUN (Google) → Gets public IP
   - Peer B → STUN (Google) → Gets public IP
   - Try direct connection → ❌ Fails if both behind NAT/firewall

2. **With TURN** (After Setup):
   - Peer A → STUN (Google) → Gets public IP
   - Peer B → STUN (Google) → Gets public IP
   - Try direct connection → ❌ Fails
   - Fallback to TURN → ✅ Relays through TURN server

## IIS Reverse Proxy Configuration

If your Next.js app is behind IIS reverse proxy, make sure:

1. **IIS ARR (Application Request Routing) is configured** for your Next.js app
2. **WebSocket support is enabled** in IIS (for future WebSocket signaling upgrade)
3. **TURN server ports are accessible** (not blocked by IIS):
   - UDP 3478 (TURN)
   - UDP 49152-65535 (TURN relay ports)

### IIS Configuration Notes

- IIS reverse proxy handles HTTP/HTTPS traffic to your Next.js app
- TURN server runs **separately** on UDP ports (not through IIS)
- TURN server needs direct access to the internet (bypasses IIS)
- Your Next.js app communicates with TURN server directly from the browser

### Port Requirements

```
Next.js App:     TCP 3000 (or your port) → Through IIS reverse proxy
TURN Server:     UDP 3478, UDP 49152-65535 → Direct (bypasses IIS)
Signaling API:   HTTP/HTTPS → Through IIS reverse proxy
```

## Testing

After adding TURN server:

1. Restart your Next.js server
2. Open two browser windows (from different networks if possible)
3. Check console logs for: `[WebRTC] Adding TURN server for proxy/NAT traversal`
4. Check connection stats: `connectionType: 'relay'` means using TURN
5. Verify TURN is working: Check browser console for `[WebRTC] ICE connection state: connected`

## Debugging

Check browser console for:
- `[WebRTC] ICE connection state: checking` - Trying to connect
- `[WebRTC] ICE connection state: failed` - Connection failed (needs TURN)
- `[WebRTC] ICE connection state: connected` - Success!

## Cost Considerations

- **STUN**: Free (Google provides - already configured)
- **TURN**: 
  - **Self-hosted Coturn**: Free (just server costs ~$5-10/month for small VPS)
  - **Metered.ca**: Free tier for testing, paid for production
  - **Cloudflare**: Check pricing
  - **Public TURN**: Free but unreliable (testing only)

## HIPAA Compliance

- TURN servers only relay encrypted media (DTLS-SRTP)
- No media content is stored or logged
- Choose a HIPAA-compliant TURN provider if required
