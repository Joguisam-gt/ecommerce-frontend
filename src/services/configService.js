/**
 * Servicio de configuracion publica de la tienda (IVA por defecto y cuentas bancarias).
 */
import { apiClient } from './apiClient';

/**
 * GET /store/config/public
 * @returns {Promise<{ defaultTaxRate: number, companyBankAccounts: object[] }>}
 */
export async function getPublicConfig() {
  const response = await apiClient.get('/store/config/public');
  const data = response?.data ?? {};
  return {
    defaultTaxRate: data.defaultTaxRate,
    companyBankAccounts: Array.isArray(data.companyBankAccounts) ? data.companyBankAccounts : [],
  };
}

export default { getPublicConfig };
