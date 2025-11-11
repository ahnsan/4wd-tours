# Medusa Admin Deployment - Documentation Index

Complete standalone Medusa Admin deployment for Vercel with Railway backend integration.

## Quick Navigation

### Getting Started
- **[QUICKSTART.md](./QUICKSTART.md)** - Deploy in 5 minutes (START HERE!)
- **[README.md](./README.md)** - Complete deployment guide

### Configuration
- **[ENV-VARIABLES.md](./ENV-VARIABLES.md)** - All environment variables explained
- **[RAILWAY-CORS-SETUP.md](./RAILWAY-CORS-SETUP.md)** - CORS configuration guide
- **[vercel.json](./vercel.json)** - Vercel deployment configuration
- **[package.json](./package.json)** - NPM scripts and dependencies

### Deployment Scripts
- **[build-and-deploy.sh](./build-and-deploy.sh)** - Full build and deploy automation
- **[deploy-only.sh](./deploy-only.sh)** - Quick deploy (when already built)

### Templates
- **[.env.example](./.env.example)** - Environment variables template
- **[.gitignore](./.gitignore)** - Git ignore rules
- **[.vercelignore](./.vercelignore)** - Vercel ignore rules

---

## Document Purposes

### QUICKSTART.md
**Who:** First-time deployers
**Purpose:** Get admin deployed in 5 minutes
**Content:**
- 3-step deployment process
- Minimal explanations
- Quick troubleshooting
- Essential commands only

### README.md
**Who:** Developers needing complete reference
**Purpose:** Comprehensive deployment and maintenance guide
**Content:**
- Architecture overview
- Detailed setup instructions
- Multiple deployment methods
- Custom domain setup
- Troubleshooting guide
- Maintenance procedures
- Complete command reference

### RAILWAY-CORS-SETUP.md
**Who:** Anyone setting up or fixing CORS
**Purpose:** Master CORS configuration
**Content:**
- Why CORS is critical
- Step-by-step CORS setup
- Railway dashboard walkthrough
- Railway CLI commands
- CORS troubleshooting
- Testing CORS configuration
- Security best practices

### ENV-VARIABLES.md
**Who:** Developers managing configuration
**Purpose:** Complete environment variables reference
**Content:**
- All variables explained
- Required vs optional
- How to set via CLI/dashboard
- Variable templates
- Security best practices
- Troubleshooting variables

---

## Common Workflows

### First Time Deployment

1. Read: [QUICKSTART.md](./QUICKSTART.md)
2. Run: `bash build-and-deploy.sh`
3. Follow: Step 2 for Railway CORS
4. Test: Admin login

**Time Required:** 5-10 minutes

### Updating After Code Changes

1. Make changes to `src/admin/` in parent project
2. Run: `bash build-and-deploy.sh`
3. Verify: New version deployed

**Time Required:** 3-5 minutes

### Fixing CORS Issues

1. Read: [RAILWAY-CORS-SETUP.md](./RAILWAY-CORS-SETUP.md)
2. Update Railway variables
3. Wait for redeploy
4. Test login

**Time Required:** 5 minutes

### Adding Custom Domain

1. Read: [README.md](./README.md) - Custom Domain section
2. Add domain in Vercel
3. Configure DNS
4. Update Railway CORS
5. Test access

**Time Required:** 30 minutes (plus DNS propagation)

---

## File Structure

```
/Users/Karim/med-usa-4wd/admin/
├── Documentation
│   ├── INDEX.md                    ← You are here
│   ├── QUICKSTART.md              ← Start here for deployment
│   ├── README.md                  ← Complete reference guide
│   ├── RAILWAY-CORS-SETUP.md      ← CORS configuration
│   └── ENV-VARIABLES.md           ← Environment variables
│
├── Configuration Files
│   ├── package.json               ← NPM configuration
│   ├── vercel.json               ← Vercel deployment config
│   ├── .env.example              ← Environment template
│   ├── .gitignore                ← Git ignore rules
│   └── .vercelignore             ← Vercel ignore rules
│
├── Deployment Scripts
│   ├── build-and-deploy.sh       ← Full automation script
│   └── deploy-only.sh            ← Quick deploy script
│
└── Build Output (After build)
    ├── index.html                ← Admin entry point
    └── assets/                   ← JS, CSS, images
```

---

## Related Documentation

### Parent Project Documentation
- `/Users/Karim/med-usa-4wd/README.md` - Project overview
- `/Users/Karim/med-usa-4wd/docs/ADMIN-DEPLOYMENT-GUIDE.md` - Alternative deployment guide
- `/Users/Karim/med-usa-4wd/docs/medusa-llm/` - Medusa v2 documentation

