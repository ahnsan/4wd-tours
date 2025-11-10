# Addon Mapping Direction - Quick Reference Card

**1-Minute Decision Guide**

---

## Should we reverse from Addon→Tours to Tour→Addons?

# ❌ NO

---

## Why Not?

### The Killer Stat
**81% of addons are universal** (apply to all tours)

**Current system**: `["*"]` = One entry, handles 13 addons
**Proposed system**: Must duplicate across 5 tours = 65 entries

---

## Side-by-Side

| Task | Current | Proposed |
|------|---------|----------|
| Add universal addon | 1 update | 6 updates ❌ |
| Add new tour | 0 updates | Must list 13+ addons ❌ |
| Performance | 101ms | 171ms ❌ |
| Data duplication | None | High ❌ |
| Already done | ✅ Yes | No ❌ |

**Current wins on all metrics.**

---

## The Math

### Universal Addons (13 of 16)
- Gourmet BBQ → All tours
- Picnic Hamper → All tours
- Seafood Platter → All tours
- Internet → All tours
- Starlink → All tours
- Drone Photography → All tours
- GoPro → All tours
- Photo Album → All tours
- Beach Cabana → All tours
- Fishing → All tours
- Bodyboarding → All tours
- Paddleboarding → All tours
- Kayaking → All tours

**Current**: 13 addons with `["*"]` = 13 simple entries
**Proposed**: 13 addons × 5 tours = 65 duplicate entries to maintain

### Tour-Specific Addons (3 of 16)
- Glamping → Multi-day only
- Eco-Lodge → Multi-day only
- Sandboarding → Rainbow Beach tours only

---

## Recommendation

✅ **KEEP CURRENT SYSTEM**

Optional improvements (12 hours):
- Add caching for performance
- Add admin dashboard
- Add computed addon counts

---

## When to Reconsider

Only if ALL of these become true:
- [ ] 20+ tours
- [ ] <10 addons
- [ ] Most addons tour-specific (not universal)

**Current**: 5 tours, 16 addons, 81% universal
**Likelihood**: Very low

---

## Cost Comparison

| Option | Hours | Cost | Risk |
|--------|-------|------|------|
| **Reverse** | 26 | $3,600 | Medium-High |
| **Optimize current** | 12 | $1,200 | Low |
| **Do nothing** | 0 | $0 | None |

**Savings**: $2,400 + ongoing maintenance

---

## Decision

**Keep**: `addon.metadata.applicable_tours`

**Reason**: Better design for this business model

**Confidence**: 90%+

---

## Full Analysis

📄 `/docs/ADDON-MAPPING-REVERSAL-STRATEGY.md` (20,000 words)
📄 `/docs/ADDON-MAPPING-DECISION-SUMMARY.md` (3,000 words)

---

**Last Updated**: November 9, 2025
**Status**: ✅ Analysis Complete
**Next**: Stakeholder approval

