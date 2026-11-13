/**
 * Campo de texto con etiqueta, mensaje de error y area tactil >= 44px.
 */
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../config/theme';

/**
 * @param {{ label?: string, value: string, onChangeText: Function, error?: string,
 *   secureTextEntry?: boolean, keyboardType?: string, placeholder?: string,
 *   autoCapitalize?: string, maxLength?: number, multiline?: boolean }} props
 * Las props adicionales (onBlur, editable, autoComplete, etc.) se pasan al TextInput.
 */
export function AppTextInput({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  placeholder,
  autoCapitalize = 'sentences',
  maxLength,
  multiline = false,
  style,
  ...rest
}) {
  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        accessibilityLabel={label || placeholder}
        accessibilityHint={error || undefined}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, error ? styles.inputError : null]}
        {...rest}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontSize: typography.small,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: MIN_TOUCH_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  error: { marginTop: spacing.xs, fontSize: typography.small, color: colors.danger },
});

export default AppTextInput;
