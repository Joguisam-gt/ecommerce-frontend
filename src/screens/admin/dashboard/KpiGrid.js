/**
 * Rejilla de indicadores (KpiCard): una fila con ajuste en escritorio y dos columnas en movil.
 * La reutilizan el dashboard y los reportes.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { KpiCard } from '../../../components';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { spacing } from '../../../config/theme';

/**
 * @param {{ items: { key: string, label: string, value: string, hint?: string,
 *   tone?: 'default'|'success'|'danger' }[] }} props
 */
export function KpiGrid({ items = [] }) {
  const { isDesktop } = useResponsiveLayout();
  // Escritorio: todas en fila (ancho minimo para que hagan wrap); movil: dos por fila.
  const itemStyle = isDesktop ? styles.itemDesktop : styles.itemMobile;
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.key} style={itemStyle}>
          <KpiCard label={item.label} value={item.value} hint={item.hint} tone={item.tone || 'default'} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs, marginBottom: spacing.md },
  itemDesktop: { flexGrow: 1, flexBasis: 0, minWidth: 170, padding: spacing.xs },
  itemMobile: { width: '50%', padding: spacing.xs },
});

export default KpiGrid;
