# Deployment Checklist - Med USA 4WD
**PRINT THIS PAGE AND CHECK OFF ITEMS DURING DEPLOYMENT**

---

## Pre-Deployment (30-60 min)

- [ ] All code committed to git (`git status` clean)
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] PageSpeed Desktop: **90+** (Score: _____)
- [ ] PageSpeed Mobile: **90+** (Score: _____)
- [ ] SEO score: **95+** (Score: _____)
- [ ] Database migrations tested
- [ ] Secrets generated (JWT, COOKIE, Stripe)
- [ ] Backup created (Tag: _______________)
- [ ] Rollback plan reviewed
- [ ] Team on standby

**GO/NO-GO**: ☐ GO  ☐ NO-GO

**Deployment Start Time**: _____________

---

## Phase 1: Infrastructure (60-90 min)

- [ ] Vercel account created
- [ ] Railway account created
- [ ] PostgreSQL database provisioned
- [ ] DATABASE_URL saved securely
- [ ] Domain purchased: _________________
- [ ] Staging environment created (optional)

**Phase 1 Complete**: ________ (time)

---

## Phase 2: Database (20-30 min)

- [ ] Database connection tested
- [ ] Migrations run successfully
- [ ] Seed data loaded
- [ ] Product count: 5 ✓
- [ ] Prices in dollars format verified
- [ ] Automated backups configured
- [ ] Manual backup created and stored

**Phase 2 Complete**: ________ (time)

---

## Phase 3: Backend (30-45 min)

- [ ] Repository connected to Railway
- [ ] Environment variables set:
  - [ ] DATABASE_URL
  - [ ] NODE_ENV=production
  - [ ] JWT_SECRET
  - [ ] COOKIE_SECRET
  - [ ] STORE_CORS
  - [ ] STRIPE_API_KEY (test for now)
  - [ ] STRIPE_WEBHOOK_SECRET
- [ ] Build settings configured
- [ ] Deployment successful
- [ ] Health check: 200 OK ✓
- [ ] Products API returns tours ✓
- [ ] Backend URL: _______________________

**Phase 3 Complete**: ________ (time)

---

## Phase 4: Storefront (30-45 min)

