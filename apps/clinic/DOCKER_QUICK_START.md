# Docker Quick Start Guide

Get the Clinic SaaS application running with Docker in minutes.

---

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

---

## Quick Start (Development)

### 1. Clone and Navigate

```bash
cd /Users/shivramrana/Documents/clinictool/clinic/apps/clinic
```

### 2. Create Environment File

```bash
# Copy example environment file
cp .env.local .env.docker

# Or create minimal .env.docker:
cat > .env.docker << 'EOF'
# Secrets (change these!)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# MongoDB root credentials
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=changeme123

# TURN server credentials (for telemedicine)
TURN_USERNAME=telemedicine
TURN_PASSWORD=changeme123

# Environment
NODE_ENV=development
EOF
```

### 3. Start All Services

```bash
# Start everything (app, MongoDB, Redis, TURN server)
docker-compose up -d

# Check logs
docker-compose logs -f app
```

### 4. Wait for Services to Start

```bash
# Check health status
docker-compose ps

# Should show all services as "healthy"
```

### 5. Create Admin Account

```bash
# Access the app container
docker-compose exec app sh

# Create admin
npm run admin:create

# Exit container
exit
```

### 6. Access Application

Open browser: **http://localhost:5053**

Login with admin credentials created in step 5.

---

## Production Deployment

### 1. Create Production Environment

```bash
# Copy production template
cp .env.production.template .env.production

# Edit with production values
nano .env.production
```

### 2. Build Production Image

```bash
# Build optimized production image
docker build -t clinic-app:production .

# Verify image
docker images clinic-app
```

### 3. Run with Production Profile

```bash
# Start with nginx reverse proxy
docker-compose --profile production up -d

# Access via nginx on port 80/443
```

---

## Common Commands

### Container Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a service
docker-compose restart app

# View logs
docker-compose logs -f app

# Execute command in container
docker-compose exec app npm run admin:create
```

### Database Management

```bash
# Access MongoDB shell
docker-compose exec mongo mongosh -u admin -p changeme123

# Backup database
docker-compose exec app npm run backup:db

# Restore database
docker-compose exec app npm run backup:restore
```

### Redis Management

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Check Redis memory
docker-compose exec redis redis-cli INFO memory

# Flush all cache
docker-compose exec redis redis-cli FLUSHALL
```

### Maintenance

```bash
# View resource usage
docker stats

# Clean up unused images/containers
docker system prune -a

# View disk usage
docker system df
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check individual service
docker-compose logs mongo
docker-compose logs redis
docker-compose logs app

# Restart services
docker-compose restart
```

### Database Connection Error

```bash
# Check MongoDB is running
docker-compose ps mongo

# Check MongoDB logs
docker-compose logs mongo

# Verify connection string
docker-compose exec app printenv MONGODB_URI
```

### Application Error 500

```bash
# Check app logs
docker-compose logs app

# Restart app
docker-compose restart app

# Rebuild if needed
docker-compose up -d --build app
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase Docker memory limit (Docker Desktop)
# Settings → Resources → Memory → Increase to 4GB+

# Restart Docker
```

### Port Already in Use

```bash
# Find what's using port 5053
lsof -i :5053

# Kill the process or change port in docker-compose.yml
# ports:
#   - "5054:5053"  # Use different host port
```

---

## Development Workflow

### 1. Make Code Changes

Edit files in your IDE as normal.

### 2. Rebuild and Restart

```bash
# Rebuild app container
docker-compose up -d --build app

# Or with no cache
docker-compose build --no-cache app
docker-compose up -d app
```

### 3. View Logs

```bash
docker-compose logs -f app
```

### 4. Test Changes

Access http://localhost:5053 to test.

---

## Scaling with Docker

### Horizontal Scaling

```bash
# Scale app to 3 instances
docker-compose up -d --scale app=3

# Add nginx load balancer
docker-compose --profile production up -d
```

### Resource Limits

Edit `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## Security Best Practices

### 1. Use Secrets Management

```bash
# Docker Swarm secrets
echo "my-jwt-secret" | docker secret create jwt_secret -

# Use in compose:
secrets:
  jwt_secret:
    external: true
```

### 2. Non-Root User

Already configured in Dockerfile:

```dockerfile
USER nextjs  # Runs as non-root user (UID 1001)
```

### 3. Read-Only Filesystem

```yaml
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
      - /app/.next/cache
```

### 4. Network Isolation

```yaml
networks:
  frontend:
    internal: false
  backend:
    internal: true
```

---

## Performance Optimization

### 1. Enable BuildKit

```bash
# Add to ~/.bashrc or ~/.zshrc
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### 2. Use Multi-Stage Builds

Already configured in Dockerfile (3 stages: deps, builder, runner).

### 3. Layer Caching

```bash
# Build with cache from registry
docker build --cache-from clinic-app:latest -t clinic-app:new .
```

### 4. Volume Performance

Use named volumes instead of bind mounts for better performance.

---

## Monitoring

### With Docker Stats

```bash
# Real-time stats
docker stats

# Format output
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### With cAdvisor

```yaml
services:
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    ports:
      - 8080:8080
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
```

Access: http://localhost:8080

---

## Cleanup

### Remove Everything

```bash
# Stop and remove containers, networks
docker-compose down

# Also remove volumes (DELETES DATA!)
docker-compose down -v

# Remove images
docker rmi clinic-app:latest
```

### Selective Cleanup

```bash
# Remove only app container
docker-compose rm -s -f app

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

---

## Next Steps

1. **Production Setup**: See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
2. **Kubernetes**: Convert to Kubernetes with [kompose](https://kompose.io/)
3. **CI/CD**: Integrate with GitHub Actions, GitLab CI, or Jenkins
4. **Monitoring**: Add Prometheus + Grafana
5. **Backup**: Automate database backups to S3

---

## Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Next.js Docker Example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

**Last Updated:** 2026-02-09
**Docker Version:** 24.0+
**Docker Compose Version:** 2.0+
