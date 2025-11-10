# Stripe Production Setup Guide

## Overview

This guide covers complete Stripe configuration for production deployment of Medusa 4WD Tours, including switching from test mode to live mode, configuring webhooks, and testing payment flows.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Activate Stripe Account](#activate-stripe-account)
3. [Switch to Live Mode](#switch-to-live-mode)
4. [Get Live API Keys](#get-live-api-keys)
5. [Configure Webhooks](#configure-webhooks)
6. [Update Environment Variables](#update-environment-variables)
7. [Test Payment Flow](#test-payment-flow)
8. [Enable Payment Methods](#enable-payment-methods)
9. [Configure Fraud Prevention](#configure-fraud-prevention)
10. [Monitoring & Alerts](#monitoring--alerts)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

**Before starting, ensure you have:**

- [ ] Stripe account created: https://dashboard.stripe.com/register
- [ ] Business information ready (ABN, business address, bank details)
- [ ] Tax identification number (if applicable)
- [ ] Bank account for payouts
- [ ] Production backend deployed and accessible via HTTPS

---

## Activate Stripe Account

### Step 1: Complete Business Verification

1. Go to: https://dashboard.stripe.com/settings/account
2. Complete all required sections:

**Business Details:**
- Business type: Sole proprietorship / Company / Partnership
- Business name: "Medusa 4WD Tours" (or legal business name)
- Business address: Your business address
- Business website: https://medusa-4wd-tours.com
- Industry: "Tour Operators" or "Recreation Services"

**Personal Details (for sole proprietors or company directors):**
- Full legal name
- Date of birth
- Address
- Phone number

**Tax Information:**
- Australian Business Number (ABN): Your ABN
- Tax ID (TFN for sole traders, not usually required)

**Bank Account:**
- Account holder name
- BSB: Your bank BSB
- Account number: Your bank account number
- Account type: Business / Personal

### Step 2: Verify Your Identity

Stripe may require identity verification:

1. Upload identification (Driver's license, Passport)
2. May require business registration documents
3. Verification usually takes 1-3 business days

### Step 3: Activate Payments

1. Once verified, you'll see "Activate payments" button
2. Review and accept Stripe's terms of service
3. Account will be activated for live payments

**Verification Status:**
- Dashboard → Settings → Account
- Look for "Charges enabled: Yes" and "Payouts enabled: Yes"

---

## Switch to Live Mode

### Current Mode Indicator

**Top-left of Stripe Dashboard:**
- **Test mode** (gray badge) = Not production, using test keys
- **Live mode** (no badge or blue badge) = Production, using live keys

### Switch to Live Mode

1. Click the "Test mode" toggle switch in top-left corner
2. Switch to **OFF** (Live mode)
3. You'll see a warning: "You are now in live mode"
4. All subsequent operations will use live (real money) mode

**CRITICAL:** Always verify you're in the correct mode before copying keys!

---

## Get Live API Keys

### Step 1: Navigate to API Keys

1. Go to: https://dashboard.stripe.com/apikeys
2. **Verify "Test mode" toggle is OFF** (you're in live mode)
3. You'll see two types of keys

### Step 2: Identify Key Types

**Secret Key (Backend):**
- Starts with: `sk_live_`
- Used by: Medusa backend
- Keep secret: NEVER expose publicly
- Permissions: Full API access

**Publishable Key (Frontend):**
- Starts with: `pk_live_`
- Used by: Next.js storefront
- Safe to expose: Can be in browser code
- Permissions: Limited (create payment intents only)

### Step 3: Reveal and Copy Keys

**Secret Key:**
```
Format: sk_live_YOUR_STRIPE_LIVE_SECRET_KEY_HERE
```

1. Click "Reveal test key" (if hidden)
2. Copy the full key
3. Store securely (do NOT commit to git)
4. Add to backend environment variables

**Publishable Key:**
```
Format: pk_live_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

1. Copy the key
2. Add to both backend and storefront environment variables

### Step 4: Restricted Keys (Advanced, Optional)

For enhanced security, create restricted API keys:

1. Go to: https://dashboard.stripe.com/apikeys
2. Click "Create restricted key"
3. Name: "Production Backend - Limited Permissions"
4. Grant only required permissions:
   - ✅ Charges: Write
   - ✅ Customers: Write
   - ✅ Payment Intents: Write
   - ✅ Refunds: Write
   - ❌ Everything else: None
5. Use restricted key instead of full secret key

---

## Configure Webhooks

### Why Webhooks Are Critical

Webhooks notify your backend when payment events occur:
- Payment succeeded → Update order status to "paid"
- Payment failed → Update order status to "payment_failed"
- Refund issued → Update order with refund details

**Without webhooks:**
- Orders won't update automatically
- You'll need to manually check Stripe Dashboard
- Poor customer experience

### Step 1: Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/webhooks
2. **Verify you're in LIVE mode** (toggle off)
3. Click "+ Add endpoint"

**Endpoint Configuration:**

- **Endpoint URL:** `https://your-backend-domain.com/hooks/payment/stripe_stripe`
  - Example: `https://api.medusa-4wd-tours.com/hooks/payment/stripe_stripe`
  - MUST use HTTPS (not HTTP)
  - MUST be publicly accessible
  - Format: `https://{backend-url}/hooks/payment/stripe_stripe`

- **Description:** "Production Backend - Payment Webhooks"

- **Events to send:**
  - Click "Select events"
  - Choose specific events (recommended) OR all events

### Step 2: Select Webhook Events

**REQUIRED Events (Minimum):**

```
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
✅ payment_intent.amount_capturable_updated
✅ charge.succeeded
```

**RECOMMENDED Events (For Better Functionality):**

```
✅ payment_intent.canceled
✅ payment_intent.created
✅ charge.failed
✅ charge.refunded
✅ charge.updated
```

**If Using Subscriptions (Future):**

```
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
```

**Alternative: Select All Events**

For simplicity, you can select "all events", but this sends more data than needed.

### Step 3: Get Webhook Signing Secret

After creating the endpoint:

1. Click on the endpoint in the list
2. Under "Signing secret", click "Reveal"
3. Copy the secret (format: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
4. Add to backend environment variables

**Example:**
```
whsec_abcdef1234567890abcdef1234567890abcdef1234567890
```

### Step 4: Test Webhook Endpoint

**Send Test Webhook:**

1. In webhook endpoint details, click "Send test webhook"
2. Select event: `payment_intent.succeeded`
3. Click "Send test webhook"
4. Check response:
   - ✅ Status 200 OK = Working correctly
   - ❌ Status 400/500 = Check backend logs

**Using Stripe CLI (Advanced):**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local development
stripe listen --forward-to https://your-backend-domain.com/hooks/payment/stripe_stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

## Update Environment Variables

### Backend Environment Variables

**File:** Platform environment variables (Railway, Render, etc.)

```bash
# Stripe Live Mode Secret Key
STRIPE_API_KEY=sk_live_YOUR_STRIPE_LIVE_SECRET_KEY_HERE

# Stripe Live Mode Publishable Key (for reference, also in storefront)
STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to Update:**

**Railway:**
1. Project → Variables tab
2. Edit or add variable
3. Value updates immediately
4. Deployment auto-restarts

**Render:**
1. Dashboard → Service → Environment
2. Add variable or edit existing
3. Click "Save Changes"
4. Triggers redeployment

**Vercel (if hosting backend):**
1. Project Settings → Environment Variables
2. Select scope: Production
3. Add or update variables
4. Redeploy: `vercel --prod`

### Storefront Environment Variables

**File:** Platform environment variables (Vercel, etc.)

```bash
# Stripe Live Mode Publishable Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Vercel:**
1. Project Settings → Environment Variables
2. Add/update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Scope: Production
4. Redeploy: `vercel --prod`

---

## Test Payment Flow

### CRITICAL: Test Before Going Live

**Always test the complete payment flow before announcing to customers**

### Step 1: Test in Stripe TEST Mode First

Before using real money, test with test cards:

1. **Ensure TEST mode active** (toggle on in Stripe Dashboard)
2. Use test API keys in development environment
3. Use Stripe test cards

**Test Card Numbers:**

```
# Successful payment
4242 4242 4242 4242

# Card declined
4000 0000 0000 0002

# Insufficient funds
4000 0000 0000 9995

# 3D Secure authentication required
4000 0025 0000 3155
```

**Card Details:**
- Expiry: Any future date (e.g., 12/34)
- CVV: Any 3 digits (e.g., 123)
- ZIP/Postal Code: Any 5 digits (e.g., 12345)

**Test Flow:**
1. Add product to cart on storefront
2. Proceed to checkout
3. Enter test card details
4. Complete order
5. Verify order appears in Medusa Admin
6. Verify payment appears in Stripe Dashboard (Test mode)
7. Verify webhook events received (check backend logs)

### Step 2: Test in Stripe LIVE Mode (Real Money)

**Use small amount ($1-5 AUD) and refund immediately**

1. **Switch to LIVE mode** in Stripe Dashboard
2. Update backend/storefront with live API keys
3. Create test product with $1 price
4. Complete test order with REAL card
5. Verify order in Medusa Admin
6. Verify payment in Stripe Dashboard (Live mode)
7. **IMMEDIATELY REFUND** the test payment:
   - Stripe Dashboard → Payments
   - Click on test payment
   - Click "Refund payment"
   - Confirm refund

### Step 3: Test Webhook Delivery

1. Complete test payment (test mode or live mode)
2. Check backend logs for webhook events
3. Verify events logged:
   - `payment_intent.created`
   - `payment_intent.succeeded` (or `payment_failed`)
   - `charge.succeeded`

**Expected Log Output (example):**
```
[INFO] Webhook received: payment_intent.created
[INFO] Webhook received: payment_intent.succeeded
[INFO] Order updated: order_01ABCDEF status=completed
```

### Step 4: Test Failure Scenarios

**Test Failed Payment:**
1. Use test card: `4000 0000 0000 0002` (TEST mode)
2. Complete checkout
3. Verify order status: "payment_failed" or "requires_action"
4. Verify webhook `payment_intent.payment_failed` received

**Test 3D Secure (SCA):**
1. Use test card: `4000 0025 0000 3155` (TEST mode)
2. Complete checkout
3. Verify 3D Secure modal appears
4. Complete authentication
5. Verify payment succeeds

**Test Refund:**
1. Complete successful payment
2. Go to Medusa Admin → Orders
3. Click on test order
4. Issue refund
5. Verify refund appears in Stripe Dashboard
6. Verify webhook `charge.refunded` received

---

## Enable Payment Methods

### Default Payment Methods

Stripe enables these by default:
- ✅ Visa
- ✅ Mastercard
- ✅ American Express
- ✅ Discover (if US customers)
- ✅ Apple Pay (automatic with card payments)
- ✅ Google Pay (automatic with card payments)

### Optional Payment Methods for Australia

**Afterpay / Clearpay:**

1. Go to: https://dashboard.stripe.com/settings/payment_methods
2. Find "Afterpay / Clearpay"
3. Click "Enable"
4. Configure:
   - Display name: "Afterpay"
   - Currency: AUD
   - Minimum amount: $1 AUD
   - Maximum amount: $2,000 AUD (Afterpay limit)

**Requires code changes in Medusa/Storefront to support**

**BECS Direct Debit (Australian Bank Transfers):**

1. Go to: https://dashboard.stripe.com/settings/payment_methods
2. Find "BECS Direct Debit"
3. Click "Enable"
4. Useful for recurring payments (subscriptions)

**Requires code changes in Medusa to support**

### Configure Payment Methods in Medusa

**File:** `/medusa-config.ts` (already configured)

```typescript
{
  resolve: "@medusajs/medusa/payment-stripe",
  id: "stripe",
  options: {
    apiKey: process.env.STRIPE_API_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    capture: false, // Manual capture for better control
    automatic_payment_methods: true, // ✅ Enables Apple Pay, Google Pay, etc.
  },
}
```

**`automatic_payment_methods: true`** automatically enables:
- Apple Pay (if customer has Apple device)
- Google Pay (if customer has Google account)
- Browser-saved cards

---

## Configure Fraud Prevention

### Stripe Radar (Included with Stripe)

**Automatic fraud detection** - enabled by default in live mode

1. Go to: https://dashboard.stripe.com/radar/overview
2. Review Radar settings
3. Default rules:
   - Block high-risk payments
   - Challenge medium-risk payments (3D Secure)
   - Allow low-risk payments

**Customize Rules (Optional):**

1. Go to: https://dashboard.stripe.com/radar/rules
2. Add custom rules:
   - Block payments from specific countries
   - Require 3D Secure for high-value orders
   - Block payments with CVV mismatch

**Example Custom Rule:**
```
Block if :amount_in_aud: > 500 AND :ip_country: != 'AU'
```

### 3D Secure / Strong Customer Authentication (SCA)

**Enabled by default for European customers (regulatory requirement)**

**Enable for all payments (optional, for extra security):**

1. Go to: https://dashboard.stripe.com/settings/payment_methods
2. Under "Card payments", find "3D Secure"
3. Configure:
   - Automatic: Stripe decides when to challenge
   - Required: Always require 3D Secure (may reduce conversion)

**Recommendation:** Use "Automatic" (Stripe's default)

### Email Receipts

**Enable automatic email receipts:**

1. Go to: https://dashboard.stripe.com/settings/emails
2. Enable:
   - ✅ Successful payments
   - ✅ Failed payments
   - ✅ Refunds
   - ✅ Disputes
3. Customize email template (optional):
   - Add logo
   - Customize colors
   - Add custom message

---

## Monitoring & Alerts

### Stripe Dashboard Monitoring

**Daily checks:**
1. Payments: https://dashboard.stripe.com/payments
2. Failed payments: Filter by "Failed"
3. Disputes: https://dashboard.stripe.com/disputes
4. Balance: https://dashboard.stripe.com/balance

### Email Alerts

**Configure in:** https://dashboard.stripe.com/settings/notifications

**Enable alerts for:**
- ✅ Failed payments
- ✅ Disputes filed
- ✅ Payouts failed
- ✅ Large transactions (e.g., over $500)
- ✅ Unusual activity detected by Radar

### Webhook Monitoring

**Monitor webhook delivery:**

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your endpoint
3. View "Event log"
4. Check for failed deliveries (red status)

**Failed webhooks:**
- Stripe retries automatically (up to 3 days)
- Fix backend issue causing failures
- Manually resend failed events if needed

### Third-Party Monitoring

**Sentry (Error Tracking):**

```bash
# Backend .env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Configure Sentry to track:**
- Webhook processing errors
- Payment processing errors
- Stripe API errors

---

## Troubleshooting

### Issue 1: "No such API key"

**Error:** Authentication error, invalid API key

**Causes:**
- Using test key in live mode (or vice versa)
- Typo in API key
- API key revoked

**Solutions:**
1. Verify you're in correct mode (test vs live)
2. Re-copy API key from Stripe Dashboard
3. Check for extra spaces or line breaks in .env
4. Verify environment variable is set on platform

```bash
# Test API key
curl https://api.stripe.com/v1/charges \
  -u sk_live_REPLACE_WITH_YOUR_LIVE_KEY: \
  -d amount=100 \
  -d currency=aud

# Should return charges or authentication error
```

### Issue 2: Webhooks Not Received

**Symptoms:**
- Payments succeed but orders don't update
- No webhook events in logs

**Causes:**
- Webhook URL incorrect
- Webhook secret mismatch
- Backend not accessible publicly
- Firewall blocking Stripe IPs

**Solutions:**

1. **Verify webhook URL:**
   ```
   https://your-backend-domain.com/hooks/payment/stripe_stripe
   ```
   - Must be HTTPS
   - Must be publicly accessible (test: `curl https://...`)

2. **Verify webhook secret:**
   - Copy from Stripe Dashboard → Webhooks → Endpoint details
   - Ensure `STRIPE_WEBHOOK_SECRET` matches exactly

3. **Test webhook delivery:**
   - Stripe Dashboard → Webhooks → Endpoint → "Send test webhook"
   - Check response status (should be 200 OK)

4. **Check backend logs:**
   - Look for incoming webhook requests
   - Look for signature verification errors

5. **Verify endpoint accessibility:**
   ```bash
   curl -X POST https://your-backend-domain.com/hooks/payment/stripe_stripe \
     -H "Content-Type: application/json" \
     -d '{"test": true}'

   # Should return 200 or 400 (not 404)
   ```

### Issue 3: "Payment Failed" (No Specific Reason)

**Symptoms:**
- Customer reports payment failed
- No clear error message

**Common Causes:**
- Card declined by bank
- Insufficient funds
- Card expired
- CVV incorrect
- 3D Secure authentication failed

**Solutions:**

1. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/payments
   - Find the failed payment
   - View "Failure code" and "Failure message"

2. **Common failure codes:**
   - `card_declined` - Contact customer's bank
   - `insufficient_funds` - Ask customer to use different card
   - `expired_card` - Card expiry date has passed
   - `incorrect_cvc` - Wrong CVV code entered

3. **Advise customer:**
   - Try different card
   - Contact their bank
   - Check card details (expiry, CVV)

### Issue 4: 3D Secure Not Working

**Symptoms:**
- 3D Secure modal doesn't appear
- Authentication loop

**Solutions:**

1. Ensure Stripe.js is loaded correctly on storefront
2. Verify `automatic_payment_methods: true` in medusa-config.ts
3. Test with 3D Secure test card: `4000 0025 0000 3155`
4. Check browser console for JavaScript errors

### Issue 5: Refunds Not Processing

**Symptoms:**
- Refund fails in Medusa Admin or Stripe Dashboard

**Causes:**
- Charge not captured yet
- Insufficient funds in Stripe balance
- Bank declined refund

**Solutions:**

1. Verify charge is captured (Medusa uses `capture: false` by default)
2. Capture charge before refunding (if not auto-captured)
3. Check Stripe balance (if negative, add funds)
4. Wait 24 hours and retry (bank may be temporarily declining)

---

## Production Checklist

### Before Going Live

- [ ] Stripe account fully activated
- [ ] Business verification completed
- [ ] Bank account connected and verified
- [ ] Switched to LIVE mode in Stripe Dashboard
- [ ] Live secret API key copied and stored securely
- [ ] Live publishable API key copied
- [ ] Webhook endpoint created with correct URL (HTTPS)
- [ ] Webhook signing secret copied
- [ ] Required webhook events selected
- [ ] Backend environment variables updated with live keys
- [ ] Storefront environment variables updated with live keys
- [ ] Backend redeployed with new environment variables
- [ ] Storefront redeployed with new environment variables
- [ ] Test payment completed in TEST mode (test cards)
- [ ] Test payment completed in LIVE mode (real card, small amount)
- [ ] Test payment refunded successfully
- [ ] Webhook events received and logged correctly
- [ ] Order status updates correctly after payment
- [ ] Email receipts configured (optional)
- [ ] Stripe Radar enabled (default)
- [ ] Monitoring and alerts configured
- [ ] Failed payment handling tested
- [ ] 3D Secure authentication tested

### Post-Launch Monitoring

- [ ] Daily check of Stripe Dashboard for failures
- [ ] Weekly review of failed payments and disputes
- [ ] Monthly review of Radar (fraud) alerts
- [ ] Quarterly review of API key security
- [ ] Annual rotation of API keys (recommended)

---

## Support & Resources

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Documentation:** https://stripe.com/docs
- **Stripe API Reference:** https://stripe.com/docs/api
- **Stripe Support:** https://support.stripe.com
- **Medusa Stripe Integration:** https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider/stripe

---

**Last Updated:** 2025-11-10
**Version:** 1.0.0
