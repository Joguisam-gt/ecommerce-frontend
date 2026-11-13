/**
 * Titulo de seccion con subtitulo opcional.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../config/theme';

/** @param {{ title: string, subtitle?: string, style?: object }} props */
export function SectionTitle({ title, subtitle, style }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  title: { fontSize: typography.title, fontWeight: '700', color: colors.textPrimary },
  subtitle: { marginTop: spacing.xs, fontSize: typography.body, color: colors.textSecondary },
});

export default SectionTitle;
