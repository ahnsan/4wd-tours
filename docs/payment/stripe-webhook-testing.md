# Stripe Webhook Testing Guide

## Quick Start - Testing Webhooks Locally

This guide provides step-by-step instructions for testing Stripe webhooks during development.

## Method 1: Stripe CLI (Recommended)

The Stripe CLI is the easiest and most reliable way to test webhooks locally. It forwards webhook events from Stripe to your local development server without exposing it to the internet.

### Installation

#### macOS (Homebrew)
```bash
brew install stripe/stripe-cli/stripe
```

#### Linux (Debian/Ubuntu)
```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

#### Windows (Scoop)
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

#### Manual Download
Download from: https://github.com/stripe/stripe-cli/releases

### Authentication

1. Login to your Stripe account:
```bash
stripe login
```

2. This will open your browser to authenticate. Press Enter after authorizing.

3. Verify authentication:
```bash
stripe config --list
```

### Forward Webhooks to Local Server

1. Make sure your Medusa backend is running:
```bash
npm run dev
```

2. In a separate terminal, start the Stripe CLI webhook forwarding:
```bash
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe
```

3. The CLI will output a webhook signing secret (starts with `whsec_`):
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

4. Copy this secret and add it to your `.env` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

5. Restart your Medusa backend for the changes to take effect.

### Trigger Test Events

While `stripe listen` is running, open another terminal and trigger test events:

#### Test Successful Payment
```bash
stripe trigger payment_intent.succeeded
```

#### Test Failed Payment
```bash
stripe trigger payment_intent.payment_failed
```

#### Test Payment Awaiting Capture
```bash
stripe trigger payment_intent.amount_capturable_updated
```

#### Test Partial Payment
```bash
stripe trigger payment_intent.partially_funded
```

### Monitor Webhook Events

When a webhook event is triggered or forwarded, you'll see output like:

```
2024-01-15 10:30:45   --> payment_intent.succeeded [evt_xxxxxxxxxxxxx]
2024-01-15 10:30:45  <--  [200] POST http://localhost:9000/hooks/payment/stripe_stripe [evt_xxxxxxxxxxxxx]
```

**Status codes:**
- `200`: Webhook successfully processed
- `400`: Bad request (check Medusa logs)
- `401`: Authentication failed (check webhook secret)
- `500`: Server error (check Medusa logs)

### View Event Details

To see full details of a triggered event:

```bash
stripe events retrieve evt_xxxxxxxxxxxxx
```

## Method 2: ngrok (Alternative)

If you prefer to expose your local server to the internet, you can use ngrok.

### Installation

Download and install ngrok: https://ngrok.com/download

Or via Homebrew (macOS):
```bash
brew install ngrok
```

### Setup

1. Sign up for a free ngrok account: https://dashboard.ngrok.com/signup

2. Install your auth token:
```bash
ngrok config add-authtoken <your-auth-token>
```

### Usage

1. Start your Medusa backend:
```bash
npm run dev
```

2. In a separate terminal, start ngrok:
```bash
ngrok http 9000
```

3. ngrok will display a forwarding URL:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:9000
```

4. In Stripe Dashboard, create a webhook endpoint:
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Enter URL: `https://abc123.ngrok.io/hooks/payment/stripe_stripe`
   - Select events: `payment_intent.*`
   - Click "Add endpoint"

