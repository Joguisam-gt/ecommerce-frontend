/**
 * Formulario de transferencia bancaria: cuentas oficiales de la empresa,
 * banco de origen, cuenta personal, monto, numero de autorizacion y
 * comprobante. El comprobante se intenta subir con receiptUploader; si la
 * subida no esta configurada se pide la URL https manual (el backend solo
 * acepta receiptUrl https).
 */
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTextInput, Card, SegmentedControl } from '../../../components';
import { BANKS } from '../../../config/constants';
import { colors, radius, spacing, typography } from '../../../config/theme';
import { uploadReceipt } from '../../../services/receiptUploader';
import { formatMoney } from '../../../utils/format';
import { isHttpsUrl } from '../../../utils/validators';
import CompanyBankAccounts from './CompanyBankAccounts';
import ReceiptDropZone from './ReceiptDropZone';
import { ACCOUNT_PATTERN, AUTHORIZATION_PATTERN, parseAmount } from './checkoutHelpers';

/** Opciones de banco de origen. */
const BANK_OPTIONS = BANKS.map((bank) => ({ label: bank, value: bank }));

/**
 * Estado inicial del formulario.
 * @param {number} grandTotal Total del carrito para prellenar el monto.
 */
export function initialTransfer(grandTotal) {
  return {
    bankName: BANKS[0],
    senderAccountNumber: '',
    transferAmount: grandTotal > 0 ? Number(grandTotal).toFixed(2) : '',
    authorizationNumber: '',
    file: null,
    uploadedUrl: '',
    manualUrl: '',
    manualUrlRequired: false,
  };
}

/**
 * URL final del comprobante: la subida o la manual.
 * @param {object} transfer
 */
export const receiptUrlOf = (transfer) => (transfer.uploadedUrl || transfer.manualUrl || '').trim();

/**
 * Valida el formulario; devuelve errores por campo.
 * @param {object} transfer
 * @returns {Record<string, string>}
 */
export function validateTransfer(transfer) {
  const errors = {};
  if (!BANKS.includes(transfer.bankName)) errors.bankName = 'Selecciona el banco de origen.';
  if (!ACCOUNT_PATTERN.test(transfer.senderAccountNumber.trim())) {
    errors.senderAccountNumber = 'Cuenta invalida: 4 a 34 digitos o guiones.';
  }
  if (parseAmount(transfer.transferAmount) === null) {
    errors.transferAmount = 'Monto invalido: mayor que 0 y con maximo 2 decimales.';
  }
  if (!AUTHORIZATION_PATTERN.test(transfer.authorizationNumber.trim())) {
    errors.authorizationNumber = 'Autorizacion invalida: 3 a 64 letras, numeros o guiones.';
  }
  if (!transfer.uploadedUrl) {
    if (transfer.manualUrlRequired) {
      if (!isHttpsUrl(transfer.manualUrl)) errors.manualUrl = 'Ingresa una URL https valida del comprobante.';
    } else {
      errors.receipt = 'Adjunta el comprobante de la transferencia.';
    }
  }
  return errors;
}

/**
 * @param {{ value: object, errors: Record<string, string>, grandTotal: number,
 *   companyBankAccounts: object[], disabled?: boolean,
 *   onChange: (patch: object) => void }} props
 */
