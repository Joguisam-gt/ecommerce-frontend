/**
 * Servicio de facturas del panel de administracion (/admin/invoices).
 */
import { apiClient } from '../apiClient';
import { seg, toData, toPage } from '../pagedResponse';

const BASE = '/admin/invoices';

/** GET /admin/invoices -> { items, meta } */
export async function listInvoices(query) {
  return toPage(await apiClient.get(BASE, { query }));
}

/** GET /admin/invoices/:id -> factura (detalle) */
export async function getInvoice(id) {
  return toData(await apiClient.get(`${BASE}/${seg(id)}`));
}

export default { listInvoices, getInvoice };
