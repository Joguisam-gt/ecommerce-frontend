/**
 * Validacion y construccion del cuerpo de POST /admin/inventory/losses segun
 * recordLossSchema: { productId, quantity, reason, notes?, occurredAt? }.
 * Modulo puro (sin dependencias) para poder verificarlo contra el backend.
 */

/** Maximo de unidades por movimiento (MAX_MOVEMENT_QUANTITY del backend). */
export const MAX_LOSS_QUANTITY = 100000;

/** Motivos admitidos (ALL_LOSS_REASONS del backend). */
export const LOSS_REASONS = ['expired', 'damaged'];

/** Fecha AAAA-MM-DD valida. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Estado inicial del formulario de merma. */
export const EMPTY_LOSS_FORM = { productId: '', quantity: '', reason: 'expired', notes: '', occurredAt: '' };

/**
 * Valida el formulario; devuelve un objeto { campo: mensaje } (vacio si es valido).
 * @param {typeof EMPTY_LOSS_FORM} form
 */
export function validateLossForm(form) {
  const errors = {};
  if (!/^[a-f\d]{24}$/i.test(form.productId || '')) errors.productId = 'Selecciona un producto.';
  const quantity = Number(String(form.quantity).trim());
  if (!/^\d+$/.test(String(form.quantity).trim()) || quantity < 1 || quantity > MAX_LOSS_QUANTITY) {
    errors.quantity = `Cantidad entera entre 1 y ${MAX_LOSS_QUANTITY}.`;
  }
  if (!LOSS_REASONS.includes(form.reason)) errors.reason = 'Selecciona un motivo.';
  if ((form.notes || '').trim().length > 1000) errors.notes = 'Maximo 1000 caracteres.';
  const date = (form.occurredAt || '').trim();
  if (date && (!DATE_RE.test(date) || Number.isNaN(Date.parse(date)))) errors.occurredAt = 'Usa el formato AAAA-MM-DD.';
  return errors;
}

/**
 * Cuerpo exacto del alta de merma (omite opcionales vacios).
 * @param {typeof EMPTY_LOSS_FORM} form
 */
export function buildLossBody(form) {
  const body = {
    productId: form.productId,
    quantity: Number(String(form.quantity).trim()),
    reason: form.reason,
  };
  const notes = (form.notes || '').trim();
  if (notes) body.notes = notes;
  const date = (form.occurredAt || '').trim();
  if (date) body.occurredAt = date;
  return body;
}
