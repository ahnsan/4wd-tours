# Quick Start: Add-ons Seeding

**⚡ Fast reference for executing the add-ons seeding script**

---

## 🎯 Quick Commands

### Railway (Production)
```bash
railway run npm run seed:addons
```

### Local (Test)
```bash
npm run seed:addons:dry
```

### Install Dependencies First
```bash
npm install
```

---

## ✅ Prerequisites Check

```bash
# 1. Check tsx is installed
npm list tsx

# 2. Check images exist
ls -la public/images/addons/*.jpg | wc -l
# Should show: 19

# 3. Test backend connectivity
curl https://4wd-tours-production.up.railway.app/health
```

---

## 🔑 Required Environment Variables

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://4wd-tours-production.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_c1aea896aab279e937a2375566b06bfda34775b149b33353ca77eb3e8588a91b
NEXT_PUBLIC_DEFAULT_REGION_ID=reg_01K9S1YB6T87JJW43F5ZAE8HWG
MEDUSA_ADMIN_TOKEN=<get-from-railway>
VERCEL_URL=sunshine-coast-4wd-tours.vercel.app
```

---

## 📝 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run seed:addons` | Execute seeding (production) |
| `npm run seed:addons:dry` | Test without creating products |
| `npm run seed:addons:verbose` | Enable detailed logging |

---

## 🚦 Execution Flow

1. **Test First (Dry Run)**
   ```bash
   npm run seed:addons:dry
   ```

2. **Review Output** - Should show:
   ```
   ✅ Created: 19 (in dry run, shows "Would create")
   ⏭️ Skipped: 0
   ❌ Failed: 0
   ```

3. **Execute for Real**
   ```bash
   npm run seed:addons
   # OR on Railway
   railway run npm run seed:addons
   ```

4. **Verify Results**
   - Check Medusa Admin: `/admin/products`
   - Test API: `curl .../store/add-ons?region_id=...`
   - View frontend: `/addons` page

---

## 🛠️ Quick Troubleshooting

| Error | Fix |
|-------|-----|
| "tsx not found" | Run `npm install` |
| "401 Unauthorized" | Set `MEDUSA_ADMIN_TOKEN` |
| "Region not found" | Check region exists in admin |
| "Image 404" | Verify Vercel deployment |

---

## 📊 Expected Results

**Success Output:**
```
✅ Created: 19
⏭️ Skipped: 0
❌ Failed: 0
🎉 Add-ons seeding completed successfully!
```

**Time:** ~10-15 seconds for all 19 products

**Products Created:**
- 5 Food & Beverage
- 2 Connectivity
- 4 Photography
- 3 Accommodation & Comfort
- 5 Activities & Equipment

---

## 📚 Full Documentation

- **Complete Guide:** `scripts/SEED-ADDONS-README.md`
- **Implementation Report:** `docs/ADDON-MIGRATION-SEED-COMPLETE.md`
- **Script Source:** `scripts/seed-addons-production.ts`

---

## 🔒 Safety Features

- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Error recovery** - Continues if one product fails
- ✅ **Dry run mode** - Test without changes
- ✅ **Rollback safe** - Delete in admin if needed

---

**Ready? Run:** `npm run seed:addons:dry` first, then `npm run seed:addons`
