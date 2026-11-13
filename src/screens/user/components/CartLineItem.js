/**
 * Linea del carrito en la caja: imagen, nombre, SKU, cantidad editable,
 * boton quitar, precio unitario (con tachado si hay descuento), descuento,
 * IVA aplicado y total de la linea.
 */
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QuantitySelector } from '../../../components';
import { colors, radius, spacing, typography } from '../../../config/theme';
import { formatMoney, formatPercent } from '../../../utils/format';

/**
 * @param {{ item: object, issue?: object, busy?: boolean, compact?: boolean,
 *   onChangeQuantity: (qty: number) => void, onRemove: () => void }} props
 */
export default function CartLineItem({ item, issue, busy = false, compact = false, onChangeQuantity, onRemove }) {
  const hasDiscount = Number(item.discountPercent) > 0;
  const maxQuantity = Math.max(1, Number(item.availableStock) || 1);

  return (
    <View style={styles.row} accessibilityLabel={`Producto ${item.name}`}>
      {/* Imagen o marcador neutro si no hay imagen */}
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel={`Imagen de ${item.name}`}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Nombre y SKU */}
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.meta}>SKU: {item.sku}</Text>

        {/* Precio unitario */}
        <View style={styles.priceRow}>
          {hasDiscount ? (
            <Text style={styles.strike} accessibilityLabel={`Precio original ${formatMoney(item.unitPrice)}`}>
              {formatMoney(item.unitPrice)}
            </Text>
          ) : null}
          <Text style={styles.unitFinal}>{formatMoney(item.unitFinalPrice)} c/u</Text>
        </View>

        {/* Descuento activo */}
        {hasDiscount ? (
          <Text style={styles.discount}>
            Descuento {formatPercent(item.discountPercent)}: -{formatMoney(item.discountTotal)}
          </Text>
        ) : null}

        {/* IVA aplicado en la linea */}
        <Text style={styles.meta}>
          IVA {formatPercent(item.taxRatePercent)}: {formatMoney(item.taxTotal)}
        </Text>

        {/* Problema de inventario de esta linea */}
        {issue ? (
          <Text style={styles.issue} accessibilityRole="alert">
            {issue.code === 'INSUFFICIENT_STOCK'
              ? `Solicitaste ${issue.requested}, solo hay ${issue.availableStock} disponibles`
              : 'Este producto ya no esta disponible'}
          </Text>
        ) : null}

        {/* Controles: cantidad, quitar y total */}
        <View style={[styles.controls, compact && styles.controlsCompact]}>
          <QuantitySelector value={item.quantity} min={1} max={maxQuantity} onChange={onChangeQuantity} disabled={busy} />
          <TouchableOpacity
            onPress={onRemove}
            disabled={busy}
            style={styles.removeButton}
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${item.name} del carrito`}
          >
            <Text style={styles.removeText}>Quitar</Text>
          </TouchableOpacity>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.total}>{formatMoney(item.grandTotal)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* Estilos de la linea */
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: typography.small,
    color: colors.textSecondary,
  },
  body: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  strike: {
    fontSize: typography.small,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: spacing.sm,
  },
  unitFinal: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  discount: {
    fontSize: typography.small,
    color: colors.success,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  issue: {
    fontSize: typography.small,
    color: colors.danger,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  controlsCompact: {
    justifyContent: 'space-between',
  },
  removeButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  removeText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: typography.body,
  },
  totalBox: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: typography.small,
    color: colors.textSecondary,
  },
  total: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
