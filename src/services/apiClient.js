/**
 * Cliente HTTP sobre fetch nativo.
 *
 * - Siempre envia cookies (credentials: 'include') y JSON.
 * - Normaliza los errores del backend en ApiError (code, status, details, body).
 * - Ante un 401 intenta UNA vez POST /auth/refresh (deduplicado entre peticiones
 *   concurrentes) y reintenta; si el refresh falla avisa al manejador registrado.
 * - El token de acceso vive solo en memoria y se envia como Bearer unicamente en
 *   plataformas nativas; en web la sesion depende de cookies HttpOnly.
 */
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/env';

/** Error normalizado de la API. */
export class ApiError extends Error {
  /**
   * @param {{ message?: string, status?: number, code?: string, details?: unknown, body?: unknown }} init
   */
  constructor({ message, status = 0, code = 'ERROR', details = undefined, body = undefined } = {}) {
    super(message || 'Ocurrio un error inesperado');
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.body = body;
  }
}

/** Codigos por defecto segun el estado HTTP cuando el cuerpo no trae uno. */
const DEFAULT_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  402: 'PAYMENT_DECLINED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  423: 'LOCKED',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
};

/** Mensajes por defecto segun el estado HTTP. */
const DEFAULT_MESSAGES = {
  400: 'La solicitud no es valida.',
  401: 'Tu sesion no es valida o ha expirado.',
  403: 'No tienes permisos para esta operacion.',
  404: 'El recurso solicitado no existe.',
  409: 'La operacion entra en conflicto con el estado actual.',
  422: 'No se pudo procesar la solicitud.',
  423: 'La cuenta esta bloqueada temporalmente.',
  429: 'Demasiados intentos. Espera un momento e intenta de nuevo.',
  503: 'El servicio no esta disponible en este momento.',
};

/** Rutas que nunca deben disparar un refresh automatico (evita bucles). */
const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/login'];

/** Estado interno del modulo (solo memoria, nunca persistido). */
let accessToken = null;
let unauthorizedHandler = null;
let refreshPromise = null;

/** Guarda (o limpia con null) el token de acceso en memoria. */
export function setAccessToken(token) {
  accessToken = token || null;
}

/** Registra la funcion a invocar cuando la sesion no se puede renovar. */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === 'function' ? fn : null;
}

/** Construye la URL completa con query params, omitiendo undefined, null y ''. */
function buildUrl(path, query) {
  const base = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return base;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.append(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Lee el cuerpo como JSON de forma tolerante (null si vacio o no JSON). */
async function readBody(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Traduce una respuesta de error del backend a ApiError. */
function toApiError(status, body) {
  let code;
  let message;
  let details;
  if (body && typeof body.error === 'object' && body.error !== null) {
    // Formato estandar: { error: { code, message, details } }
    ({ code, message, details } = body.error);
  } else if (body && typeof body.error === 'string') {
    // Formato de contrato: { error: 'INSUFFICIENT_STOCK', availableStock, productId, message }
    const { error, message: contractMessage, ...rest } = body;
    code = error;
    message = contractMessage;
    details = Object.keys(rest).length > 0 ? rest : undefined;
  }
  return new ApiError({
    status,
    code: code || DEFAULT_CODES[status] || (status >= 500 ? 'SERVER_ERROR' : 'ERROR'),
    message: message || DEFAULT_MESSAGES[status] || 'Ocurrio un error inesperado.',
    details,
    body,
  });
}

/** Ejecuta una peticion fetch cruda y devuelve { response, body } o lanza NETWORK_ERROR. */
async function rawRequest(method, path, body, opts = {}) {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json', ...(opts.headers || {}) };
  // En nativo se envia el Bearer; en web solo cuentan las cookies HttpOnly.
  if (Platform.OS !== 'web' && accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  let response;
  try {
    response = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor. Revisa tu conexion.',
      details: cause ? String(cause.message || cause) : undefined,
    });
  }
  return { response, body: await readBody(response) };
}

/**
 * Renueva la sesion con POST /auth/refresh. Las llamadas concurrentes comparten
 * la misma promesa. Devuelve el `data` de sesion ({ user, accessToken, expiresIn }).
 */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { response, body } = await rawRequest('POST', '/auth/refresh', undefined);
      if (!response.ok) throw toApiError(response.status, body);
      const data = body?.data ?? null;
      setAccessToken(data?.accessToken ?? null);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Peticion completa con normalizacion de errores y un unico reintento tras refresh. */
async function request(method, path, body, opts = {}) {
  const { response, body: data } = await rawRequest(method, path, body, opts);
  if (response.ok) return data;

  const canRefresh =
    response.status === 401 && !opts.skipAuthRefresh && !NO_REFRESH_PATHS.some((p) => path.startsWith(p));

  if (canRefresh) {
    try {
      await refreshSession();
    } catch {
      // La sesion no se pudo renovar: se limpia el token y se avisa a la app.
      setAccessToken(null);
      if (unauthorizedHandler) unauthorizedHandler();
      throw toApiError(response.status, data);
    }
    // Reintento unico; si vuelve a fallar se propaga el error sin nuevo refresh.
    const retry = await rawRequest(method, path, body, opts);
    if (retry.response.ok) return retry.body;
    throw toApiError(retry.response.status, retry.body);
  }

  throw toApiError(response.status, data);
}

/** API publica del cliente. opts = { query?, headers?, skipAuthRefresh? } */
export const apiClient = {
  /** GET path */
  get: (path, opts) => request('GET', path, undefined, opts),
  /** POST path con cuerpo JSON */
  post: (path, body, opts) => request('POST', path, body, opts),
  /** PATCH path con cuerpo JSON */
  patch: (path, body, opts) => request('PATCH', path, body, opts),
  /** DELETE path */
  del: (path, opts) => request('DELETE', path, undefined, opts),
};

export default apiClient;
