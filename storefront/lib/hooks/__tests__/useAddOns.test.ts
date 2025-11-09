/**
 * useAddOns Hook Unit Tests
 *
 * Tests add-ons hook behavior:
 * - Data fetching
 * - Loading states
 * - Error handling
 * - SSR safety
 * - Refetch functionality
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useAddOns } from '../useAddOns';
import * as addonsService from '../../data/addons-service';
import { createMockAddOn } from '../../test-utils';

// Mock addons service
jest.mock('../../data/addons-service');

describe('useAddOns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // Initial State
  // ==========================================================================
  describe('Initial State', () => {
    it('should start with loading state', () => {
      const mockResponse = {
        addons: [],
        count: 0,
        source: 'api' as const,
      };
      (addonsService.fetchAllAddOns as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddOns());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.addons).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================================================
  // Data Fetching
  // ==========================================================================
  describe('Data Fetching', () => {
    it('should fetch add-ons on mount', async () => {
      const mockAddons = [
        createMockAddOn({ id: 'addon_01', title: 'Snorkeling' }),
        createMockAddOn({ id: 'addon_02', title: 'Kayaking' }),
      ];
      const mockResponse = {
        addons: mockAddons,
        count: 2,
        source: 'api' as const,
      };
      (addonsService.fetchAllAddOns as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons).toEqual(mockAddons);
      expect(result.current.addons).toHaveLength(2);
      expect(result.current.dataSource).toBe('api');
      expect(addonsService.fetchAllAddOns).toHaveBeenCalledTimes(1);
    });

    it('should handle API success with cache source', async () => {
      const mockAddons = [createMockAddOn()];
      const mockResponse = {
        addons: mockAddons,
        count: 1,
        source: 'cache' as const,
      };
      (addonsService.fetchAllAddOns as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons).toEqual(mockAddons);
      expect(result.current.dataSource).toBe('cache');
    });

    it('should handle empty add-ons list', async () => {
      const mockResponse = {
        addons: [],
        count: 0,
        source: 'api' as const,
      };
      (addonsService.fetchAllAddOns as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const mockError = new Error('API request failed');
      (addonsService.fetchAllAddOns as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.addons).toEqual([]);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (addonsService.fetchAllAddOns as jest.Mock).mockRejectedValue(networkError);

      const { result } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toBe('Network error');
    });

    it('should handle non-Error thrown values', async () => {
      (addonsService.fetchAllAddOns as jest.Mock).mockRejectedValue('String error');

      const { result } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toBe('Unknown error fetching add-ons');
    });
  });

  // ==========================================================================
  // SSR Safety
  // ==========================================================================
  describe('SSR Safety', () => {
    it('should not fetch on server side (typeof window === undefined)', () => {
      // Mock server-side environment
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      (addonsService.fetchAllAddOns as jest.Mock).mockResolvedValue({
        addons: [],
        count: 0,
        source: 'api' as const,
      });

      const { result } = renderHook(() => useAddOns());

      expect(result.current.isLoading).toBe(false);
      expect(addonsService.fetchAllAddOns).not.toHaveBeenCalled();

      // Restore window
      global.window = originalWindow;
    });

    it('should fetch on client side (typeof window !== undefined)', async () => {
      // Ensure we're in client environment
      expect(typeof window).not.toBe('undefined');

      const mockResponse = {
        addons: [createMockAddOn()],
        count: 1,
        source: 'api' as const,
      };
      (addonsService.fetchAllAddOns as jest.Mock).mockResolvedValue(mockResponse);

      renderHook(() => useAddOns());

      await waitFor(() => {
        expect(addonsService.fetchAllAddOns).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // Refetch Functionality
  // ==========================================================================
  describe('Refetch', () => {
    it('should refetch add-ons when refetch is called', async () => {
      const mockResponse1 = {
        addons: [createMockAddOn({ id: 'addon_01' })],
        count: 1,
        source: 'api' as const,
      };
      const mockResponse2 = {
        addons: [
          createMockAddOn({ id: 'addon_01' }),
          createMockAddOn({ id: 'addon_02' }),
        ],
        count: 2,
        source: 'api' as const,
      };

      (addonsService.fetchAllAddOns as jest.Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() => useAddOns());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons).toHaveLength(1);
      expect(addonsService.fetchAllAddOns).toHaveBeenCalledTimes(1);

      // Trigger refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.addons).toHaveLength(2);
      });

      expect(addonsService.fetchAllAddOns).toHaveBeenCalledTimes(2);
    });

    it('should set loading state during refetch', async () => {
      const mockResponse = {
        addons: [createMockAddOn()],
        count: 1,
        source: 'api' as const,
      };
      (addonsService.fetchAllAddOns as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddOns());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger refetch
      result.current.refetch();

      // Should be loading immediately after refetch call
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle errors during refetch', async () => {
      const mockResponse = {
        addons: [createMockAddOn()],
        count: 1,
        source: 'api' as const,
      };
      const mockError = new Error('Refetch failed');

      (addonsService.fetchAllAddOns as jest.Mock)
        .mockResolvedValueOnce(mockResponse)
        .mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAddOns());

      // Wait for initial successful fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.addons).toHaveLength(1);
      expect(result.current.error).toBeNull();

      // Trigger refetch that will fail
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      // Previous data should be cleared on error
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ==========================================================================
  // Loading States
  // ==========================================================================
  describe('Loading States', () => {
    it('should set loading to true during initial fetch', () => {
      (addonsService.fetchAllAddOns as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useAddOns());

      expect(result.current.isLoading).toBe(true);
    });

    it('should set loading to false after successful fetch', async () => {
      const mockResponse = {
        addons: [createMockAddOn()],
        count: 1,
        source: 'api' as const,
      };
      (addonsService.fetchAllAddOns as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading to false after error', async () => {
      (addonsService.fetchAllAddOns as jest.Mock).mockRejectedValue(
        new Error('Fetch failed')
      );

      const { result } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Data Source
  // ==========================================================================
  describe('Data Source', () => {
    it('should set dataSource from API response', async () => {
      const mockResponse = {
        addons: [createMockAddOn()],
        count: 1,
        source: 'api' as const,
      };
      (addonsService.fetchAllAddOns as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result.current.dataSource).toBe('api');
      });
    });

    it('should update dataSource when it changes', async () => {
      const mockResponse1 = {
        addons: [createMockAddOn()],
        count: 1,
        source: 'api' as const,
      };
      const mockResponse2 = {
        addons: [createMockAddOn()],
        count: 1,
        source: 'cache' as const,
      };

      (addonsService.fetchAllAddOns as jest.Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result.current.dataSource).toBe('api');
      });

      result.current.refetch();

      await waitFor(() => {
        expect(result.current.dataSource).toBe('cache');
      });
    });
  });

  // ==========================================================================
  // Multiple Hook Instances
  // ==========================================================================
  describe('Multiple Hook Instances', () => {
    it('should allow multiple instances to fetch independently', async () => {
      const mockResponse = {
        addons: [createMockAddOn()],
        count: 1,
        source: 'api' as const,
      };
      (addonsService.fetchAllAddOns as jest.Mock).mockResolvedValue(mockResponse);

      const { result: result1 } = renderHook(() => useAddOns());
      const { result: result2 } = renderHook(() => useAddOns());

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      // Both should have fetched independently
      expect(addonsService.fetchAllAddOns).toHaveBeenCalledTimes(2);
      expect(result1.current.addons).toEqual(mockResponse.addons);
      expect(result2.current.addons).toEqual(mockResponse.addons);
    });
  });
});
