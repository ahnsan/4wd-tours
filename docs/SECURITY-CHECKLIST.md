# Production Security Checklist

## Pre-Deployment Security Review

Use this checklist before every production deployment to ensure security best practices are followed.

---

## 1. Secrets & Credentials

### Critical Secrets
- [ ] `JWT_SECRET` is at least 64 characters long
- [ ] `JWT_SECRET` is cryptographically random (generated via `crypto.randomBytes(64)`)
- [ ] `JWT_SECRET` is different from development/staging environments
- [ ] `COOKIE_SECRET` is at least 64 characters long
- [ ] `COOKIE_SECRET` is cryptographically random
- [ ] `COOKIE_SECRET` is different from development/staging environments
- [ ] All secrets are stored in platform secret manager (not in code)
- [ ] No secrets exist in git history (`git log --all -- '*.env'` returns nothing)

### API Keys
- [ ] Stripe API key is LIVE mode (`sk_live_`, not `sk_test_`)
- [ ] Stripe publishable key is LIVE mode (`pk_live_`, not `pk_test_`)
- [ ] Stripe webhook secret is configured
- [ ] Stripe webhook endpoint uses HTTPS
- [ ] All third-party API keys are production keys (not test/sandbox)
- [ ] API keys have minimum required permissions (principle of least privilege)

### Database & Redis
- [ ] Database password is at least 20 characters
- [ ] Database password is randomly generated (not dictionary word)
- [ ] Database connection uses SSL/TLS
- [ ] Redis password is configured (if not using localhost)
- [ ] Redis connection uses SSL/TLS (if remote)

### Secret Rotation
- [ ] Secret rotation schedule documented
- [ ] Process for emergency secret rotation established
- [ ] Team knows how to rotate secrets
- [ ] Last rotation date documented for all secrets

---

## 2. Environment Configuration

### Backend (Medusa)
- [ ] `NODE_ENV=production` is set
- [ ] `DATABASE_URL` points to production database
- [ ] `REDIS_URL` points to production Redis instance
- [ ] `STORE_CORS` contains only production storefront domains (HTTPS)
- [ ] `ADMIN_CORS` contains only production admin domains (HTTPS)
- [ ] `AUTH_CORS` contains only production auth domains (HTTPS)
- [ ] No `localhost` in CORS configuration
- [ ] No `http://` URLs in CORS (HTTPS only)
- [ ] No wildcard `*` in CORS (too permissive)

### Storefront (Next.js)
- [ ] `NEXT_PUBLIC_MEDUSA_BACKEND_URL` uses HTTPS
- [ ] `NEXT_PUBLIC_MEDUSA_BACKEND_URL` points to production backend
- [ ] `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is production key (not dev key)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is LIVE mode
- [ ] `NEXT_PUBLIC_DEBUG=false` in production
- [ ] No sensitive data in `NEXT_PUBLIC_*` variables (these are public)

---

## 3. Git & Version Control

### Repository Security
- [ ] `.env` file is in `.gitignore`
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env*.local` is in `.gitignore`
- [ ] `.env.production` is in `.gitignore` (if used locally)
- [ ] No secrets committed to git (run: `git log --all --full-history -- '*.env'`)
- [ ] No secrets in commit messages
- [ ] No secrets in code comments
- [ ] GitHub repository secrets are configured (if using GitHub Actions)

### Code Review
- [ ] All code changes peer-reviewed before merge to main
- [ ] Security-sensitive changes reviewed by senior developer
- [ ] No hardcoded secrets in source code
- [ ] No commented-out secrets in source code

---

## 4. Database Security

### Access Control
- [ ] Database user has minimum required permissions (not superuser)
- [ ] Database is not publicly accessible (IP allowlist configured)
- [ ] Database connections use SSL/TLS encryption
- [ ] Database password rotated within last 180 days
- [ ] Connection pooling configured (prevents connection exhaustion)

### Backup & Recovery
- [ ] Automated daily backups configured
- [ ] Backup retention policy defined (minimum 30 days)
- [ ] Backup restoration tested (at least once)
- [ ] Point-in-time recovery available (if supported)
- [ ] Backups stored in different region/account (disaster recovery)

### Data Protection
- [ ] Sensitive customer data encrypted at rest (PII, payment info)
- [ ] Database audit logging enabled
- [ ] SQL injection protection verified (use parameterized queries)

---

## 5. Payment Security (Stripe)

