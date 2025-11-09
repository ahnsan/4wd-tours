/**
 * Checkout Page Component Unit Tests
 *
 * Tests checkout page behavior:
 * - Form rendering
 * - Form validation
 * - Medusa cart creation
 * - Address setting
 * - Payment processing
 * - Error handling
 * - Success redirect
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutPage from '../page';
import * as cartService from '../../../lib/data/cart-service';
import {
  createMockCartState,
  createMockMedusaCart,
  createMockMedusaOrder,
  createMockAddress,
} from '../../../lib/test-utils';

// Mock dependencies
const mockPush = jest.fn();
const mockUseCart = jest.fn();

jest.mock('../../../lib/hooks/useCart', () => ({
  useCart: () => mockUseCart(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/checkout',
}));

jest.mock('../../../lib/data/cart-service');
jest.mock('../../../components/Checkout/CustomerForm', () => ({
  __esModule: true,
  default: ({ onDataChange, initialData }: any) => (
    <div data-testid="customer-form">
      <input
        data-testid="customer-email"
        defaultValue={initialData?.email || ''}
        onChange={(e) =>
          onDataChange(
            { ...initialData, email: e.target.value, fullName: 'John Doe' },
            e.target.value.includes('@')
          )
        }
      />
    </div>
  ),
}));

jest.mock('../../../components/Checkout/PaymentForm', () => ({
  __esModule: true,
  default: ({ onDataChange, initialData }: any) => (
    <div data-testid="payment-form">
      <input
        data-testid="payment-terms"
        type="checkbox"
        onChange={(e) =>
          onDataChange(
            { ...initialData, termsAccepted: e.target.checked, method: 'card' },
            e.target.checked
          )
        }
      />
    </div>
  ),
}));

jest.mock('../../../components/Checkout/PriceSummary', () => ({
  __esModule: true,
  default: ({ tour, addOns }: any) => (
    <div data-testid="price-summary">
      <div data-testid="tour-name">{tour?.name}</div>
      <div data-testid="addons-count">{addOns?.length || 0}</div>
    </div>
  ),
}));

describe('CheckoutPage', () => {
  const mockCart = createMockCartState();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    // Mock useCart
    mockUseCart.mockReturnValue({
      cart: mockCart,
      setMedusaCartId: jest.fn(),
    });

    // Mock cart service functions
    (cartService.createCart as jest.Mock).mockResolvedValue(createMockMedusaCart());
    (cartService.setCartEmail as jest.Mock).mockResolvedValue(createMockMedusaCart());
    (cartService.setShippingAddress as jest.Mock).mockResolvedValue(createMockMedusaCart());
    (cartService.setBillingAddress as jest.Mock).mockResolvedValue(createMockMedusaCart());
    (cartService.getShippingOptions as jest.Mock).mockResolvedValue([
      { id: 'so_01', name: 'Standard Shipping' },
    ]);
    (cartService.addShippingMethod as jest.Mock).mockResolvedValue(createMockMedusaCart());
    (cartService.initializePaymentSessions as jest.Mock).mockResolvedValue(createMockMedusaCart());
    (cartService.setPaymentSession as jest.Mock).mockResolvedValue(createMockMedusaCart());
    (cartService.completeCart as jest.Mock).mockResolvedValue(createMockMedusaOrder());

    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // Rendering
  // ==========================================================================
  describe('Rendering', () => {
    it('should render checkout page with all components', () => {
      render(<CheckoutPage />);

      expect(screen.getByText('Complete Your Booking')).toBeInTheDocument();
      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
      expect(screen.getByTestId('payment-form')).toBeInTheDocument();
      expect(screen.getByTestId('price-summary')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /complete booking/i })).toBeInTheDocument();
    });

    it('should render price summary with cart data', () => {
      render(<CheckoutPage />);

      expect(screen.getByTestId('tour-name')).toHaveTextContent(mockCart.tour!.title);
      expect(screen.getByTestId('addons-count')).toHaveTextContent(
        mockCart.selected_addons.length.toString()
      );
    });

    it('should render security badge', () => {
      render(<CheckoutPage />);

      expect(screen.getByText('Secure SSL Encrypted Payment')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Cart Initialization
  // ==========================================================================
  describe('Cart Initialization', () => {
    it('should redirect to tours page if cart is empty', () => {
      mockUseCart.mockReturnValue({
        cart: { ...mockCart, tour: null },
        setMedusaCartId: jest.fn(),
      });

      render(<CheckoutPage />);

      expect(mockPush).toHaveBeenCalledWith('/tours');
    });

    it('should create Medusa cart if not exists', async () => {
      mockUseCart.mockReturnValue({
        cart: { ...mockCart, medusa_cart_id: null },
        setMedusaCartId: jest.fn(),
      });

      render(<CheckoutPage />);

      await waitFor(() => {
        expect(cartService.createCart).toHaveBeenCalled();
      });
    });

    it('should not create Medusa cart if already exists', () => {
      mockUseCart.mockReturnValue({
        cart: { ...mockCart, medusa_cart_id: 'cart_existing_123' },
        setMedusaCartId: jest.fn(),
      });

      render(<CheckoutPage />);

      expect(cartService.createCart).not.toHaveBeenCalled();
    });

    it('should handle Medusa cart creation error', async () => {
      mockUseCart.mockReturnValue({
        cart: { ...mockCart, medusa_cart_id: null },
        setMedusaCartId: jest.fn(),
      });
      (cartService.createCart as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<CheckoutPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to initialize checkout/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Form Validation
  // ==========================================================================
  describe('Form Validation', () => {
    it('should disable complete button when forms are invalid', () => {
      render(<CheckoutPage />);

      const button = screen.getByRole('button', { name: /complete booking/i });
      expect(button).toBeDisabled();
    });

    it('should enable complete button when forms are valid', async () => {
      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      const termsCheckbox = screen.getByTestId('payment-terms');

      // Fill in forms
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(termsCheckbox);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /complete booking/i });
        expect(button).not.toBeDisabled();
      });
    });

    it('should show helper text when form is incomplete', () => {
      render(<CheckoutPage />);

      expect(
        screen.getByText(/please complete all required fields to continue/i)
      ).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Checkout Process
  // ==========================================================================
  describe('Checkout Process', () => {
    it('should complete checkout successfully', async () => {
      const mockOrder = createMockMedusaOrder({ id: 'order_123' });
      (cartService.completeCart as jest.Mock).mockResolvedValue(mockOrder);

      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      const termsCheckbox = screen.getByTestId('payment-terms');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(termsCheckbox);

      const button = screen.getByRole('button', { name: /complete booking/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(cartService.setCartEmail).toHaveBeenCalled();
        expect(cartService.setShippingAddress).toHaveBeenCalled();
        expect(cartService.setBillingAddress).toHaveBeenCalled();
        expect(cartService.initializePaymentSessions).toHaveBeenCalled();
        expect(cartService.setPaymentSession).toHaveBeenCalled();
        expect(cartService.completeCart).toHaveBeenCalled();
      });

      expect(mockPush).toHaveBeenCalledWith('/checkout/confirmation?bookingId=order_123');
    });

    it('should show loading state during checkout', async () => {
      (cartService.completeCart as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      const termsCheckbox = screen.getByTestId('payment-terms');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(termsCheckbox);

      const button = screen.getByRole('button', { name: /complete booking/i });
      await userEvent.click(button);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should set shipping and billing addresses with customer data', async () => {
      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      const termsCheckbox = screen.getByTestId('payment-terms');

      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.click(termsCheckbox);

      const button = screen.getByRole('button', { name: /complete booking/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(cartService.setShippingAddress).toHaveBeenCalledWith(
          mockCart.medusa_cart_id,
          expect.objectContaining({
            first_name: 'John',
            last_name: 'Doe',
            country_code: 'au',
          })
        );
      });
    });

    it('should set payment provider to manual', async () => {
      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      const termsCheckbox = screen.getByTestId('payment-terms');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(termsCheckbox);

      const button = screen.getByRole('button', { name: /complete booking/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(cartService.setPaymentSession).toHaveBeenCalledWith(
          mockCart.medusa_cart_id,
          'manual'
        );
      });
    });

    it('should clear localStorage after successful checkout', async () => {
      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      const termsCheckbox = screen.getByTestId('payment-terms');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(termsCheckbox);

      const button = screen.getByRole('button', { name: /complete booking/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('checkout_customer');
      });
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  describe('Error Handling', () => {
    it('should show error when forms are incomplete', async () => {
      render(<CheckoutPage />);

      const button = screen.getByRole('button', { name: /complete booking/i });

      // Try to submit without filling forms
      await userEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/please complete all required fields/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when cart is not initialized', async () => {
      mockUseCart.mockReturnValue({
        cart: { ...mockCart, medusa_cart_id: null },
        setMedusaCartId: jest.fn(),
      });

      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      const termsCheckbox = screen.getByTestId('payment-terms');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(termsCheckbox);

      const button = screen.getByRole('button', { name: /complete booking/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/cart not initialized/i)).toBeInTheDocument();
      });
    });

    it('should show error when cart completion fails', async () => {
      (cartService.completeCart as jest.Mock).mockRejectedValue(
        new Error('Payment failed')
      );

      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      const termsCheckbox = screen.getByTestId('payment-terms');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(termsCheckbox);

      const button = screen.getByRole('button', { name: /complete booking/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/checkout failed.*payment failed/i)).toBeInTheDocument();
      });
    });

    it('should show generic error for unknown errors', async () => {
      (cartService.completeCart as jest.Mock).mockRejectedValue('Unknown error');

      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      const termsCheckbox = screen.getByTestId('payment-terms');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(termsCheckbox);

      const button = screen.getByRole('button', { name: /complete booking/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/checkout failed.*please try again/i)).toBeInTheDocument();
      });
    });

    it('should handle shipping address error', async () => {
      (cartService.setShippingAddress as jest.Mock).mockRejectedValue(
        new Error('Invalid address')
      );

      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      const termsCheckbox = screen.getByTestId('payment-terms');

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(termsCheckbox);

      const button = screen.getByRole('button', { name: /complete booking/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Shipping Options
  // ==========================================================================
  describe('Shipping Options', () => {
    it('should fetch shipping options when customer form is valid', async () => {
      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      await userEvent.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(cartService.getShippingOptions).toHaveBeenCalledWith(
          mockCart.medusa_cart_id
        );
      });
    });

    it('should auto-select first shipping option', async () => {
      const mockOptions = [
        { id: 'so_01', name: 'Standard' },
        { id: 'so_02', name: 'Express' },
      ];
      (cartService.getShippingOptions as jest.Mock).mockResolvedValue(mockOptions);

      render(<CheckoutPage />);

      const emailInput = screen.getByTestId('customer-email');
      await userEvent.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(cartService.getShippingOptions).toHaveBeenCalled();
      });

      const termsCheckbox = screen.getByTestId('payment-terms');
      await userEvent.click(termsCheckbox);

      const button = screen.getByRole('button', { name: /complete booking/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(cartService.addShippingMethod).toHaveBeenCalledWith(
          mockCart.medusa_cart_id,
          'so_01'
        );
      });
    });
  });

  // ==========================================================================
  // localStorage Integration
  // ==========================================================================
  describe('localStorage Integration', () => {
    it('should load saved customer data from localStorage', () => {
      const savedData = {
        fullName: 'Saved User',
        email: 'saved@example.com',
      };
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(savedData));

      render(<CheckoutPage />);

      expect(localStorage.getItem).toHaveBeenCalledWith('checkout_customer');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('invalid json{');

      // Should not throw
      expect(() => render(<CheckoutPage />)).not.toThrow();
    });
  });
});
