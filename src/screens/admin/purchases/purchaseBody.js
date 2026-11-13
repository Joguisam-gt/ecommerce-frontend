/**
 * Validacion, total y cuerpo de POST /admin/purchases segun createPurchaseSchema:
 * { supplierId, items:[{ productId, quantity, unitCost }], paymentMethod?,
 *   supplierInvoiceNumber?, notes?, purchasedAt? }. Sin campos extra.
 * Modulo puro (sin dependencias) para poder verificarlo contra el backend.
 */

/** Limites del backend (purchase.validator.js). */
export const MAX_PURCHASE_ITEMS = 200;
export const MAX_MOVEMENT_QUANTITY = 100000;
export const MAX_UNIT_COST = 10000000;

/** Metodos de pago admitidos. */
export const PURCHASE_PAYMENT_METHODS = ['cash_on_delivery', 'card', 'bank_transfer'];

/** Fecha AAAA-MM-DD. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Numero decimal con hasta 2 decimales (acepta coma). */
const MONEY_RE = /^\d+([.,]\d{1,2})?$/;

/** Linea vacia de compra; product guarda los datos mostrados del producto elegido. */
export function emptyPurchaseLine() {
  return { key: `l${Date.now()}${Math.floor(Math.random() * 100000)}`, productId: '', product: null, quantity: '1', unitCost: '' };
}

/** Estado inicial del formulario (metodo por defecto del backend: transferencia). */
export function emptyPurchaseForm() {
  return {
    supplierId: '',
    paymentMethod: 'bank_transfer',
    supplierInvoiceNumber: '',
    notes: '',
    purchasedAt: '',
    items: [emptyPurchaseLine()],
  };
}

/** Convierte texto de costo a numero. */
export function toCost(text) {
  const raw = String(text === undefined || text === null ? '' : text).trim();
  return MONEY_RE.test(raw) ? Number(raw.replace(',', '.')) : NaN;
}

/** Convierte texto de cantidad a entero. */
export function toQuantity(text) {
  const raw = String(text === undefined || text === null ? '' : text).trim();
  return /^\d+$/.test(raw) ? Number(raw) : NaN;
}

/** Total de una linea en centavos (0 si incompleta). */
function lineCents(line) {
  const quantity = toQuantity(line.quantity);
  const cost = toCost(line.unitCost);
  if (!Number.isFinite(quantity) || !Number.isFinite(cost)) return 0;
  return Math.round(cost * 100) * quantity;
}

/** Total de una linea en quetzales. */
export function lineTotal(line) {
  return lineCents(line) / 100;
}

/** Total de la compra en quetzales (suma exacta en centavos). */
export function purchaseTotal(items) {
  return items.reduce((sum, line) => sum + lineCents(line), 0) / 100;
}

/**
 * Valida el formulario. Devuelve { errors, lineErrors } donde lineErrors es un
 * arreglo paralelo a items con { productId?, quantity?, unitCost? }.
 * @param {ReturnType<typeof emptyPurchaseForm>} form
 */
export function validatePurchaseForm(form) {
  const errors = {};
  if (!/^[a-f\d]{24}$/i.test(form.supplierId || '')) errors.supplierId = 'Selecciona un proveedor.';
  if (form.paymentMethod && !PURCHASE_PAYMENT_METHODS.includes(form.paymentMethod)) errors.paymentMethod = 'Metodo invalido.';
  const invoiceNumber = (form.supplierInvoiceNumber || '').trim();
  if (invoiceNumber.length > 60) errors.supplierInvoiceNumber = 'Maximo 60 caracteres.';
  if ((form.notes || '').trim().length > 1000) errors.notes = 'Maximo 1000 caracteres.';
  const date = (form.purchasedAt || '').trim();
  if (date && (!DATE_RE.test(date) || Number.isNaN(Date.parse(date)))) errors.purchasedAt = 'Usa el formato AAAA-MM-DD.';

  if (form.items.length < 1) errors.items = 'Agrega al menos una linea.';
  if (form.items.length > MAX_PURCHASE_ITEMS) errors.items = `Maximo ${MAX_PURCHASE_ITEMS} lineas.`;

  // Validacion por linea, incluido producto repetido (uniqueBy productId).
  const seen = new Set();
  const lineErrors = form.items.map((line) => {
    const lineError = {};
    if (!/^[a-f\d]{24}$/i.test(line.productId || '')) lineError.productId = 'Selecciona un producto.';
    else if (seen.has(line.productId.toLowerCase())) lineError.productId = 'Producto repetido en la compra.';
    if (line.productId) seen.add(line.productId.toLowerCase());
    const quantity = toQuantity(line.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_MOVEMENT_QUANTITY) {
      lineError.quantity = `Entero entre 1 y ${MAX_MOVEMENT_QUANTITY}.`;
    }
    const cost = toCost(line.unitCost);
    if (!Number.isFinite(cost) || cost < 0 || cost > MAX_UNIT_COST) lineError.unitCost = 'Costo con hasta 2 decimales.';
    return lineError;
  });
  const valid = Object.keys(errors).length === 0 && lineErrors.every((item) => Object.keys(item).length === 0);
  return { errors, lineErrors, valid };
}

/**
 * Cuerpo exacto del alta de compra (omite opcionales vacios y datos de UI).
 * @param {ReturnType<typeof emptyPurchaseForm>} form
 */
export function buildPurchaseBody(form) {
  const body = {
    supplierId: form.supplierId,
    items: form.items.map((line) => ({
      productId: line.productId,
      quantity: toQuantity(line.quantity),
      unitCost: toCost(line.unitCost),
    })),
  };
  if (form.paymentMethod) body.paymentMethod = form.paymentMethod;
  const invoiceNumber = (form.supplierInvoiceNumber || '').trim();
  if (invoiceNumber) body.supplierInvoiceNumber = invoiceNumber;
  const notes = (form.notes || '').trim();
  if (notes) body.notes = notes;
  const date = (form.purchasedAt || '').trim();
  if (date) body.purchasedAt = date;
  return body;
}