### Stripe Configuration
- [ ] Stripe account fully activated (not test mode)
- [ ] Business verification completed
- [ ] Bank account connected and verified
- [ ] Using LIVE mode API keys
- [ ] Test payment completed successfully with real card (small amount)
- [ ] Test payment refunded successfully

### Webhook Security
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook endpoint URL uses HTTPS
- [ ] Webhook secret configured in backend
- [ ] Webhook signature verification enabled (default in Medusa)
- [ ] Webhook endpoint is not publicly listed/discoverable
- [ ] All required webhook events configured:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `payment_intent.amount_capturable_updated`
  - [ ] `charge.succeeded`

### PCI Compliance
- [ ] No card numbers stored in database
- [ ] No CVV codes stored anywhere
- [ ] Payment form uses Stripe Elements (PCI-compliant)
- [ ] Stripe handles all sensitive payment data

### Fraud Prevention
- [ ] Stripe Radar enabled (fraud detection)
- [ ] 3D Secure (SCA) enabled for applicable regions
- [ ] Email receipts configured
- [ ] Dispute notifications enabled
- [ ] Refund policy clearly stated on website

---

## 6. CORS & API Security

### CORS Configuration
- [ ] CORS origins use HTTPS only
- [ ] No localhost in production CORS
- [ ] No wildcard `*` CORS (too permissive)
- [ ] Subdomain wildcards limited (e.g., `*.yourdomain.com` only if needed)
- [ ] CORS tested from browser console

### API Security
- [ ] Rate limiting enabled (prevent abuse)
- [ ] API endpoints require authentication where appropriate
- [ ] Admin endpoints protected (authentication required)
- [ ] Sensitive endpoints use HTTPS only
- [ ] API versioning strategy defined

---

## 7. SSL/TLS & HTTPS

### Certificate Configuration
- [ ] SSL/TLS certificates auto-provisioned (or manually configured)
- [ ] All domains use HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] HSTS header enabled (HTTP Strict Transport Security)
- [ ] Certificate expiration monitoring configured
- [ ] Certificate auto-renewal enabled

### Security Headers
- [ ] `Strict-Transport-Security` header set
- [ ] `X-Frame-Options: DENY` or `SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy` configured
- [ ] `Permissions-Policy` configured (if applicable)
- [ ] Content Security Policy (CSP) configured (Next.js)

---

## 8. Access Control & Authentication

### Admin Access
- [ ] Strong admin password (20+ characters, mixed case, numbers, symbols)
- [ ] Admin accounts use unique emails (not shared)
- [ ] Admin access limited to authorized personnel only
- [ ] Admin sessions expire after inactivity
- [ ] Multi-factor authentication (MFA) enabled (if supported)

### User Authentication
- [ ] Password complexity requirements enforced
- [ ] Passwords hashed with bcrypt/argon2 (default in Medusa)
- [ ] Account lockout after failed login attempts (if applicable)
- [ ] Password reset flow secure (token-based, time-limited)
- [ ] Email verification for new accounts

### Session Management
- [ ] Sessions use secure, HTTP-only cookies
- [ ] Session tokens are cryptographically random
- [ ] Session expiration configured (reasonable timeout)
- [ ] Sessions invalidated on logout
- [ ] Concurrent session limit (if applicable)

---

## 9. Infrastructure Security

### Server Configuration
- [ ] Server OS and packages up-to-date
- [ ] Unnecessary services disabled
- [ ] SSH access restricted (key-based authentication only)
- [ ] Firewall configured (only required ports open)
- [ ] DDoS protection enabled (Cloudflare, AWS Shield, etc.)

### Platform Security
- [ ] Deployment platform account uses MFA
- [ ] Team access follows principle of least privilege
- [ ] Audit logging enabled on platform
- [ ] IP allowlist configured (if supported)
- [ ] Platform security features enabled (e.g., Vercel Attack Challenge Mode)

### Container Security (if using Docker)
- [ ] Base images from trusted sources
- [ ] Base images regularly updated
- [ ] No secrets in Dockerfile
- [ ] Minimal image size (fewer attack vectors)
- [ ] Container runs as non-root user

---

## 10. Monitoring & Logging

### Error Tracking
- [ ] Error tracking service configured (Sentry, etc.)
- [ ] Production errors monitored and alerted
- [ ] Error logs do not expose sensitive data
- [ ] Stack traces sanitized in production

### Performance Monitoring
- [ ] Application performance monitoring (APM) configured
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom, etc.)
- [ ] Alerts configured for downtime/errors
- [ ] Performance budgets defined