export default function BankTransferForm({ value, errors, grandTotal, companyBankAccounts, disabled = false, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [fileError, setFileError] = useState(null);
  const amount = parseAmount(value.transferAmount);
  const amountMismatch = amount !== null && Math.round(amount * 100) !== Math.round(Number(grandTotal) * 100);

  /* Archivo elegido: lo guarda e intenta subirlo para obtener la URL https */
  const handleFile = useCallback(
    async (file) => {
      setFileError(null);
      setUploadMessage(null);
      onChange({ file, uploadedUrl: '' });
      setUploading(true);
      try {
        const url = await uploadReceipt(file);
        onChange({ uploadedUrl: url, manualUrlRequired: false });
        setUploadMessage('Comprobante subido correctamente.');
      } catch (err) {
        // Sin servicio de subida (u otro fallo): se pide la URL https manual.
        onChange({ manualUrlRequired: true });
        setUploadMessage(
          err && err.code === 'UPLOAD_NOT_CONFIGURED'
            ? 'La subida de archivos no esta disponible. El sistema solo acepta una URL https del comprobante: subelo a tu almacenamiento (por ejemplo, un enlace compartido) e ingresa el enlace abajo.'
            : 'No se pudo subir el comprobante. Ingresa una URL https del comprobante para continuar.',
        );
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  /* Error de tipo o tamano del archivo */
  const handleFileError = useCallback((message) => setFileError(message), []);

  return (
    <Card style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Transferencia bancaria
      </Text>
      <Text style={styles.hint}>
        Transfiere exactamente {formatMoney(grandTotal)} a una de estas cuentas y registra los datos del comprobante.
      </Text>

      {/* Cuentas oficiales de la empresa */}
      <CompanyBankAccounts accounts={companyBankAccounts} />

      {/* Banco de origen */}
      <Text style={styles.label}>Banco de origen</Text>
      <SegmentedControl options={BANK_OPTIONS} value={value.bankName} onChange={(bankName) => onChange({ bankName })} />
      {errors.bankName ? <Text style={styles.error}>{errors.bankName}</Text> : null}

      {/* Datos de la transferencia */}
      <View style={styles.fields}>
        <AppTextInput
          label="Numero de tu cuenta"
          value={value.senderAccountNumber}
          onChangeText={(text) => onChange({ senderAccountNumber: text.replace(/[^0-9-]/g, '') })}
          error={errors.senderAccountNumber}
          keyboardType="number-pad"
          maxLength={34}
        />
        <AppTextInput
          label="Monto transferido (Q)"
          value={value.transferAmount}
          onChangeText={(text) => onChange({ transferAmount: text.replace(/[^0-9.]/g, '') })}
          error={errors.transferAmount}
          keyboardType="decimal-pad"
          maxLength={14}
        />
        {amountMismatch && !errors.transferAmount ? (
          <Text style={styles.error}>El monto debe coincidir con el total del pedido: {formatMoney(grandTotal)}.</Text>
        ) : null}
        <AppTextInput
          label="Numero de autorizacion"
          value={value.authorizationNumber}
          onChangeText={(text) => onChange({ authorizationNumber: text.replace(/\s/g, '') })}
          error={errors.authorizationNumber}
          autoCapitalize="characters"
          maxLength={64}
        />
      </View>

      {/* Comprobante */}
      <ReceiptDropZone
        file={value.file}
        disabled={disabled || uploading}
        onFileSelected={handleFile}
        onError={handleFileError}
      />
      {uploading ? <Text style={styles.info}>Subiendo comprobante...</Text> : null}
      {fileError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {fileError}
        </Text>
      ) : null}
      {errors.receipt ? <Text style={styles.error}>{errors.receipt}</Text> : null}
      {uploadMessage ? (
        <View style={[styles.notice, value.uploadedUrl ? styles.noticeSuccess : null]}>
          <Text style={value.uploadedUrl ? styles.successText : styles.info}>{uploadMessage}</Text>
        </View>
      ) : null}

      {/* URL https manual cuando no hay servicio de subida */}
      {value.manualUrlRequired && !value.uploadedUrl ? (
        <AppTextInput
          label="URL https del comprobante"
          value={value.manualUrl}
          onChangeText={(text) => onChange({ manualUrl: text.trim() })}
          error={errors.manualUrl}
          keyboardType="url"
          autoCapitalize="none"
          placeholder="https://..."
          maxLength={2048}
        />
      ) : null}
    </Card>
  );
}

/* Estilos del formulario de transferencia */
const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fields: {
    marginTop: spacing.md,
  },
  error: {
    fontSize: typography.small,
    color: colors.danger,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  info: {
    fontSize: typography.small,
    color: colors.textSecondary,
  },
  successText: {
    fontSize: typography.small,
    color: colors.success,
    fontWeight: '600',
  },
  notice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeSuccess: {
    borderColor: colors.success,
  },
});
