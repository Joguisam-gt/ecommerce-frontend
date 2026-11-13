/**
 * Boton principal de la app con variantes solidas, estado de carga y area tactil >= 44px.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../config/theme';

/** Colores por variante (todos solidos). */
const VARIANTS = {
  primary: { background: colors.primary, border: colors.primary, text: colors.onPrimary },
  secondary: { background: colors.surface, border: colors.border, text: colors.textPrimary },
  danger: { background: colors.danger, border: colors.danger, text: colors.onPrimary },
};

/** Estilo aplicado cuando el boton esta deshabilitado (sin opacidad). */
const DISABLED = { background: colors.muted, border: colors.border, text: colors.textSecondary };

/**
 * @param {{ title: string, onPress?: Function, variant?: 'primary'|'secondary'|'danger',
 *   disabled?: boolean, loading?: boolean, style?: object, accessibilityLabel?: string }} props
 */
export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
  testID,
}) {
  const isDisabled = disabled || loading;
  const palette = isDisabled ? DISABLED : VARIANTS[variant] || VARIANTS.primary;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.85}
      testID={testID}
      style={[styles.base, { backgroundColor: palette.background, borderColor: palette.border }, style]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.text, { color: palette.text }]} numberOfLines={2}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_SIZE,
    minWidth: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AppButton;
