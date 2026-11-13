/**
 * Banner de error: borde y texto en color danger sobre fondo surface.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../config/theme';

/** @param {{ message?: string, style?: object }} props */
export function ErrorBanner({ message, style }) {
  // Sin mensaje no se renderiza nada.
  if (!message) return null;
  return (
    <View style={[styles.banner, style]} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  text: { color: colors.danger, fontSize: typography.body },
});

export default ErrorBanner;
