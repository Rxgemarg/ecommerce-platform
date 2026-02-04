# Security Documentation

## Security Posture Summary

This document outlines the security measures implemented in the e-commerce platform.

## Dependencies Security

### Critical Vulnerabilities Fixed
- ✅ **Next.js upgraded from 14.1.4 to 14.2.28** - Fixed authorization bypass vulnerability (GHSA-f82v-jwr5-mffw)

### Remaining Vulnerabilities (Non-Critical)
- **High**: Next.js DoS vulnerabilities (requires Next.js 15.x - major version upgrade pending)
- **High**: tar package vulnerabilities (via argon2 - build-time only dependency)
- **Moderate**: Lodash prototype pollution (via @nestjs/config)
- **Low**: cookie package (via csurf - will be addressed in future update)

## API Security Measures

### 1. Helmet Security Headers
All API responses include security headers via Helmet:
- Content-Security-Policy
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Resource-Policy: same-origin
- Strict-Transport-Security
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection
- Referrer-Policy: no-referrer

### 2. CORS Configuration
- Configurable allowed origins via `ALLOWED_ORIGINS` environment variable
- Credentials enabled for authenticated requests
- Methods restricted to: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Allowed headers: Content-Type, Authorization, X-CSRF-Token

### 3. Input Validation
- Global ValidationPipe with whitelist enabled
- Forbids non-whitelisted properties
- Automatic transformation of payloads
- DTO validation using class-validator

### 4. Authentication & Authorization
- JWT-based authentication with role-based access control (RBAC)
- Role hierarchy: OWNER > ADMIN > MANAGER > SUPPORT > VIEWER
- CSRF protection on state-changing operations
- Session management with secure cookies

### 5. API Structure
- Versioned API prefix: `/api/v1/`
- Swagger documentation available at `/api/docs` (can be disabled in production)
- Standardized error responses

## Frontend Security

### Storefront & Admin
- **XSS Protection**: React's built-in XSS prevention
- **CSRF Protection**: Implemented in API, tokens required for mutations
- **Content Security Policy**: Configured via Helmet headers
- **Secure Dependencies**: ESLint security rules enabled

### Environment Variables
- `.env` files are gitignored
- `NEXT_PUBLIC_API_URL` is the only public env var
- All secrets server-side only

## Database Security

### Supabase PostgreSQL
- SSL/TLS encryption required (`sslmode=require`)
- Connection pooling via Supabase
- Row Level Security (RLS) policies in place
- Direct connection URL separate from pooled connection

## Production Deployment Security

### Environment Variables Required
```bash
# Critical - Must be changed from defaults
JWT_SECRET=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>

# Database (Supabase)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# CORS - Restrict to your domains only
ALLOWED_ORIGINS=https://your-store.com,https://admin.your-store.com

# API URL for frontend
NEXT_PUBLIC_API_URL=https://api.your-store.com
```

### Security Checklist for Production

- [ ] Change all default secrets (JWT_SECRET, SESSION_SECRET)
- [ ] Enable HTTPS only (HSTS headers active)
- [ ] Restrict CORS origins to production domains
- [ ] Disable Swagger UI or protect with auth in production
- [ ] Enable rate limiting
- [ ] Configure proper logging (no PII/secrets)
- [ ] Set up monitoring and alerting
- [ ] Enable database audit logging
- [ ] Configure backup strategy
- [ ] Review and test RBAC permissions

## Security Best Practices Implemented

1. **No secrets in code**: All secrets via environment variables
2. **Input validation**: All endpoints validate input DTOs
3. **SQL Injection prevention**: Using Prisma ORM with parameterized queries
4. **Password hashing**: Argon2 for password storage
5. **Audit logging**: All write operations logged with user attribution
6. **Error handling**: Generic error messages to clients, detailed logs server-side

## Incident Response

If a security incident is suspected:

1. Rotate all secrets immediately (JWT_SECRET, SESSION_SECRET, DB credentials)
2. Review audit logs in Supabase
3. Check application logs for anomalies
4. Review active user sessions
5. Notify affected users if data breach confirmed

## Contact

For security concerns, please contact the development team.

---

Last updated: 2026-02-04
