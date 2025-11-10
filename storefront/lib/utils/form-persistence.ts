/**
 * Form Persistence Utility
 *
 * Provides resilient form state persistence to sessionStorage for checkout flows.
 * Automatically saves and restores form data across page reloads and navigation.
 *
 * SECURITY FEATURES:
 * - Excludes sensitive payment data (card numbers, CVV)
 * - Uses sessionStorage (cleared when tab closes)
 * - Graceful error handling for JSON serialization
 * - Data validation on restore
 *
 * @module form-persistence
 */

/**
 * Fields that should NEVER be persisted for security reasons
 */
const SENSITIVE_FIELDS = [
  'cardNumber',
  'cardCVV',
  'cvv',
  'securityCode',
  'card_number',
  'card_cvv',
  'payment_token',
  'stripe_token',
  'cart_id', // Managed by CartContext
  'access_token',
  'api_key',
] as const;

/**
 * Storage key prefix to namespace all checkout persistence keys
 */
const STORAGE_PREFIX = 'checkout_persist_';

/**
 * Debounce timer map for each storage key
 */
const debounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Check if code is running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

/**
 * Filter out sensitive fields from data object
 *
 * @param data - Data object to filter
 * @returns Filtered data object with sensitive fields removed
 */
function filterSensitiveData<T extends Record<string, any>>(data: T): Partial<T> {
  const filtered: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive fields
    if (SENSITIVE_FIELDS.includes(key as any)) {
      continue;
    }

    // Skip nested objects with sensitive fields (recursive filtering)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const filteredNested = filterSensitiveData(value);
      if (Object.keys(filteredNested).length > 0) {
        filtered[key as keyof T] = filteredNested as any;
      }
    } else {
      filtered[key as keyof T] = value;
    }
  }

  return filtered;
}

/**
 * Save form data to sessionStorage with debouncing and error handling
 *
 * @param key - Unique identifier for the form data
 * @param data - Form data to persist
 * @param debounceMs - Milliseconds to debounce (default: 500ms)
 * @returns true if save was successful or queued, false if failed
 *
 * @example
 * ```ts
 * saveFormData('customer-info', {
 *   fullName: 'John Doe',
 *   email: 'john@example.com',
 *   cardNumber: '1234567890123456' // Will be filtered out
 * });
 * ```
 */
export function saveFormData<T extends Record<string, any>>(
  key: string,
  data: T,
  debounceMs: number = 500
): boolean {
  if (!isBrowser()) {
    console.warn('[FormPersistence] Not in browser environment, skipping save');
    return false;
  }

  // Clear existing debounce timer
  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new debounced save
  const timer = setTimeout(() => {
    try {
      // Filter sensitive data before saving
      const filteredData = filterSensitiveData(data);

      // Validate we have data to save
      if (Object.keys(filteredData).length === 0) {
        console.warn(`[FormPersistence] No data to save for key: ${key}`);
        return;
      }

      const storageKey = `${STORAGE_PREFIX}${key}`;
      const serialized = JSON.stringify({
        data: filteredData,
        timestamp: Date.now(),
        version: '1.0.0',
      });

      window.sessionStorage.setItem(storageKey, serialized);
      console.log(`[FormPersistence] Saved data for key: ${key}`);
    } catch (error) {
      console.error(`[FormPersistence] Error saving data for key ${key}:`, error);

      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('[FormPersistence] sessionStorage quota exceeded, clearing old data');
        clearOldestPersistedData();
      }
    } finally {
      debounceTimers.delete(key);
    }
  }, debounceMs);

  debounceTimers.set(key, timer);
  return true;
}

/**
 * Load form data from sessionStorage with validation
 *
 * @param key - Unique identifier for the form data
 * @param maxAgeMs - Maximum age in milliseconds (default: 1 hour)
 * @returns Restored form data or null if not found/invalid
 *
 * @example
 * ```ts
 * const customerData = loadFormData<CustomerData>('customer-info');
 * if (customerData) {
 *   setFormData(customerData);
 * }
 * ```
 */
