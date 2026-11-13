/**
 * Servicio de gestion de personal del superusuario (/superuser/staff).
 */
import { apiClient } from '../apiClient';
import { seg, toData, toPage } from '../pagedResponse';

const BASE = '/superuser/staff';

/** GET /superuser/staff (filtros: role admin|superuser, isActive, search) -> { items, meta } */
export async function listStaff(query) {
  return toPage(await apiClient.get(BASE, { query }));
}

/** POST /superuser/staff (datos de usuario + role admin|superuser) -> usuario creado */
export async function createStaff(body) {
  return toData(await apiClient.post(BASE, body));
}

/** PATCH /superuser/staff/:id/role con cuerpo { role } (cualquier rol valido, p. ej. degradar a user). */
export async function changeStaffRole(id, role) {
  return toData(await apiClient.patch(`${BASE}/${seg(id)}/role`, { role }));
}

/** PATCH /superuser/staff/:id/status con cuerpo { isActive: boolean }. */
export async function changeStaffStatus(id, isActive) {
  return toData(await apiClient.patch(`${BASE}/${seg(id)}/status`, { isActive: Boolean(isActive) }));
}

export default { listStaff, createStaff, changeStaffRole, changeStaffStatus };
