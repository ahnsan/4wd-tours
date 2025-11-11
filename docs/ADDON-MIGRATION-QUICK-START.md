# Add-ons Migration - Quick Start Guide

**TL;DR**: 3-step process to get 6 add-ons live in production

---

## Prerequisites Check (2 minutes)

```bash
# 1. Verify Railway connection
cd /Users/Karim/med-usa-4wd
railway status

# 2. Verify images exist
ls -lh storefront/public/images/addons/addon-*.jpg | wc -l
# Expected: 20 (including extras)

# 3. Verify seed script
ls -lh scripts/seed-addons.ts
```

---

## Step 1: Deploy Images (5 minutes)

Images are already in `/storefront/public/images/addons/`. Deploy storefront:

```bash
cd /Users/Karim/med-usa-4wd/storefront
vercel --prod
```

**Verify**: Visit https://4wd-tours-913f.vercel.app/images/addons/addon-internet.jpg

---

## Step 2: Seed Database (5 minutes)

Run the seed script on Railway:

```bash
cd /Users/Karim/med-usa-4wd
railway run npx medusa exec ./scripts/seed-addons.ts
```

**Expected Output**:
```
✅ Add-ons seeding complete!
   Created 6 add-on products
```

---

## Step 3: Verify (3 minutes)

```bash
# Test backend health
curl https://4wd-tours-production.up.railway.app/health

# Test storefront add-ons page
curl -I https://4wd-tours-913f.vercel.app/checkout/add-ons
```

**Manual Check**: Visit https://4wd-tours-913f.vercel.app/checkout/add-ons

---

## Done!

You should now see 6 add-on products:
1. Always-on High-Speed Internet ($50/day)
2. Glamping Setup ($250/booking)
3. BBQ on the Beach ($180/day)
4. Professional Camera Rental ($75/booking)
5. Gourmet Picnic Package ($85/day)
6. Fishing Gear Package ($65/day)

---

## Troubleshooting

**Railway timeout?** Try via Railway Dashboard:
- Dashboard → Service → Settings → Run Command: `npx medusa exec ./scripts/seed-addons.ts`

**Images not loading?** Re-deploy storefront:
```bash
cd /Users/Karim/med-usa-4wd/storefront
vercel --prod --force
```

**Need to rollback?**
```bash
railway run npx medusa exec ./scripts/delete-all-products.ts --filter="addon-"
```

---

## Full Documentation

See `/docs/ADDON-MIGRATION-EXECUTION-PLAN.md` for complete details.
