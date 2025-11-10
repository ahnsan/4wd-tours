# Addon Persuasive Copy - Implementation Guide

## Quick Reference

All persuasive copy has been implemented in the seeding script at:
**`/src/modules/seeding/tour-seed.ts`**

## What's Been Added

### For Each of 16 Addons:

1. **`persuasive_title`** - Benefit-focused title (5-8 words)
2. **`persuasive_description`** - 2-3 emotional sentences selling the experience
3. **`value_proposition`** - Clear benefit statement comparing value
4. **`features`** - Array of 5-6 specific, detailed features
5. **`urgency_text`** - FOMO messaging (where applicable)
6. **`testimonial`** - Authentic customer quote with attribution
7. **`category_intro`** - Category headline
8. **`category_persuasion`** - Why this category matters (2-3 sentences)

## Category Organization

### 1. Food & Beverage (3 addons)
- Gourmet Beach BBQ - $180
- Picnic Hamper - $85
- Seafood Platter - $150

### 2. Connectivity (2 addons)
- Portable Internet - $30/day
- Starlink Satellite - $50/day

### 3. Photography (3 addons)
- Aerial Photography Package - $200
- GoPro Package - $75
- Professional Photo Album - $150

### 4. Accommodation (3 addons)
- Glamping Setup - $250/day
- Beach Cabana - $180/day
- Eco-Lodge Upgrade - $300/day

### 5. Activities (5 addons)
- Fishing Equipment - $65/day
- Sandboarding Gear - $45/day
- Bodyboarding Set - $35/day
- Paddleboarding Package - $55/day
- Kayaking Adventure - $75/day

## Frontend Display Recommendations

### Category Page Layout
```
┌─────────────────────────────────────┐
│ Category Introduction (Hero)        │
│ "Fuel Your Adventure"               │
│ Category persuasion text            │
└─────────────────────────────────────┘
│
▼
┌─────────────────────────────────────┐
│ Addon Card 1                         │
│ • Persuasive Title (H3)             │
│ • Price (prominent)                 │
│ • Persuasive Description            │
│ • Value Proposition (highlighted)   │
│ • Features (bullets)                │
│ • Testimonial (quote box)           │
│ • Urgency text (if applicable)      │
│ • [Add to Cart] button              │
└─────────────────────────────────────┘
```

### Recommended UI Elements

**1. Category Headers**
```typescript
<div className="category-header">
  <h2>{addon.metadata.category_intro}</h2>
  <p className="category-persuasion">
    {addon.metadata.category_persuasion}
  </p>
</div>
```

**2. Addon Card**
```typescript
<div className="addon-card">
  <h3>{addon.metadata.persuasive_title}</h3>
  <div className="price">${addon.price / 100}</div>

  <p className="description">
    {addon.metadata.persuasive_description}
  </p>

  <div className="value-prop highlight">
    <strong>Value:</strong> {addon.metadata.value_proposition}
  </div>

  <ul className="features">
    {addon.metadata.features.map(f => <li>{f}</li>)}
  </ul>

  {addon.metadata.urgency_text && (
    <div className="urgency">
      ⏰ {addon.metadata.urgency_text}
    </div>
  )}

  <blockquote className="testimonial">
    {addon.metadata.testimonial}
  </blockquote>

  <button>Add to Tour</button>
</div>
```

## Conversion Optimization Tips

### 1. Visual Hierarchy
- **Persuasive Title**: Largest text, eye-catching
- **Price**: Prominent but not intimidating
- **Value Proposition**: Highlighted/boxed
- **Features**: Easy-to-scan bullets
- **Testimonial**: Styled as authentic quote

### 2. Color Psychology
- **Urgency text**: Orange/red accent
- **Value proposition**: Green/gold highlight
- **Add button**: High-contrast CTA color
- **Testimonial**: Subtle background, italics

### 3. Mobile Optimization
- Stack elements vertically on mobile
- Keep persuasive title above fold
- Collapsible feature lists for space
- Sticky "Add to Tour" button

### 4. Social Proof Display
```typescript
// Show testimonials with star ratings
<div className="testimonial">
  <div className="stars">★★★★★</div>
  <p>{addon.metadata.testimonial}</p>
</div>
```

### 5. Bundling Strategy
Suggest complementary addons:
- Photography bundle: Drone + GoPro + Album (save 10%)
- Adventure bundle: Fishing + Sandboarding + Kayaking
- Comfort bundle: Glamping + Cabana + Picnic

## A/B Testing Ideas

### Test 1: Urgency Placement
- A: Urgency text at top (before description)
- B: Urgency text at bottom (before button)

### Test 2: Value Proposition Format
- A: "Value: [proposition text]"
- B: "Why book this: [proposition text]"
- C: Value prop integrated into description

### Test 3: Price Display
- A: "$45/day" (straightforward)
- B: "Just $45 per day" (minimizing language)
- C: "$45/day (saves you $100+ in rental fees)"

### Test 4: Feature Lists
- A: Plain bullet points
- B: Checkmark bullets with icons
- C: Expandable "See all features"

### Test 5: Testimonial Styling
- A: Quote with photo placeholder
- B: Star rating + quote
- C: Full review card with location

## Data to Track

### Key Metrics
1. **Addon attachment rate** (% of tours with addons)
2. **Average addons per booking**
3. **Revenue per addon category**
4. **Most/least popular addons**
5. **Addon combinations** (what's bought together)

### Heatmap Analysis
- Where users click most on addon cards
- How far users scroll in each category
- Which addons get most "Add to Cart" clicks
- Abandonment points in addon selection

### Customer Feedback
- Post-booking survey: "Which addons enhanced your tour most?"
- Net Promoter Score by addon category
- Review mining for addon mentions

## SEO Considerations

### Meta Fields for Each Addon
```typescript
{
  title: `${persuasive_title} | Fraser Island Tours`,
  description: value_proposition,
  keywords: [category, location, activity_type],
  openGraph: {
    title: persuasive_title,
    description: persuasive_description,
    image: addon_hero_image_url
  }
}
```

### Rich Snippets
Implement Product schema for each addon:
```json
{
  "@type": "Product",
  "name": "Aerial Photography Package",
  "description": "Professional drone photography...",
  "offers": {
    "@type": "Offer",
    "price": "200",
    "priceCurrency": "AUD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "reviewCount": "47"
  }
}
```

## Accessing the Data

### From Medusa Product
```typescript
const addon = await productService.retrieve(productId, {
  relations: ['variants', 'collection']
})

const {
  persuasive_title,
  persuasive_description,
  value_proposition,
  features,
  urgency_text,
  testimonial,
  category_intro,
  category_persuasion
} = addon.metadata
```

### Grouping by Category
```typescript
const addonsByCategory = addons.reduce((acc, addon) => {
  const cat = addon.metadata.category
  if (!acc[cat]) acc[cat] = []
  acc[cat].push(addon)
  return acc
}, {})
```

## Next Steps

1. **Design Phase**: Create UI mockups using this copy
2. **Development**: Implement addon display page
3. **Testing**: Set up A/B tests for key elements
4. **Analytics**: Implement tracking for addon performance
5. **Iteration**: Refine copy based on conversion data

## Files Reference

- **Seed Data**: `/src/modules/seeding/tour-seed.ts`
- **Full Copy Document**: `/docs/addon-persuasive-copy.md`
- **This Guide**: `/docs/addon-copy-implementation-guide.md`

---

**Questions or Updates?**
Contact the marketing team or update the seed file directly.
All changes sync automatically when seeding script runs.
