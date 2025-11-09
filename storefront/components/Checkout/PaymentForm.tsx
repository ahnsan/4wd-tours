'use client';

import React, { useState } from 'react';
import styles from './PaymentForm.module.css';
import {
  validateCardNumber,
  validateCardExpiry,
  validateCVV,
  validateRequired,
  formatCardNumber,
} from '../../lib/utils/validation';

export type PaymentMethod = 'card' | 'paypal' | 'bank_transfer';

export interface PaymentData {
  method: PaymentMethod;
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCVV?: string;
  termsAccepted: boolean;
}

interface PaymentFormProps {
  onDataChange: (data: PaymentData, isValid: boolean) => void;
  initialData?: Partial<PaymentData>;
}

export default function PaymentForm({ onDataChange, initialData }: PaymentFormProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: initialData?.method || 'card',
    cardNumber: initialData?.cardNumber || '',
    cardName: initialData?.cardName || '',
    cardExpiry: initialData?.cardExpiry || '',
    cardCVV: initialData?.cardCVV || '',
    termsAccepted: initialData?.termsAccepted || false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PaymentData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PaymentData, boolean>>>({});

  const validateField = (field: keyof PaymentData, value: string | boolean): string | undefined => {
    if (paymentData.method !== 'card' && field !== 'method' && field !== 'termsAccepted') {
      return undefined;
    }

    switch (field) {
      case 'cardNumber':
        if (typeof value === 'string') {
          const result = validateCardNumber(value);
          return result.isValid ? undefined : result.error;
        }
        break;

      case 'cardName':
        if (typeof value === 'string') {
          const result = validateRequired(value, 'Cardholder name');
          return result.isValid ? undefined : result.error;
        }
        break;

      case 'cardExpiry':
        if (typeof value === 'string') {
          const result = validateCardExpiry(value);
          return result.isValid ? undefined : result.error;
        }
        break;

      case 'cardCVV':
        if (typeof value === 'string') {
          const result = validateCVV(value);
          return result.isValid ? undefined : result.error;
        }
        break;

      case 'termsAccepted':
        if (typeof value === 'boolean' && !value) {
          return 'You must accept the terms and conditions';
        }
        break;
    }

    return undefined;
  };

  const validateForm = (data: PaymentData): boolean => {
    if (!data.termsAccepted) {
      return false;
    }

    if (data.method === 'card') {
      const cardFields: (keyof PaymentData)[] = ['cardNumber', 'cardName', 'cardExpiry', 'cardCVV'];
      for (const field of cardFields) {
        const value = data[field];
        if (typeof value === 'string') {
          const error = validateField(field, value);
          if (error) {
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleMethodChange = (method: PaymentMethod) => {
    const newData = { ...paymentData, method };
    setPaymentData(newData);

    // Clear card errors when switching to non-card method
    if (method !== 'card') {
      setErrors({});
      setTouched({});
    }

    const isValid = validateForm(newData);
    onDataChange(newData, isValid);
  };

  const handleChange = (field: keyof PaymentData, value: string | boolean) => {
    let processedValue = value;

    // Format card number
    if (field === 'cardNumber' && typeof value === 'string') {
      processedValue = formatCardNumber(value);
    }

    // Format expiry date
    if (field === 'cardExpiry' && typeof value === 'string') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length >= 2) {
        processedValue = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2, 4);
      } else {
        processedValue = digitsOnly;
      }
    }

    const newData = { ...paymentData, [field]: processedValue };
    setPaymentData(newData);

    // Validate field if touched
    if (touched[field] && typeof processedValue !== 'boolean') {
      const error = validateField(field, processedValue);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }

    const isValid = validateForm(newData);
    onDataChange(newData, isValid);
  };

  const handleBlur = (field: keyof PaymentData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = paymentData[field];
    if (value !== undefined) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  return (
    <div className={styles.paymentForm}>
      <h2 className={styles.formTitle}>Payment Information</h2>

      {/* Payment Method Selection */}
      <div className={styles.methodSelection}>
        <h3 className={styles.sectionTitle}>Select Payment Method</h3>
        <div className={styles.methodGrid}>
          <button
            type="button"
            className={`${styles.methodButton} ${paymentData.method === 'card' ? styles.methodActive : ''}`}
            onClick={() => handleMethodChange('card')}
            aria-pressed={paymentData.method === 'card'}
          >
            <svg className={styles.methodIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
              <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
            </svg>
            <span>Credit/Debit Card</span>
          </button>

          <button
            type="button"
            className={`${styles.methodButton} ${paymentData.method === 'paypal' ? styles.methodActive : ''}`}
            onClick={() => handleMethodChange('paypal')}
            aria-pressed={paymentData.method === 'paypal'}
          >
            <svg className={styles.methodIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .76-.633h8.14c3.26 0 5.45 1.532 5.45 4.91 0 3.378-2.19 5.91-5.45 5.91H9.39l-1.354 7.43a.641.641 0 0 1-.633.633z" />
            </svg>
            <span>PayPal</span>
          </button>

          <button
            type="button"
            className={`${styles.methodButton} ${paymentData.method === 'bank_transfer' ? styles.methodActive : ''}`}
            onClick={() => handleMethodChange('bank_transfer')}
            aria-pressed={paymentData.method === 'bank_transfer'}
          >
            <svg className={styles.methodIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" />
              <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2" />
            </svg>
            <span>Bank Transfer</span>
          </button>
        </div>
      </div>

      {/* Card Payment Form */}
      {paymentData.method === 'card' && (
        <div className={styles.cardForm}>
          <h3 className={styles.sectionTitle}>Card Details</h3>

          <div className={styles.formGroup}>
            <label htmlFor="cardNumber" className={`${styles.label} ${styles.required}`}>
              Card Number
            </label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              className={`${styles.input} ${touched.cardNumber && errors.cardNumber ? styles.inputError : ''}`}
              value={paymentData.cardNumber}
              onChange={(e) => handleChange('cardNumber', e.target.value)}
              onBlur={() => handleBlur('cardNumber')}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              aria-required="true"
              aria-invalid={touched.cardNumber && !!errors.cardNumber}
              aria-describedby={errors.cardNumber ? 'cardNumber-error' : undefined}
            />
            {touched.cardNumber && errors.cardNumber && (
              <span id="cardNumber-error" className={styles.errorMessage} role="alert">
                {errors.cardNumber}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cardName" className={`${styles.label} ${styles.required}`}>
              Cardholder Name
            </label>
            <input
              type="text"
              id="cardName"
              name="cardName"
              className={`${styles.input} ${touched.cardName && errors.cardName ? styles.inputError : ''}`}
              value={paymentData.cardName}
              onChange={(e) => handleChange('cardName', e.target.value)}
              onBlur={() => handleBlur('cardName')}
              placeholder="John Smith"
              aria-required="true"
              aria-invalid={touched.cardName && !!errors.cardName}
              aria-describedby={errors.cardName ? 'cardName-error' : undefined}
            />
            {touched.cardName && errors.cardName && (
              <span id="cardName-error" className={styles.errorMessage} role="alert">
                {errors.cardName}
              </span>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cardExpiry" className={`${styles.label} ${styles.required}`}>
                Expiry Date
              </label>
              <input
                type="text"
                id="cardExpiry"
                name="cardExpiry"
                className={`${styles.input} ${touched.cardExpiry && errors.cardExpiry ? styles.inputError : ''}`}
                value={paymentData.cardExpiry}
                onChange={(e) => handleChange('cardExpiry', e.target.value)}
                onBlur={() => handleBlur('cardExpiry')}
                placeholder="MM/YY"
                maxLength={5}
                aria-required="true"
                aria-invalid={touched.cardExpiry && !!errors.cardExpiry}
                aria-describedby={errors.cardExpiry ? 'cardExpiry-error' : undefined}
              />
              {touched.cardExpiry && errors.cardExpiry && (
                <span id="cardExpiry-error" className={styles.errorMessage} role="alert">
                  {errors.cardExpiry}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cardCVV" className={`${styles.label} ${styles.required}`}>
                CVV
              </label>
              <input
                type="text"
                id="cardCVV"
                name="cardCVV"
                className={`${styles.input} ${touched.cardCVV && errors.cardCVV ? styles.inputError : ''}`}
                value={paymentData.cardCVV}
                onChange={(e) => handleChange('cardCVV', e.target.value)}
                onBlur={() => handleBlur('cardCVV')}
                placeholder="123"
                maxLength={4}
                aria-required="true"
                aria-invalid={touched.cardCVV && !!errors.cardCVV}
                aria-describedby={errors.cardCVV ? 'cardCVV-error' : undefined}
              />
              {touched.cardCVV && errors.cardCVV && (
                <span id="cardCVV-error" className={styles.errorMessage} role="alert">
                  {errors.cardCVV}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PayPal Instructions */}
      {paymentData.method === 'paypal' && (
        <div className={styles.paymentInfo}>
          <p className={styles.infoText}>
            You will be redirected to PayPal to complete your payment securely.
          </p>
        </div>
      )}

      {/* Bank Transfer Instructions */}
      {paymentData.method === 'bank_transfer' && (
        <div className={styles.paymentInfo}>
          <p className={styles.infoText}>
            Bank transfer details will be provided after booking confirmation. Your booking will be held for 24 hours pending payment.
          </p>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className={styles.termsGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={paymentData.termsAccepted}
            onChange={(e) => handleChange('termsAccepted', e.target.checked)}
            className={styles.checkbox}
            aria-required="true"
          />
          <span>
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.link}>
              Terms and Conditions
            </a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className={styles.link}>
              Privacy Policy
            </a>
          </span>
        </label>
        {!paymentData.termsAccepted && touched.termsAccepted && (
          <span className={styles.errorMessage} role="alert">
            You must accept the terms and conditions to continue
          </span>
        )}
      </div>
    </div>
  );
}
