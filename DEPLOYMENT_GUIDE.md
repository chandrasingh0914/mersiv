# Deployment Guide

This guide covers deploying Mersiv to production environments.

---

## Prerequisites

- [ ] Project builds successfully (`npm run build`)
- [ ] All tests pass (see TESTING_CHECKLIST.md)
- [ ] Environment variables configured
- [ ] MongoDB database ready (Atlas or self-hosted)
- [ ] Cloud storage for assets (S3, R2, etc.)

---

## Option 1: Vercel Deployment (Recommended)

Vercel is the easiest option for Next.js apps but requires special handling for Socket.io.

### Step 1: Prepare for Vercel

Since Vercel uses serverless functions, Socket.io needs modification:

**Option A: Separate Socket.io Server**
Deploy Socket.io on a separate Node.js server (Railway, Render, etc.)

**Option B: Use WebSocket Service**
Replace Socket.io with a service like Ably or Pusher

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mersiv
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.com
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

### Step 4: Deploy Widget

Widget can be served from Vercel:
```html
<script src="https://your-app.vercel.app/widget.js" data-domain="yourdomain.com"></script>
```

---

## Option 2: Traditional Server Deployment

For full control with Socket.io support.

### Providers
- DigitalOcean App Platform
- Railway
- Render
- AWS EC2
- Heroku

### Step 1: Build Application

```bash
npm run build
```

### Step 2: Environment Variables

Create `.env.production`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mersiv
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production
```

### Step 3: Start Production Server

```bash
npm start
```

Or use PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "mersiv" -- start
pm2 startup
pm2 save
```

