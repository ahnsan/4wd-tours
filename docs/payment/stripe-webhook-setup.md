# Stripe Webhook Setup Guide for Medusa v2

## Overview

Medusa v2 **automatically handles Stripe webhooks** through the `@medusajs/medusa/payment-stripe` module provider. You do **NOT** need to create custom webhook endpoints - Medusa provides a built-in webhook handler at `/hooks/payment/{provider_id}`.

## How Medusa v2 Handles Webhooks

### Built-in Webhook Endpoint

Medusa automatically creates a webhook endpoint that:
- Listens for Stripe webhook events
- Verifies webhook signatures using your webhook secret
- Processes payment events (authorized, captured, failed)
- Updates order status automatically
- Handles asynchronous payment flows

### Webhook URL Pattern

The webhook URL follows this pattern:
```
{server_url}/hooks/payment/{provider_id}
```

Where:
- `{server_url}` is your Medusa backend URL
- `{provider_id}` is the provider ID without the `pp_` prefix

For the default Stripe setup (with `id: "stripe"` in medusa-config.ts), the webhook URL is:
```
http://localhost:9000/hooks/payment/stripe_stripe
```

**Important:** The provider ID format is `{identifier}_{id}`:
- `identifier` = "stripe" (from the Stripe module provider)
- `id` = "stripe" (from your medusa-config.ts configuration)

## Configuration

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Stripe Secret API Key (required)
STRIPE_API_KEY=sk_test_your_secret_key_here

# Stripe Webhook Secret (required for production, optional for development)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Where to find these:**
- **API Key:** Stripe Dashboard > Developers > API keys > Secret key
- **Webhook Secret:** Created when you add a webhook endpoint (see setup instructions below)

### 2. Medusa Configuration

The Stripe payment module is already configured in `/Users/Karim/med-usa-4wd/medusa-config.ts`:

```typescript
{
  resolve: "@medusajs/medusa/payment",
  options: {
    providers: [
      {
        resolve: "@medusajs/medusa/payment-stripe",
        id: "stripe",
        options: {
          apiKey: process.env.STRIPE_API_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
          capture: false, // Manual capture for better control
          automatic_payment_methods: true, // Enable Apple Pay, Google Pay, etc.
        },
      },
    ],
  },
}
```

**Configuration Options:**
- `apiKey`: Your Stripe Secret API Key (required)
- `webhookSecret`: Webhook signing secret for security (required for production)
- `capture`: Whether to automatically capture payments after authorization (default: false)
- `automatic_payment_methods`: Enable Stripe's automatic payment methods like Apple Pay, Google Pay (default: false)

## Stripe Dashboard Setup

### Step 1: Create a Webhook Endpoint

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers > Webhooks**
3. Click **Add endpoint**

### Step 2: Configure Webhook URL

**For Development (Local):**
```
http://localhost:9000/hooks/payment/stripe_stripe
```

**For Production:**
```
https://your-domain.com/hooks/payment/stripe_stripe
```

**Important:** Replace `your-domain.com` with your actual production domain.

### Step 3: Select Events to Listen To

Subscribe to the following webhook events:

- `payment_intent.amount_capturable_updated`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.partially_funded` (Medusa v2.8.5+)

**Why these events:**
- `payment_intent.succeeded`: Payment completed successfully
- `payment_intent.payment_failed`: Payment failed (card declined, etc.)
- `payment_intent.amount_capturable_updated`: Authorized payment ready to capture
- `payment_intent.partially_funded`: Partial payment received (for split payments)

### Step 4: Save and Copy Webhook Secret

1. Click **Add endpoint** to save
2. Click on the newly created endpoint
3. Click **Reveal** in the "Signing secret" section
4. Copy the webhook secret (starts with `whsec_`)
5. Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## Testing Webhooks Locally

### Method 1: Stripe CLI (Recommended)

The Stripe CLI allows you to test webhooks locally without exposing your development server to the internet.

#### Installation

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Other platforms:**
Download from [Stripe CLI releases](https://github.com/stripe/stripe-cli/releases)

#### Setup

1. Authenticate with Stripe:
```bash
stripe login
```

2. Forward webhook events to your local server:
```bash
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe
```

3. The CLI will output a webhook signing secret (starts with `whsec_`). Add this to your `.env` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_...from_cli_output...
```

#### Testing

While the CLI is running, you can trigger test events:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test payment requiring capture
stripe trigger payment_intent.amount_capturable_updated
```

You should see the webhook events being forwarded to your local Medusa backend in the CLI output.

### Method 2: ngrok (Alternative)

If you prefer to use ngrok to expose your local server:

1. Install ngrok: https://ngrok.com/download

2. Start your Medusa backend:
```bash
npm run dev
```

3. In a separate terminal, start ngrok:
```bash
ngrok http 9000
```

4. Copy the HTTPS forwarding URL (e.g., `https://abc123.ngrok.io`)