### Build Output
- `/Users/Karim/med-usa-4wd/.medusa/admin/` - Built admin files (source for deployment)

### Source Code
- `/Users/Karim/med-usa-4wd/src/admin/` - Admin customizations and widgets

---

## Support Resources

### Official Documentation
- **Medusa v2**: https://docs.medusajs.com
- **Vercel**: https://vercel.com/docs
- **Railway**: https://docs.railway.app

### Local Documentation
- **Medusa Full Docs**: `/Users/Karim/med-usa-4wd/docs/medusa-llm/medusa-llms-full.txt`
- **Build Guide**: Search for "admin-only" in Medusa docs

### Community
- **Medusa Discord**: https://discord.gg/medusajs
- **GitHub Issues**: https://github.com/medusajs/medusa/issues

---

## Quick Commands Reference

```bash
# Deploy admin (full process)
cd /Users/Karim/med-usa-4wd/admin
bash build-and-deploy.sh

# Deploy only (already built)
bash deploy-only.sh

# Build admin from parent project
cd /Users/Karim/med-usa-4wd
npx medusa build --admin-only

# Check Vercel deployments
npx vercel list

# Update Railway CORS
railway variables set ADMIN_CORS="...,https://your-admin.vercel.app"
railway variables set AUTH_CORS="...,https://your-admin.vercel.app"

# View logs
npx vercel logs              # Vercel
railway logs --follow        # Railway

# Create admin user
railway run npx medusa user --email admin@4wdtours.com.au --password [password]
```

---

## Checklist Templates

### Pre-Deployment Checklist

- [ ] Vercel account created
- [ ] Railway backend running
- [ ] Railway PostgreSQL connected
- [ ] Admin user created on backend
- [ ] Node.js 18+ installed locally
- [ ] Git configured (if using Git deployment)

### Deployment Checklist

- [ ] Admin built successfully (`npx medusa build --admin-only`)
- [ ] Deployed to Vercel
- [ ] Deployment URL obtained
- [ ] Railway ADMIN_CORS updated
- [ ] Railway AUTH_CORS updated
- [ ] Railway backend redeployed
- [ ] Can access admin URL
- [ ] Login page loads without errors
- [ ] Successfully logged in
- [ ] Dashboard displays correctly
- [ ] Products list loads
- [ ] No CORS errors in console

### Post-Deployment Checklist

- [ ] Admin credentials saved in password manager
- [ ] Deployment URL documented
- [ ] Team notified of new admin URL
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up (Vercel Analytics)
- [ ] Backup admin user created
- [ ] Documentation updated with actual URLs

---

## Troubleshooting Quick Links

| Issue | See Document | Section |
|-------|-------------|---------|
| CORS errors on login | RAILWAY-CORS-SETUP.md | Common Issues |
| Blank admin page | README.md | Troubleshooting |
| Can't login | README.md | Admin User Management |
| Environment variable not working | ENV-VARIABLES.md | Troubleshooting |
| Deployment fails | QUICKSTART.md | Troubleshooting |
| Custom domain not working | README.md | Custom Domain Setup |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-11 | Initial standalone admin setup |
| | | - Complete deployment automation |
| | | - Comprehensive documentation |
| | | - Railway integration guide |
| | | - CORS configuration guide |

---

## Project Context

### Architecture

```
Vercel (Admin)  →  Railway (Backend)  →  PostgreSQL (Database)
                ↓
          Vercel (Storefront)
```

### Key URLs

| Service | URL |
|---------|-----|
| **Admin** | `https://[your-deployment].vercel.app` |
| **Backend** | `https://4wd-tours-production.up.railway.app` |
| **Storefront** | `https://4wd-tours-913f.vercel.app` |

### Technology Stack

- **Admin Frontend**: Medusa Admin v2 (React SPA)
- **Backend**: Medusa v2 (Node.js)
- **Database**: PostgreSQL (Railway)
- **Cache**: Redis (Railway, optional)
- **Hosting**: Vercel (Admin + Storefront), Railway (Backend)

---

**Navigation Tip:** Use your IDE's file tree or CMD/CTRL+P to quickly jump between documents.

**Need Help?** Start with QUICKSTART.md for deployment or README.md for detailed reference.

---

**Created:** 2025-11-11
**Status:** Production Ready
**Maintained By:** 4WD Tours Development Team
