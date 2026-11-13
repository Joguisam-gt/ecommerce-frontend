/**
 * Insignia solida de descuento ("-15%"): fondo success y texto blanco.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../config/theme';
import { formatPercent } from '../utils/format';

/** @param {{ percent: number, style?: object }} props */
export function DiscountBadge({ percent, style }) {
  // Sin descuento no se muestra nada.
  if (!percent || Number(percent) <= 0) return null;
  return (
    <View style={[styles.badge, style]} accessible accessibilityLabel={`Descuento de ${formatPercent(percent)}`}>
      <Text style={styles.text}>{`-${formatPercent(percent)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  text: { color: colors.onPrimary, fontSize: typography.small, fontWeight: '700' },
});

export default DiscountBadge;
