/**
 * Reglas puras de la configuracion global (PATCH /superuser/settings, updateSettingsSchema del backend):
 * conversion porcentaje <-> fraccion de defaultTaxRate, validacion de companyBankAccounts, deteccion de
 * duplicados banco + numero y construccion del cuerpo con solo los campos modificados.
 */

/** Bancos admitidos (COMPANY_BANKS del backend). */
export const COMPANY_BANKS = ['G&T', 'Banco Industrial', 'Banrural', 'BAC'];

/** Tipos de cuenta admitidos (ALL_BANK_ACCOUNT_TYPES). */
export const ACCOUNT_TYPES = ['monetaria', 'ahorro'];

/** Maximo de cuentas (MAX_COMPANY_BANK_ACCOUNTS). */
export const MAX_COMPANY_BANK_ACCOUNTS = 20;

/** Numero de cuenta: digitos y guiones, 5 a 30 caracteres, empieza y termina en digito. */
export const ACCOUNT_NUMBER_PATTERN = /^[0-9][0-9-]{3,28}[0-9]$/;

/** Limites del titular (ACCOUNT_HOLDER_LIMITS). */
const HOLDER_MIN = 3;
const HOLDER_MAX = 120;

/** Contador para claves locales estables de las tarjetas de cuenta. */
let localKeySeed = 0;

/** Genera una clave local unica (no se envia al backend). */
function nextLocalKey() {
  localKeySeed += 1;
  return `acc-${localKeySeed}`;
}

/**
 * Fraccion (0.12) -> texto de porcentaje ("12").
 * @param {number} rate
 * @returns {string}
 */
export function fractionToPercentText(rate) {
  const value = Number(rate);
  if (!Number.isFinite(value)) return '';
  return String(Math.round(value * 10000) / 100);
}

/**
 * Valida el texto del porcentaje (0 a 100, maximo 2 decimales para no superar 4 decimales en la fraccion).
 * @param {string} text
 * @returns {{ fraction: number | null, error: string | null }}
 */
export function parsePercent(text) {
  const clean = String(text).trim().replace(',', '.');
  if (!clean) return { fraction: null, error: 'Campo obligatorio' };
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(clean)) {
    return { fraction: null, error: 'Usa un numero entre 0 y 100 con maximo 2 decimales' };
  }
  const percent = Number(clean);
  if (percent < 0 || percent > 100) return { fraction: null, error: 'Debe estar entre 0 y 100' };
  // Conversion entera para evitar errores de coma flotante (12.35 -> 0.1235).
  return { fraction: Math.round(percent * 100) / 10000, error: null };
}

/** Cuenta nueva vacia con valores por defecto. */
export function newAccount() {
  return {
    localKey: nextLocalKey(),
    bankName: COMPANY_BANKS[0],
    accountNumber: '',
    accountHolder: '',
    accountType: ACCOUNT_TYPES[0],
    isActive: true,
  };
}

/** Lista del backend -> lista editable con claves locales. */
export function toFormAccounts(accounts) {
  return (accounts || []).map((account) => ({
    localKey: nextLocalKey(),
    bankName: account.bankName,
    accountNumber: account.accountNumber || '',
    accountHolder: account.accountHolder || '',
    accountType: account.accountType,
    isActive: account.isActive !== false,
  }));
}

/** Cuenta editable -> forma exacta de bankAccountSchema (sin localKey). */
function toPayloadAccount(account) {
  return {
    bankName: account.bankName,
    accountNumber: account.accountNumber.trim(),
    accountHolder: account.accountHolder.trim(),
    accountType: account.accountType,
    isActive: Boolean(account.isActive),
  };
}

/** Clave de unicidad del backend: banco + numero sin guiones. */
export function bankAccountKey(account) {
  return `${account.bankName}|${String(account.accountNumber).trim().replace(/-/g, '')}`;
}

/**
 * Valida las cuentas: campos de cada una y duplicados banco + numero.
 * @param {Array<object>} accounts
 * @returns {{ byIndex: Record<number, Record<string, string>>, list: string | null }}
 */
