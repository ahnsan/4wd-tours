# Addon-Tour Mapping - Quick Reference Guide

**Last Updated:** 2025-11-08
**Status:** Planning Complete - Ready for Development

---

## TL;DR - What This Does

**Problem:** Admins need an easy way to configure which addons appear on which tour product pages.

**Solution:** Dual-location admin UI:
1. **Addon Page (Primary):** Select multiple tours this addon applies to
2. **Tour Page (Secondary):** View which addons are available for this tour

---

## Quick Facts

| Aspect | Details |
|--------|---------|
| **Primary Widget** | Addon Product → "Applicable Tours" section |
| **Secondary Widget** | Tour Product → "Available Add-ons" section |
| **Widget Zone** | `product.details.after` (both) |
| **Data Storage** | `addon.metadata.applicable_tours` (array of tour IDs) |
| **Implementation** | Medusa Admin SDK widgets (no core changes) |
| **Components** | `@medusajs/ui` + `@medusajs/admin-sdk` |

---

## Data Model (30 Second Overview)

### Addon Product Metadata
```typescript
{
  metadata: {
    addon: true,
    category: "Food & Beverage",

    // NEW FIELD
    applicable_tours: [
      "prod_tour_3d_fraser",
      "prod_tour_5d_ultimate"
    ]
  }
}
```

### Tour Product Metadata
```typescript
{
  metadata: {
    is_tour: true,
    duration_days: 3,

    // NO CHANGES NEEDED
    // Addons are found by querying addon products
  }
}
```

---

## User Workflow (Primary)

**Scenario:** Product manager adds new "Kayaking Adventure" addon

1. Navigate to **Products → Add-ons Collection**
2. Click **+ New Product**, create addon with details
3. Scroll to **"Applicable Tours"** widget
4. Click **"Edit Applicable Tours"**
5. Click **"Multi-Day Only"** preset button (8 tours selected)
6. Uncheck "3 Day Desert Tour" (no water access)
7. Click **"Save Tour Mappings"**
8. Toast: **"✓ Kayaking Adventure available on 7 tours"**

**Time:** < 2 minutes (vs. 10+ minutes manually)

---

## UI Components at a Glance

### Addon Page Widget

**Read Mode:**
```
┌─────────────────────────────────────┐
│ APPLICABLE TOURS                    │
│                                     │
│ 3 tours                             │
│ ✓ 1 Day Rainbow Beach Tour         │
│ ✓ 3 Day Fraser Island Explorer     │
│ ✓ 5 Day Ultimate Adventure          │
│                                     │
│ [Edit Applicable Tours]             │
└─────────────────────────────────────┘
```

**Edit Mode:**
```
┌─────────────────────────────────────┐
│ APPLICABLE TOURS                    │
│                                     │
│ [Select All] [Multi-Day] [Clear]   │
│ 🔍 Filter tours...                  │
│                                     │
│ 1 DAY TOURS (4)                     │
│ ☑ 1 Day Rainbow Beach Tour         │
│ ☐ 1 Day Noosa Everglades           │
│                                     │
│ MULTI-DAY TOURS (8)                 │
│ ☑ 3 Day Fraser Island Explorer     │
│ ☐ 3 Day Noosa Hinterland           │
│                                     │
│ [Cancel]          [Save Mappings]   │
└─────────────────────────────────────┘
```

### Tour Page Widget (Read-Only)

```
┌─────────────────────────────────────┐
│ AVAILABLE ADD-ONS FOR THIS TOUR     │
│                                     │
│ 8 addons available                  │
│                                     │
│ Food & Beverage (2)                 │
│ • Gourmet Beach BBQ - $180          │
│ • Picnic Hamper - $85               │
│                                     │
│ Photography (2)                     │
│ • Aerial Photography - $200         │
│ • GoPro Package - $75               │
└─────────────────────────────────────┘
```

---

## Implementation Files

### New Files to Create

```
src/admin/widgets/
├── addon-tour-mapping.tsx           ← PRIMARY WIDGET
└── tour-available-addons.tsx        ← SECONDARY WIDGET

src/lib/types/
└── addon-mapping.ts                 ← TYPE DEFINITIONS

src/lib/utils/
└── addon-mapping-utils.ts           ← UTILITY FUNCTIONS

src/api/admin/addons/[id]/tours/
└── route.ts                         ← API ENDPOINTS (optional)
```

### Existing Files (Reference Only)

- `/src/admin/widgets/tour-content-editor.tsx` - Example widget pattern
- `/src/admin/widgets/blog-post-products.tsx` - Checkbox selection example
- `/src/modules/seeding/tour-seed.ts` - Tour/addon data definitions

---

## Key Features

### Bulk Operations
- ✅ Select All Tours (21 tours)
- ✅ Select Multi-Day Only (8 tours)
- ✅ Select by Location (Fraser Island = 5 tours)
- ✅ Clear All

### Search & Filter
- ✅ Text search (title, location, category)
- ✅ Group by duration (single-day, multi-day)
- ✅ Filter by location
- ✅ Show only unmapped tours

### Validation
- ⚠️ Warning: Accommodation addon on 1-day tour
- ⚠️ Warning: Activity addon on non-beach tour
- ⚠️ Warning: 0 tours selected (allowed but warned)
- ❌ Error: Invalid tour ID

### User Feedback
- 🟢 Toast notifications (success/error)
- 📊 Live preview: "This addon applies to 8 tours"
- 🔔 Unsaved changes warning before leaving page

---

## API Reference (Quick)

### Get Tours for Addon
```http
GET /admin/addons/:id/applicable-tours
```

