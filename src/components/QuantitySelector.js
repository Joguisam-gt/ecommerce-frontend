/**
 * Selector de cantidad con botones de restar y sumar (44x44) y limites min/max.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../config/theme';

/**
 * @param {{ value: number, min?: number, max?: number, onChange: Function, disabled?: boolean }} props
 */
export function QuantitySelector({ value, min = 1, max, onChange, disabled = false }) {
  const current = Number(value) || 0;
  const hasMax = typeof max === 'number' && Number.isFinite(max);
  const canDecrease = !disabled && current > min;
  const canIncrease = !disabled && (!hasMax || current < max);

  /** Aplica un cambio respetando los limites. */
  const change = (delta) => {
    let next = current + delta;
    if (next < min) next = min;
    if (hasMax && next > max) next = max;
    if (next !== current && onChange) onChange(next);
  };

  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={`Cantidad ${current}`}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Disminuir cantidad"
        accessibilityState={{ disabled: !canDecrease }}
        disabled={!canDecrease}
        onPress={() => change(-1)}
        style={[styles.button, !canDecrease && styles.buttonDisabled]}
      >
        <Text style={[styles.symbol, !canDecrease && styles.symbolDisabled]}>-</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{current}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Aumentar cantidad"
        accessibilityState={{ disabled: !canIncrease }}
        disabled={!canIncrease}
        onPress={() => change(1)}
        style={[styles.button, !canIncrease && styles.buttonDisabled]}
      >
        <Text style={[styles.symbol, !canIncrease && styles.symbolDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  button: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: colors.muted },
  symbol: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  symbolDisabled: { color: colors.textSecondary },
  value: {
    minWidth: MIN_TOUCH_SIZE,
    textAlign: 'center',
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
  },
});

export default QuantitySelector;