- [ ] Repository connected to Vercel
- [ ] Root directory: `storefront` ✓
- [ ] Environment variables set:
  - [ ] NEXT_PUBLIC_MEDUSA_BACKEND_URL
  - [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (test)
  - [ ] NEXT_PUBLIC_SITE_URL
- [ ] Build successful
- [ ] Site loads without errors ✓
- [ ] Tours display correctly ✓
- [ ] Prices display correctly ✓
- [ ] Storefront URL: ____________________

**Phase 4 Complete**: ________ (time)

---

## Phase 5: Stripe Production (30-45 min)

**⚠️ WARNING: Live payment processing begins here**

- [ ] Stripe live mode activated
- [ ] Business details completed
- [ ] Payment methods enabled
- [ ] Live API keys obtained:
  - [ ] pk_live_... (publishable)
  - [ ] sk_live_... (secret)
- [ ] Backend env updated with live keys
- [ ] Storefront env updated with live keys
- [ ] Applications redeployed
- [ ] Webhook endpoint configured
- [ ] Webhook URL: ______________________
- [ ] Webhook secret set
- [ ] Test webhook delivered ✓
- [ ] Test transaction completed
  - Amount: $_______
  - Payment ID: ___________________
- [ ] Webhook received ✓
- [ ] Order in database ✓
- [ ] **Test transaction REFUNDED** ✓

**Phase 5 Complete**: ________ (time)

---

## Phase 6: DNS & Domain (30 min + propagation)

- [ ] Domain added to Vercel
- [ ] DNS configured (A/CNAME records)
- [ ] www redirect configured
- [ ] API subdomain configured (optional)
- [ ] DNS propagation complete (check: whatsmydns.net)
- [ ] SSL certificate issued ✓
- [ ] HTTPS working ✓
- [ ] HTTP redirects to HTTPS ✓

**DNS Configuration Time**: ________
**Propagation Complete**: ________ (24-48 hours)

---

## Phase 7: Final Verification (45-60 min)

### E2E Booking Test
- [ ] Homepage loads
- [ ] Tour detail page loads
- [ ] Date and passengers selected
- [ ] Reserve tour clicked
- [ ] Checkout page loads
- [ ] Contact info filled
- [ ] Test payment (4242...) completed
- [ ] Confirmation page shows
- [ ] Order in Stripe ✓
- [ ] Order in database ✓

### Pricing Verification
- [ ] Great Fraser Island: $200 ✓
- [ ] Noosa Hinterland: $150 ✓
- [ ] Rainbow Beach: $180 ✓
- [ ] Sunshine Coast Custom: $250 ✓
- [ ] Multi-Day Fraser: $600 ✓

### Real Payment Test
- [ ] Small booking created with real card
- [ ] Payment succeeded in Stripe
- [ ] Order created in database
- [ ] **IMMEDIATELY REFUNDED** ✓

### Performance
- [ ] PageSpeed Desktop: _____ (90+ required)
- [ ] PageSpeed Mobile: _____ (90+ required)
- [ ] LCP: _____ (< 2.5s)
- [ ] FID: _____ (< 100ms)
- [ ] CLS: _____ (< 0.1)

### SEO
- [ ] SEO score: _____ (95+ required)
- [ ] Structured data validated ✓
- [ ] All metadata present ✓

### Browser Testing
- [ ] Chrome ✓
- [ ] Firefox ✓
- [ ] Safari ✓
- [ ] Mobile (iPhone/Android) ✓

### Monitoring
- [ ] Error monitoring active
- [ ] Analytics tracking ✓
- [ ] Web Vitals logging ✓

**Phase 7 Complete**: ________ (time)

---

## Phase 8: Go-Live (30-45 min)

- [ ] Placeholder text removed
- [ ] Final content review complete
- [ ] Legal pages present (Terms, Privacy, Refund)
- [ ] Sitemap accessible: /sitemap.xml ✓
- [ ] Google Search Console verified
- [ ] Sitemap submitted to Google
- [ ] Google Business Profile updated
- [ ] Social media announced:
  - [ ] Facebook
  - [ ] Instagram
  - [ ] Twitter/X
  - [ ] LinkedIn (if applicable)
- [ ] Log monitoring started:
  - Terminal 1: Backend logs
  - Terminal 2: Storefront logs
- [ ] Analytics monitoring started
- [ ] Team communication channel active
- [ ] Contact list confirmed

**Go-Live Complete**: ________ (time)

---

## Post-Deployment Monitoring

### First Hour Checks (every 15 min)
- [ ] 0:15 - No errors, site responsive
- [ ] 0:30 - No errors, site responsive
- [ ] 0:45 - No errors, site responsive
- [ ] 1:00 - No errors, site responsive

### First 24 Hours Checks

**Hour 2**: _____
- [ ] Error rate < 0.1%
- [ ] Performance stable
- [ ] Payment success rate > 95%

**Hour 4**: _____
- [ ] Error rate < 0.1%
- [ ] Performance stable
- [ ] Payment success rate > 95%

**Hour 8**: _____
- [ ] Error rate < 0.1%
- [ ] Performance stable
- [ ] Payment success rate > 95%

**Hour 24**: _____
- [ ] Error rate < 0.1%
- [ ] Performance stable
- [ ] Payment success rate > 95%
- [ ] Full smoke test passed

### Metrics to Track

| Metric | Target | Day 1 |
|--------|--------|-------|
| Uptime | > 99.9% | _____ |
| Error Rate | < 0.1% | _____ |
| PageSpeed Score | 90+ | _____ |
| Payment Success | > 95% | _____ |
| Response Time | < 200ms | _____ |

---

## Issues Encountered

| Time | Issue | Resolution | Duration |
|------|-------|------------|----------|
| _____ | _____ | _____ | _____ |
| _____ | _____ | _____ | _____ |
| _____ | _____ | _____ | _____ |

---

## Rollback Decision

**If critical issue occurs**:

☐ Continue monitoring and fix in place
☐ **INITIATE ROLLBACK**

**Rollback Started**: ________
**Rollback Completed**: ________

---

## Sign-Off

| Role | Name | Signature | Date/Time |
|------|------|-----------|-----------|
| Technical Lead | _____ | _____ | _____ |
| Backend Dev | _____ | _____ | _____ |
| Frontend Dev | _____ | _____ | _____ |
| QA Engineer | _____ | _____ | _____ |
| Project Manager | _____ | _____ | _____ |

---

## Final URLs

- **Production Site**: _______________________________
- **Backend API**: ___________________________________
- **Admin Panel**: ___________________________________

---

## Total Time

- **Estimated**: 4-6 hours (+ DNS propagation)
- **Actual**: ________ hours

**Deployment Status**: ☐ SUCCESS  ☐ PARTIAL  ☐ FAILED

---

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Deployment Date**: __________________
**Document Version**: 1.0
**For detailed instructions**: See DEPLOYMENT-RUNBOOK.md
