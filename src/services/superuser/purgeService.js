/**
 * Servicio de purga (borrado fisico) del superusuario (/superuser/purge).
 */
import { apiClient } from '../apiClient';
import { seg, toData } from '../pagedResponse';

/** Colecciones permitidas por la lista blanca del backend. */
export const PURGEABLE_COLLECTIONS = ['users', 'products', 'suppliers', 'coupons'];

/**
 * DELETE /superuser/purge/:collection/:id -> resultado de la purga (data).
 * @param {'users'|'products'|'suppliers'|'coupons'} collection
 * @param {string} id ObjectId hexadecimal
 */
export async function purgeRecord(collection, id) {
  return toData(await apiClient.del(`/superuser/purge/${seg(collection)}/${seg(id)}`));
}

export default { PURGEABLE_COLLECTIONS, purgeRecord };
