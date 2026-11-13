/**
 * Tokenizador de tarjetas SIMULADO en memoria.
 *
 * Sustituye a la pasarela real: recibe los datos de la tarjeta y devuelve solo un
 * token opaco y metadatos seguros. El numero completo y el CVV nunca salen de esta
 * funcion, no se guardan ni se envian al backend.
 */
import { ApiError } from './apiClient';
import { isValidCvv, isValidExpiry, isNonEmpty, luhnCheck } from '../utils/validators';
import { CARD_BRANDS } from '../config/constants';

/** Alfabeto alfanumerico para el token. */
const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Genera una cadena aleatoria alfanumerica que nunca es solo digitos. */
function randomToken(length) {
  const bytes = new Uint8Array(length);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  const chars = Array.from(bytes, (b) => TOKEN_ALPHABET[b % TOKEN_ALPHABET.length]);
  // Garantiza al menos una letra para que nunca parezca un numero de tarjeta.
  chars[0] = LETTERS[bytes[0] % LETTERS.length];
  return chars.join('');
}

/**
 * Tokeniza una tarjeta.
 * @param {{ number: string, holderName: string, brand: string, expiry: string, cvv: string }} card
 * @returns {Promise<{ paymentToken: string, last4: string, cardHolderName: string, cardBrand: string }>}
 */
export async function tokenizeCard({ number, holderName, brand, expiry, cvv }) {
  const digits = String(number ?? '').replace(/[\s-]/g, '');
  // Validaciones previas equivalentes a las de una pasarela.
  const invalid =
    !luhnCheck(digits) ||
    !isNonEmpty(holderName) ||
    !CARD_BRANDS.includes(brand) ||
    !isValidExpiry(expiry) ||
    !isValidCvv(cvv, brand);
  if (invalid) {
    throw new ApiError({ status: 400, code: 'CARD_INVALID', message: 'Los datos de la tarjeta no son validos.' });
  }
  return {
    paymentToken: `tok_${randomToken(32)}`,
    last4: digits.slice(-4),
    cardHolderName: String(holderName).trim(),
    cardBrand: brand,
  };
}

export default { tokenizeCard };
