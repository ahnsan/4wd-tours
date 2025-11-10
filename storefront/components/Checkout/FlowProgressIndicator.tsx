'use client';

import React from 'react';
import styles from './FlowProgressIndicator.module.css';

export interface FlowProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  categories: Array<{ id: string; name: string; icon: string }>;
  onStepClick?: (step: number) => void;
}

/**
 * FlowProgressIndicator - Visual progress bar for multi-step flow
 * Shows current step, completed steps, and allows navigation to previous steps
 */
export default function FlowProgressIndicator({
  currentStep,
  totalSteps,
  completedSteps,
  categories,
  onStepClick,
}: FlowProgressIndicatorProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const getStepStatus = (step: number): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.has(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const canNavigateToStep = (step: number): boolean => {
    // Can navigate to completed steps or current step
    return completedSteps.has(step) || step === currentStep;
  };

  return (
    <div className={styles.container} role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
      {/* Progress Bar */}
      <div className={styles.progressBarContainer}>
        <div
          className={styles.progressBar}
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Step Indicators */}
      <div className={styles.stepsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const status = getStepStatus(index);
          const isClickable = canNavigateToStep(index) && onStepClick;
          const isLastStep = index === totalSteps - 1;
          const stepName = isLastStep ? 'Summary' : categories[index]?.name || `Step ${index + 1}`;
          const stepIcon = isLastStep ? '✓' : categories[index]?.icon || '•';

          return (
            <button
              key={index}
              type="button"
              className={`${styles.step} ${styles[status]} ${isClickable ? styles.clickable : ''}`}
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              aria-label={`${stepName} - ${status === 'completed' ? 'Completed' : status === 'current' ? 'Current step' : 'Upcoming'}`}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              <div className={styles.stepCircle}>
                <span className={styles.stepIcon} aria-hidden="true">
                  {status === 'completed' ? '✓' : stepIcon}
                </span>
              </div>
              <span className={styles.stepLabel}>{stepName}</span>
            </button>
          );
        })}
      </div>

      {/* Step Counter */}
      <div className={styles.stepCounter} aria-live="polite">
        Step {currentStep + 1} of {totalSteps}
      </div>
    </div>
  );
}
