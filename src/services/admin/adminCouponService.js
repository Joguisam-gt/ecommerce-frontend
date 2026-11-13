/**
 * Servicio de cupones del panel de administracion (/admin/coupons).
 */
import { apiClient } from '../apiClient';
import { seg, toData, toPage } from '../pagedResponse';

const BASE = '/admin/coupons';

/** GET /admin/coupons/applicable-products -> { items, meta } */
export async function listApplicableProducts(query) {
  return toPage(await apiClient.get(`${BASE}/applicable-products`, { query }));
}

/** GET /admin/coupons -> { items, meta } */
export async function listCoupons(query) {
  return toPage(await apiClient.get(BASE, { query }));
}

/** GET /admin/coupons/:id -> cupon */
export async function getCoupon(id) {
  return toData(await apiClient.get(`${BASE}/${seg(id)}`));
}

/** POST /admin/coupons -> cupon creado */
export async function createCoupon(body) {
  return toData(await apiClient.post(BASE, body));
}

/** PATCH /admin/coupons/:id -> cupon actualizado */
export async function updateCoupon(id, body) {
  return toData(await apiClient.patch(`${BASE}/${seg(id)}`, body));
}

/** PATCH /admin/coupons/:id/deactivate -> cupon desactivado */
export async function deactivateCoupon(id) {
  return toData(await apiClient.patch(`${BASE}/${seg(id)}/deactivate`));
}

export default { listApplicableProducts, listCoupons, getCoupon, createCoupon, updateCoupon, deactivateCoupon };
