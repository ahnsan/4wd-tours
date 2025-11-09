/**
 * useCart Hook Unit Tests
 *
 * Tests cart hook behavior:
 * - State management
 * - localStorage sync
 * - Medusa API integration
 * - Optimistic updates
 * - Error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart } from '../useCart';
import * as cartService from '../../data/cart-service';
import {
  createMockTour,
  createMockAddOn,
  createMockMedusaCart,
  setupMockLocalStorage,
  createMockCartState,
} from '../../test-utils';

// Mock cart service
jest.mock('../../data/cart-service');

describe('useCart', () => {
  let mockLocalStorage: ReturnType<typeof setupMockLocalStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage = setupMockLocalStorage();

    // Suppress console logs
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Default mock implementations
    (cartService.createCart as jest.Mock).mockResolvedValue(createMockMedusaCart());
    (cartService.getCart as jest.Mock).mockResolvedValue(createMockMedusaCart());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockLocalStorage.clear();
  });

  // ==========================================================================
  // Initial State
  // ==========================================================================
  describe('Initial State', () => {
    it('should initialize with empty cart state', () => {
      const { result } = renderHook(() => useCart());

      expect(result.current.cart).toEqual({
        tour: null,
        participants: 1,
        tour_start_date: null,
        selected_addons: [],
        subtotal: 0,
        total: 0,
        medusa_cart_id: null,
      });
    });

    it('should load cart from localStorage on mount', () => {
      const savedCart = createMockCartState();
      mockLocalStorage.setItem('sunshine_coast_4wd_cart', JSON.stringify(savedCart));

      const { result } = renderHook(() => useCart());

      expect(result.current.cart.tour?.id).toBe(savedCart.tour?.id);
      expect(result.current.cart.participants).toBe(savedCart.participants);
      expect(result.current.cart.medusa_cart_id).toBe(savedCart.medusa_cart_id);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.setItem('sunshine_coast_4wd_cart', 'invalid json{');

      const { result } = renderHook(() => useCart());

      // Should fallback to default state
      expect(result.current.cart.tour).toBeNull();
    });

    it('should retrieve cart from Medusa on mount if cart ID exists', async () => {
      const savedCart = createMockCartState({ medusa_cart_id: 'cart_01ABC123' });
      mockLocalStorage.setItem('sunshine_coast_4wd_cart', JSON.stringify(savedCart));

      renderHook(() => useCart());

      await waitFor(() => {
        expect(cartService.getCart).toHaveBeenCalledWith('cart_01ABC123');
      });
    });

    it('should clear invalid Medusa cart ID on retrieval error', async () => {
      const savedCart = createMockCartState({ medusa_cart_id: 'invalid_cart' });
      mockLocalStorage.setItem('sunshine_coast_4wd_cart', JSON.stringify(savedCart));
      (cartService.getCart as jest.Mock).mockRejectedValue(new Error('Cart not found'));

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.cart.medusa_cart_id).toBeNull();
      });
    });
  });

  // ==========================================================================
  // setTour()
  // ==========================================================================
  describe('setTour', () => {
    it('should set tour and update totals', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour({ base_price: 15000 });

      await act(async () => {
        await result.current.setTour(tour);
      });

      expect(result.current.cart.tour).toEqual(tour);
      expect(result.current.cart.subtotal).toBe(15000); // 1 participant * 15000
    });

    it('should create Medusa cart when setting tour', async () => {
      const mockMedusaCart = createMockMedusaCart({ id: 'cart_new_123' });
      (cartService.createCart as jest.Mock).mockResolvedValue(mockMedusaCart);

      const { result } = renderHook(() => useCart());
      const tour = createMockTour();

      await act(async () => {
        await result.current.setTour(tour);
      });

      await waitFor(() => {
        expect(cartService.createCart).toHaveBeenCalled();
        expect(result.current.cart.medusa_cart_id).toBe('cart_new_123');
      });
    });

    it('should not create duplicate Medusa cart if one exists', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();

      // First tour sets cart ID
      await act(async () => {
        await result.current.setTour(tour);
      });

      await waitFor(() => {
        expect(result.current.cart.medusa_cart_id).toBeTruthy();
      });

      const firstCartId = result.current.cart.medusa_cart_id;
      const callCount = (cartService.createCart as jest.Mock).mock.calls.length;

      // Set tour again
      await act(async () => {
        await result.current.setTour(createMockTour({ id: 'tour_02' }));
      });

      // Should not create new cart
      expect(cartService.createCart).toHaveBeenCalledTimes(callCount);
      expect(result.current.cart.medusa_cart_id).toBe(firstCartId);
    });

    it('should continue with localStorage on Medusa error', async () => {
      (cartService.createCart as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useCart());
      const tour = createMockTour();

      await act(async () => {
        await result.current.setTour(tour);
      });

      // Tour should still be set in localStorage
      expect(result.current.cart.tour).toEqual(tour);
      expect(result.current.cart.medusa_cart_id).toBeNull();
    });

    it('should persist to localStorage', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();

      await act(async () => {
        await result.current.setTour(tour);
      });

      const savedData = mockLocalStorage.getItem('sunshine_coast_4wd_cart');
      expect(savedData).toBeTruthy();

      const parsed = JSON.parse(savedData!);
      expect(parsed.tour.id).toBe(tour.id);
    });
  });

  // ==========================================================================
  // setParticipants()
  // ==========================================================================
  describe('setParticipants', () => {
    it('should update participant count and recalculate totals', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour({ base_price: 10000 });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.setParticipants(3);
      });

      expect(result.current.cart.participants).toBe(3);
      expect(result.current.cart.subtotal).toBe(30000); // 3 * 10000
    });

    it('should not allow participants less than 1', async () => {
      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.setParticipants(0);
      });

      expect(result.current.cart.participants).toBe(1);

      await act(async () => {
        await result.current.setParticipants(-5);
      });

      expect(result.current.cart.participants).toBe(1);
    });

    it('should update add-on prices based on new participant count', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour({ base_price: 10000 });
      const addon = createMockAddOn({
        price: 2000,
        pricing_type: 'per_person'
      });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.addAddOn(addon, 1);
        await result.current.setParticipants(4);
      });

      // Base price: 4 * 10000 = 40000
      // Add-on: 1 * 2000 * 4 participants = 8000
      expect(result.current.cart.subtotal).toBe(48000);
    });
  });

  // ==========================================================================
  // setTourStartDate()
  // ==========================================================================
  describe('setTourStartDate', () => {
    it('should set tour start date', async () => {
      const { result } = renderHook(() => useCart());
      const date = '2025-12-15';

      await act(async () => {
        result.current.setTourStartDate(date);
      });

      expect(result.current.cart.tour_start_date).toBe(date);
    });

    it('should persist date to localStorage', async () => {
      const { result } = renderHook(() => useCart());
      const date = '2025-12-15';

      await act(async () => {
        result.current.setTourStartDate(date);
      });

      const savedData = mockLocalStorage.getItem('sunshine_coast_4wd_cart');
      const parsed = JSON.parse(savedData!);
      expect(parsed.tour_start_date).toBe(date);
    });
  });

  // ==========================================================================
  // addAddOn()
  // ==========================================================================
  describe('addAddOn', () => {
    it('should add new add-on to cart', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour({ base_price: 10000 });
      const addon = createMockAddOn({
        id: 'addon_01',
        price: 2500,
        pricing_type: 'per_booking'
      });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.addAddOn(addon, 1);
      });

      expect(result.current.cart.selected_addons).toHaveLength(1);
      expect(result.current.cart.selected_addons[0].id).toBe('addon_01');
      expect(result.current.cart.selected_addons[0].quantity).toBe(1);
      expect(result.current.cart.selected_addons[0].total_price).toBe(2500);
    });

    it('should increment quantity for existing add-on', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();
      const addon = createMockAddOn({
        id: 'addon_01',
        price: 2500,
        pricing_type: 'per_booking'
      });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.addAddOn(addon, 1);
        await result.current.addAddOn(addon, 2);
      });

      expect(result.current.cart.selected_addons).toHaveLength(1);
      expect(result.current.cart.selected_addons[0].quantity).toBe(3);
      expect(result.current.cart.selected_addons[0].total_price).toBe(7500); // 3 * 2500
    });

    it('should calculate per_person pricing correctly', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();
      const addon = createMockAddOn({
        price: 1000,
        pricing_type: 'per_person'
      });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.setParticipants(3);
        await result.current.addAddOn(addon, 2);
      });

      // 2 quantity * 1000 price * 3 participants = 6000
      expect(result.current.cart.selected_addons[0].total_price).toBe(6000);
    });

    it('should calculate per_day pricing correctly', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour({ duration_days: 3 });
      const addon = createMockAddOn({
        price: 1000,
        pricing_type: 'per_day'
      });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.addAddOn(addon, 2);
      });

      // 2 quantity * 1000 price * 3 days = 6000
      expect(result.current.cart.selected_addons[0].total_price).toBe(6000);
    });

    it('should update cart totals when adding add-on', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour({ base_price: 10000 });
      const addon = createMockAddOn({ price: 2500, pricing_type: 'per_booking' });

      await act(async () => {
        await result.current.setTour(tour);
      });

      const subtotalBefore = result.current.cart.subtotal;

      await act(async () => {
        await result.current.addAddOn(addon, 1);
      });

      expect(result.current.cart.subtotal).toBe(subtotalBefore + 2500);
    });
  });

  // ==========================================================================
  // removeAddOn()
  // ==========================================================================
  describe('removeAddOn', () => {
    it('should remove add-on from cart', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();
      const addon1 = createMockAddOn({ id: 'addon_01', price: 2500, pricing_type: 'per_booking' });
      const addon2 = createMockAddOn({ id: 'addon_02', price: 3000, pricing_type: 'per_booking' });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.addAddOn(addon1, 1);
        await result.current.addAddOn(addon2, 1);
      });

      expect(result.current.cart.selected_addons).toHaveLength(2);

      await act(async () => {
        await result.current.removeAddOn('addon_01');
      });

      expect(result.current.cart.selected_addons).toHaveLength(1);
      expect(result.current.cart.selected_addons[0].id).toBe('addon_02');
    });

    it('should update totals when removing add-on', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour({ base_price: 10000 });
      const addon = createMockAddOn({ id: 'addon_01', price: 2500, pricing_type: 'per_booking' });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.addAddOn(addon, 1);
      });

      const subtotalWithAddon = result.current.cart.subtotal;

      await act(async () => {
        await result.current.removeAddOn('addon_01');
      });

      expect(result.current.cart.subtotal).toBe(subtotalWithAddon - 2500);
    });

    it('should handle removing non-existent add-on', async () => {
      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.removeAddOn('non_existent');
      });

      expect(result.current.cart.selected_addons).toHaveLength(0);
    });
  });

  // ==========================================================================
  // updateAddOnQuantity()
  // ==========================================================================
  describe('updateAddOnQuantity', () => {
    it('should update add-on quantity', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();
      const addon = createMockAddOn({
        id: 'addon_01',
        price: 2500,
        pricing_type: 'per_booking'
      });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.addAddOn(addon, 1);
        await result.current.updateAddOnQuantity('addon_01', 5);
      });

      expect(result.current.cart.selected_addons[0].quantity).toBe(5);
      expect(result.current.cart.selected_addons[0].total_price).toBe(12500); // 5 * 2500
    });

    it('should remove add-on when quantity set to 0', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();
      const addon = createMockAddOn({ id: 'addon_01', price: 2500, pricing_type: 'per_booking' });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.addAddOn(addon, 3);
        await result.current.updateAddOnQuantity('addon_01', 0);
      });

      expect(result.current.cart.selected_addons).toHaveLength(0);
    });

    it('should remove add-on when quantity is negative', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();
      const addon = createMockAddOn({ id: 'addon_01', price: 2500, pricing_type: 'per_booking' });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.addAddOn(addon, 2);
        await result.current.updateAddOnQuantity('addon_01', -1);
      });

      expect(result.current.cart.selected_addons).toHaveLength(0);
    });
  });

  // ==========================================================================
  // clearCart()
  // ==========================================================================
  describe('clearCart', () => {
    it('should clear all cart data', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();
      const addon = createMockAddOn({ price: 2500, pricing_type: 'per_booking' });

      await act(async () => {
        await result.current.setTour(tour);
        await result.current.addAddOn(addon, 1);
        await result.current.setParticipants(4);
        await result.current.setTourStartDate('2025-12-15');
      });

      // Verify cart has data
      expect(result.current.cart.tour).toBeTruthy();
      expect(result.current.cart.selected_addons).toHaveLength(1);

      await act(async () => {
        result.current.clearCart();
      });

      expect(result.current.cart).toEqual({
        tour: null,
        participants: 1,
        tour_start_date: null,
        selected_addons: [],
        subtotal: 0,
        total: 0,
        medusa_cart_id: null,
      });
    });

    it('should remove cart from localStorage', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();

      await act(async () => {
        await result.current.setTour(tour);
      });

      // Verify localStorage has cart
      expect(mockLocalStorage.getItem('sunshine_coast_4wd_cart')).toBeTruthy();

      await act(async () => {
        result.current.clearCart();
      });

      expect(mockLocalStorage.getItem('sunshine_coast_4wd_cart')).toBeNull();
    });
  });

  // ==========================================================================
  // getCartSummary()
  // ==========================================================================
  describe('getCartSummary', () => {
    it('should return current cart state', () => {
      const { result } = renderHook(() => useCart());

      const summary = result.current.getCartSummary();

      expect(summary).toEqual(result.current.cart);
    });
  });

  // ==========================================================================
  // getMedusaCartId()
  // ==========================================================================
  describe('getMedusaCartId', () => {
    it('should return Medusa cart ID', async () => {
      const mockMedusaCart = createMockMedusaCart({ id: 'cart_test_123' });
      (cartService.createCart as jest.Mock).mockResolvedValue(mockMedusaCart);

      const { result } = renderHook(() => useCart());
      const tour = createMockTour();

      await act(async () => {
        await result.current.setTour(tour);
      });

      await waitFor(() => {
        expect(result.current.getMedusaCartId()).toBe('cart_test_123');
      });
    });

    it('should return null when no Medusa cart exists', () => {
      const { result } = renderHook(() => useCart());

      expect(result.current.getMedusaCartId()).toBeNull();
    });
  });

  // ==========================================================================
  // localStorage Sync
  // ==========================================================================
  describe('localStorage Sync', () => {
    it('should sync cart to localStorage on every update', async () => {
      const { result } = renderHook(() => useCart());
      const tour = createMockTour();

      await act(async () => {
        await result.current.setTour(tour);
      });

      let savedData = JSON.parse(mockLocalStorage.getItem('sunshine_coast_4wd_cart')!);
      expect(savedData.tour.id).toBe(tour.id);

      await act(async () => {
        await result.current.setParticipants(5);
      });

      savedData = JSON.parse(mockLocalStorage.getItem('sunshine_coast_4wd_cart')!);
      expect(savedData.participants).toBe(5);
    });

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage.setItem to throw error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useCart());
      const tour = createMockTour();

      // Should not throw
      await act(async () => {
        await result.current.setTour(tour);
      });

      expect(result.current.cart.tour).toEqual(tour);
    });
  });
});
