/**
 * Grafico de barras horizontales hecho con View nativos: cada barra tiene un
 * ancho proporcional al maximo de la serie. Sin librerias de graficos.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../config/theme';
import { formatNumber } from '../utils/format';

/** Color de relleno segun el tono. */
const TONE_COLORS = { primary: colors.primary, success: colors.success, danger: colors.danger };

/**
 * @param {{ data: { label: string, value: number }[], formatValue?: (v: number) => string,
 *   tone?: 'primary'|'success'|'danger', emptyMessage?: string, style?: object }} props
 */
export function BarChart({ data = [], formatValue = formatNumber, tone = 'primary', emptyMessage = 'Sin datos', style }) {
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    return <Text style={styles.empty}>{emptyMessage}</Text>;
  }
  // Escala por el maximo (valores negativos o invalidos cuentan como 0).
  const values = rows.map((row) => {
    const n = Number(row.value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  });
  const max = Math.max(...values, 0);
  const fill = TONE_COLORS[tone] || TONE_COLORS.primary;
  return (
    <View style={[styles.container, style]} accessibilityRole="summary">
      {rows.map((row, index) => {
        const percent = max > 0 ? (values[index] / max) * 100 : 0;
        const formatted = formatValue(Number(row.value) || 0);
        return (
          <View
            key={`${row.label}-${index}`}
            style={styles.row}
            accessible
            accessibilityLabel={`${row.label}: ${formatted}`}
          >
            <Text style={styles.label} numberOfLines={2}>
              {row.label}
            </Text>
            {/* Pista de fondo y barra solida proporcional. */}
            <View style={styles.track}>
              {percent > 0 ? <View style={[styles.bar, { width: `${percent}%`, backgroundColor: fill }]} /> : null}
            </View>
            <Text style={styles.value} numberOfLines={1}>
              {formatted}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { rowGap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm },
  label: { width: '30%', fontSize: typography.small, color: colors.textPrimary },
  track: {
    flex: 1,
    height: 18,
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: radius.sm },
  value: { minWidth: 72, textAlign: 'right', fontSize: typography.small, fontWeight: '600', color: colors.textPrimary },
  empty: { fontSize: typography.body, color: colors.textSecondary, paddingVertical: spacing.md },
});

export default BarChart;
