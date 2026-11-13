/**
 * Seccion de un reporte: titulo, KPIs, grafico de barras opcional y contenido (tabla).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart, Card } from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { KpiGrid } from '../dashboard/KpiGrid';

/**
 * @param {{ title: string, subtitle?: string, kpis?: object[],
 *   chart?: { title?: string, data: { label: string, value: number }[], formatValue?: Function, tone?: string },
 *   children?: React.ReactNode }} props
 */
export function ReportSection({ title, subtitle, kpis, chart, children }) {
  const hasChart = chart && Array.isArray(chart.data) && chart.data.length > 0;
  return (
    <Card style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* Indicadores de la seccion */}
      {kpis && kpis.length > 0 ? <KpiGrid items={kpis} /> : null}

      {/* Grafico de barras horizontales */}
      {hasChart ? (
        <View style={styles.chart}>
          {chart.title ? <Text style={styles.chartTitle}>{chart.title}</Text> : null}
          <BarChart data={chart.data} formatValue={chart.formatValue} tone={chart.tone} />
        </View>
      ) : null}

      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: typography.small, color: colors.textSecondary, marginTop: spacing.xs },
  chart: { marginVertical: spacing.md },
  chartTitle: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
});

export default ReportSection;
