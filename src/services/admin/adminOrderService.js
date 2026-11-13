/**
 * Servicio de conciliacion de transferencias (/admin/orders).
 */
import { apiClient } from '../apiClient';
import { seg, toData, toPage } from '../pagedResponse';

/**
 * GET /admin/orders/pending-verification
 * @param {{ page?: number, limit?: number }} [query]
 * @returns {Promise<{ items: object[], meta: object }>}
 */
export async function listPendingVerification(query) {
  return toPage(await apiClient.get('/admin/orders/pending-verification', { query }));
}

/**
 * PATCH /admin/orders/:id/reconcile. El motivo (3-500 chars) es obligatorio al rechazar.
 * @param {string} id
 * @param {{ action: 'approve'|'reject', reason?: string }} body
 * @returns {Promise<object>}
 */
export async function reconcileOrder(id, { action, reason } = {}) {
  // Solo se envian campos definidos (el backend rechaza campos desconocidos).
  const body = { action };
  if (reason !== undefined && reason !== null && reason !== '') body.reason = reason;
  return toData(await apiClient.patch(`/admin/orders/${seg(id)}/reconcile`, body));
}

export default { listPendingVerification, reconcileOrder };
