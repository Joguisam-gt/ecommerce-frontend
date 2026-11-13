/**
 * Etiqueta de precio: precio original tachado (si hay descuento) y precio final en negrita.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../config/theme';
import { formatMoney } from '../utils/format';

/** Tamanos de fuente por variante de tamano. */
const SIZES = {
  sm: { final: typography.body, original: typography.small },
  md: { final: typography.subtitle, original: typography.small },
  lg: { final: typography.title, original: typography.body },
};

/** Normaliza alias de tamano ('small', 'medium', 'large'). */
function resolveSize(size) {
  const alias = { small: 'sm', medium: 'md', large: 'lg' };
  return SIZES[alias[size] || size] || SIZES.md;
}

/**
 * @param {{ originalPrice?: number, finalPrice: number, hasDiscount?: boolean,
 *   size?: 'sm'|'md'|'lg'|'small'|'medium'|'large' }} props
 */
export function PriceTag({ originalPrice, finalPrice, hasDiscount = false, size = 'md' }) {
  const sizes = resolveSize(size);
  const label = hasDiscount
    ? `Precio ${formatMoney(finalPrice)}, antes ${formatMoney(originalPrice)}`
    : `Precio ${formatMoney(finalPrice)}`;
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      {hasDiscount && originalPrice !== undefined && originalPrice !== null ? (
        <Text style={[styles.original, { fontSize: sizes.original }]}>{formatMoney(originalPrice)}</Text>
      ) : null}
      <Text style={[styles.final, { fontSize: sizes.final }, hasDiscount && styles.discounted]}>
        {formatMoney(finalPrice)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: spacing.sm },
  original: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  final: { color: colors.textPrimary, fontWeight: '700' },
  discounted: { color: colors.success },
});

export default PriceTag;