5. In Stripe Dashboard, create a webhook endpoint with URL:
```
https://abc123.ngrok.io/hooks/payment/stripe_stripe
```

6. Copy the webhook secret and add to `.env`

## Webhook Verification

### How Medusa Verifies Webhooks

Medusa automatically verifies webhook signatures using the `webhookSecret` to ensure:
- The request came from Stripe
- The payload hasn't been tampered with
- The webhook is not a replay attack

**Security Note:** For production, ALWAYS set `STRIPE_WEBHOOK_SECRET`. Without it, your webhook endpoint is vulnerable to malicious requests.

### What Happens When a Webhook is Received

1. Stripe sends webhook event to your endpoint
2. Medusa verifies the signature using `STRIPE_WEBHOOK_SECRET`
3. Medusa calls the payment provider's `getWebhookActionAndData` method
4. Based on the event type, Medusa performs one of the following:
   - **payment_intent.succeeded**: Marks payment as captured, creates order if not exists
   - **payment_intent.payment_failed**: Marks payment as failed, updates order status
   - **payment_intent.amount_capturable_updated**: Marks payment as authorized

## Multiple Payment Methods

If you're using multiple Stripe payment methods (Bancontact, iDEAL, etc.), each has its own webhook URL:

| Payment Method | Provider ID | Webhook URL |
|----------------|-------------|-------------|
| Basic Stripe | `pp_stripe_stripe` | `/hooks/payment/stripe_stripe` |
| Bancontact | `pp_stripe-bancontact_stripe` | `/hooks/payment/stripe-bancontact_stripe` |
| BLIK | `pp_stripe-blik_stripe` | `/hooks/payment/stripe-blik_stripe` |
| giropay | `pp_stripe-giropay_stripe` | `/hooks/payment/stripe-giropay_stripe` |
| iDEAL | `pp_stripe-ideal_stripe` | `/hooks/payment/stripe-ideal_stripe` |
| Przelewy24 | `pp_stripe-przelewy24_stripe` | `/hooks/payment/stripe-przelewy24_stripe` |
| PromptPay | `pp_stripe-promptpay_stripe` | `/hooks/payment/stripe-promptpay_stripe` |

You'll need to create separate webhook endpoints in Stripe for each payment method you use.

## Troubleshooting

### Webhook Not Receiving Events

**Check 1: Verify webhook URL is correct**
```bash
# Test if endpoint is accessible
curl http://localhost:9000/hooks/payment/stripe_stripe
```

**Check 2: Verify Stripe API key and webhook secret**
```bash
# Check environment variables are set
echo $STRIPE_API_KEY
echo $STRIPE_WEBHOOK_SECRET
```

**Check 3: Check Medusa logs**
```bash
# Start Medusa in development mode to see detailed logs
npm run dev
```

Look for webhook-related errors in the console output.

**Check 4: Test with Stripe CLI**
```bash
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe
```

This will show you exactly what events are being sent and any errors.

### Webhook Signature Verification Failed

**Cause:** Incorrect `STRIPE_WEBHOOK_SECRET`

**Solution:**
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click on your webhook endpoint
3. Reveal and copy the signing secret
4. Update your `.env` file with the correct secret
5. Restart your Medusa backend

### Webhook Events Not Updating Orders

**Cause:** Payment collection or order not found

**Solution:**
- Ensure the payment was created through Medusa
- Check that the `payment_collection_id` is valid
- Verify the cart was converted to an order before payment completion

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `STRIPE_API_KEY` to your production Stripe secret key (starts with `sk_live_`)
- [ ] Create webhook endpoint in Stripe with your production URL
- [ ] Set `STRIPE_WEBHOOK_SECRET` to the production webhook signing secret
- [ ] Subscribe to all required webhook events
- [ ] Test webhook delivery with Stripe's test mode first
- [ ] Enable webhook signature verification (always use `webhookSecret`)
- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Set up webhook retry logic if needed (Stripe automatically retries)
- [ ] Enable region-specific payment methods if needed

## Additional Resources

- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks)
- [Medusa Payment Module Documentation](https://docs.medusajs.com/commerce-modules/payment)
- [Medusa Stripe Provider Documentation](https://docs.medusajs.com/commerce-modules/payment/payment-provider/stripe)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

## Support

If you encounter issues:
1. Check Medusa logs for errors
2. Check Stripe Dashboard > Developers > Webhooks for delivery attempts
3. Use Stripe CLI to test locally
4. Consult Medusa Discord or documentation
