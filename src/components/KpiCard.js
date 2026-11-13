/**
 * Tarjeta de indicador (KPI): etiqueta, valor destacado y pista opcional.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../config/theme';

/** Color del valor segun el tono. */
const TONE_COLORS = { default: colors.textPrimary, success: colors.success, danger: colors.danger };

/**
 * @param {{ label: string, value: string|number, hint?: string,
 *   tone?: 'default'|'success'|'danger', style?: object }} props
 */
export function KpiCard({ label, value, hint, tone = 'default', style }) {
  const color = TONE_COLORS[tone] || TONE_COLORS.default;
  return (
    <View
      style={[styles.card, tone !== 'default' && { borderLeftColor: color }, style]}
      accessible
      accessibilityLabel={[label, String(value ?? '-'), hint].filter(Boolean).join('. ')}
    >
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value === null || value === undefined || value === '' ? '-' : String(value)}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    rowGap: spacing.xs,
  },
  label: { fontSize: typography.small, color: colors.textSecondary, fontWeight: '600' },
  value: { fontSize: typography.title, fontWeight: '700' },
  hint: { fontSize: typography.small, color: colors.textSecondary },
});

export default KpiCard;
