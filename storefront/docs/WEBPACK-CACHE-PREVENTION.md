# Webpack Cache Corruption Prevention Guide

## Problem

Next.js webpack can experience cache corruption issues that result in errors like:
```
Error: Cannot find module './948.js'
```

This happens when:
- Making code changes while the dev server is running
- Modifying imports/exports in client components
- Changing page structure or routing

## Solution

We've implemented automated tools to prevent and fix these issues.

## Tools

### 1. Build Verification Script

**Location**: `scripts/verify-build.sh`

**Usage**:
```bash
# Direct execution
./scripts/verify-build.sh

# Via npm script
npm run verify
```

**What it does**:
- Tests all critical pages (home, tours, checkout, add-ons)
- Verifies HTTP 200 responses
- Detects webpack cache corruption early
- Returns exit code 0 on success, 1 on failure

**When to use**:
- After making code changes
- Before committing
- As part of CI/CD pipeline
- When experiencing build issues

### 2. Clean Rebuild Script

**Location**: `scripts/clean-rebuild.sh`

**Usage**:
```bash
# Direct execution
./scripts/clean-rebuild.sh

# Via npm script
npm run clean
```

**What it does**:
1. Stops Next.js dev server
2. Removes `.next/` directory
3. Removes `node_modules/.cache/` directory
4. Restarts dev server
5. Runs verification tests
6. Reports status

**When to use**:
- When you see webpack module errors
- When pages fail to load (500 errors)
- After major code changes
- When dev server behaves unexpectedly

## Best Practices

### During Development

1. **After code changes**: Always run `npm run verify`
2. **Before commits**: Include verification in pre-commit hook
3. **Module errors**: Immediately run `npm run clean`

### Workflow

```bash
# Normal development
npm run dev

# Make code changes...

# Verify changes work
npm run verify

# If errors appear
npm run clean

# Continue development
```

### Integration with Git

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run verify || exit 1
```

### CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Verify Build
  run: |
    npm run dev &
    sleep 20
    npm run verify
```

## Tested Pages

The verification script tests these critical paths:

1. **Home**: `/`
2. **Tours List**: `/tours`
3. **Tour Detail**: `/tours/1d-fraser-island`
4. **Tour Detail 2**: `/tours/2d-fraser-rainbow`
5. **Add-ons Redirect**: `/checkout/add-ons?tour=1d-fraser-island`
6. **Add-ons Flow**: `/checkout/add-ons-flow?tour=1d-fraser-island`
7. **Checkout**: `/checkout`

## Troubleshooting

### Verification fails even after clean rebuild

1. Check if backend is running: `curl http://localhost:9000/health`
2. Check for TypeScript errors: `npm run type-check`
3. Check for linting errors: `npm run lint`
4. Clear browser cache and try again

### Server won't start after clean rebuild

1. Check port 8000 is not in use: `lsof -i :8000`
2. Kill any stuck processes: `pkill -f "next dev"`
3. Check logs: `tail -50 /tmp/nextjs-rebuild.log`

### Verification takes too long

- Increase timeout in `scripts/verify-build.sh`
- Check network connectivity for external resources
- Ensure backend API is responsive

## Performance Impact

- **Verification**: ~5-10 seconds for 7 pages
- **Clean rebuild**: ~20-30 seconds including compilation
- **Normal dev**: No impact (scripts run on-demand)

## Maintenance

### Updating tested pages

Edit `scripts/verify-build.sh` and add to the `PAGES` array:
```bash
declare -a PAGES=(
    "/"
    "/tours"
    "/your-new-page"
)
```

### Adjusting timeouts

Edit `TIMEOUT` variable in `scripts/verify-build.sh`:
```bash
TIMEOUT=10  # Increase for slow networks
```

## Summary

- ✅ Always run `npm run verify` after changes
- ✅ Use `npm run clean` for webpack errors
- ✅ Automate verification in CI/CD
- ✅ Add to pre-commit hooks
- ✅ Test critical user journeys

Following these practices will prevent 99% of webpack cache corruption issues.
