/**
 * Servicio de inventario del panel de administracion (/admin/inventory).
 */
import { apiClient } from '../apiClient';
import { seg, toData, toPage } from '../pagedResponse';

const BASE = '/admin/inventory';

/** GET /admin/inventory -> { items, meta } */
export async function listInventory(query) {
  return toPage(await apiClient.get(BASE, { query }));
}

/** GET /admin/inventory/:id -> detalle del producto con su inventario */
export async function getInventoryProduct(id) {
  return toData(await apiClient.get(`${BASE}/${seg(id)}`));
}

/** GET /admin/inventory/losses -> { items, meta } */
export async function listLosses(query) {
  return toPage(await apiClient.get(`${BASE}/losses`, { query }));
}

/** POST /admin/inventory/losses -> perdida registrada (data). */
export async function recordLoss(body) {
  return toData(await apiClient.post(`${BASE}/losses`, body));
}

/**
 * Variante opcional de recordLoss que conserva la meta del backend
 * ({ previousStock, newStock }) -> { data, meta }.
 */
export async function recordLossWithStock(body) {
  const response = await apiClient.post(`${BASE}/losses`, body);
  return { data: toData(response), meta: response?.meta || {} };
}

export default { listInventory, getInventoryProduct, listLosses, recordLoss, recordLossWithStock };
