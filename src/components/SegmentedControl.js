/**
 * Control segmentado de seleccion unica (metodo de pago, marca, banco).
 * Se adapta en varias filas si no cabe en el ancho disponible.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../config/theme';

/**
 * @param {{ options: { label: string, value: any }[], value: any, onChange: Function,
 *   accessibilityLabel?: string, disabled?: boolean }} props
 */
export function SegmentedControl({ options = [], value, onChange, accessibilityLabel, disabled = false }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected, selected, disabled }}
            disabled={disabled}
            onPress={() => onChange && onChange(option.value)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  option: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: typography.body, color: colors.textPrimary },
  labelSelected: { color: colors.onPrimary, fontWeight: '600' },
});

export default SegmentedControl;
