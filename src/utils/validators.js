/**
 * Validadores locales de formularios (correo, telefono, tarjeta, URL).
 * Son una ayuda de UX: la validacion real siempre la hace el backend.
 */

/** Comprueba que el valor sea texto con contenido distinto de espacios. */
export function isNonEmpty(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
}

/** Valida un correo con un patron razonable (usuario@dominio.tld). */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Valida un telefono: digitos, espacios o guiones, con + opcional (7 a 20 caracteres). */
export function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  return /^\+?[0-9\s-]{7,20}$/.test(phone.trim());
}

/** Algoritmo de Luhn sobre un numero de tarjeta (ignora espacios y guiones). */
export function luhnCheck(cardNumber) {
  const digits = String(cardNumber ?? '').replace(/[\s-]/g, '');
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  // Recorre de derecha a izquierda duplicando cada segundo digito.
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * Valida una fecha de vencimiento 'MM/AA' no vencida (valida hasta el ultimo dia del mes).
 * @param {string} expiry
 * @param {Date} [now]
 */
export function isValidExpiry(expiry, now = new Date()) {
  const match = /^(\d{2})\/(\d{2})$/.exec(String(expiry ?? '').trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  // Primer dia del mes siguiente al vencimiento.
  const expiresAt = new Date(year, month, 1);
  return expiresAt > now;
}

/** Valida el CVV: 4 digitos para Amex, 3 para el resto. */
export function isValidCvv(cvv, brand) {
  const length = brand === 'Amex' ? 4 : 3;
  return new RegExp(`^\\d{${length}}$`).test(String(cvv ?? ''));
}

/** Comprueba que el texto sea una URL https con host. */
export function isHttpsUrl(url) {
  if (typeof url !== 'string') return false;
  return /^https:\/\/[^\s/$.?#][^\s]*$/i.test(url.trim());
}
