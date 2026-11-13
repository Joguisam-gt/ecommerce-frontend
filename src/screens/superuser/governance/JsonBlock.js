/**
 * Bloque de solo lectura que muestra un valor como JSON formateado con fuente monoespaciada
 * dentro de un ScrollView (vertical y horizontal) para previousState, newState y metadata.
 */
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../config/theme';
import { toPrettyJson } from './auditLogHelpers';

/** Fuente monoespaciada por plataforma. */
const MONOSPACE = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

/**
 * @param {{ title: string, value: unknown, maxHeight?: number }} props
 */
export function JsonBlock({ title, value, maxHeight = 220 }) {
  const text = toPrettyJson(value);
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {/* Desplazamiento vertical anidado para textos largos; horizontal para lineas anchas. */}
      <ScrollView style={[styles.box, { maxHeight }]} nestedScrollEnabled>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator>
          <Text style={styles.code} selectable accessibilityLabel={`${title}: ${text}`}>
            {text}
          </Text>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  title: {
    fontSize: typography.small,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  box: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    padding: spacing.sm,
  },
  code: { fontFamily: MONOSPACE, fontSize: typography.small, color: colors.textPrimary },
});

export default JsonBlock;
