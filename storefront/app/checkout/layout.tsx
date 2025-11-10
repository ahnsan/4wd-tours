'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import styles from './checkout-layout.module.css';

interface CheckoutLayoutProps {
  children: ReactNode;
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  const pathname = usePathname();

  // Determine current step for progress indicator
  const getCurrentStep = () => {
    if (pathname?.includes('/add-ons-flow') || pathname?.includes('/add-ons')) {
      return 2;
    }
    if (pathname?.includes('/confirmation')) {
      return 3;
    }
    return 1; // Main checkout page
  };

  const currentStep = getCurrentStep();

  const steps = [
    { number: 1, label: 'Details', path: '/checkout' },
    { number: 2, label: 'Add-ons', path: '/checkout/add-ons-flow' },
    { number: 3, label: 'Confirmation', path: '/checkout/confirmation' },
  ];

  return (
    <div className={styles.checkoutLayout}>
      {/* Progress Indicator - only show on non-confirmation pages */}
      {!pathname?.includes('/confirmation') && (
        <div className={styles.progressContainer}>
          <div className={styles.progressSteps}>
            {steps.slice(0, 2).map((step) => (
              <div
                key={step.number}
                className={`${styles.progressStep} ${
                  currentStep === step.number
                    ? styles.progressStepActive
                    : currentStep > step.number
                    ? styles.progressStepCompleted
                    : ''
                }`}
              >
                <div className={styles.progressStepNumber}>{step.number}</div>
                <div className={styles.progressStepLabel}>{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={styles.checkoutContent}>{children}</div>
    </div>
  );
}
