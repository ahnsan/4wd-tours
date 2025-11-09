/**
 * Add-on Recommendation Logic
 *
 * Recommends add-ons based on booking context:
 * - Lodging type (glamping, camping, hotel)
 * - Duration (multi-day trips)
 * - Drive mode (self-drive, guided)
 * - Always recommend essentials (Internet)
 */

export type LodgingType = 'glamping' | 'camping' | 'hotel' | 'none';
export type DriveMode = 'self-drive' | 'guided';

export interface BookingContext {
  duration_days: number;
  lodging?: LodgingType;
  drive_mode?: DriveMode;
  participants?: number;
}

export interface AddOn {
  id: string;
  title: string;
  category: string;
  metadata?: {
    unit?: 'per_day' | 'per_booking';
    quantity_allowed?: boolean;
    recommended_for?: string[];
    tags?: string[];
  };
}

export interface RecommendedAddOn extends AddOn {
  recommendationReason: string;
  recommendationScore: number; // 0-100
}

/**
 * Get recommended add-ons based on booking context
 */
export function getRecommendedAddons(
  allAddons: AddOn[],
  context: BookingContext
): RecommendedAddOn[] {
  const recommendations: RecommendedAddOn[] = [];

  allAddons.forEach(addon => {
    const score = calculateRecommendationScore(addon, context);
    if (score > 0) {
      recommendations.push({
        ...addon,
        recommendationReason: getRecommendationReason(addon, context),
        recommendationScore: score,
      });
    }
  });

  // Sort by score (highest first)
  return recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
}

/**
 * Calculate recommendation score (0-100)
 * Exported for testing and custom recommendation logic
 */
export function calculateRecommendationScore(addon: AddOn, context: BookingContext): number {
  let score = 0;
  const { duration_days, lodging, drive_mode } = context;
  const tags = addon.metadata?.tags || [];
  const title = addon.title.toLowerCase();

  // Always recommend Internet
  if (title.includes('internet') || tags.includes('essential')) {
    score += 100;
  }

  // Glamping recommendations
  if (lodging === 'glamping') {
    if (title.includes('glamping') || tags.includes('glamping')) {
      score += 80;
    }
    if (title.includes('setup') || title.includes('premium')) {
      score += 60;
    }
  }

  // Camping recommendations
  if (lodging === 'camping') {
    if (title.includes('camping') || tags.includes('camping')) {
      score += 75;
    }
    if (title.includes('gear') || title.includes('equipment')) {
      score += 50;
    }
  }

  // Multi-day recommendations
  if (duration_days >= 2) {
    if (title.includes('bbq') || title.includes('beach')) {
      score += 70;
    }
    if (title.includes('meal') || title.includes('food')) {
      score += 60;
    }
  }

  // Self-drive recommendations
  if (drive_mode === 'self-drive') {
    if (title.includes('gps') || title.includes('navigation')) {
      score += 65;
    }
    if (title.includes('insurance') || title.includes('protection')) {
      score += 55;
    }
  }

  // Guided tour recommendations
  if (drive_mode === 'guided') {
    if (title.includes('photography') || tags.includes('experience')) {
      score += 60;
    }
  }

  // Category-based recommendations
  if (addon.category === 'Essential') {
    score += 40;
  } else if (addon.category === 'Popular') {
    score += 30;
  }

  return score;
}

/**
 * Get human-readable recommendation reason
 * Exported for UI display and customization
 */
export function getRecommendationReason(addon: AddOn, context: BookingContext): string {
  const { duration_days, lodging, drive_mode } = context;
  const title = addon.title.toLowerCase();
  const tags = addon.metadata?.tags || [];

  if (title.includes('internet') || tags.includes('essential')) {
    return 'Essential for all tours';
  }

  if (lodging === 'glamping' && (title.includes('glamping') || tags.includes('glamping'))) {
    return 'Perfect for your glamping experience';
  }

  if (lodging === 'camping' && (title.includes('camping') || tags.includes('camping'))) {
    return 'Great for camping adventures';
  }

  if (duration_days >= 2 && title.includes('bbq')) {
    return `Ideal for ${duration_days}-day trip`;
  }

  if (drive_mode === 'self-drive' && (title.includes('gps') || title.includes('navigation'))) {
    return 'Helpful for self-drive tours';
  }

  if (addon.category === 'Essential') {
    return 'Highly recommended';
  }

  if (addon.category === 'Popular') {
    return 'Popular choice';
  }

  return 'Recommended for you';
}

/**
 * Sort add-ons: recommended first, then alphabetical
 */
export function sortAddons(
  addons: AddOn[],
  recommendedIds: Set<string>
): AddOn[] {
  return [...addons].sort((a, b) => {
    const aRecommended = recommendedIds.has(a.id);
    const bRecommended = recommendedIds.has(b.id);

    // Recommended first
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;

    // Then alphabetical
    return a.title.localeCompare(b.title);
  });
}
