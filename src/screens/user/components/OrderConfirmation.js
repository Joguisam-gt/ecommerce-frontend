/**
 * Confirmacion de pedido creado: numero de orden, estado, total y metodo de
 * pago. Para transferencias explica que la orden queda pendiente de
 * verificacion por un administrador.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Card } from '../../../components';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../../config/constants';
import { colors, radius, spacing, typography } from '../../../config/theme';
import { formatMoney } from '../../../utils/format';
import { orderStatusLabel } from './checkoutHelpers';

/**
 * Fila etiqueta / valor.
 * @param {{ label: string, value: string }} props
 */
function DetailRow({ label, value }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/**
 * @param {{ order: object, onGoStore: () => void, onGoDashboard: () => void }} props
 */
export default function OrderConfirmation({ order, onGoStore, onGoDashboard }) {
  const method = (order && order.payment && order.payment.method) || '';
  const isTransfer = method === PAYMENT_METHODS.BANK_TRANSFER;
  const total = order && order.totals ? order.totals.grandTotal : 0;
  const card = order && order.payment && order.payment.card;

  return (
    <Card style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Pedido registrado
      </Text>
      <Text style={styles.subtitle}>Gracias por tu compra.</Text>

      {/* Datos principales del pedido */}
      <DetailRow label="Numero de orden" value={String((order && order.orderNumber) || '-')} />
      <DetailRow label="Estado" value={`${orderStatusLabel(order && order.status)} (${(order && order.status) || '-'})`} />
      <DetailRow label="Total" value={formatMoney(total)} />
      <DetailRow label="Metodo de pago" value={PAYMENT_METHOD_LABELS[method] || method || '-'} />
      {card ? <DetailRow label="Tarjeta" value={`${card.brand} terminada en ${card.last4}`} /> : null}

      {/* Aviso especifico de transferencia */}
      {isTransfer ? (
        <View style={styles.notice} accessibilityRole="alert">
          <Text style={styles.noticeText}>
            Tu orden quedo en estado pending_verification (pendiente de verificacion). Un administrador validara tu
            comprobante.
          </Text>
        </View>
      ) : null}

      {/* Navegacion posterior */}
      <View style={styles.actions}>
        <View style={styles.action}>
          <AppButton title="Volver a la tienda" onPress={onGoStore} />
        </View>
        <View style={styles.action}>
          <AppButton title="Mi panel" variant="secondary" onPress={onGoDashboard} />
        </View>
      </View>
    </Card>
  );
}

/* Estilos de la confirmacion */
const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.success,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  rowValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notice: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  noticeText: {
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
    marginHorizontal: -spacing.xs,
  },
  action: {
    flexGrow: 1,
    flexBasis: 180,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
});
