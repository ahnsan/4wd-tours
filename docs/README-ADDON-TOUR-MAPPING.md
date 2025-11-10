# Addon-Tour Mapping Documentation Suite

**Project:** Sunshine Coast 4WD Tours - Medusa E-commerce
**Feature:** Addon-Tour Mapping Admin UI
**Status:** Planning Complete - Ready for Development
**Date:** 2025-11-08

---

## Overview

This documentation suite provides comprehensive planning, technical specifications, and visual diagrams for implementing an admin UI that allows product managers to map addons to tours in the Medusa Admin dashboard.

**Problem Solved:** Admins need an intuitive way to configure which addons (e.g., "Kayaking Adventure") are available for which tours (e.g., "3 Day Fraser Island Explorer").

**Solution:** Dual-location admin widgets using Medusa Admin SDK.

---

## Documentation Files

### 1. Quick Reference (Start Here)
**File:** `ADDON-TOUR-MAPPING-QUICKREF.md` (11KB)
**Purpose:** 30-second overview for stakeholders and quick reference

**Contents:**
- TL;DR summary
- Quick facts table
- 30-second data model overview
- Primary user workflow
- UI mockups (ASCII)
- Implementation phases
- Testing checklist
- Success metrics

**Who should read this:**
- Product Managers
- Stakeholders
- Anyone needing high-level understanding
- Developers needing quick reference

**Reading time:** 5-10 minutes

---

### 2. Full Planning Document (Complete Specification)
**File:** `addon-tour-mapping-admin-ui-plan.md` (55KB)
**Purpose:** Comprehensive planning document with all requirements

**Contents:**
1. Admin Workflow Analysis
2. UI Component Design (Primary & Secondary)
3. Medusa Admin Customization
4. Data Validation
5. User Experience Design
6. User Workflow Diagram
7. Required Medusa Customizations
8. Implementation Phases
9. Testing Checklist
10. Code Examples (React components)
11. Performance Considerations
12. Accessibility (WCAG 2.1 AA)
13. Future Enhancements
14. Success Metrics
15. Documentation & Training
16. Approval & Sign-Off

**Who should read this:**
- Product Managers (Sections 1-6)
- UX Designers (Sections 2, 5, 12)
- Developers (All sections)
- QA Engineers (Section 9)
- Technical Leads (Sections 3, 7, 11)

**Reading time:** 45-60 minutes

---

### 3. Technical Specifications (Developer Guide)
**File:** `addon-tour-mapping-technical-specs.md` (31KB)
**Purpose:** Implementation reference for developers

**Contents:**
1. Data Schema (PostgreSQL, JSONB)
2. API Specifications (RESTful endpoints)
3. TypeScript Types (all interfaces)
4. Utility Functions (complete implementations)
5. React Hooks (custom hooks)
6. Testing (unit, integration, E2E)
7. Performance Optimization
8. Error Handling
9. Migration Guide

**Who should read this:**
- Developers (all sections)
- Technical Leads (architecture review)
- QA Engineers (section 6)

**Reading time:** 60-90 minutes

**Key Features:**
- Complete TypeScript type definitions
- Full utility function implementations
- Custom React hooks
- Database query examples
- API request/response examples
- Test examples

---

### 4. Visual Diagrams (Architecture & Workflows)
**File:** `addon-tour-mapping-diagrams.md` (56KB)
**Purpose:** Visual understanding of system architecture and workflows

**Contents:**
1. System Architecture Diagram
2. Data Flow Diagrams (2 flows)
3. User Workflow Diagrams (3 scenarios)
4. Component Hierarchy Diagram
5. State Machine Diagram
6. Database Relationship Diagram
7. Validation Flow Diagram
8. Preset Selection Diagram
9. Responsive Layout Diagrams (desktop, tablet, mobile)

**Who should read this:**
- Everyone (visual learners)
- UX Designers (all diagrams)
- Developers (architecture, state machine)
- Product Managers (workflows)
- QA Engineers (workflows, validation)

