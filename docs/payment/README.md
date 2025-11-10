# Stripe Payment & Webhook Setup

This directory contains comprehensive documentation for setting up and testing Stripe webhooks with Medusa v2.

## Quick Links

- **[Stripe Webhook Setup Guide](./stripe-webhook-setup.md)** - Complete setup instructions for production and development
- **[Stripe Webhook Testing Guide](./stripe-webhook-testing.md)** - How to test webhooks locally using Stripe CLI

## Quick Start

### 1. Environment Setup

Add to your `.env` file:
```env
STRIPE_API_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Medusa Configuration

Already configured in `/Users/Karim/med-usa-4wd/medusa-config.ts`:
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
          capture: false,
          automatic_payment_methods: true,
        },
      },
    ],
  },
}
```

### 3. Testing Locally (Stripe CLI)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe

# In another terminal, trigger a test event
stripe trigger payment_intent.succeeded
```

## Key Information

### Webhook URL

**Development:**
```
http://localhost:9000/hooks/payment/stripe_stripe
```

**Production:**
```
https://your-domain.com/hooks/payment/stripe_stripe
```

### Required Webhook Events

Subscribe to these events in Stripe Dashboard:
- `payment_intent.amount_capturable_updated`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.partially_funded`

### How It Works

Medusa v2 **automatically handles webhooks** - no custom code needed!

1. Stripe sends webhook event to `/hooks/payment/stripe_stripe`
2. Medusa verifies signature using `STRIPE_WEBHOOK_SECRET`
3. Medusa processes the event and updates payment/order status
4. Your storefront reflects the updated order status

## Important Notes

- **Webhooks are handled automatically by Medusa** - you don't need to create custom webhook endpoints
- **Webhook secret is optional for development** but **required for production**
- **Use Stripe CLI for local testing** - it's the easiest and most reliable method
- **Multiple payment methods require separate webhook endpoints** (see full documentation)

## Documentation Structure

```
docs/payment/
├── README.md                      # This file - quick overview
├── stripe-webhook-setup.md        # Complete setup guide
└── stripe-webhook-testing.md      # Testing instructions
```

## Troubleshooting

### Webhook signature verification failed
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly in `.env`
- Restart your Medusa backend after updating `.env`

### Webhook not receiving events
- Verify webhook URL is exactly: `http://localhost:9000/hooks/payment/stripe_stripe`
- Check that Medusa backend is running
- Use Stripe CLI to see webhook forwarding in real-time

### Payment not updating order
- Ensure payment was created through Medusa
- Check Medusa logs for specific errors
- Verify cart exists and has items

## Getting Help

1. Check the detailed guides in this directory
2. Check Medusa logs: `npm run dev`
3. Check Stripe Dashboard: https://dashboard.stripe.com/webhooks
4. Use Stripe CLI for debugging: `stripe listen`
5. Consult [Medusa Documentation](https://docs.medusajs.com/commerce-modules/payment)

## Next Steps

1. **Setup**: Read [stripe-webhook-setup.md](./stripe-webhook-setup.md)
2. **Configure**: Update your `.env` file with Stripe credentials
3. **Test**: Follow [stripe-webhook-testing.md](./stripe-webhook-testing.md)
4. **Deploy**: Set up production webhooks in Stripe Dashboard

## Configuration Files

Modified files for webhook support:
- `/Users/Karim/med-usa-4wd/medusa-config.ts` - Stripe module configuration
- `/Users/Karim/med-usa-4wd/.env` - Environment variables

## Additional Resources

- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks)
- [Medusa Payment Module](https://docs.medusajs.com/commerce-modules/payment)
- [Medusa Stripe Provider](https://docs.medusajs.com/commerce-modules/payment/payment-provider/stripe)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
