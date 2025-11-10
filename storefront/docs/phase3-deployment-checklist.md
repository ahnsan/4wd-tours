# Phase 3: Deployment Checklist

## Pre-Deployment Tasks

### Backend Setup
- [ ] Add `applicable_tours` metadata to all addons in Medusa
- [ ] Verify tour handles match product handles exactly
- [ ] Test metadata format: `["tour-handle-1", "tour-handle-2"]` or `["*"]`
- [ ] Backup database before making metadata changes
- [ ] Test metadata changes in staging environment first

### Frontend Verification
- [ ] Run `npm run build` - confirm no TypeScript errors
- [ ] Run `npm run lint` - confirm no linting errors
- [ ] Test filtering logic in development mode
- [ ] Verify performance logs show <50ms filtering time
- [ ] Check all console logs are appropriate for production

### Testing Checklist
- [ ] Test 1-day tour (expect ~13 addons)
- [ ] Test 3-day tour (expect all 16 addons)
- [ ] Test tour switching (verify incompatible addons removed)
- [ ] Test empty state (create tour with no addons)
- [ ] Test no tour in cart (verify redirect to tours page)
- [ ] Test filter badge displays correctly
- [ ] Test toast notifications appear and disappear
- [ ] Test loading states
- [ ] Test on mobile devices
- [ ] Test with slow network (throttling)

### Performance Testing
- [ ] Open browser DevTools → Console
- [ ] Verify filtering logs show <50ms
- [ ] Check page load time <2 seconds
- [ ] Monitor memory usage (no leaks)
- [ ] Test with 20+ addons
- [ ] Verify useMemo is preventing unnecessary recalculations

## Deployment Steps

### 1. Staging Deployment
```bash
# Deploy to staging
git checkout staging
git pull origin main
npm run build
# Deploy to staging server
```

- [ ] Deployed to staging
- [ ] Verify staging URL works
- [ ] Run through all test cases
- [ ] Check browser console for errors
- [ ] Test on different browsers (Chrome, Firefox, Safari)

### 2. Backend Data Migration
```bash
# In Medusa backend
npm run seed-addons  # or update via admin panel
```

- [ ] Metadata added to all addons
- [ ] Verified in Medusa admin panel
- [ ] Tested API response includes metadata
- [ ] Backed up before changes

### 3. Production Deployment
```bash
# Deploy to production
git checkout main
git merge staging
git push origin main
npm run build
# Deploy to production server
```

- [ ] Deployed to production
- [ ] Smoke test: Load add-ons flow page
- [ ] Verify filter badge shows
- [ ] Test one complete booking flow
- [ ] Monitor error logs for 15 minutes

## Post-Deployment Monitoring

### Immediate (First Hour)
- [ ] Monitor error tracking (Sentry, LogRocket, etc.)
- [ ] Check performance metrics
- [ ] Verify addon filtering working correctly
- [ ] Monitor user sessions
- [ ] Check browser console errors (sample users)

### First Day
- [ ] Review analytics for filtering metrics
- [ ] Check conversion rates (compare to baseline)
- [ ] Monitor empty state occurrences
- [ ] Review user feedback/support tickets
- [ ] Check mobile vs desktop metrics

### First Week
- [ ] Analyze A/B test results (if running)
- [ ] Review performance trends
- [ ] Identify most filtered addons
- [ ] Check for edge cases not caught in testing
- [ ] Gather team feedback

## Rollback Plan

### If Issues Found
```bash
# Rollback frontend
git revert HEAD
npm run build
# Deploy previous version

# Rollback backend metadata
# Restore from backup or set all to ["*"]
```

### Rollback Triggers
- [ ] Error rate > 1%
- [ ] Page load time > 5 seconds
- [ ] Filtering taking > 500ms
- [ ] User reports of incorrect filtering
- [ ] Conversion rate drops > 10%

## Success Metrics

### Technical Metrics
- [ ] Filtering performance < 50ms (current: ~3.5ms)
- [ ] Page load time < 2 seconds
- [ ] Error rate < 0.1%
- [ ] Zero filtering failures

### Business Metrics
- [ ] Conversion rate maintained or improved
- [ ] Average order value maintained
- [ ] Addon selection rate maintained
- [ ] User session time acceptable

### User Experience Metrics
- [ ] Filter badge visible and clear
- [ ] Empty states rare (<5% of sessions)
- [ ] Tour changes handled smoothly
- [ ] No user confusion (support tickets)

## Known Issues & Workarounds

### Issue 1: Missing Metadata
**Symptom**: Addon not showing for any tour
**Cause**: No `applicable_tours` in metadata
**Fix**: Add `["*"]` to show for all tours

### Issue 2: Wrong Tour Handle
**Symptom**: Addon not showing for expected tour
**Cause**: Tour handle mismatch
**Fix**: Verify handle matches product handle exactly

### Issue 3: Performance Slow
**Symptom**: Filtering taking >100ms
**Cause**: Too many addons or complex logic
**Fix**: Check console logs, optimize if needed

## Communication Plan

### Internal Team
- [ ] Notify development team of deployment
- [ ] Brief support team on new filtering feature
- [ ] Update internal documentation
- [ ] Schedule post-deployment review meeting

### External (if applicable)
- [ ] Update API documentation
- [ ] Notify partners of changes
- [ ] Update user guides
- [ ] Prepare FAQ for support

## Documentation Links

- Implementation Report: `/docs/addon-filtering-implementation.md`
- Quick Reference: `/docs/addon-filtering-quick-reference.md`
- Summary: `/docs/phase3-summary.md`
- Code: `/lib/data/addon-filtering.ts`

## Emergency Contacts

- Technical Lead: [Name/Contact]
- Product Owner: [Name/Contact]
- DevOps: [Name/Contact]
- On-Call Engineer: [Name/Contact]

## Sign-Off

### Development Team
- [ ] Code reviewed and approved
- [ ] Tests passed
- [ ] Documentation complete
- [ ] Performance verified

### Product Team
- [ ] Feature tested and approved
- [ ] UX reviewed
- [ ] Acceptance criteria met
- [ ] Ready for production

### DevOps Team
- [ ] Deployment plan reviewed
- [ ] Monitoring configured
- [ ] Rollback plan tested
- [ ] Backup verified

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Approved By**: _____________

**Status**: ⏳ Pending → ✅ Complete