**Reading time:** 30-45 minutes

**Key Features:**
- ASCII art diagrams (no external tools needed)
- Complete user workflows
- State machine for widget behavior
- Database query visualizations
- Responsive design layouts

---

## Quick Navigation Guide

### I need to...

**...understand the feature in 5 minutes**
→ Read: `ADDON-TOUR-MAPPING-QUICKREF.md`

**...understand the complete requirements**
→ Read: `addon-tour-mapping-admin-ui-plan.md` (Sections 1-6)

**...design the UI mockups**
→ Read: `addon-tour-mapping-admin-ui-plan.md` (Section 2)
→ See: `addon-tour-mapping-diagrams.md` (Section 9)

**...implement the feature**
→ Read: `addon-tour-mapping-technical-specs.md` (all)
→ Reference: `addon-tour-mapping-admin-ui-plan.md` (Section 10)

**...understand data storage**
→ Read: `addon-tour-mapping-technical-specs.md` (Section 1)
→ See: `addon-tour-mapping-diagrams.md` (Section 6)

**...write tests**
→ Read: `addon-tour-mapping-technical-specs.md` (Section 6)
→ Reference: `addon-tour-mapping-admin-ui-plan.md` (Section 9)

**...understand user workflows**
→ See: `addon-tour-mapping-diagrams.md` (Section 3)
→ Reference: `ADDON-TOUR-MAPPING-QUICKREF.md`

**...get approval from stakeholders**
→ Present: `ADDON-TOUR-MAPPING-QUICKREF.md`
→ Deep dive: `addon-tour-mapping-admin-ui-plan.md` (Sections 1, 5, 14)

---

## Implementation Roadmap

### Phase 1: Core Widget (Week 1)
**Goal:** Working addon-tour mapping on addon pages

**Files to create:**
- `/src/admin/widgets/addon-tour-mapping.tsx`
- `/src/lib/types/addon-mapping.ts`
- `/src/lib/utils/addon-mapping-utils.ts`

**Reference:**
- Technical Specs: Sections 3, 4, 5
- Planning Doc: Section 10 (code examples)
- Diagrams: Section 4 (component hierarchy)

**Deliverable:** Functional widget with basic checkbox selection

---

### Phase 2: Enhanced UX (Week 2)
**Goal:** Professional UX with all features

**Tasks:**
- Visual tour cards
- Search/filter functionality
- Bulk select presets
- Validation and warnings
- Mapping preview

**Reference:**
- Planning Doc: Section 2 (UI design)
- Planning Doc: Section 5 (UX design)
- Diagrams: Section 7 (validation flow)
- Diagrams: Section 8 (preset logic)

**Deliverable:** Production-ready UX

---

### Phase 3: Secondary Widget (Week 3)
**Goal:** Tour page addon view

**Files to create:**
- `/src/admin/widgets/tour-available-addons.tsx`

**Reference:**
- Planning Doc: Section 2.B (secondary UI)
- Technical Specs: Section 10.2 (code example)

**Deliverable:** Complete dual-location system

---

### Phase 4: Optimization & Launch (Week 4)
**Goal:** Polish and production readiness

**Tasks:**
- Smart suggestions
- Caching optimization
- Analytics tracking
- User acceptance testing
- Documentation

**Reference:**
- Planning Doc: Section 11 (performance)
- Planning Doc: Section 13 (future enhancements)
- Technical Specs: Section 7 (optimization)

**Deliverable:** Launch-ready feature

---

## Key Decisions Made

### 1. Storage Approach
**Decision:** Use product metadata (`addon.metadata.applicable_tours`)
**Rationale:** Simple, no new tables, works with existing Medusa APIs
**Alternative Considered:** Medusa Link Module (more complex, overkill)

