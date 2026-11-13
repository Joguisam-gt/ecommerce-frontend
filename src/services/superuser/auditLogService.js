/**
 * Servicio de bitacora de auditoria del superusuario (/superuser/audit-logs).
 */
import { apiClient } from '../apiClient';
import { toPage } from '../pagedResponse';

/** GET /superuser/audit-logs -> { items, meta } */
export async function listAuditLogs(query) {
  return toPage(await apiClient.get('/superuser/audit-logs', { query }));
}

export default { listAuditLogs };
