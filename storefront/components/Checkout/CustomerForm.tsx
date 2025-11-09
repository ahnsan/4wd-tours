'use client';

import React, { useState } from 'react';
import styles from './CustomerForm.module.css';
import {
  validateEmail,
  validatePhone,
  validateFullName,
  validateRequired,
  formatPhoneNumber,
} from '../../lib/utils/validation';

export interface CustomerData {
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
  dietaryRequirements: string;
  specialRequests: string;
}

interface CustomerFormProps {
  onDataChange: (data: CustomerData, isValid: boolean) => void;
  initialData?: Partial<CustomerData>;
}

export default function CustomerForm({ onDataChange, initialData }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerData>({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    emergencyContact: initialData?.emergencyContact || '',
    emergencyPhone: initialData?.emergencyPhone || '',
    dietaryRequirements: initialData?.dietaryRequirements || '',
    specialRequests: initialData?.specialRequests || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CustomerData, boolean>>>({});

  const validateField = (field: keyof CustomerData, value: string): string | undefined => {
    switch (field) {
      case 'fullName':
        const nameResult = validateFullName(value);
        return nameResult.isValid ? undefined : nameResult.error;

      case 'email':
        const emailResult = validateEmail(value);
        return emailResult.isValid ? undefined : emailResult.error;

      case 'phone':
        const phoneResult = validatePhone(value);
        return phoneResult.isValid ? undefined : phoneResult.error;

      case 'emergencyContact':
        const emergencyNameResult = validateRequired(value, 'Emergency contact name');
        return emergencyNameResult.isValid ? undefined : emergencyNameResult.error;

      case 'emergencyPhone':
        const emergencyPhoneResult = validatePhone(value);
        return emergencyPhoneResult.isValid ? undefined : emergencyPhoneResult.error;

      default:
        return undefined;
    }
  };

  const handleChange = (field: keyof CustomerData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Validate field if it has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }

    // Check if all required fields are valid
    const requiredFields: (keyof CustomerData)[] = [
      'fullName',
      'email',
      'phone',
      'emergencyContact',
      'emergencyPhone',
    ];

    const newErrors: Partial<Record<keyof CustomerData, string>> = {};
    requiredFields.forEach((key) => {
      const fieldValue = key === field ? value : formData[key];
      const error = validateField(key, fieldValue);
      if (error) {
        newErrors[key] = error;
      }
    });

    const isValid = Object.keys(newErrors).length === 0;
    onDataChange(newFormData, isValid);
  };

  const handleBlur = (field: keyof CustomerData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));

    // Format phone numbers on blur
    if ((field === 'phone' || field === 'emergencyPhone') && !error) {
      const formatted = formatPhoneNumber(formData[field]);
      handleChange(field, formatted);
    }
  };

  return (
    <div className={styles.customerForm}>
      <h2 className={styles.formTitle}>Customer Details</h2>
      <p className={styles.formDescription}>
        Please provide your contact information and any special requirements for your tour.
      </p>

      <form className={styles.form}>
        {/* Full Name */}
        <div className={styles.formGroup}>
          <label htmlFor="fullName" className={`${styles.label} ${styles.required}`}>
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            className={`${styles.input} ${touched.fullName && errors.fullName ? styles.inputError : ''}`}
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder="John Smith"
            aria-required="true"
            aria-invalid={touched.fullName && !!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {touched.fullName && errors.fullName && (
            <span id="fullName-error" className={styles.errorMessage} role="alert">
              {errors.fullName}
            </span>
          )}
        </div>

        {/* Email */}
        <div className={styles.formGroup}>
          <label htmlFor="email" className={`${styles.label} ${styles.required}`}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={`${styles.input} ${touched.email && errors.email ? styles.inputError : ''}`}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="john.smith@example.com"
            aria-required="true"
            aria-invalid={touched.email && !!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {touched.email && errors.email && (
            <span id="email-error" className={styles.errorMessage} role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Phone */}
        <div className={styles.formGroup}>
          <label htmlFor="phone" className={`${styles.label} ${styles.required}`}>
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className={`${styles.input} ${touched.phone && errors.phone ? styles.inputError : ''}`}
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            placeholder="0400 123 456"
            aria-required="true"
            aria-invalid={touched.phone && !!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {touched.phone && errors.phone && (
            <span id="phone-error" className={styles.errorMessage} role="alert">
              {errors.phone}
            </span>
          )}
        </div>

        {/* Emergency Contact */}
        <div className={styles.formGroup}>
          <label htmlFor="emergencyContact" className={`${styles.label} ${styles.required}`}>
            Emergency Contact Name
          </label>
          <input
            type="text"
            id="emergencyContact"
            name="emergencyContact"
            className={`${styles.input} ${touched.emergencyContact && errors.emergencyContact ? styles.inputError : ''}`}
            value={formData.emergencyContact}
            onChange={(e) => handleChange('emergencyContact', e.target.value)}
            onBlur={() => handleBlur('emergencyContact')}
            placeholder="Jane Smith"
            aria-required="true"
            aria-invalid={touched.emergencyContact && !!errors.emergencyContact}
            aria-describedby={errors.emergencyContact ? 'emergencyContact-error' : undefined}
          />
          {touched.emergencyContact && errors.emergencyContact && (
            <span id="emergencyContact-error" className={styles.errorMessage} role="alert">
              {errors.emergencyContact}
            </span>
          )}
        </div>

        {/* Emergency Phone */}
        <div className={styles.formGroup}>
          <label htmlFor="emergencyPhone" className={`${styles.label} ${styles.required}`}>
            Emergency Contact Phone
          </label>
          <input
            type="tel"
            id="emergencyPhone"
            name="emergencyPhone"
            className={`${styles.input} ${touched.emergencyPhone && errors.emergencyPhone ? styles.inputError : ''}`}
            value={formData.emergencyPhone}
            onChange={(e) => handleChange('emergencyPhone', e.target.value)}
            onBlur={() => handleBlur('emergencyPhone')}
            placeholder="0400 987 654"
            aria-required="true"
            aria-invalid={touched.emergencyPhone && !!errors.emergencyPhone}
            aria-describedby={errors.emergencyPhone ? 'emergencyPhone-error' : undefined}
          />
          {touched.emergencyPhone && errors.emergencyPhone && (
            <span id="emergencyPhone-error" className={styles.errorMessage} role="alert">
              {errors.emergencyPhone}
            </span>
          )}
        </div>

        {/* Dietary Requirements */}
        <div className={styles.formGroup}>
          <label htmlFor="dietaryRequirements" className={styles.label}>
            Dietary Requirements
          </label>
          <input
            type="text"
            id="dietaryRequirements"
            name="dietaryRequirements"
            className={styles.input}
            value={formData.dietaryRequirements}
            onChange={(e) => handleChange('dietaryRequirements', e.target.value)}
            placeholder="Vegetarian, allergies, etc. (optional)"
            aria-describedby="dietary-help"
          />
          <span id="dietary-help" className={styles.helpText}>
            Please let us know about any dietary restrictions or allergies
          </span>
        </div>

        {/* Special Requests */}
        <div className={styles.formGroup}>
          <label htmlFor="specialRequests" className={styles.label}>
            Special Requests
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            className={styles.textarea}
            value={formData.specialRequests}
            onChange={(e) => handleChange('specialRequests', e.target.value)}
            placeholder="Any special requests or additional information (optional)"
            rows={4}
            aria-describedby="requests-help"
          />
          <span id="requests-help" className={styles.helpText}>
            Let us know if you have any special requirements for your tour
          </span>
        </div>
      </form>
    </div>
  );
}