### Update Tour Mappings
```http
POST /admin/addons/:id/applicable-tours
Content-Type: application/json

{
  "tour_ids": ["tour_1", "tour_2"],
  "replace": true
}
```

### Get Addons for Tour
```http
GET /admin/tours/:id/available-addons
```

---

## Validation Rules Summary

| Addon Category | Recommended For | Warning If... |
|----------------|-----------------|---------------|
| Food & Beverage | All tours | None |
| Connectivity | All tours | None |
| Photography | All tours | None |
| Accommodation | Multi-day (2+ days) | Mapped to 1-day tours |
| Activities | Beach/water tours | Mapped to non-beach tours |

---

## Testing Checklist

### Unit Tests
- [ ] Widget renders only for addon products
- [ ] Loads existing tour mappings
- [ ] Validates tour IDs before save
- [ ] Applies presets correctly
- [ ] Filters tours by search query

### Integration Tests
- [ ] Updates addon metadata with tour IDs
- [ ] Retrieves addons for tour
- [ ] Handles API errors gracefully
- [ ] Persists changes to database

### E2E Tests
- [ ] Product manager maps addon to multiple tours
- [ ] Bulk select with "Multi-Day Only" preset
- [ ] Search and filter tours
- [ ] Save and verify success toast
- [ ] Check storefront - addon appears on selected tours

### Manual Testing
- [ ] Create new addon and map to 5 tours
- [ ] Edit existing addon and change mappings
- [ ] Use "Select All" and verify all 21 tours selected
- [ ] Test category validation warnings
- [ ] Verify tour page shows correct addons

---

## Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| Widget load time | < 500ms | TBD |
| Save operation | < 1s | TBD |
| Search response | < 200ms | TBD |
| Tour list render | < 300ms | TBD |

---

## Accessibility

- ✅ Keyboard navigation (Tab, Space, Enter, Escape)
- ✅ Screen reader support (ARIA labels)
- ✅ 4.5:1 color contrast ratio
- ✅ Focus indicators visible
- ✅ Error messages announced

---

## Implementation Phases

### Phase 1: Core Widget (Week 1)
**Goal:** Working addon-tour mapping on addon pages

**Tasks:**
- Create `addon-tour-mapping.tsx`
- Implement checkbox selection UI
- Add save functionality
- Add loading/saving states

**Deliverable:** Functional widget

### Phase 2: Enhanced UX (Week 2)
**Goal:** Professional UX with all features

**Tasks:**
- Add visual tour cards with thumbnails
- Implement search/filter
- Add bulk select presets
- Add validation and warnings
- Add mapping preview

**Deliverable:** Production-ready UX

### Phase 3: Secondary Widget (Week 3)
**Goal:** Tour page addon view

**Tasks:**
- Create `tour-available-addons.tsx`
- Implement read-only addon list
- Add quick-add functionality
- Add zero-addon warning

**Deliverable:** Complete dual-location system

### Phase 4: Optimization (Week 4)
**Goal:** Polish and production readiness

**Tasks:**
- Smart suggestions
- Caching optimization
- Analytics tracking
- User testing
- Documentation

**Deliverable:** Launch-ready feature

---

## Success Metrics

### Operational
- ⏱️ Time to map new addon: < 2 min (was 10+ min)
- ❌ Mapping errors: < 1%
- ⭐ Admin satisfaction: 4.5/5 stars

### Business
- 📈 Addon attachment rate: Monitor increase
- 💰 Average order value: Track addon revenue
- 📊 Product coverage: % of tours with addons

---

## Common Questions

**Q: Where is the data stored?**
A: In `addon.metadata.applicable_tours` as an array of tour product IDs.

**Q: What if I want an addon to apply to ALL tours?**
A: Set `metadata.applicable_to_all_tours = true` (future enhancement).

**Q: Can I map tours to addons from the tour page?**
A: Yes, using the secondary "Quick Add Addon" feature, but bulk operations should use addon page.

**Q: What happens if I select 0 tours?**
A: You'll get a warning, but save is allowed. Addon won't appear on any tour.

**Q: How do I know if my mappings are working?**
A: Check the storefront - addon should appear in cart flow for selected tours.

**Q: Can I export/import mappings?**
A: Not in Phase 1, but planned for Phase 4 (CSV import/export).

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `addon-tour-mapping-admin-ui-plan.md` | Full planning document (16 sections) |
| `addon-tour-mapping-technical-specs.md` | Technical implementation details |
| `tour-content-editor-widget.md` | Example widget implementation |
| `addon-copy-implementation-guide.md` | Addon content/copy reference |

---

## Development Commands

```bash
# Start Medusa dev server
npm run dev

# Build admin widgets
npm run build

# Run tests
npm run test

# Seed tours and addons
npm run seed
```

---

## Key Takeaways

1. **Dual-location strategy**: Primary on addon page, secondary on tour page
2. **Metadata storage**: `applicable_tours` array in addon product metadata
3. **Bulk operations**: Presets for efficient mapping (Select All, Multi-Day Only)
4. **Validation**: Category-based warnings to prevent mistakes
5. **User feedback**: Toast notifications, live previews, unsaved changes warnings
6. **No core changes**: Uses Medusa Admin SDK widgets only

---

## Next Steps

1. **Design Review:** Get approval from product manager and UX designer
2. **Technical Review:** Confirm API approach and data model
3. **Development:** Start Phase 1 (core widget)
4. **Testing:** Unit, integration, E2E tests
5. **Launch:** Deploy to production with monitoring

---

**Questions?** Refer to full planning document or contact technical lead.

**Status:** ✅ Planning Complete - Ready for Development

