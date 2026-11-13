/**
 * Utilidades de formato para importes y porcentajes.
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
