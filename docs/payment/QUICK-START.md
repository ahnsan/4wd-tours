# Stripe Webhook Quick Start

## 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms: https://github.com/stripe/stripe-cli/releases
```

## 2. Login to Stripe

```bash
stripe login
```

## 3. Start Your Medusa Backend

```bash
npm run dev
```

## 4. Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe
```

Copy the webhook secret that appears (starts with `whsec_`)

## 5. Update .env File

Add the webhook secret to `/Users/Karim/med-usa-4wd/.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## 6. Restart Medusa Backend

Stop (Ctrl+C) and restart:

```bash
npm run dev
```

## 7. Test Webhooks

In a separate terminal:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed
```

You should see the webhook events in both:
- Stripe CLI output (200 status = success)
- Medusa backend logs

## Production Setup

1. **Deploy your Medusa backend to production**

2. **Create webhook endpoint in Stripe Dashboard:**
   - URL: `https://your-domain.com/hooks/payment/stripe_stripe`
   - Events:
     - `payment_intent.amount_capturable_updated`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.partially_funded`

3. **Copy webhook secret and add to production .env:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_production_secret_here
   ```

4. **Use production Stripe API key:**
   ```env
   STRIPE_API_KEY=sk_live_your_live_key_here
   ```

## Important URLs

- **Local webhook:** `http://localhost:9000/hooks/payment/stripe_stripe`
- **Production webhook:** `https://your-domain.com/hooks/payment/stripe_stripe`
- **Stripe Dashboard:** https://dashboard.stripe.com/webhooks
- **Stripe Test Cards:** https://stripe.com/docs/testing#cards

## Need Help?

See the full documentation:
- [Complete Setup Guide](./stripe-webhook-setup.md)
- [Testing Guide](./stripe-webhook-testing.md)
- [Overview](./README.md)

## Troubleshooting

**Webhook signature verification failed:**
- Verify `STRIPE_WEBHOOK_SECRET` is set in `.env`
- Restart Medusa backend after updating `.env`

**Webhook not receiving events:**
- Check webhook URL is correct
- Verify Medusa backend is running
- Check Stripe CLI for errors

**Payment not updating order:**
- Ensure payment created through Medusa
- Check Medusa logs for errors
- Verify cart exists and has items
