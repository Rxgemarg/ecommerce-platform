# Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the e-commerce platform to production.

## Architecture

- **Storefront**: Next.js 14 deployed to Vercel
- **Admin Panel**: Next.js 14 deployed to Vercel
- **API**: NestJS deployed to Render (Docker)
- **Database**: Supabase PostgreSQL

## Prerequisites

1. Accounts created:
   - Vercel (https://vercel.com)
   - Render (https://render.com)
   - Supabase (https://supabase.com)
   - GitHub repository with code pushed

2. Required environment variables ready (see `.env.example`)

## Deployment Steps

### Step 1: Database Setup (Supabase)

1. Create a new Supabase project
2. Save the database connection strings:
   - **Connection string** (for API): `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require`
   - **Direct connection** (for migrations): Same as above
3. Run initial migrations:
   ```bash
   cd apps/api
   npx prisma migrate deploy
   ```

### Step 2: API Deployment (Render)

1. **Create Web Service on Render:**
   - Connect your GitHub repository
   - Select "Docker" as runtime
   - Set root directory: `./`
   - Dockerfile path: `apps/api/Dockerfile`

2. **Configure Environment Variables:**
   ```
   NODE_ENV=production
   API_PORT=3001
   DATABASE_URL=<your-supabase-connection-string>
   DIRECT_URL=<your-supabase-direct-connection>
   JWT_SECRET=<generate-strong-secret>
   SESSION_SECRET=<generate-strong-secret>
   ALLOWED_ORIGINS=<vercel-storefront-url>,<vercel-admin-url>
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Deploy:**
   - Render will automatically build and deploy
   - Note the API URL (e.g., `https://ecommerce-api-xxx.onrender.com`)

4. **Verify Deployment:**
   ```bash
   curl https://ecommerce-api-xxx.onrender.com/api/v1/product-types
   ```

### Step 3: Storefront Deployment (Vercel)

1. **Import Project:**
   - Go to Vercel Dashboard
   - Add New Project → Import Git Repository
   - Select your repository

2. **Configure Build Settings:**
   - Framework Preset: Next.js
   - Root Directory: `apps/storefront`
   - Build Command: `cd ../.. && pnpm build --filter=@ecommerce/storefront`
   - Install Command: `cd ../.. && pnpm install`
   - Output Directory: `.next`

3. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.onrender.com
   ```

4. **Deploy:**
   - Vercel will build and deploy automatically
   - Note the Storefront URL

### Step 4: Admin Panel Deployment (Vercel)

1. **Import Project:**
   - Add another project in Vercel
   - Select same repository

2. **Configure Build Settings:**
   - Framework Preset: Next.js
   - Root Directory: `apps/admin`
   - Build Command: `cd ../.. && pnpm build --filter=@ecommerce/admin`
   - Install Command: `cd ../.. && pnpm install`
   - Output Directory: `.next`

3. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.onrender.com
   ```

4. **Deploy:**
   - Vercel will build and deploy automatically
   - Note the Admin URL

### Step 5: Update API CORS

1. Go to Render Dashboard
2. Update `ALLOWED_ORIGINS` environment variable:
   ```
   https://your-storefront.vercel.app,https://your-admin.vercel.app
   ```
3. Redeploy the API service

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) automatically:

1. **On Pull Request:**
   - Runs linting
   - Runs type checking
   - Runs security audit
   - Builds all applications

2. **On Merge to Main:**
   - All PR checks
   - Builds and pushes API Docker image to GitHub Container Registry

### Setting up GitHub Secrets

Required secrets for CI/CD:
- `GITHUB_TOKEN` (automatically provided)
- `SNYK_TOKEN` (optional, for Snyk security scanning)

## Rollback Procedure

### API Rollback (Render)

1. Go to Render Dashboard → Your Service
2. Click "Manual Deploy" → "Deploy existing image"
3. Select the previous image tag
4. Click "Deploy"

### Frontend Rollback (Vercel)

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Find the previous working deployment
4. Click the three dots menu → "Promote to Production"

## Monitoring

### Health Check Endpoints

- **API**: `GET /api/v1/product-types` (should return 200 with product types)
- **Storefront**: `GET /` (should return 200)
- **Admin**: `GET /` (should return 200)

### Logs

- **API**: Render Dashboard → Service → Logs
- **Storefront/Admin**: Vercel Dashboard → Project → Logs
- **Database**: Supabase Dashboard → Logs

### Key Metrics to Monitor

1. API response times
2. Error rates (5xx responses)
3. Database connection pool
4. Frontend Core Web Vitals (Vercel Analytics)

## Common Issues & Solutions

### Issue: CORS Errors

**Solution:**
- Verify `ALLOWED_ORIGINS` includes the Vercel domains
- Check that origins don't have trailing slashes
- Redeploy API after updating environment variables

### Issue: Database Connection Failed

**Solution:**
- Verify DATABASE_URL format
- Ensure `sslmode=require` is included
- Check Supabase project is active
- Verify IP allowlist in Supabase (if applicable)

### Issue: Build Failures

**Solution:**
- Check that `pnpm-lock.yaml` is committed
- Verify all environment variables are set
- Check build logs for specific errors
- Ensure Node.js 20+ is specified

### Issue: 404 on API Endpoints

**Solution:**
- Remember API uses prefix `/api/v1/`
- Check Render service is running
- Verify health check endpoint works

## Security Checklist

Before going live:

- [ ] Change default JWT_SECRET and SESSION_SECRET
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Restrict CORS origins to production domains
- [ ] Disable Swagger UI in production (optional)
- [ ] Enable database audit logging in Supabase
- [ ] Set up rate limiting (configured in env vars)
- [ ] Review RBAC permissions
- [ ] Enable email verification (if using auth)

## Maintenance Windows

### Regular Updates

**Weekly:**
- Review security advisories
- Check dependency updates (`pnpm outdated`)

**Monthly:**
- Update dependencies
- Review and rotate secrets
- Analyze performance metrics

**Quarterly:**
- Security audit
- Disaster recovery test
- Backup restoration test

## Support Contacts

- **Vercel Support**: https://vercel.com/help
- **Render Support**: https://render.com/docs
- **Supabase Support**: https://supabase.com/support

---

## Quick Reference Commands

```bash
# Local development
pnpm dev              # Start all services
pnpm dev:api          # Start API only
pnpm dev:storefront   # Start storefront only
pnpm dev:admin        # Start admin only

# Build
pnpm build            # Build all applications
pnpm build --filter=@ecommerce/api        # Build API only
pnpm build --filter=@ecommerce/storefront # Build storefront only

# Database
pnpm db:push          # Push schema changes
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm lint             # Run linting
pnpm type-check       # Run type checking
pnpm test             # Run tests
pnpm audit            # Check for vulnerabilities
```

---

Last updated: 2026-02-04