### Step 4: Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io WebSocket support
    location /api/socketio {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### Step 5: SSL Certificate

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Option 3: Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/mersiv
      - NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### Deploy

```bash
docker-compose up -d
```

---

## MongoDB Setup

### Option A: MongoDB Atlas (Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0 Sandbox)
3. Create database user
4. Whitelist IP addresses (or 0.0.0.0/0 for any IP)
5. Get connection string
6. Update `MONGODB_URI` environment variable

**Connection String:**
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/mersiv?retryWrites=true&w=majority
```

### Option B: Self-Hosted MongoDB

```bash
# Ubuntu/Debian
sudo apt-get install mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB
mongo
> use admin
> db.createUser({
  user: "mersiv_admin",
  pwd: "secure_password",
  roles: ["readWrite", "dbAdmin"]
})
```

### Seed Production Data

```bash
# SSH into server
ssh user@your-server.com

# Navigate to project
cd /path/to/mersiv

# Run seed script
node scripts/seed-data.js
```

---

## Asset Storage (GLB Models, Images, Videos)

### Option A: AWS S3

```bash
# Install AWS CLI
npm install -g aws-cli

# Configure
aws configure

# Upload assets
aws s3 cp ./assets/models/ s3://your-bucket/models/ --recursive
aws s3 cp ./assets/images/ s3://your-bucket/images/ --recursive

# Set CORS policy
# In S3 bucket → Permissions → CORS
```

**CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### Option B: Cloudflare R2

- Lower costs than S3
- S3-compatible API
- No egress fees

### Option C: Vercel Blob

```bash
npm install @vercel/blob

# Upload via API
```

### Update MongoDB URLs

After uploading, update store documents with CDN URLs:
```javascript
{
  "imageUrl": "https://your-cdn.com/stores/store1.jpg",
  "videoUrl": "https://your-cdn.com/videos/promo.mp4",
  "models": [
    {
      "url": "https://your-cdn.com/models/chair.glb"
    }
  ]
}
```

---

## Socket.io Scaling (Multiple Servers)

For high traffic, scale horizontally with Redis adapter.

### Install Redis

```bash
npm install @socket.io/redis-adapter redis
```

### Update socketio.ts

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});
```

### Deploy Redis

**Option A: Redis Cloud**
- Free tier available
- https://redis.com/redis-enterprise-cloud/

**Option B: Self-hosted**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

---

## CDN Configuration

Use CDN for static assets and widget.js.

### Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Update DNS records
3. Enable caching rules:
   - Cache `/widget.js` for 1 hour
   - Cache images/videos for 1 month
   - Cache GLB models for 1 week

### CloudFront (AWS)

1. Create CloudFront distribution
2. Set origin to your server
3. Configure cache behaviors
4. Update DNS CNAME

---

## Analytics Setup

### Google Analytics 4

1. Go to https://analytics.google.com
2. Create GA4 property
3. Get Measurement ID (G-XXXXXXXXXX)
4. Add to widget documentation for clients:

```html
<!-- Add before widget script -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- Widget script -->
<script src="https://yourdomain.com/widget.js" data-domain="client.com"></script>
```

### Mixpanel

1. Sign up at https://mixpanel.com
2. Get project token
3. Add to widget documentation:

```html
<script src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"></script>
<script>
  mixpanel.init('YOUR_PROJECT_TOKEN');
</script>
<script src="https://yourdomain.com/widget.js" data-domain="client.com"></script>
```

---

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured (not in git)
- [ ] MongoDB authentication enabled
- [ ] MongoDB network access restricted
- [ ] CORS configured properly
- [ ] Rate limiting on API routes
- [ ] Input validation on all endpoints
- [ ] Dependencies updated (`npm audit fix`)
- [ ] CSP headers configured
- [ ] XSS protection enabled

### Add Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to API routes
app.use('/api/', limiter);
```

---

## Monitoring & Logging

### Option A: Vercel Analytics

Built-in for Vercel deployments.

### Option B: Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Option C: LogRocket

```bash
npm install logrocket
```

---

## Backup Strategy

### MongoDB Backups

**Automated (MongoDB Atlas):**
- Automatic daily backups
- Point-in-time recovery
- Configured in Atlas dashboard

**Manual Backups:**
```bash
# Dump database
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/mersiv" --out=/backup

# Restore
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/mersiv" /backup/mersiv
```

### Asset Backups

Set up versioning on S3/R2 buckets.

---

## Post-Deployment Checklist

- [ ] Application accessible at production URL
- [ ] 3D viewer loads correctly
- [ ] Socket.io connects successfully
- [ ] Widget embeds on test domain
- [ ] MongoDB read/write operations work
- [ ] Assets load from CDN
- [ ] Analytics tracking functional
- [ ] SSL certificate valid
- [ ] Performance acceptable (Lighthouse score >90)
- [ ] Mobile responsive
- [ ] Cross-browser tested
- [ ] Error monitoring active
- [ ] Backup system configured

---

## Rollback Plan

### Quick Rollback (Vercel)

```bash
vercel rollback
```

### Manual Rollback

1. Stop current deployment
2. Restore previous code version
3. Restore MongoDB backup if needed
4. Restart services

---

## Maintenance

### Weekly
- [ ] Check error logs
- [ ] Review analytics
- [ ] Monitor disk space

### Monthly
- [ ] Update dependencies (`npm update`)
- [ ] Review security advisories (`npm audit`)
- [ ] Test backups

### Quarterly
- [ ] Performance audit
- [ ] Security audit
- [ ] User feedback review

---

## Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Socket.io Docs**: https://socket.io/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Vercel Support**: https://vercel.com/support
- **Three.js Docs**: https://threejs.org/docs

---

## Troubleshooting Production Issues

### Issue: Socket.io Not Connecting

**Check:**
- WebSocket support enabled on server
- Firewall allows WebSocket connections
- CORS configured correctly
- Nginx proxy headers set

### Issue: Models Not Loading

**Check:**
- CORS headers on CDN
- URLs are absolute, not relative
- Files are publicly accessible
- Network tab shows 200 OK responses

### Issue: High Memory Usage

**Solutions:**
- Enable compression middleware
- Optimize GLB model sizes
- Implement lazy loading
- Add server-side caching

### Issue: Slow Performance

**Solutions:**
- Enable CDN for static assets
- Implement Redis caching
- Optimize database queries
- Add database indexes

---

## Success Metrics

Track these KPIs:
- Average page load time < 3 seconds
- Socket.io connection success rate > 99%
- API response time < 500ms
- Widget load success rate > 95%
- User engagement time
- Model drag operations per session

---

**Deployment Date:** _________________  
**Deployed By:** _________________  
**Environment:** ☐ Staging ☐ Production  
**Status:** ☐ Success ☐ Issues  
**Notes:** _________________
