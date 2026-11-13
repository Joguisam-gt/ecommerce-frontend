/**
 * Servicio de clientes (/admin/customers). El borrado fisico es solo de superusuario.
 */
import { apiClient } from '../apiClient';
import { seg, toData, toPage } from '../pagedResponse';

const BASE = '/admin/customers';

/** GET /admin/customers -> { items, meta } */
export async function listCustomers(query) {
  return toPage(await apiClient.get(BASE, { query }));
}

/** GET /admin/customers/:id -> cliente */
export async function getCustomer(id) {
  return toData(await apiClient.get(`${BASE}/${seg(id)}`));
}

/** PATCH /admin/customers/:id -> cliente actualizado */
export async function updateCustomer(id, body) {
  return toData(await apiClient.patch(`${BASE}/${seg(id)}`, body));
}

/** PATCH /admin/customers/:id/deactivate -> cliente desactivado */
export async function deactivateCustomer(id) {
  return toData(await apiClient.patch(`${BASE}/${seg(id)}/deactivate`));
}

/** DELETE /admin/customers/:id (204, solo superusuario) -> null */
export async function deleteCustomer(id) {
  return toData(await apiClient.del(`${BASE}/${seg(id)}`));
}

export default { listCustomers, getCustomer, updateCustomer, deactivateCustomer, deleteCustomer };
