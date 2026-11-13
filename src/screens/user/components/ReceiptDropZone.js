/**
 * Zona para adjuntar el comprobante de transferencia (imagen o PDF, max 5 MB).
 * Web: arrastrar y soltar sobre el nodo DOM que react-native-web expone en el
 * ref del View, mas boton "Seleccionar archivo". Movil: solo el boton, con
 * expo-document-picker.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AppButton } from '../../../components';
import { colors, radius, spacing, typography } from '../../../config/theme';
import { RECEIPT_PICKER_TYPES, formatFileSize, receiptFileError } from './checkoutHelpers';

/** true cuando se ejecuta en navegador. */
const IS_WEB = Platform.OS === 'web';

/**
 * Convierte un File del navegador al formato de asset de expo-document-picker.
 * @param {File} file
 */
function assetFromWebFile(file) {
  const createUrl = globalThis.URL && globalThis.URL.createObjectURL;
  return {
    name: file.name,
    size: file.size,
    mimeType: file.type,
    uri: createUrl ? globalThis.URL.createObjectURL(file) : '',
    file,
  };
}

/**
 * @param {{ file: object | null, disabled?: boolean,
 *   onFileSelected: (file: object) => void, onError: (message: string) => void }} props
 */
export default function ReceiptDropZone({ file, disabled = false, onFileSelected, onError }) {
  const zoneRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const callbacksRef = useRef({ onFileSelected, onError, disabled });

  /* Mantiene las callbacks al dia sin re-registrar los listeners */
  useEffect(() => {
    callbacksRef.current = { onFileSelected, onError, disabled };
  }, [onFileSelected, onError, disabled]);

  /* Valida y entrega el archivo elegido */
  const acceptFile = (asset) => {
    const message = receiptFileError(asset);
    if (message) {
      callbacksRef.current.onError(message);
      return;
    }
    callbacksRef.current.onFileSelected(asset);
  };

  /* Web: listeners nativos de drag and drop sobre el nodo DOM del View */
  useEffect(() => {
    if (!IS_WEB) return undefined;
    const node = zoneRef.current;
    if (!node || typeof node.addEventListener !== 'function') return undefined;

    const handleDragOver = (event) => {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      if (!callbacksRef.current.disabled) setDragging(true);
    };
    const handleDragLeave = (event) => {
      event.preventDefault();
      // Ignora la salida hacia un hijo de la misma zona.
      if (event.relatedTarget && typeof node.contains === 'function' && node.contains(event.relatedTarget)) return;
      setDragging(false);
    };
    const handleDrop = (event) => {
      event.preventDefault();
      setDragging(false);
      if (callbacksRef.current.disabled) return;
      const dropped = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (dropped) acceptFile(assetFromWebFile(dropped));
    };

    node.addEventListener('dragover', handleDragOver);
    node.addEventListener('dragleave', handleDragLeave);
    node.addEventListener('drop', handleDrop);
    return () => {
      node.removeEventListener('dragover', handleDragOver);
      node.removeEventListener('dragleave', handleDragLeave);
      node.removeEventListener('drop', handleDrop);
    };
    // acceptFile usa callbacksRef: los listeners se registran una sola vez.
  }, []);

  /* Abre el selector de archivos del sistema */
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: RECEIPT_PICKER_TYPES,
        multiple: false,
        copyToCacheDirectory: true,
        base64: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      acceptFile({
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
        uri: asset.uri,
        file: asset.file,
      });
    } catch (err) {
      callbacksRef.current.onError('No se pudo abrir el selector de archivos.');
    }
  };

  return (
    <View>
      <Text style={styles.label}>Comprobante de la transferencia (imagen o PDF, max 5 MB)</Text>
      <View
        ref={zoneRef}
        style={[styles.zone, dragging && styles.zoneActive]}
        accessibilityLabel="Zona para adjuntar el comprobante"
      >
        {/* Instrucciones segun plataforma */}
        <Text style={styles.instructions}>
          {IS_WEB ? 'Arrastra y suelta aqui tu comprobante, o' : 'Adjunta una foto o PDF de tu comprobante'}
        </Text>
        <AppButton title="Seleccionar archivo" variant="secondary" onPress={pickFile} disabled={disabled} />

        {/* Archivo elegido */}
        {file ? (
          <Text style={styles.fileInfo} accessibilityLiveRegion="polite">
            Archivo: {file.name} ({formatFileSize(file.size)})
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* Estilos de la zona de carga */
const styles = StyleSheet.create({
  label: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  zone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  zoneActive: {
    borderColor: colors.primary,
    borderStyle: 'solid',
    backgroundColor: colors.muted,
  },
  instructions: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  fileInfo: {
    fontSize: typography.small,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
