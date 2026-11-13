/**
 * Servicio del carrito del usuario autenticado (/cart). Todas las funciones
 * devuelven el `data` del carrito actualizado.
 */
import { apiClient } from './apiClient';

/** Extrae el carrito del envoltorio { data }. */
const unwrap = (response) => response?.data ?? null;

/** GET /cart */
export async function getCart() {
  return unwrap(await apiClient.get('/cart'));
}

/** POST /cart/items (201) */
export async function addItem(productId, quantity) {
  return unwrap(await apiClient.post('/cart/items', { productId, quantity }));
}

/** PATCH /cart/items/:productId */
export async function updateItem(productId, quantity) {
  return unwrap(await apiClient.patch(`/cart/items/${encodeURIComponent(productId)}`, { quantity }));
}

/** DELETE /cart/items/:productId */
export async function removeItem(productId) {
  return unwrap(await apiClient.del(`/cart/items/${encodeURIComponent(productId)}`));
}

/** POST /cart/coupon (422 con code de motivo si es invalido o expirado). */
export async function applyCoupon(code) {
  return unwrap(await apiClient.post('/cart/coupon', { code }));
}

/** DELETE /cart/coupon */
export async function removeCoupon() {
  return unwrap(await apiClient.del('/cart/coupon'));
}

export default { getCart, addItem, updateItem, removeItem, applyCoupon, removeCoupon };
