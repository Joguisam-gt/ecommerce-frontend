/**
 * Indicador de carga centrado con texto opcional.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../config/theme';

/** @param {{ label?: string }} props */
export function LoadingState({ label = 'Cargando...' }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  label: { marginTop: spacing.md, color: colors.textSecondary, fontSize: typography.body },
});

export default LoadingState;
