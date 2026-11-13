/**
 * Servicio del punto de venta: checkout con clave de idempotencia.
 */
import { apiClient } from './apiClient';

/** Alfabeto permitido por el backend para Idempotency-Key ([A-Za-z0-9_-]). */
const KEY_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

/** Devuelve n enteros aleatorios (usa crypto si esta disponible). */
function randomInts(n) {
  const values = new Uint8Array(n);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < n; i += 1) values[i] = Math.floor(Math.random() * 256);
  }
  return values;
}

/**
 * Genera una clave de idempotencia de 32 caracteres [A-Za-z0-9_-].
 * Debe generarse una vez por intento de compra y reutilizarse en los reintentos.
 */
export function generateIdempotencyKey() {
  const prefix = `ck${Date.now().toString(36)}_`;
  const random = Array.from(randomInts(32 - prefix.length), (v) => KEY_ALPHABET[v % KEY_ALPHABET.length]).join('');
  return `${prefix}${random}`;
}

/**
 * POST /pos/checkout
 * @param {object} payload Cuerpo exacto del contrato de checkout.
 * @param {string} idempotencyKey
 * @returns {Promise<{ order: object, invoice: object }>}
 */
export async function checkout(payload, idempotencyKey) {
  const response = await apiClient.post('/pos/checkout', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  const data = response?.data ?? {};
  return { order: data.order, invoice: data.invoice };
}

export default { checkout, generateIdempotencyKey };
