/**
 * Casilla de verificacion nativa con etiqueta y area tactil >= 44px.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../config/theme';

/**
 * @param {{ label: string, checked: boolean, onChange: (next: boolean) => void,
 *   disabled?: boolean, style?: object }} props
 */
export function Checkbox({ label, checked, onChange, disabled = false, style }) {
  const isChecked = Boolean(checked);
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: isChecked, disabled }}
      disabled={disabled}
      onPress={() => onChange && onChange(!isChecked)}
      activeOpacity={0.85}
      style={[styles.row, style]}
    >
      {/* Caja: rellena con color primario cuando esta marcada. */}
      <View
        style={[
          styles.box,
          isChecked && styles.boxChecked,
          disabled && styles.boxDisabled,
        ]}
      >
        {isChecked ? <Text style={styles.mark}>X</Text> : null}
      </View>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: MIN_TOUCH_SIZE, flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm },
  box: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxDisabled: { backgroundColor: colors.muted, borderColor: colors.border },
  mark: { color: colors.onPrimary, fontSize: typography.small, fontWeight: '700' },
  label: { flexShrink: 1, fontSize: typography.body, color: colors.textPrimary },
  labelDisabled: { color: colors.textSecondary },
});

export default Checkbox;
