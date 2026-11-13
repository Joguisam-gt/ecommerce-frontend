/**
 * Servicio de proveedores (/admin/suppliers). El borrado fisico es solo de superusuario.
 */
import { apiClient } from '../apiClient';
import { seg, toData, toPage } from '../pagedResponse';

const BASE = '/admin/suppliers';

/** GET /admin/suppliers -> { items, meta } */
export async function listSuppliers(query) {
  return toPage(await apiClient.get(BASE, { query }));
}

/** GET /admin/suppliers/:id -> proveedor (detalle) */
export async function getSupplier(id) {
  return toData(await apiClient.get(`${BASE}/${seg(id)}`));
}

/** POST /admin/suppliers -> proveedor creado */
export async function createSupplier(body) {
  return toData(await apiClient.post(BASE, body));
}

/** PATCH /admin/suppliers/:id -> proveedor actualizado */
export async function updateSupplier(id, body) {
  return toData(await apiClient.patch(`${BASE}/${seg(id)}`, body));
}

/** PATCH /admin/suppliers/:id/deactivate -> proveedor desactivado */
export async function deactivateSupplier(id) {
  return toData(await apiClient.patch(`${BASE}/${seg(id)}/deactivate`));
}

/** DELETE /admin/suppliers/:id (204, solo superusuario) -> null */
export async function deleteSupplier(id) {
  return toData(await apiClient.del(`${BASE}/${seg(id)}`));
}

export default { listSuppliers, getSupplier, createSupplier, updateSupplier, deactivateSupplier, deleteSupplier };