### Security Monitoring
- [ ] Failed login attempts logged
- [ ] Suspicious activity alerts configured
- [ ] Database query logging enabled (for audit)
- [ ] API rate limit violations logged

### Log Management
- [ ] Centralized log aggregation (if multi-service)
- [ ] Logs do not contain secrets or PII
- [ ] Log retention policy defined (compliance)
- [ ] Logs stored securely

---

## 11. Data Privacy & Compliance

### GDPR Compliance (if applicable)
- [ ] Privacy policy published and accessible
- [ ] Cookie consent banner implemented (if using cookies)
- [ ] User data export functionality (if required)
- [ ] User data deletion functionality (if required)
- [ ] Data processing agreements with third parties

### Australian Privacy Principles (if applicable)
- [ ] Privacy policy complies with Australian Privacy Act
- [ ] Customer data stored/processed according to APP requirements
- [ ] Data breach notification process established

### PCI DSS (Payment Card Industry)
- [ ] No card data stored (Stripe handles all card data)
- [ ] PCI compliance questionnaire completed (if required)
- [ ] Regular security scans (if required)

---

## 12. Dependency Security

### Dependency Management
- [ ] All dependencies up-to-date (critical security patches)
- [ ] No known vulnerabilities (`npm audit` or `yarn audit` clean)
- [ ] Dependency scanning automated (Dependabot, Snyk, etc.)
- [ ] Lock files committed (`package-lock.json`, `yarn.lock`)
- [ ] Only necessary dependencies installed (minimal attack surface)

### Security Scanning
- [ ] Run `npm audit` or `yarn audit` before deployment
- [ ] Fix all critical and high severity vulnerabilities
- [ ] Review moderate vulnerabilities
- [ ] Document accepted risks (if any vulnerabilities remain)

---

## 13. Incident Response

### Preparation
- [ ] Security incident response plan documented
- [ ] Team trained on incident response
- [ ] Contact list for security incidents (who to notify)
- [ ] Escalation procedures defined

### Detection
- [ ] Security monitoring alerts configured
- [ ] Logs reviewed regularly
- [ ] Anomaly detection enabled (if applicable)

### Response
- [ ] Procedure for secret rotation in case of compromise
- [ ] Backup restoration procedure tested
- [ ] Communication plan for security incidents
- [ ] Post-incident review process defined

---

## 14. Testing

### Security Testing
- [ ] Penetration testing completed (if required)
- [ ] Vulnerability scanning completed
- [ ] SQL injection testing passed
- [ ] XSS (Cross-Site Scripting) testing passed
- [ ] CSRF (Cross-Site Request Forgery) protection verified

### Payment Testing
- [ ] Test payment flow with test cards (before going live)
- [ ] Test payment flow with real card (small amount, then refund)
- [ ] Test failed payment handling
- [ ] Test refund flow
- [ ] Test webhook delivery and retry logic

### Authentication Testing
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test password reset flow
- [ ] Test session expiration
- [ ] Test concurrent sessions (if applicable)

---

## 15. Documentation

### Security Documentation
- [ ] Security policies documented
- [ ] Secret rotation procedures documented
- [ ] Incident response plan documented
- [ ] Admin access procedures documented
- [ ] Backup and recovery procedures documented

### Deployment Documentation
- [ ] Deployment procedures documented
- [ ] Environment variables documented (see `.env.production.*.example`)
- [ ] Rollback procedures documented
- [ ] Post-deployment verification steps documented

---

## Sign-Off

### Deployment Approval

**Deployment Date:** _______________

**Deployed By:** _______________

**Reviewed By:** _______________

**Security Checklist Completed:** [ ] Yes [ ] No

**Outstanding Security Issues:**
- _______________________________________
- _______________________________________
- _______________________________________

**Risk Assessment:** [ ] Low [ ] Medium [ ] High

**Approved for Production:** [ ] Yes [ ] No

---

## Post-Deployment Verification

Complete within 1 hour of deployment:

- [ ] Health check endpoint responding
- [ ] Admin login functional
- [ ] Storefront loading correctly
- [ ] Test order completed successfully
- [ ] Payment processed successfully
- [ ] Webhook events received
- [ ] No errors in logs
- [ ] Monitoring alerts configured
- [ ] Performance metrics within acceptable range

---

**Last Updated:** 2025-11-10
**Version:** 1.0.0
**Next Review Date:** _______________
