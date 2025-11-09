/**
 * Test Utilities for Unit Testing
 *
 * Provides:
 * - Custom render function with providers
 * - Mock data factories
 * - Mock API response helpers
 * - Common test helpers
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import type { Tour, AddOn, SelectedAddOn, CartState } from './types/checkout';
import type { MedusaCart, MedusaOrder, AddressPayload } from './data/cart-service';

// ============================================================================
// Mock Data Factories
// ============================================================================

export const createMockTour = (overrides?: Partial<Tour>): Tour => ({
  id: 'tour_01',
  title: 'Rainbow Beach 4WD Adventure',
  description: 'Experience the stunning Rainbow Beach on a 4WD adventure',
  base_price: 15000, // $150.00 in cents
  duration_days: 1,
  image_url: '/images/rainbow-beach.jpg',
  ...overrides,
});

export const createMockAddOn = (overrides?: Partial<AddOn>): AddOn => ({
  id: 'addon_01',
  title: 'Snorkeling Equipment',
  description: 'Premium snorkeling gear for underwater exploration',
  price: 2500, // $25.00 in cents
  pricing_type: 'per_person',
  icon: 'snorkel',
  category: 'equipment',
  available: true,
  ...overrides,
});

export const createMockSelectedAddOn = (overrides?: Partial<SelectedAddOn>): SelectedAddOn => ({
  ...createMockAddOn(),
  quantity: 1,
  total_price: 2500,
  ...overrides,
});

export const createMockCartState = (overrides?: Partial<CartState>): CartState => ({
  tour: createMockTour(),
  participants: 2,
  tour_start_date: '2025-12-15',
  selected_addons: [createMockSelectedAddOn()],
  subtotal: 32500, // $325.00
  total: 32500,
  medusa_cart_id: 'cart_01ABC123',
  ...overrides,
});

export const createMockAddress = (overrides?: Partial<AddressPayload>): AddressPayload => ({
  first_name: 'John',
  last_name: 'Doe',
  address_1: '123 Sunshine Coast Road',
  address_2: '',
  city: 'Sunshine Coast',
  country_code: 'au',
  province: 'QLD',
  postal_code: '4556',
  phone: '+61400000000',
  company: '',
  metadata: {},
  ...overrides,
});

export const createMockMedusaCart = (overrides?: Partial<MedusaCart>): MedusaCart => ({
  id: 'cart_01ABC123',
  email: 'test@example.com',
  shipping_address: createMockAddress(),
  billing_address: createMockAddress(),
  items: [
    {
      id: 'item_01',
      cart_id: 'cart_01ABC123',
      variant_id: 'variant_01',
      quantity: 1,
      title: 'Rainbow Beach 4WD Adventure',
      description: 'Full day tour',
      thumbnail: '/images/tour.jpg',
      unit_price: 15000,
      subtotal: 15000,
      total: 15000,
      metadata: {},
    },
  ],
  region: { id: 'reg_01', name: 'Australia', currency_code: 'aud' },
  region_id: 'reg_01K9G4HA190556136E7RJQ4411',
  shipping_methods: [],
  payment_session: null,
  payment_sessions: [],
  completed_at: undefined,
  subtotal: 15000,
  total: 15000,
  tax_total: 0,
  shipping_total: 0,
  discount_total: 0,
  metadata: {},
  ...overrides,
});

export const createMockMedusaOrder = (overrides?: Partial<MedusaOrder>): MedusaOrder => ({
  id: 'order_01XYZ789',
  display_id: 1001,
  email: 'test@example.com',
  shipping_address: createMockAddress(),
  billing_address: createMockAddress(),
  items: [
    {
      id: 'item_01',
      cart_id: 'cart_01ABC123',
      variant_id: 'variant_01',
      quantity: 1,
      title: 'Rainbow Beach 4WD Adventure',
      description: 'Full day tour',
      thumbnail: '/images/tour.jpg',
      unit_price: 15000,
      subtotal: 15000,
      total: 15000,
      metadata: {},
    },
  ],
  shipping_methods: [],
  total: 15000,
  subtotal: 15000,
  tax_total: 0,
  shipping_total: 0,
  discount_total: 0,
  status: 'pending',
  created_at: new Date().toISOString(),
  metadata: {},
  ...overrides,
});

// ============================================================================
// Mock Fetch Helpers
// ============================================================================

export const mockFetchSuccess = (data: any, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status,
      json: async () => data,
      statusText: 'OK',
    } as Response)
  );
};

export const mockFetchError = (status = 500, message = 'Internal Server Error') => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      json: async () => ({ message }),
      statusText: message,
    } as Response)
  );
};

export const mockFetchNetworkError = (errorMessage = 'Network error') => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error(errorMessage))
  );
};

export const mockFetchTimeout = () => {
  global.fetch = jest.fn(() =>
    new Promise((_, reject) => {
      const error = new Error('Request timeout');
      error.name = 'AbortError';
      setTimeout(() => reject(error), 100);
    })
  );
};

// ============================================================================
// Mock localStorage
// ============================================================================

export const createMockLocalStorage = () => {
  const store: { [key: string]: string } = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
};

export const setupMockLocalStorage = () => {
  const mockStorage = createMockLocalStorage();
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
  return mockStorage;
};

// ============================================================================
// React Testing Library Helpers
// ============================================================================

interface AllProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper component with all providers
 * Add your context providers here
 */
function AllProviders({ children }: AllProvidersProps) {
  return <>{children}</>;
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// ============================================================================
// Common Test Helpers
// ============================================================================

/**
 * Wait for async updates
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Wait for a condition to be true
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> => {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition timeout');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};

/**
 * Suppress console errors/warnings in tests
 */
export const suppressConsole = () => {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
    console.log = originalLog;
  });
};

// ============================================================================
// Type Helpers
// ============================================================================

export type MockFetch = jest.MockedFunction<typeof fetch>;

export const getMockFetch = (): MockFetch => global.fetch as MockFetch;

// ============================================================================
// Export everything for easy imports
// ============================================================================

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
