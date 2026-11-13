/**
 * Reglas del formulario de cupones alineadas con createCouponSchema del backend
 * (admin-coupon.validator.js) y con resolveExpiration de AdminCouponService.
 */

/** Patron del codigo tras pasar a mayusculas (COUPON_CODE_PATTERN del backend). */
export const COUPON_CODE_PATTERN = /^[A-Z0-9_-]{3,30}$/;

/** Maximo de productos aplicables (MAX_APPLICABLE_PRODUCTS). */
export const MAX_APPLICABLE_PRODUCTS = 500;

/** Limite superior de maxUses / maxUsesPerUser. */
const MAX_USES_LIMIT = 1000000;

/** Formulario vacio. codeMode: 'manual' (el admin escribe) o 'auto' (el backend genera al omitir code). */
export const EMPTY_COUPON_FORM = {
  codeMode: 'manual',
  code: '',
  description: '',
  discountPercent: '',
  expiresAt: '',
  isPermanent: false,
  maxUses: '',
  maxUsesPerUser: '',
};

/** Codigos de error 422 del backend que pertenecen al campo de expiracion. */
export const EXPIRATION_ERROR_CODES = [
  'COUPON_EXPIRATION_CONFLICT',
  'COUPON_EXPIRATION_REQUIRED',
  'COUPON_EXPIRATION_IN_PAST',
  'COUPON_EXPIRATION_BEFORE_START',
];

/** Entero positivo opcional desde texto: '' -> null, invalido -> NaN. */
function optionalInt(text) {
  const raw = String(text || '').trim();
  if (raw === '') return null;
  return /^\d+$/.test(raw) ? Number(raw) : NaN;
}

/**
 * Convierte AAAA-MM-DD al final de ese dia en hora local, en ISO 8601 (UTC).
 * Asi un cupon "hasta el 31" vale todo el dia 31 en la zona del administrador.
 * @param {string} day
 * @returns {string | null}
 */
export function endOfLocalDayIso(day) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || '').trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999);
  // Rechaza fechas imposibles (p. ej. 2026-02-31 se desplazaria de mes).
  if (date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
  return date.toISOString();
}

/**
 * Valida el formulario localmente con las mismas reglas del backend.
 * @param {typeof EMPTY_COUPON_FORM} form
 * @param {number} selectedCount Productos aplicables seleccionados.
 * @returns {Record<string, string>} Errores por campo (vacio si es valido).
 */
export function validateCouponForm(form, selectedCount = 0) {
  const errors = {};

  // Codigo manual: obligatorio en modo manual y con el patron del backend.
  if (form.codeMode === 'manual') {
    const code = form.code.trim().toUpperCase();
    if (code === '') errors.code = 'Escribe un codigo o usa "Generar Codigo Aleatorio".';
    else if (!COUPON_CODE_PATTERN.test(code)) errors.code = 'Solo letras, numeros, guion y guion bajo (3 a 30 caracteres).';
  }

  // Descripcion opcional de hasta 500 caracteres.
  if (form.description.trim().length > 500) errors.description = 'Maximo 500 caracteres.';

  // Descuento porcentual entero 1-100 (discountPercent es el unico tipo admitido en el alta).
  const percent = optionalInt(form.discountPercent);
  if (percent === null) errors.discountPercent = 'Indica el porcentaje de descuento.';
  else if (Number.isNaN(percent) || percent < 1 || percent > 100) errors.discountPercent = 'Debe ser un entero entre 1 y 100.';

  // Vigencia: expiresAt XOR isPermanent, y la fecha debe ser futura.
  const hasDate = form.expiresAt.trim() !== '';
  if (hasDate && form.isPermanent) {
    errors.expiresAt = 'Elige una fecha de expiracion o marca "Cupon Permanente", no ambos.';
  } else if (!hasDate && !form.isPermanent) {
    errors.expiresAt = 'Indica una fecha de expiracion o marca "Cupon Permanente".';
  } else if (hasDate) {
    const iso = endOfLocalDayIso(form.expiresAt);
    if (!iso) errors.expiresAt = 'Fecha invalida (AAAA-MM-DD).';
    else if (Date.parse(iso) <= Date.now()) errors.expiresAt = 'La fecha de expiracion debe ser futura.';
  }

  // Limites de uso opcionales (1 a 1,000,000) y por usuario <= total.
  const maxUses = optionalInt(form.maxUses);
  const maxUsesPerUser = optionalInt(form.maxUsesPerUser);
  if (maxUses !== null && (Number.isNaN(maxUses) || maxUses < 1 || maxUses > MAX_USES_LIMIT)) {
    errors.maxUses = 'Debe ser un entero mayor o igual a 1.';
  }
  if (maxUsesPerUser !== null && (Number.isNaN(maxUsesPerUser) || maxUsesPerUser < 1 || maxUsesPerUser > MAX_USES_LIMIT)) {
    errors.maxUsesPerUser = 'Debe ser un entero mayor o igual a 1.';
  } else if (maxUses !== null && maxUsesPerUser !== null && !errors.maxUses && maxUsesPerUser > maxUses) {
    errors.maxUsesPerUser = 'No puede superar el limite total de usos.';
  }

  // Productos aplicables: maximo 500.
  if (selectedCount > MAX_APPLICABLE_PRODUCTS) {
    errors.applicableProductIds = `Selecciona como maximo ${MAX_APPLICABLE_PRODUCTS} productos.`;
  }
  return errors;
}

/**
 * Construye el cuerpo EXACTO de POST /admin/coupons (solo campos de createCouponSchema).
 * - code se omite en modo 'auto': el backend lo genera con su CouponCodeGenerator.
 * - expiresAt o isPermanent: true, nunca ambos.
 * - applicableProductIds solo si hay seleccion (vacio = cupon global).
 * @param {typeof EMPTY_COUPON_FORM} form
 * @param {string[]} productIds
 * @returns {object}
 */
export function buildCouponBody(form, productIds = []) {
  const body = { discountPercent: Number(form.discountPercent.trim()) };
  if (form.codeMode === 'manual') body.code = form.code.trim().toUpperCase();
  const description = form.description.trim();
  if (description) body.description = description;
  if (form.isPermanent) body.isPermanent = true;
  else body.expiresAt = endOfLocalDayIso(form.expiresAt);
  const maxUses = optionalInt(form.maxUses);
  const maxUsesPerUser = optionalInt(form.maxUsesPerUser);
  if (maxUses !== null) body.maxUses = maxUses;
  if (maxUsesPerUser !== null) body.maxUsesPerUser = maxUsesPerUser;
  if (productIds.length > 0) body.applicableProductIds = productIds;
  return body;
}

/**
 * Estado visible de un cupon para StatusBadge: inactivo, expirado o activo.
 * @param {object} coupon CouponDTO.
 * @returns {'active'|'inactive'|'expired'}
 */
export function couponStatus(coupon) {
  if (!coupon.isActive) return 'inactive';
  if (!coupon.isPermanent && coupon.expiresAt && Date.parse(coupon.expiresAt) <= Date.now()) return 'expired';
  return 'active';
}

/**
 * Texto del descuento: porcentaje o monto fijo (cupones heredados de tipo 'fixed').
 * @param {object} coupon
 * @param {(n: number) => string} formatMoney
 */
export function couponDiscountLabel(coupon, formatMoney) {
  if (coupon.discountType === 'percentage') return `${coupon.discountPercent}%`;
  return formatMoney(coupon.discountValue);
}
