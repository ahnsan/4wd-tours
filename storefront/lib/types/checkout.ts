// Type definitions for checkout and add-ons

export interface Tour {
  id: string;
  title: string;
  description: string;
  base_price: number;
  duration_days: number;
  image_url?: string;
}

export interface AddOn {
  id: string;
  title: string;
  description: string;
  price: number;
  pricing_type: 'per_booking' | 'per_day' | 'per_person';
  icon?: string;
  category?: string;
  available: boolean;
}

export interface SelectedAddOn extends AddOn {
  quantity: number;
  total_price: number;
}

export interface CartState {
  tour: Tour | null;
  participants: number;
  tour_start_date: string | null;
  selected_addons: SelectedAddOn[];
  subtotal: number;
  total: number;
  medusa_cart_id: string | null; // Medusa backend cart ID for sync
}

export interface CartActions {
  setTour: (tour: Tour) => void;
  setParticipants: (count: number) => void;
  setTourStartDate: (date: string) => void;
  addAddOn: (addon: AddOn, quantity?: number) => void;
  removeAddOn: (addonId: string) => void;
  updateAddOnQuantity: (addonId: string, quantity: number) => void;
  clearCart: () => void;
  getCartSummary: () => CartState;
  getMedusaCartId: () => string | null; // Get current Medusa cart ID
}

export type CartStore = CartState & CartActions;
