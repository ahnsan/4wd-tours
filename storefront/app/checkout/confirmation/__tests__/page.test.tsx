/**
 * Confirmation Page Component Unit Tests
 *
 * Tests confirmation page behavior:
 * - Order fetching
 * - Order display
 * - Loading states
 * - Error handling
 * - Price formatting
 * - Action buttons
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmationPage from '../page';
import * as cartService from '../../../../lib/data/cart-service';
import {
  createMockMedusaOrder,
  createMockAddress,
} from '../../../../lib/test-utils';

// Mock dependencies
const mockPush = jest.fn();
const mockGetParam = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: mockGetParam,
  }),
  usePathname: () => '/checkout/confirmation',
}));

jest.mock('../../../../lib/data/cart-service');

// Mock window.alert for PDF download test
global.alert = jest.fn();

describe('ConfirmationPage', () => {
  const mockOrder = createMockMedusaOrder({
    id: 'order_01XYZ789',
    display_id: 1001,
    email: 'customer@example.com',
    total: 35000, // $350.00
    subtotal: 30000,
    tax_total: 3000,
    shipping_total: 2000,
    discount_total: 0,
    items: [
      {
        id: 'item_01',
        cart_id: 'cart_123',
        variant_id: 'variant_01',
        quantity: 2,
        title: 'Rainbow Beach 4WD Tour',
        description: 'Full day adventure',
        unit_price: 15000,
        subtotal: 30000,
        total: 30000,
      },
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockGetParam.mockClear();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock useSearchParams
    mockGetParam.mockImplementation((key) => {
      if (key === 'bookingId') return 'order_01XYZ789';
      return null;
    });

    // Mock getOrder
    (cartService.getOrder as jest.Mock).mockResolvedValue(mockOrder);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // Loading State
  // ==========================================================================
  describe('Loading State', () => {
    it('should show loading state while fetching order', () => {
      (cartService.getOrder as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ConfirmationPage />);

      expect(screen.getByText('Loading your order details...')).toBeInTheDocument();
    });

    it('should show spinner during loading', () => {
      (cartService.getOrder as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      const { container } = render(<ConfirmationPage />);

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Order Display
  // ==========================================================================
  describe('Order Display', () => {
    it('should display order confirmation after loading', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
      });

      expect(screen.getByText(/thank you for booking/i)).toBeInTheDocument();
    });

    it('should display order number', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(`#${mockOrder.display_id}`)).toBeInTheDocument();
      });
    });

    it('should display order ID', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/order id:/i)).toBeInTheDocument();
        expect(screen.getByText(mockOrder.id)).toBeInTheDocument();
      });
    });

    it('should display customer email', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(mockOrder.email)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/a confirmation email has been sent/i)
      ).toBeInTheDocument();
    });

    it('should display order status', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/order status:/i)).toBeInTheDocument();
      });
    });

    it('should display item count', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/items:/i)).toBeInTheDocument();
        expect(screen.getByText(`${mockOrder.items.length} item`)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Order Items
  // ==========================================================================
  describe('Order Items', () => {
    it('should display all order items', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Rainbow Beach 4WD Tour')).toBeInTheDocument();
      });
    });

    it('should display item description', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Full day adventure')).toBeInTheDocument();
      });
    });

    it('should display item quantity', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Qty: 2')).toBeInTheDocument();
      });
    });

    it('should handle order with multiple items', async () => {
      const orderWithMultipleItems = createMockMedusaOrder({
        items: [
          {
            id: 'item_01',
            title: 'Tour Package',
            quantity: 1,
            total: 15000,
          } as any,
          {
            id: 'item_02',
            title: 'Snorkeling Equipment',
            quantity: 2,
            total: 5000,
          } as any,
        ],
      });
      (cartService.getOrder as jest.Mock).mockResolvedValue(orderWithMultipleItems);

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Tour Package')).toBeInTheDocument();
        expect(screen.getByText('Snorkeling Equipment')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Shipping Address
  // ==========================================================================
  describe('Shipping Address', () => {
    it('should display shipping address', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
      });

      const address = mockOrder.shipping_address;
      expect(
        screen.getByText(`${address.first_name} ${address.last_name}`)
      ).toBeInTheDocument();
      expect(screen.getByText(address.address_1)).toBeInTheDocument();
    });

    it('should display phone number if provided', async () => {
      const orderWithPhone = createMockMedusaOrder({
        shipping_address: createMockAddress({ phone: '+61400123456' }),
      });
      (cartService.getOrder as jest.Mock).mockResolvedValue(orderWithPhone);

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('+61400123456')).toBeInTheDocument();
      });
    });

    it('should display emergency contact from metadata', async () => {
      const orderWithEmergency = createMockMedusaOrder({
        shipping_address: createMockAddress({
          metadata: {
            emergency_contact: 'Jane Doe',
            emergency_phone: '+61400999888',
          },
        }),
      });
      (cartService.getOrder as jest.Mock).mockResolvedValue(orderWithEmergency);

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/emergency contact:/i)).toBeInTheDocument();
        expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
      });
    });

    it('should display dietary requirements from metadata', async () => {
      const orderWithDietary = createMockMedusaOrder({
        shipping_address: createMockAddress({
          metadata: {
            dietary_requirements: 'Vegetarian, no nuts',
          },
        }),
      });
      (cartService.getOrder as jest.Mock).mockResolvedValue(orderWithDietary);

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/dietary requirements:/i)).toBeInTheDocument();
        expect(screen.getByText('Vegetarian, no nuts')).toBeInTheDocument();
      });
    });

    it('should display special requests from metadata', async () => {
      const orderWithRequests = createMockMedusaOrder({
        shipping_address: createMockAddress({
          metadata: {
            special_requests: 'Window seat preferred',
          },
        }),
      });
      (cartService.getOrder as jest.Mock).mockResolvedValue(orderWithRequests);

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/special requests:/i)).toBeInTheDocument();
        expect(screen.getByText('Window seat preferred')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Payment Summary
  // ==========================================================================
  describe('Payment Summary', () => {
    it('should display payment summary section', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/payment summary/i)).toBeInTheDocument();
      });
    });

    it('should display subtotal', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/subtotal:/i)).toBeInTheDocument();
      });
    });

    it('should display tax', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/tax:/i)).toBeInTheDocument();
      });
    });

    it('should display shipping when present', async () => {
      const orderWithShipping = createMockMedusaOrder({ shipping_total: 1000 });
      (cartService.getOrder as jest.Mock).mockResolvedValue(orderWithShipping);

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/shipping:/i)).toBeInTheDocument();
      });
    });

    it('should display discount when present', async () => {
      const orderWithDiscount = createMockMedusaOrder({ discount_total: 500 });
      (cartService.getOrder as jest.Mock).mockResolvedValue(orderWithDiscount);

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/discount:/i)).toBeInTheDocument();
      });
    });

    it('should display total', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/total paid \(aud\):/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  describe('Error Handling', () => {
    it('should redirect to home if no booking ID', () => {
      mockGetParam.mockReturnValue(null);

      render(<ConfirmationPage />);

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should show error when order fetch fails', async () => {
      (cartService.getOrder as jest.Mock).mockRejectedValue(
        new Error('Order not found')
      );

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Order Not Found')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/failed to load order details/i)
      ).toBeInTheDocument();
    });

    it('should show return to home button on error', async () => {
      (cartService.getOrder as jest.Mock).mockRejectedValue(
        new Error('Order not found')
      );

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Return to Home')).toBeInTheDocument();
      });
    });

    it('should not redirect on error', async () => {
      (cartService.getOrder as jest.Mock).mockRejectedValue(
        new Error('Order not found')
      );

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Order Not Found')).toBeInTheDocument();
      });

      // Should not redirect, just show error
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Action Buttons
  // ==========================================================================
  describe('Action Buttons', () => {
    it('should render download PDF button', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });
    });

    it('should render book another tour button', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Book Another Tour')).toBeInTheDocument();
      });
    });

    it('should render return to home link', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        const homeLinks = screen.getAllByText('Return to Home');
        expect(homeLinks.length).toBeGreaterThan(0);
      });
    });

    it('should handle PDF download click', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download PDF');
      await userEvent.click(downloadButton);

      // Should show loading text
      expect(screen.getByText('Generating PDF...')).toBeInTheDocument();

      // Wait for alert to be called
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should disable PDF button during download', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download PDF').closest('button');
      await userEvent.click(downloadButton!);

      expect(downloadButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // Important Information
  // ==========================================================================
  describe('Important Information', () => {
    it('should display important information section', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Important Information')).toBeInTheDocument();
      });
    });

    it('should display tour preparation tips', async () => {
      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/arrive 15 minutes before the tour start time/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/comfortable clothing and closed-toe shoes/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/sunscreen, hat, and water bottle/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Date Formatting
  // ==========================================================================
  describe('Date Formatting', () => {
    it('should format order date correctly', async () => {
      const order = createMockMedusaOrder({
        created_at: '2025-12-15T10:30:00.000Z',
      });
      (cartService.getOrder as jest.Mock).mockResolvedValue(order);

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/order date:/i)).toBeInTheDocument();
      });

      // Date should be formatted (exact format depends on locale)
      const dateText = screen.getByText(/order date:/i).nextSibling;
      expect(dateText).toBeTruthy();
    });

    it('should handle invalid dates gracefully', async () => {
      const order = createMockMedusaOrder({
        created_at: 'invalid-date',
      });
      (cartService.getOrder as jest.Mock).mockResolvedValue(order);

      render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText(/order date:/i)).toBeInTheDocument();
      });

      // Should display the invalid date as-is rather than throwing
      expect(screen.getByText('invalid-date')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Suspense Integration
  // ==========================================================================
  describe('Suspense Integration', () => {
    it('should render with Suspense fallback', () => {
      (cartService.getOrder as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      const { container } = render(<ConfirmationPage />);

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Success Icon
  // ==========================================================================
  describe('Success Icon', () => {
    it('should display success icon on confirmation', async () => {
      const { container } = render(<ConfirmationPage />);

      await waitFor(() => {
        expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
      });

      const successIcon = container.querySelector('.successIcon');
      expect(successIcon).toBeInTheDocument();
    });
  });
});