### 2. Primary UI Location
**Decision:** Addon product page (edit applicable tours)
**Rationale:** More efficient to select multiple tours from one addon
**Supporting Location:** Tour product page (read-only view)

### 3. Implementation Approach
**Decision:** Medusa Admin SDK widgets
**Rationale:** No core changes, clean separation, follows Medusa patterns
**Alternative Considered:** Custom admin pages (more complex)

### 4. Bulk Operations
**Decision:** Include preset buttons (Select All, Multi-Day, etc.)
**Rationale:** Saves time, reduces errors, better UX
**User Feedback:** Expected to reduce mapping time from 10+ min to < 2 min

### 5. Validation Strategy
**Decision:** Warnings (not errors) for category mismatches
**Rationale:** Allow flexibility, but guide admins with suggestions
**Example:** Warn if accommodation addon on 1-day tour, but allow save

---

## Data Model Summary

### Addon Product Metadata
```typescript
{
  metadata: {
    addon: true,
    category: "Food & Beverage",
    unit: "per_booking",

    // NEW FIELD
    applicable_tours: [
      "prod_tour_3d_fraser_island",
      "prod_tour_5d_ultimate_adventure"
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
    location: "Fraser Island",

    // NO CHANGES NEEDED
  }
}
```

### Query Logic
```sql
-- Get addons for a tour
SELECT * FROM product
WHERE metadata->>'addon' = 'true'
  AND metadata->'applicable_tours' ? 'tour_id'
```

---

## Success Metrics

### Operational Efficiency
- ⏱️ **Time to map addon:** < 2 min (target), 10+ min (current manual)
- ❌ **Mapping errors:** < 1% of saves
- ⭐ **Admin satisfaction:** 4.5/5 stars

### Business Impact
- 📈 **Addon attachment rate:** Monitor increase
- 💰 **Average order value:** Track addon revenue
- 📊 **Product coverage:** % of tours with addons

### Technical Performance
- ⚡ **Widget load time:** < 500ms
- 💾 **Save operation:** < 1s
- 🔍 **Search response:** < 200ms

---

## Testing Strategy

### Unit Tests (60+ tests)
- Widget render conditions
- Tour mapping logic
- Validation rules
- Preset selections
- Filter/search functions

### Integration Tests (20+ tests)
- API endpoint behavior
- Database updates
- Error handling
- Data persistence

### E2E Tests (10+ scenarios)
- Create new addon workflow
- Bulk update workflow
- Tour launch verification
- Search and filter
- Validation warnings

**Coverage Target:** 90%+

---

## Technology Stack

### Frontend
- **React** (Medusa Admin dashboard)
- **TypeScript** (type safety)
- **@medusajs/ui** (UI components)
- **@medusajs/admin-sdk** (widget system)

### Backend
- **Medusa Framework** (v2.11.3)
- **PostgreSQL** (database)
- **JSONB** (metadata storage)

### Development
- **Vite** (build tool)
- **Jest** (unit tests)
- **Playwright** (E2E tests)

---

## Related Documentation

### Existing Features (Reference)
- `tour-content-editor-widget.md` - Example widget implementation
- `addon-copy-implementation-guide.md` - Addon content reference
- `PRICE_EDITING_QUICK_START.md` - Price widget example
- `/src/admin/widgets/tour-content-editor.tsx` - Working widget code

### Medusa Resources
- Medusa Admin SDK: https://docs.medusajs.com/admin-development
- Admin Widgets: https://docs.medusajs.com/learn/fundamentals/admin
- Product API: https://docs.medusajs.com/api/admin#products

### Project Context
- 21 tour products (seeded in `/src/modules/seeding/tour-seed.ts`)
- 16 addon products (seeded in `/src/modules/seeding/tour-seed.ts`)
- Addon categories: Food & Beverage, Connectivity, Photography, Accommodation, Activities

---

## Approval Checklist

### Design Review
- [ ] Product Manager approval
- [ ] UX Designer approval
- [ ] Technical Lead approval
- [ ] Stakeholder sign-off