export function validateAccounts(accounts) {
  const byIndex = {};
  const put = (index, field, message) => {
    byIndex[index] = { ...(byIndex[index] || {}), [field]: message };
  };
  const list = accounts.length > MAX_COMPANY_BANK_ACCOUNTS ? `Maximo ${MAX_COMPANY_BANK_ACCOUNTS} cuentas` : null;
  const seen = new Set();
  accounts.forEach((account, index) => {
    // Reglas por campo identicas a bankAccountSchema.
    if (!COMPANY_BANKS.includes(account.bankName)) put(index, 'bankName', 'Banco no admitido');
    const number = account.accountNumber.trim();
    if (!number) put(index, 'accountNumber', 'Campo obligatorio');
    else if (!ACCOUNT_NUMBER_PATTERN.test(number)) {
      put(index, 'accountNumber', 'Solo digitos y guiones (5 a 30), empieza y termina en digito');
    }
    const holder = account.accountHolder.trim();
    if (holder.length < HOLDER_MIN || holder.length > HOLDER_MAX) {
      put(index, 'accountHolder', `El titular debe tener entre ${HOLDER_MIN} y ${HOLDER_MAX} caracteres`);
    }
    if (!ACCOUNT_TYPES.includes(account.accountType)) put(index, 'accountType', 'Tipo no admitido');
    // Duplicado banco + numero (ignorando guiones), marcado en la segunda aparicion.
    if (number) {
      const key = bankAccountKey(account);
      if (seen.has(key)) put(index, 'accountNumber', 'Cuenta repetida: mismo banco y numero que otra de la lista');
      seen.add(key);
    }
  });
  return { byIndex, list };
}

/** Compara dos listas de cuentas ya normalizadas. */
function sameAccounts(a, b) {
  return JSON.stringify(a.map(toPayloadAccount)) === JSON.stringify(b.map(toPayloadAccount));
}

/**
 * Cuerpo del PATCH con SOLO los campos modificados. companyBankAccounts va completo si cambio
 * (el backend reemplaza la lista entera).
 * @param {{ defaultTaxRate: number, maintenanceMode: boolean, companyBankAccounts: object[] }} original
 * @param {{ taxPercent: string, maintenanceMode: boolean, accounts: object[] }} form
 * @returns {object} Cuerpo (vacio si no hay cambios).
 */
export function buildSettingsPatch(original, form) {
  const body = {};
  const { fraction } = parsePercent(form.taxPercent);
  if (fraction !== null && fraction !== Number(original.defaultTaxRate)) body.defaultTaxRate = fraction;
  if (Boolean(form.maintenanceMode) !== Boolean(original.maintenanceMode)) {
    body.maintenanceMode = Boolean(form.maintenanceMode);
  }
  const originalAccounts = toFormAccounts(original.companyBankAccounts);
  if (!sameAccounts(form.accounts, originalAccounts)) {
    body.companyBankAccounts = form.accounts.map(toPayloadAccount);
  }
  return body;
}

/**
 * Reparte los details de VALIDATION_ERROR del backend en errores del formulario.
 * Campos: defaultTaxRate, maintenanceMode, companyBankAccounts, companyBankAccounts[i].campo, _root.
 * @param {Record<string, string>} fieldMap Resultado de fieldErrorsFromApi.
 * @returns {{ taxPercent?: string, maintenanceMode?: string, list?: string, root?: string,
 *   byIndex: Record<number, Record<string, string>> }}
 */
export function mapSettingsDetails(fieldMap) {
  const result = { byIndex: {} };
  Object.entries(fieldMap).forEach(([field, message]) => {
    const match = /^companyBankAccounts\[(\d+)\](?:\.(\w+))?$/.exec(field);
    if (match) {
      const index = Number(match[1]);
      const key = match[2] || 'accountNumber';
      result.byIndex[index] = { ...(result.byIndex[index] || {}), [key]: message };
    } else if (field === 'defaultTaxRate') {
      // El servidor valida la fraccion (0 a 1); se aclara para no confundir con el porcentaje.
      result.taxPercent = `Rechazado por el servidor (fraccion de 0 a 1): ${message}`;
    }
    else if (field === 'maintenanceMode') result.maintenanceMode = message;
    else if (field === 'companyBankAccounts') result.list = message;
    else result.root = result.root ? `${result.root} ${message}` : message;
  });
  return result;
}
