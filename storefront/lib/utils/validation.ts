/**
 * Form Validation Utilities
 * Client-side validation for checkout forms
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Validate Australian phone number
 */
export const validatePhone = (phone: string): ValidationResult => {
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = trimmedPhone.replace(/\D/g, '');

  // Australian phone numbers: 10 digits (landline/mobile)
  // International format: starts with +61
  if (trimmedPhone.startsWith('+61')) {
    if (digitsOnly.length !== 11) {
      return { isValid: false, error: 'Australian phone number must be 10 digits after country code' };
    }
  } else if (digitsOnly.length !== 10) {
    return { isValid: false, error: 'Phone number must be 10 digits' };
  }

  return { isValid: true };
};

/**
 * Validate full name
 */
export const validateFullName = (name: string): ValidationResult => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { isValid: false, error: 'Full name is required' };
  }

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }

  // Check for at least two words (first and last name)
  const words = trimmedName.split(/\s+/);
  if (words.length < 2) {
    return { isValid: false, error: 'Please enter both first and last name' };
  }

  return { isValid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
};

/**
 * Validate credit card number (Luhn algorithm)
 */
export const validateCardNumber = (cardNumber: string): ValidationResult => {
  const digitsOnly = cardNumber.replace(/\D/g, '');

  if (!digitsOnly) {
    return { isValid: false, error: 'Card number is required' };
  }

  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    return { isValid: false, error: 'Card number must be between 13 and 19 digits' };
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    const char = digitsOnly[i];
    if (!char) continue;

    let digit = parseInt(char, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: 'Invalid card number' };
  }

  return { isValid: true };
};

/**
 * Validate card expiry date
 */
export const validateCardExpiry = (expiry: string): ValidationResult => {
  if (!expiry) {
    return { isValid: false, error: 'Expiry date is required' };
  }

  const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;

  if (!expiryRegex.test(expiry)) {
    return { isValid: false, error: 'Expiry date must be in MM/YY format' };
  }

  const [month, year] = expiry.split('/');
  if (!month || !year) {
    return { isValid: false, error: 'Invalid expiry format' };
  }
  const expiryDate = new Date(2000 + parseInt(year, 10), parseInt(month, 10) - 1);
  const currentDate = new Date();

  if (expiryDate < currentDate) {
    return { isValid: false, error: 'Card has expired' };
  }

  return { isValid: true };
};

/**
 * Validate CVV
 */
export const validateCVV = (cvv: string): ValidationResult => {
  const digitsOnly = cvv.replace(/\D/g, '');

  if (!digitsOnly) {
    return { isValid: false, error: 'CVV is required' };
  }

  if (digitsOnly.length < 3 || digitsOnly.length > 4) {
    return { isValid: false, error: 'CVV must be 3 or 4 digits' };
  }

  return { isValid: true };
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    // Format as: 0400 123 456
    return digitsOnly.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }

  return phone;
};

/**
 * Format card number for display
 */
export const formatCardNumber = (cardNumber: string): string => {
  const digitsOnly = cardNumber.replace(/\D/g, '');
  const groups = digitsOnly.match(/.{1,4}/g) || [];
  return groups.join(' ');
};

/**
 * Mask card number for display (show last 4 digits)
 */
export const maskCardNumber = (cardNumber: string): string => {
  const digitsOnly = cardNumber.replace(/\D/g, '');
  if (digitsOnly.length < 4) return cardNumber;

  const lastFour = digitsOnly.slice(-4);
  const masked = '**** **** **** ' + lastFour;
  return masked;
};
