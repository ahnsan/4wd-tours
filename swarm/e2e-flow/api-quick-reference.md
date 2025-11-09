# Store API Quick Reference

## Authentication

All Store API requests require a publishable API key:

```bash
export API_KEY="pk_34de56e6f305b46e6d22bb1d2d3304bd9eea498066ca7749bd667318dca31ffc"
```

## Product Endpoints

### List all products
```bash
curl -H "x-publishable-api-key: $API_KEY" \
  http://localhost:9000/store/products
```

### Get product by handle
```bash
curl -H "x-publishable-api-key: $API_KEY" \
  "http://localhost:9000/store/products?handle=1d-fraser-island"
```

### Filter by collection
```bash
# Tours collection
curl -H "x-publishable-api-key: $API_KEY" \
  "http://localhost:9000/store/products?collection_id[]=tours"

# Add-ons collection
curl -H "x-publishable-api-key: $API_KEY" \
  "http://localhost:9000/store/products?collection_id[]=add-ons"
```

## Product Handles

### Tours
- `1d-rainbow-beach`
- `1d-fraser-island`
- `2d-fraser-rainbow`
- `3d-fraser-rainbow`
- `4d-fraser-rainbow`

### Add-ons
- `addon-internet`
- `addon-glamping`
- `addon-bbq`

## Expected Response Format

```json
{
  "products": [
    {
      "id": "prod_01K9FWSH42B7XWHV26ZTYQKQBH",
      "handle": "1d-fraser-island",
      "title": "1 Day Fraser Island Tour",
      "status": "published",
      "collection": {
        "id": "pcol_...",
        "handle": "tours",
        "title": "4WD Tours"
      },
      "variants": [
        {
          "id": "variant_...",
          "title": "Default",
          "sku": "TOUR-1D-FRASER-ISLAND",
          "prices": [
            {
              "amount": 200000,
              "currency_code": "AUD"
            }
          ]
        }
      ]
    }
  ],
  "count": 8,
  "offset": 0,
  "limit": 50
}
```

## Troubleshooting

### "API key required" error
**Solution**: Restart the Medusa server
```bash
# Stop current server
# Then start again
pnpm dev
```

### No products returned
**Checklist**:
1. ✅ API key exists: Run `./scripts/get-api-key.ts`
2. ✅ API key linked to sales channel: Run `./scripts/setup-api-key.ts`
3. ✅ Products linked to sales channel: Run `./scripts/link-products-to-sales-channel.ts`
4. ✅ Server restarted after API key creation

### Verify products in database
```bash
pnpm medusa exec ./scripts/list-products.ts
```

## Re-seeding

To re-seed the database (idempotent):
```bash
pnpm medusa exec ./scripts/seed-tours.ts
```

This will:
- Skip existing products
- Create missing products
- Update product metadata if needed
