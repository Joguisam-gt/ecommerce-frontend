/**
 * Resumen del pedido: subtotal, descuentos de producto, descuento de cupon,
 * IVA total y total general, tomados siempre de cart.summary (el backend
 * es la fuente de verdad de los importes).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { formatMoney, formatPercent } from '../../../utils/format';

/**
 * Fila etiqueta / importe del resumen.
 * @param {{ label: string, value: string, tone?: 'success' | 'strong' }} props
 */
function SummaryRow({ label, value, tone }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.label, tone === 'strong' && styles.strongLabel]}>{label}</Text>
      <Text
        style={[styles.value, tone === 'success' && styles.success, tone === 'strong' && styles.strongValue]}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * @param {{ summary: object | null, coupon?: object | null, taxRate?: number | null,
 *   title?: string, children?: React.ReactNode, style?: object }} props
 */
export default function OrderSummary({ summary, coupon, taxRate, title = 'Resumen del pedido', children, style }) {
  const data = summary || {};
  const couponApplied = coupon && coupon.applied;
  const couponDiscount = Number(data.couponDiscountTotal) || 0;
  const productDiscount = Number(data.productDiscountTotal) || 0;

  return (
    <Card style={style}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.items}>
        {data.totalItemsCount || 0} {data.totalItemsCount === 1 ? 'articulo' : 'articulos'}
      </Text>

      {/* Desglose de importes */}
      <SummaryRow label="Subtotal" value={formatMoney(data.subtotal || 0)} />
      {productDiscount > 0 ? (
        <SummaryRow label="Descuentos de producto" value={`-${formatMoney(productDiscount)}`} tone="success" />
      ) : null}
      {couponApplied || couponDiscount > 0 ? (
        <SummaryRow
          label={couponApplied ? `Cupon ${coupon.code}` : 'Descuento de cupon'}
          value={`-${formatMoney(couponDiscount)}`}
          tone="success"
        />
      ) : null}
      <SummaryRow
        label={typeof taxRate === 'number' ? `IVA (tasa vigente ${formatPercent(taxRate)})` : 'IVA total'}
        value={formatMoney(data.taxTotal || 0)}
      />

      <View style={styles.divider} />
      <SummaryRow label="Total general" value={formatMoney(data.grandTotal || 0)} tone="strong" />

      {/* Acciones adicionales (p. ej. boton de pago) */}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </Card>
  );
}

/* Estilos del resumen */
const styles = StyleSheet.create({
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  items: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: typography.body,
    color: colors.textSecondary,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  value: {
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  success: {
    color: colors.success,
  },
  strongLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: typography.subtitle,
  },
  strongValue: {
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  actions: {
    marginTop: spacing.lg,
  },
});
