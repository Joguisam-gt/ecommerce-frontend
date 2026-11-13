/**
 * Servicio de configuracion global del superusuario (/superuser/settings).
 * Campos admitidos en el PATCH: defaultTaxRate (fraccion 0..1, max 4 decimales),
 * maintenanceMode (boolean) y companyBankAccounts (lista completa que REEMPLAZA la actual).
 */
import { apiClient } from '../apiClient';
import { toData } from '../pagedResponse';

/** GET /superuser/settings -> configuracion actual */
export async function getSettings() {
  return toData(await apiClient.get('/superuser/settings'));
}

/**
 * PATCH /superuser/settings. Enviar siempre la lista completa de companyBankAccounts
 * (cada cuenta: bankName, accountNumber, accountHolder, accountType, isActive?).
 * @param {{ defaultTaxRate?: number, maintenanceMode?: boolean, companyBankAccounts?: object[] }} body
 */
export async function updateSettings(body) {
  return toData(await apiClient.patch('/superuser/settings', body));
}

export default { getSettings, updateSettings };
