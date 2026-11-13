/**
 * Estado vacio: titulo y mensaje centrados dentro de una tarjeta.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../config/theme';

/** @param {{ title: string, message?: string, children?: React.ReactNode }} props */
export function EmptyState({ title, message, children }) {
  return (
    <View style={styles.container} accessible accessibilityLabel={[title, message].filter(Boolean).join('. ')}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    rowGap: spacing.sm,
  },
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  message: { fontSize: typography.body, color: colors.textSecondary, textAlign: 'center' },
});

export default EmptyState;
