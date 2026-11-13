/**
 * Visor del comprobante de transferencia: imagen grande si la URL apunta a una imagen,
 * o boton "Abrir comprobante" (Linking) para PDF y otros formatos.
 */
import React, { useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { AppButton, ErrorBanner } from '../../../components';
import { colors, radius, spacing, typography } from '../../../config/theme';

/** Extensiones que se muestran como imagen. */
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

/**
 * Indica si la URL termina en una extension de imagen (ignora query y fragmento).
 * @param {string} url
 */
export function isImageUrl(url) {
  if (typeof url !== 'string') return false;
  const path = url.split('#')[0].split('?')[0].toLowerCase();
  const match = path.match(/\.([a-z0-9]+)$/);
  return Boolean(match && IMAGE_EXTENSIONS.includes(match[1]));
}

/** @param {{ url?: string | null }} props */
export function ReceiptViewer({ url }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [openError, setOpenError] = useState('');

  // Abre el comprobante en el navegador o visor del sistema.
  const openReceipt = async () => {
    setOpenError('');
    try {
      await Linking.openURL(url);
    } catch (err) {
      setOpenError('No se pudo abrir el comprobante.');
    }
  };

  // Sin URL no hay nada que mostrar.
  if (!url) {
    return <Text style={styles.muted}>La orden no tiene comprobante adjunto.</Text>;
  }

  const showImage = isImageUrl(url) && !imageFailed;

  return (
    <View>
      {showImage ? (
        <View style={styles.imageBox}>
          <Image
            source={{ uri: url }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel="Comprobante de transferencia"
            onError={() => setImageFailed(true)}
          />
        </View>
      ) : (
        <Text style={styles.muted}>
          {imageFailed ? 'No se pudo cargar la imagen del comprobante.' : 'El comprobante es un documento (PDF u otro formato).'}
        </Text>
      )}
      <ErrorBanner message={openError} />
      <AppButton title="Abrir comprobante" variant="secondary" onPress={openReceipt} style={styles.button} />
      <Text style={styles.url} numberOfLines={2}>
        {url}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    marginBottom: spacing.md,
  },
  image: { width: '100%', height: 420 },
  muted: { color: colors.textSecondary, fontSize: typography.body, marginBottom: spacing.md },
  button: { marginBottom: spacing.sm },
  url: { color: colors.textSecondary, fontSize: typography.small },
});

export default ReceiptViewer;
