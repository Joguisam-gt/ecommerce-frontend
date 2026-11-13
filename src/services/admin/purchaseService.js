/**
 * Servicio de compras a proveedores (/admin/purchases).
 */
import { apiClient } from '../apiClient';
import { seg, toData, toPage } from '../pagedResponse';

const BASE = '/admin/purchases';

/** GET /admin/purchases -> { items, meta } */
export async function listPurchases(query) {
  return toPage(await apiClient.get(BASE, { query }));
}

/** GET /admin/purchases/:id -> compra (incluye su factura) */
export async function getPurchase(id) {
  return toData(await apiClient.get(`${BASE}/${seg(id)}`));
}

/** POST /admin/purchases -> compra creada */
export async function createPurchase(body) {
  return toData(await apiClient.post(BASE, body));
}

export default { listPurchases, getPurchase, createPurchase };
