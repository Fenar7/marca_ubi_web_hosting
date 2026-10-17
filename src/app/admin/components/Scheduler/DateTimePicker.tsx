'use client';

import React, { useId } from 'react';
import styles from './Scheduler.module.scss';

export interface DateTimePickerProps {
  value: string; // ISO string or YYYY-MM-DDTHH:mm
  onChange: (isoString: string) => void;
  minDate?: string; // YYYY-MM-DD
  disabled?: boolean;
}

/**
 * Precision date and 24-hour time selector with timezone detection.
 */
export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  minDate,
  disabled = false,
}) => {
  const dateInputId = useId();
  const timeInputId = useId();

  const currentDateObj = value ? new Date(value) : new Date();
  const isDateValid = !isNaN(currentDateObj.getTime());

  // Extract YYYY-MM-DD and HH:mm in local time
  const localDateStr = isDateValid
    ? `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(
        currentDateObj.getDate()
      ).padStart(2, '0')}`
    : '';

  const localTimeStr = isDateValid
    ? `${String(currentDateObj.getHours()).padStart(2, '0')}:${String(currentDateObj.getMinutes()).padStart(
        2,
        '0'
      )}`
    : '10:00';

  // Compute timezone offset string (e.g. UTC+05:30)
  const tzOffsetMinutes = -currentDateObj.getTimezoneOffset();
  const tzSign = tzOffsetMinutes >= 0 ? '+' : '-';
  const tzHours = String(Math.floor(Math.abs(tzOffsetMinutes) / 60)).padStart(2, '0');
  const tzMins = String(Math.abs(tzOffsetMinutes) % 60).padStart(2, '0');
  const timezoneStr = `UTC${tzSign}${tzHours}:${tzMins}`;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!newDate) return;
    const combined = new Date(`${newDate}T${localTimeStr}:00`);
    if (!isNaN(combined.getTime())) {
      onChange(combined.toISOString());
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (!newTime) return;
    const combined = new Date(`${localDateStr || new Date().toISOString().split('T')[0]}T${newTime}:00`);
    if (!isNaN(combined.getTime())) {
      onChange(combined.toISOString());
    }
  };

  const adjustMinutes = (deltaMinutes: number) => {
    if (!isDateValid) return;
    const newDate = new Date(currentDateObj.getTime() + deltaMinutes * 60 * 1000);
    onChange(newDate.toISOString());
  };

  return (
    <div className={styles.dateTimePickerContainer}>
      <div className={styles.pickerRow}>
        <div className={styles.pickerField}>
          <label htmlFor={dateInputId} className={styles.pickerLabel}>
            Follow-up Date
          </label>
          <div className={styles.inputWrapper}>
            <input
              id={dateInputId}
              type="date"
              value={localDateStr}
              min={minDate}
              onChange={handleDateChange}
              disabled={disabled}
              className={styles.dateInput}
            />
          </div>
        </div>

        <div className={styles.pickerField}>
          <label htmlFor={timeInputId} className={styles.pickerLabel}>
            <span>Time</span>
            <span className={styles.timezonePill}>{timezoneStr}</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id={timeInputId}
              type="time"
              value={localTimeStr}
              onChange={handleTimeChange}
              disabled={disabled}
              className={styles.timeInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.timeAdjustmentRow}>
        <span className={styles.adjustmentLabel}>Quick Step:</span>
        <button
          type="button"
          onClick={() => adjustMinutes(15)}
          disabled={disabled}
          className={styles.stepButton}
        >
          +15m
        </button>
        <button
          type="button"
          onClick={() => adjustMinutes(30)}
          disabled={disabled}
          className={styles.stepButton}
        >
          +30m
        </button>
        <button
          type="button"
          onClick={() => adjustMinutes(60)}
          disabled={disabled}
          className={styles.stepButton}
        >
          +1h
        </button>
      </div>
    </div>
  );
};
