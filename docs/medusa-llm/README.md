# Medusa LLM Documentation

This directory contains locally cached Medusa.js documentation optimized for LLM/AI consumption.

## 📁 Contents

- `medusa-llms-full.txt` - Complete Medusa documentation (full version)
- `medusa-llms.txt` - Concise Medusa documentation
- `learn-*.md` - Key documentation pages in Markdown format
- `metadata.json` - Information about last update
- `update-log.txt` - Update history and logs
- `backups/` - Previous versions (last 3 kept)

## 🔄 Updating Documentation

### Automatic Weekly Updates

The documentation is configured to update automatically every Monday at 9:00 AM.

**Status**: Check if automatic updates are running:
- macOS: `launchctl list | grep medusa`
- Linux: `crontab -l | grep medusa`

### Manual Update

To manually update the documentation:

```bash
# From project root
./scripts/update-medusa-docs.sh

# Or directly
cd /Users/Karim/med-usa-4wd
bash scripts/update-medusa-docs.sh
```

### First-Time Setup

If automatic updates are not configured, run:

```bash
./scripts/setup-weekly-docs-update.sh
```

## 📚 Using the Documentation

### For Claude Code / LLMs

When working on Medusa-related features:

1. **ALWAYS** check local documentation first before implementing
2. Reference `medusa-llms-full.txt` for comprehensive information
3. Use `medusa-llms.txt` for quick reference
4. Check specific `.md` files for detailed guides

### Key Documentation Files

- **Architecture**: `learn-introduction-architecture.md`
- **Workflows**: `learn-basics-workflows.md`
- **API Routes**: `learn-basics-api-routes.md`
- **Admin Customizations**: `learn-basics-admin-customizations.md`
- **Commerce Modules**: `learn-fundamentals-modules-commerce-modules.md`

## 🌐 Online Documentation

If you need the absolute latest or specific pages:
- Full docs: https://docs.medusajs.com/llms-full.txt
- Concise: https://docs.medusajs.com/llms.txt
- Any page as Markdown: `https://docs.medusajs.com/{path}/index.html.md`

## 📊 Update History

Check `update-log.txt` for complete update history.

Last update information is stored in `metadata.json`.

## 🔍 Quick Search

Use grep to search the documentation:

```bash
# Search full documentation
grep -i "workflow" medusa-llms-full.txt

# Search all markdown files
grep -r "api route" *.md
```

## ⚠️ Important Notes

1. **Always use local docs when available** - Reduces dependency on network
2. **Update weekly** - Medusa is actively developed
3. **Check metadata.json** - Verify documentation freshness
4. **Keep backups** - Last 3 versions are automatically retained

## 🛠️ Troubleshooting

### Update Script Fails

1. Check internet connection
2. Verify Medusa docs are accessible: `curl -I https://docs.medusajs.com/llms-full.txt`
3. Check update-log.txt for specific errors

### Missing Files

Run manual update: `./scripts/update-medusa-docs.sh`

### Outdated Documentation

Check last update: `cat metadata.json`
If older than 7 days, run manual update.

---

**Maintained by**: Medusa 4WD Project
**Update Frequency**: Weekly (Mondays, 9:00 AM)
**Last Manual Setup**: $(date)
