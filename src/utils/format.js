/**
 * Utilidades de formato para importes, porcentajes, numeros y fechas.
 * Se implementan a mano para no depender del soporte Intl de cada plataforma.
 */

/** Agrega separadores de miles a la parte entera. */
function groupThousands(integerPart) {
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formatea un importe en quetzales: 1234.5 -> "Q 1,234.50".
 * @param {number|string|null|undefined} amount
 * @returns {string}
 */
export function formatMoney(amount) {
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  const [integerPart, decimals] = Math.abs(safe).toFixed(2).split('.');
  const sign = safe < 0 ? '-' : '';
  return `${sign}Q ${groupThousands(integerPart)}.${decimals}`;
}

/**
 * Formatea un porcentaje entero o decimal: 15 -> "15%", 12.5 -> "12.5%".
 * @param {number|string|null|undefined} n
 * @returns {string}
 */
export function formatPercent(n) {
  const value = Number(n);
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(safe * 100) / 100;
  return `${rounded}%`;
}

/** Rellena con ceros a la izquierda hasta 2 digitos. */
function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Convierte un valor ISO/Date a Date valida o null. */
function toValidDate(iso) {
  if (iso === null || iso === undefined || iso === '') return null;
  const date = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formatea una fecha ISO en hora local: "2026-11-12T14:05:00Z" -> "12/11/2026".
 * Devuelve '-' si la fecha no es valida.
 * @param {string|Date|null|undefined} iso
 * @returns {string}
 */
export function formatDate(iso) {
  const date = toValidDate(iso);
  if (!date) return '-';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/**
 * Formatea fecha y hora local: -> "12/11/2026 14:05". Devuelve '-' si no es valida.
 * @param {string|Date|null|undefined} iso
 * @returns {string}
 */
export function formatDateTime(iso) {
  const date = toValidDate(iso);
  if (!date) return '-';
  return `${formatDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Formatea un numero con separador de miles y hasta 2 decimales: 1234.5 -> "1,234.5".
 * @param {number|string|null|undefined} n
 * @returns {string}
 */
export function formatNumber(n) {
  const value = Number(n);
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(Math.abs(safe) * 100) / 100;
  const [integerPart, decimals] = String(rounded).split('.');
  const sign = safe < 0 && rounded !== 0 ? '-' : '';
  return `${sign}${groupThousands(integerPart)}${decimals ? `.${decimals}` : ''}`;
}