export function loadFormData<T extends Record<string, any>>(
  key: string,
  maxAgeMs: number = 60 * 60 * 1000 // 1 hour default
): T | null {
  if (!isBrowser()) {
    console.warn('[FormPersistence] Not in browser environment, skipping load');
    return null;
  }

  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    const stored = window.sessionStorage.getItem(storageKey);

    if (!stored) {
      console.log(`[FormPersistence] No data found for key: ${key}`);
      return null;
    }

    const parsed = JSON.parse(stored);

    // Validate structure
    if (!parsed.data || !parsed.timestamp) {
      console.warn(`[FormPersistence] Invalid data structure for key: ${key}`);
      clearFormData(key);
      return null;
    }

    // Check age
    const age = Date.now() - parsed.timestamp;
    if (age > maxAgeMs) {
      console.warn(`[FormPersistence] Data expired for key: ${key} (age: ${age}ms)`);
      clearFormData(key);
      return null;
    }

    console.log(`[FormPersistence] Loaded data for key: ${key} (age: ${age}ms)`);
    return parsed.data as T;
  } catch (error) {
    console.error(`[FormPersistence] Error loading data for key ${key}:`, error);

    // Clear corrupted data
    clearFormData(key);
    return null;
  }
}

/**
 * Clear persisted form data
 *
 * @param key - Unique identifier for the form data
 *
 * @example
 * ```ts
 * // Clear after successful checkout
 * clearFormData('customer-info');
 * clearFormData('shipping-option');
 * ```
 */
export function clearFormData(key: string): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const storageKey = `${STORAGE_PREFIX}${key}`;
    window.sessionStorage.removeItem(storageKey);
    console.log(`[FormPersistence] Cleared data for key: ${key}`);
  } catch (error) {
    console.error(`[FormPersistence] Error clearing data for key ${key}:`, error);
  }
}

/**
 * Clear all persisted checkout data
 * Useful after successful order completion
 *
 * @example
 * ```ts
 * // Clear all checkout data after order creation
 * clearAllCheckoutData();
 * router.push('/checkout/confirmation');
 * ```
 */
export function clearAllCheckoutData(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    // Get all keys from sessionStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    // Remove all checkout keys
    keysToRemove.forEach(key => {
      window.sessionStorage.removeItem(key);
    });

    console.log(`[FormPersistence] Cleared ${keysToRemove.length} checkout data items`);
  } catch (error) {
    console.error('[FormPersistence] Error clearing all checkout data:', error);
  }
}

/**
 * Clear oldest persisted data item
 * Used when storage quota is exceeded
 */
function clearOldestPersistedData(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    // Iterate through sessionStorage to find oldest checkout item
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const stored = window.sessionStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.timestamp && parsed.timestamp < oldestTimestamp) {
              oldestTimestamp = parsed.timestamp;
              oldestKey = key;
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    if (oldestKey) {
      window.sessionStorage.removeItem(oldestKey);
      console.log(`[FormPersistence] Removed oldest item: ${oldestKey}`);
    }
  } catch (error) {
    console.error('[FormPersistence] Error clearing oldest data:', error);
  }
}

/**
 * Get list of all persisted form keys
 * Useful for debugging
 *
 * @returns Array of persisted form keys (without prefix)
 */
export function getPersistedKeys(): string[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const keys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key.substring(STORAGE_PREFIX.length));
      }
    }
    return keys;
  } catch (error) {
    console.error('[FormPersistence] Error getting persisted keys:', error);
    return [];
  }
}

/**
 * React hook for form persistence
 * Automatically saves and restores form data
 *
 * @param key - Unique identifier for the form data
 * @param initialData - Initial form data
 * @param debounceMs - Debounce delay in milliseconds
 * @returns Tuple of [data, setData, clearData]
 *
 * @example
 * ```tsx
 * const [customerData, setCustomerData, clearCustomerData] = useFormPersistence(
 *   'customer-info',
 *   { fullName: '', email: '' }
 * );
 * ```
 */
export function useFormPersistence<T extends Record<string, any>>(
  key: string,
  initialData: T,
  debounceMs: number = 500
): [T, (data: T) => void, () => void] {
  const [data, setDataInternal] = React.useState<T>(() => {
    // Try to restore on mount
    const restored = loadFormData<T>(key);
    return restored ? { ...initialData, ...restored } : initialData;
  });

  const setData = React.useCallback((newData: T) => {
    setDataInternal(newData);
    saveFormData(key, newData, debounceMs);
  }, [key, debounceMs]);

  const clear = React.useCallback(() => {
    clearFormData(key);
    setDataInternal(initialData);
  }, [key, initialData]);

  return [data, setData, clear];
}

// Re-export for convenience
import React from 'react';
