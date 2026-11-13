/**
 * Panel de administracion (marcador de la Parte B): lista los modulos previstos para este rol.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, ScreenContainer, SectionTitle } from '../../components';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, radius, spacing, typography } from '../../config/theme';

/** Modulos previstos para la Parte B. */
const MODULES = [
  { title: 'Conciliacion de transferencias', description: 'Verificar comprobantes y aprobar o rechazar pagos por transferencia.' },
  { title: 'Cupones', description: 'Crear, editar y desactivar cupones de descuento.' },
  { title: 'Inventario', description: 'Ajustes de stock y movimientos de inventario.' },
  { title: 'Compras', description: 'Registro de compras a proveedores.' },
  { title: 'Proveedores', description: 'Alta y mantenimiento de proveedores.' },
  { title: 'Clientes', description: 'Consulta y gestion de clientes.' },
  { title: 'Facturacion', description: 'Consulta, emision y anulacion de facturas.' },
  { title: 'Reportes', description: 'Ventas, inventario y desempeno de la tienda.' },
];

/** Pantalla marcador del panel. */
export default function AdminPanelScreen() {
  const { isDesktop } = useResponsiveLayout();
  return (
    <ScreenContainer>
      <SectionTitle title="Panel de administracion" subtitle="Gestion operativa de la tienda." />
      <Card>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Disponible en la Parte B</Text>
        </View>
        <Text style={styles.intro}>Modulos previstos:</Text>
        {/* Grilla de modulos: dos columnas en escritorio, una en movil. */}
        <View style={styles.grid}>
          {MODULES.map((module) => (
            <View key={module.title} style={[styles.module, isDesktop && styles.moduleDesktop]}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleText}>{module.description}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  notice: {
    alignSelf: 'flex-start',
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  noticeText: { fontSize: typography.small, fontWeight: '700', color: colors.textPrimary },
  intro: { fontSize: typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  module: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  moduleDesktop: { width: '48%', flexGrow: 1 },
  moduleTitle: { fontSize: typography.body, fontWeight: '700', color: colors.textPrimary },
  moduleText: { marginTop: spacing.xs, fontSize: typography.small, color: colors.textSecondary },
});
