/**
 * Selector del metodo de pago (contra entrega, tarjeta o transferencia)
 * basado en el SegmentedControl compartido.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SegmentedControl } from '../../../components';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../../config/constants';
import { colors, spacing, typography } from '../../../config/theme';

/** Textos por defecto si PAYMENT_METHOD_LABELS no trae alguno. */
const FALLBACK_LABELS = {
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: 'Contra entrega',
  [PAYMENT_METHODS.CARD]: 'Tarjeta',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Transferencia',
};

/** Opciones en el orden de presentacion. */
const OPTIONS = [PAYMENT_METHODS.CASH_ON_DELIVERY, PAYMENT_METHODS.CARD, PAYMENT_METHODS.BANK_TRANSFER].map(
  (value) => ({ value, label: (PAYMENT_METHOD_LABELS && PAYMENT_METHOD_LABELS[value]) || FALLBACK_LABELS[value] }),
);

/**
 * @param {{ value: string, onChange: (method: string) => void }} props
 */
export default function PaymentMethodSelector({ value, onChange }) {
  return (
    <View style={styles.wrapper} accessibilityLabel="Metodo de pago">
      <Text style={styles.label} accessibilityRole="header">
        Metodo de pago
      </Text>
      <SegmentedControl options={OPTIONS} value={value} onChange={onChange} />
    </View>
  );
}

/* Estilos del selector */
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
});
