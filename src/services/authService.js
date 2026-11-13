/**
 * Servicio de autenticacion: login, logout y restauracion de sesion por cookie de refresh.
 */
import { apiClient, refreshSession, setAccessToken } from './apiClient';

/**
 * Inicia sesion. Sin refresh automatico: un 401 aqui significa credenciales invalidas.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ user: object, accessToken: string }>}
 */
export async function login({ email, password }) {
  const response = await apiClient.post(
    '/auth/login',
    { email: String(email).trim(), password },
    { skipAuthRefresh: true },
  );
  const { user, accessToken } = response?.data ?? {};
  setAccessToken(accessToken ?? null);
  return { user, accessToken };
}

/** Cierra la sesion en el servidor; el token local se limpia siempre, falle o no la llamada. */
export async function logout() {
  try {
    await apiClient.post('/auth/logout', undefined);
  } catch {
    // Si el servidor no responde, la sesion local se limpia igualmente.
  } finally {
    setAccessToken(null);
  }
}

/**
 * Intenta restaurar la sesion con la cookie de refresh.
 * @returns {Promise<object|null>} usuario o null si no hay sesion valida (no lanza en 401).
 */
export async function restoreSession() {
  try {
    const data = await refreshSession();
    return data?.user ?? null;
  } catch (error) {
    setAccessToken(null);
    // Sin sesion (401/400/403) se devuelve null; otros errores se propagan.
    if (error && [400, 401, 403].includes(error.status)) return null;
    throw error;
  }
}

export default { login, logout, restoreSession };
