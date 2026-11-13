/**
 * Subida de comprobantes de transferencia.
 *
 * El backend solo acepta `receiptUrl` https; no almacena archivos. Si
 * EXPO_PUBLIC_RECEIPT_UPLOAD_URL no esta configurada se lanza UPLOAD_NOT_CONFIGURED
 * y la pantalla debe pedir la URL https del comprobante de forma manual.
 */
import { Platform } from 'react-native';
import { RECEIPT_UPLOAD_URL } from '../config/env';
import { ApiError } from './apiClient';
import { isHttpsUrl } from '../utils/validators';

/** Agrega el archivo al FormData segun la plataforma (File en web, {uri,name,type} en nativo). */
function appendFile(form, file) {
  const name = file?.name || 'comprobante';
  const type = file?.mimeType || file?.type || 'application/octet-stream';
  if (Platform.OS === 'web' && file?.file) {
    form.append('file', file.file, name);
  } else {
    form.append('file', { uri: file?.uri, name, type });
  }
}

/**
 * Sube el comprobante y devuelve su URL https.
 * @param {{ uri: string, name?: string, mimeType?: string, file?: Blob }} file Asset de expo-document-picker.
 * @returns {Promise<string>}
 */
export async function uploadReceipt(file) {
  if (!RECEIPT_UPLOAD_URL) {
    throw new ApiError({
      status: 0,
      code: 'UPLOAD_NOT_CONFIGURED',
      message: 'La subida de archivos no esta configurada. Ingresa la URL https del comprobante.',
    });
  }
  const form = new FormData();
  appendFile(form, file);
  let response;
  try {
    response = await fetch(RECEIPT_UPLOAD_URL, { method: 'POST', body: form });
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'No se pudo subir el comprobante.' });
  }
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  // Acepta respuestas { url }, { secure_url } o { data: { url } }.
  const url = body?.url || body?.secure_url || body?.data?.url;
  if (!response.ok || !isHttpsUrl(url)) {
    throw new ApiError({
      status: response.status,
      code: 'UPLOAD_FAILED',
      message: 'No se pudo obtener una URL https del comprobante.',
      body,
    });
  }
  return url;
}

export default { uploadReceipt };