5. Copy the webhook signing secret and add to `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

6. Restart your Medusa backend

**Note:** The ngrok URL changes every time you restart it (unless you have a paid plan). You'll need to update the webhook endpoint URL in Stripe Dashboard each time.

## Method 3: Test Mode Payments

Test webhooks with actual payment flows using Stripe test cards.

### Test Card Numbers

Use these test card numbers in your storefront:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Declined Payment:**
- Card: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Requires Authentication (3D Secure):**
- Card: `4000 0025 0000 3155`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**More test cards:** https://stripe.com/docs/testing#cards

### Testing Flow

1. Make sure webhook forwarding is active (Method 1 or 2 above)

2. Go to your storefront and add products to cart

3. Proceed to checkout

4. Enter a test card number from above

5. Complete the payment

6. Watch the Stripe CLI output for webhook events:
```
payment_intent.created
payment_intent.succeeded
charge.succeeded
```

7. Verify in your Medusa Admin that the order was created and marked as paid

## Debugging Webhook Issues

### Check Medusa Logs

When running in development mode, Medusa logs all incoming requests:

```bash
npm run dev
```

Look for logs related to webhook processing:
- Webhook received
- Signature verification
- Payment status updates
- Order creation/updates

### Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. View "Events sent to endpoint" section
4. Click on individual events to see:
   - Request headers
   - Request body
   - Response status
   - Response body

### Common Issues

#### "Webhook signature verification failed"

**Cause:** Incorrect or missing `STRIPE_WEBHOOK_SECRET`

**Solution:**
1. Get the correct secret from Stripe CLI or Stripe Dashboard
2. Update `.env` file
3. Restart Medusa backend

#### "No endpoint found"

**Cause:** Incorrect webhook URL

**Solution:**
Verify the URL is exactly:
```
http://localhost:9000/hooks/payment/stripe_stripe
```

Check that:
- Port is correct (9000 by default)
- Provider ID is correct (`stripe_stripe` for default config)
- No extra slashes or characters

#### "Payment not updating order"

**Cause:** Payment not associated with cart/order

**Solution:**
1. Ensure payment session was created through Medusa
2. Check that cart exists and has items
3. Verify payment collection ID is valid
4. Check Medusa logs for specific errors

### Test Webhook Signature Verification

Create a simple test to verify webhook signatures are working:

```bash
# 1. Start webhook forwarding
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe

# 2. Trigger a test event
stripe trigger payment_intent.succeeded

# 3. Check the response status (should be 200)
# If you see 401 or 403, signature verification is failing
```

## Testing Production Webhooks

Before deploying to production, test with your production environment:

### Pre-Production Testing

1. Deploy your Medusa backend to staging/production environment

2. Create a webhook endpoint in Stripe **test mode**:
   - URL: `https://your-staging-domain.com/hooks/payment/stripe_stripe`
   - Events: All `payment_intent.*` events

3. Run test payments on your staging storefront

4. Verify webhooks are received and processed correctly

5. Check Stripe Dashboard for successful deliveries

### Production Testing

1. Create webhook endpoint in Stripe **live mode**:
   - URL: `https://your-production-domain.com/hooks/payment/stripe_stripe`
   - Events: All `payment_intent.*` events

2. Add the **live mode** webhook secret to production `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_production_secret_here
```

3. Test with real payment methods (or use live mode test cards if available)

4. Monitor webhook delivery in Stripe Dashboard

### Webhook Monitoring

Set up monitoring for production webhooks:

1. **Stripe Dashboard Monitoring:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Check "Events sent to endpoint"
   - Set up email alerts for failed deliveries

2. **Application Monitoring:**
   - Log all webhook events
   - Set up alerts for webhook processing errors
   - Monitor order creation success rates

3. **Webhook Retry Logic:**
   - Stripe automatically retries failed webhooks
   - Up to 3 days of automatic retries
   - Exponential backoff between retries

## Quick Reference Commands

### Stripe CLI Commands

```bash
# Login
stripe login

# List available events to trigger
stripe trigger --help

# Forward webhooks
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe

# Forward only specific events
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed --forward-to localhost:9000/hooks/payment/stripe_stripe

# View recent events
stripe events list

# View specific event
stripe events retrieve evt_xxxxxxxxxxxxx

# Resend event to webhook
stripe events resend evt_xxxxxxxxxxxxx

# Test webhook endpoint
stripe webhook deliver --endpoint-secret whsec_xxxxxxxxxxxxx
```

### Testing Checklist

- [ ] Stripe CLI installed and authenticated
- [ ] Medusa backend running (`npm run dev`)
- [ ] Webhook forwarding active (`stripe listen`)
- [ ] Webhook secret added to `.env`
- [ ] Test successful payment event
- [ ] Test failed payment event
- [ ] Test payment requiring capture
- [ ] Verify events in Medusa logs
- [ ] Verify order creation/updates
- [ ] Check Stripe Dashboard for delivery status

## Additional Resources

- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Medusa Payment Module Docs](https://docs.medusajs.com/commerce-modules/payment)

## Support

If you encounter issues during testing:

1. Check Medusa backend logs for errors
2. Check Stripe CLI output for webhook events
3. Check Stripe Dashboard for webhook delivery attempts
4. Review this guide's "Debugging Webhook Issues" section
5. Consult Medusa documentation or Discord community