### Development Ready
- [ ] Requirements finalized
- [ ] Mockups approved
- [ ] API contracts defined
- [ ] Test cases documented
- [ ] Success metrics defined

### Launch Criteria
- [ ] All Phase 1 features complete
- [ ] 90%+ test coverage
- [ ] Performance targets met (<500ms load, <1s save)
- [ ] User acceptance testing passed
- [ ] Documentation complete
- [ ] Training materials prepared

---

## Frequently Asked Questions

### Q: Why not use Medusa's Link Module?
**A:** Link Module is for complex many-to-many relationships with additional attributes. Our use case is simpler: addons need a list of tour IDs. Storing in metadata is sufficient and avoids additional complexity.

### Q: Can I map a tour to addons instead of addon to tours?
**A:** The secondary widget allows "quick add" from tour pages, but bulk operations should use the addon page for efficiency (select 8 tours from 1 addon vs. select 1 addon on 8 tour pages).

### Q: What if I want universal addons (apply to all tours)?
**A:** Set `metadata.applicable_to_all_tours = true`. This is a planned Phase 4 enhancement.

### Q: How do I export/import mappings?
**A:** CSV import/export is a planned Phase 4 enhancement. For now, use the database directly for bulk updates.

### Q: Will this work with Medusa v3?
**A:** The planning uses Medusa v2.11.3 APIs. Migration to v3 may require updates to Admin SDK usage, but the core concepts remain valid.

### Q: Can I add custom validation rules?
**A:** Yes! See `addon-tour-mapping-technical-specs.md` Section 4 for utility function implementations. Add your rules to `validateTourMappings()`.

### Q: What about seasonal availability?
**A:** Planned for Phase 4. The data model includes `mapping_rules.seasonal_availability` for future implementation.

---

## Getting Help

### For Questions About...

**Requirements & Scope:**
→ Contact: Product Manager
→ Read: `addon-tour-mapping-admin-ui-plan.md` (Sections 1-6)

**UI/UX Design:**
→ Contact: UX Designer
→ Read: `addon-tour-mapping-admin-ui-plan.md` (Section 2)
→ See: `addon-tour-mapping-diagrams.md` (Section 9)

**Technical Implementation:**
→ Contact: Technical Lead
→ Read: `addon-tour-mapping-technical-specs.md`
→ Reference: Existing widgets in `/src/admin/widgets/`

**Testing:**
→ Contact: QA Lead
→ Read: `addon-tour-mapping-technical-specs.md` (Section 6)
→ Read: `addon-tour-mapping-admin-ui-plan.md` (Section 9)

**General Questions:**
→ Check this README
→ Read: `ADDON-TOUR-MAPPING-QUICKREF.md`

---

## Document Maintenance

### When to Update This Documentation

**After Phase Completion:**
Update implementation status, add learnings, update metrics

**When Requirements Change:**
Update planning doc, sync technical specs, update diagrams

**After User Feedback:**
Update UX design, add to FAQ, document improvements

**When APIs Change:**
Update technical specs, update code examples

### Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-08 | Initial documentation suite | Claude |

---

## Summary

This documentation suite provides everything needed to implement addon-tour mapping in Medusa Admin:

✅ **Planning complete** - All requirements documented
✅ **Design complete** - UI mockups and workflows defined
✅ **Technical specs ready** - Code examples and APIs specified
✅ **Testing strategy defined** - Test cases and coverage goals
✅ **Visual diagrams** - Architecture and workflows illustrated

**Next Step:** Review documents, get approvals, begin Phase 1 development.

**Estimated Development Time:** 4 weeks (1 week per phase)

**Expected Impact:**
- 80% reduction in mapping time (10+ min → <2 min)
- Improved addon visibility on tours
- Increased addon attachment rate
- Better product coverage

---

**Status:** ✅ Ready for Development

**Questions?** See FAQ above or contact project leads.

