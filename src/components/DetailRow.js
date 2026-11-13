/**
 * Fila de detalle etiqueta/valor: en fila en escritorio y apilada en movil.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../config/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * @param {{ label: string, value?: string|number|null, children?: React.ReactNode, style?: object }} props
 * Si hay children se muestran en lugar de `value`.
 */
export function DetailRow({ label, value, children, style }) {
  const { isDesktop } = useResponsiveLayout();
  const display = value === null || value === undefined || value === '' ? '-' : String(value);
  return (
    <View style={[styles.row, isDesktop ? styles.rowDesktop : styles.rowMobile, style]}>
      <Text style={[styles.label, isDesktop && styles.labelDesktop]}>{label}</Text>
      <View style={styles.valueBox}>
        {children !== undefined && children !== null ? children : <Text style={styles.value}>{display}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.muted },
  rowDesktop: { flexDirection: 'row', alignItems: 'flex-start', columnGap: spacing.lg },
  rowMobile: { flexDirection: 'column', rowGap: spacing.xs },
  label: { fontSize: typography.small, fontWeight: '600', color: colors.textSecondary },
  labelDesktop: { width: 200, flexShrink: 0 },
  valueBox: { flex: 1 },
  value: { fontSize: typography.body, color: colors.textPrimary },
});

export default DetailRow;
