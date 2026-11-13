/**
 * Etiqueta de estado solida: traduce estados de pedido, pago, factura, cupon y
 * cuenta a texto en espanol con color de fondo segun su naturaleza.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../config/theme';

/** Etiquetas en espanol por estado. */
export const STATUS_LABELS = {
  paid: 'Pagado',
  verified: 'Verificado',
  active: 'Activo',
  approved: 'Aprobado',
  confirmed: 'Confirmado',
  completed: 'Completado',
  delivered: 'Entregado',
  issued: 'Emitida',
  captured: 'Cobrado',
  cash_due: 'Cobro contra entrega',
  rejected: 'Rechazado',
  voided: 'Anulada',
  inactive: 'Inactivo',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
  expired: 'Vencido',
  declined: 'Declinado',
  failed: 'Fallido',
  pending: 'Pendiente',
  pending_verification: 'Pendiente de verificacion',
  pending_payment: 'Pendiente de pago',
  processing: 'En proceso',
  shipped: 'Enviado',
  refunded: 'Reembolsado',
  scheduled: 'Programado',
  draft: 'Borrador',
};

/** Estados con tono de exito. */
const SUCCESS = ['paid', 'verified', 'active', 'approved', 'confirmed', 'completed', 'delivered', 'issued', 'captured'];
/** Estados con tono de peligro. */
const DANGER = ['rejected', 'voided', 'inactive', 'cancelled', 'canceled', 'expired', 'declined', 'failed'];

/** Devuelve 'success' | 'danger' | 'neutral' para un estado. */
export function statusTone(status) {
  const key = String(status ?? '').toLowerCase();
  if (SUCCESS.includes(key)) return 'success';
  if (DANGER.includes(key)) return 'danger';
  return 'neutral';
}

/** Etiqueta legible de un estado (si no se conoce, se humaniza la clave). */
export function statusLabel(status) {
  if (status === true) return STATUS_LABELS.active;
  if (status === false) return STATUS_LABELS.inactive;
  const key = String(status ?? '').toLowerCase();
  if (STATUS_LABELS[key]) return STATUS_LABELS[key];
  if (!key) return '-';
  const text = key.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Paleta por tono (fondos solidos). */
const TONES = {
  success: { background: colors.success, border: colors.success, text: colors.onPrimary },
  danger: { background: colors.danger, border: colors.danger, text: colors.onPrimary },
  neutral: { background: colors.muted, border: colors.border, text: colors.textPrimary },
};

/**
 * @param {{ status: string|boolean, label?: string, style?: object }} props
 * Acepta booleanos (true = Activo, false = Inactivo) para campos isActive.
 */
export function StatusBadge({ status, label, style }) {
  let tone = statusTone(status);
  if (status === true) tone = 'success';
  if (status === false) tone = 'danger';
  const palette = TONES[tone];
  const text = label || statusLabel(status);
  return (
    <View
      style={[styles.badge, { backgroundColor: palette.background, borderColor: palette.border }, style]}
      accessible
      accessibilityLabel={`Estado: ${text}`}
    >
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: { fontSize: typography.small, fontWeight: '700' },
});

export default StatusBadge;
