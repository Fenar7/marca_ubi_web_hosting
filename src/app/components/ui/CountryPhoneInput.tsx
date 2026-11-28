/**
 * @file CountryPhoneInput.tsx
 * @description Accessible combined country dial-code selector and telephone input.
 *              Synchronizes with controlled React state (`value` + `onChange`) as well as
 *              uncontrolled `FormData` submissions (`name` hidden input), auto-detects pasted
 *              international `+...` prefixes without double-prefixing, and suppresses bare dial
 *              codes when the national number is empty.
 * @module components/ui/CountryPhoneInput
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */

'use client';

import React, { useState } from 'react';
import {
  PHONE_COUNTRIES,
  composePhoneValue,
  detectCountryFromInternationalInput,
  getPhoneCountryByIso,
  splitPhoneValue,
} from '@/app/lib/phone-countries';
import styles from './CountryPhoneInput.module.scss';

export type CountryPhoneInputVariant = 'admin' | 'publicLight' | 'publicDark' | 'underline';

export interface CountryPhoneInputProps {
  /** Input element id bound to the associated field `<label htmlFor={id}>`. */
  id?: string;
  /** Optional form field name emitted via hidden input for `FormData` submissions. */
  name?: string;
  /** Controlled full international phone value (e.g., `"+971 50 123 4567"` or `""`). */
  value?: string;
  /** Initial value when rendered uncontrolled. */
  defaultValue?: string;
  /** Callback invoked with the composed E.164-friendly phone string (or `""` when empty). */
  onChange?: (nextPhoneValue: string) => void;
  /** Default country ISO code before any number is entered (defaults to `'AE'`). */
  defaultCountry?: string;
  /** Visual variant matching CRM modals vs public intake surfaces. */
  variant?: CountryPhoneInputVariant;
  /** Marks the field visually and semantically invalid (`aria-invalid`). */
  hasError?: boolean;
  /** Optional `aria-describedby` id referencing an error or hint element. */
  ariaDescribedBy?: string;
  /** Optional accessible label for the country selector control. */
  countryAriaLabel?: string;
  /** Disables both the country code selector and national number input. */
  disabled?: boolean;
  /** Marks the national number input required for native HTML constraint validation. */
  required?: boolean;
  /** Optional national number placeholder override. */
  placeholder?: string;
  /** Extra container class name if needed by host layout. */
  className?: string;
}

/**
 * Renders a unified `[ Country Code | Phone Number ]` input group.
 */
export function CountryPhoneInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  defaultCountry = 'AE',
  variant = 'admin',
  hasError = false,
  ariaDescribedBy,
  countryAriaLabel = 'Country dial code',
  disabled = false,
  required = false,
  placeholder,
  className,
}: CountryPhoneInputProps): React.ReactElement {
  const initialSource = value !== undefined ? value : (defaultValue ?? '');
  const [countryIso, setCountryIso] = useState<string>(
    () => splitPhoneValue(initialSource, defaultCountry).countryIso
  );
  const [nationalNumber, setNationalNumber] = useState<string>(
    () => splitPhoneValue(initialSource, defaultCountry).nationalNumber
  );
  const [prevPropValue, setPrevPropValue] = useState<string | undefined>(value);

  // Synchronize external controlled resets/hydration without effects or stale closures.
  if (value !== undefined && value !== prevPropValue) {
    setPrevPropValue(value);
    const localComposed = composePhoneValue(countryIso, nationalNumber);
    if (value !== localComposed) {
      if (value.trim().length === 0) {
        setCountryIso(getPhoneCountryByIso(defaultCountry).iso);
        setNationalNumber('');
      } else {
        const parsed = splitPhoneValue(value, countryIso);
        setCountryIso(parsed.countryIso);
        setNationalNumber(parsed.nationalNumber);
      }
    }
  }

  const activeCountry = getPhoneCountryByIso(countryIso);
  const composedValue = composePhoneValue(countryIso, nationalNumber);

  const emitChange = (nextIso: string, nextNational: string) => {
    const nextComposed = composePhoneValue(nextIso, nextNational);
    if (value !== undefined) {
      setPrevPropValue(nextComposed);
    }
    if (onChange) {
      onChange(nextComposed);
    }
  };

  const handleCountrySelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextIso = event.target.value;
    setCountryIso(nextIso);
    emitChange(nextIso, nationalNumber);
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextRaw = event.target.value;
    const detected = detectCountryFromInternationalInput(nextRaw);

    if (detected) {
      setCountryIso(detected.country.iso);
      setNationalNumber(detected.nationalNumber);
      emitChange(detected.country.iso, detected.nationalNumber);
      return;
    }

    setNationalNumber(nextRaw);
    emitChange(countryIso, nextRaw);
  };

  const variantClass =
    variant === 'publicLight'
      ? styles.variant_publicLight
      : variant === 'publicDark'
        ? styles.variant_publicDark
        : variant === 'underline'
          ? styles.variant_underline
          : '';

  return (
    <div
      className={[
        styles.phoneShell,
        variantClass,
        hasError ? styles.hasError : '',
        disabled ? styles.isDisabled : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {name ? <input type="hidden" name={name} value={composedValue} /> : null}

      <div className={styles.prefixWrap}>
        <span className={styles.prefixDisplay} aria-hidden="true">
          <span className={styles.prefixIso}>{activeCountry.iso}</span>
          <span className={styles.prefixDial}>{activeCountry.dialCode}</span>
          <svg
            className={styles.prefixChevron}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>

        <select
          className={styles.prefixSelect}
          aria-label={countryAriaLabel}
          value={activeCountry.iso}
          onChange={handleCountrySelect}
          disabled={disabled}
        >
          {PHONE_COUNTRIES.map((country) => (
            <option key={country.iso} value={country.iso}>
              {country.name} ({country.dialCode})
            </option>
          ))}
        </select>
      </div>

      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className={styles.numberInput}
        placeholder={placeholder ?? activeCountry.example}
        value={nationalNumber}
        onChange={handleNumberChange}
        disabled={disabled}
        required={required}
        maxLength={32}
        aria-invalid={hasError || undefined}
        aria-describedby={ariaDescribedBy}
      />
    </div>
  );
}
