/**
 * Campo de fecha AAAA-MM-DD sobre TextInput nativo, con validacion de fecha real
 * y fecha minima opcional. Sin librerias de calendario.
 */
import React, { useState } from 'react';
import { AppTextInput } from './AppTextInput';

/** Patron AAAA-MM-DD. */
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Indica si el texto es una fecha real del calendario en formato AAAA-MM-DD.
 * @param {string} text
 * @returns {boolean}
 */
export function isValidIsoDate(text) {
  const match = DATE_PATTERN.exec(String(text || ''));
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Devuelve el mensaje de error de una fecha (o null si es valida o esta vacia).
 * @param {string} text
 * @param {string} [minDate] AAAA-MM-DD
 * @returns {string|null}
 */
export function dateFieldError(text, minDate) {
  if (!text) return null;
  if (!isValidIsoDate(text)) return 'Usa el formato AAAA-MM-DD con una fecha real.';
  if (minDate && isValidIsoDate(minDate) && text < minDate) return `La fecha no puede ser anterior a ${minDate}.`;
  return null;
}

/** Inserta guiones automaticamente mientras se escriben los digitos. */
function maskDate(raw) {
  const digits = String(raw || '').replace(/[^0-9]/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/**
 * @param {{ label?: string, value: string, onChange: (text: string) => void, error?: string,
 *   minDate?: string, placeholder?: string, style?: object }} props
 */
export function DateField({ label, value, onChange, error, minDate, placeholder = 'AAAA-MM-DD', style }) {
  // La validacion interna se muestra tras salir del campo para no molestar al escribir.
  const [touched, setTouched] = useState(false);
  const internalError = touched ? dateFieldError(value, minDate) : null;
  return (
    <AppTextInput
      label={label}
      value={value || ''}
      onChangeText={(text) => onChange && onChange(maskDate(text))}
      onBlur={() => setTouched(true)}
      error={error || internalError || undefined}
      placeholder={placeholder}
      keyboardType="numeric"
      autoCapitalize="none"
      maxLength={10}
      style={style}
    />
  );
}

export default DateField;
