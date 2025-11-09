'use client';

import React, { useState } from 'react';
import { DatePickerProps } from '../../lib/types/tour';
import styles from './DatePicker.module.css';

export default function DatePicker({
  selectedDate,
  onDateChange,
  minDate = new Date(),
  maxDate,
  unavailableDates = [],
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );

  // Helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateUnavailable = (date: Date) => {
    return unavailableDates.some(
      (unavailableDate) =>
        unavailableDate.toDateString() === date.toDateString()
    );
  };

  const isDateDisabled = (date: Date) => {
    if (date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (isDateUnavailable(date)) return true;
    return false;
  };

  const isSameDay = (date1: Date | null, date2: Date) => {
    if (!date1) return false;
    return date1.toDateString() === date2.toDateString();
  };

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  // Render calendar
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay} />);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const disabled = isDateDisabled(date);
      const selected = isSameDay(selectedDate, date);

      days.push(
        <button
          key={day}
          type="button"
          className={`${styles.day} ${selected ? styles.selected : ''} ${
            disabled ? styles.disabled : ''
          }`}
          onClick={() => !disabled && onDateChange(date)}
          disabled={disabled}
          aria-label={`Select ${date.toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`}
          aria-pressed={selected}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthYear = currentMonth.toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
  });

  const isPreviousMonthDisabled =
    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0) < minDate;

  const isNextMonthDisabled =
    maxDate &&
    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) >
      maxDate;

  return (
    <div className={styles.datePicker}>
      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          onClick={goToPreviousMonth}
          disabled={isPreviousMonthDisabled}
          aria-label="Previous month"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h3 className={styles.monthYear}>{monthYear}</h3>
        <button
          type="button"
          className={styles.navButton}
          onClick={goToNextMonth}
          disabled={isNextMonthDisabled}
          aria-label="Next month"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Weekday labels */}
      <div className={styles.weekdays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.calendar} role="grid" aria-label="Calendar">
        {renderCalendar()}
      </div>

      {/* Selected date display */}
      {selectedDate && (
        <div className={styles.selectedDateDisplay}>
          <p>
            Selected:{' '}
            <strong>
              {selectedDate.toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}
