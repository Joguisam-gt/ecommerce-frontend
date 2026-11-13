/**
 * Contenedor de pagina del panel: titulo, subtitulo y acciones (a la derecha en
 * escritorio, debajo en movil) sobre ScreenContainer.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../config/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { ScreenContainer } from './ScreenContainer';

/**
 * @param {{ title: string, subtitle?: string, actions?: React.ReactNode,
 *   children: React.ReactNode, scroll?: boolean }} props
 */
export function AdminPage({ title, subtitle, actions, children, scroll = true }) {
  const { isDesktop } = useResponsiveLayout();
  return (
    <ScreenContainer scroll={scroll}>
      {/* Encabezado de la pagina. */}
      <View style={[styles.header, isDesktop ? styles.headerDesktop : styles.headerMobile]}>
        <View style={styles.titles}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actions ? <View style={[styles.actions, isDesktop && styles.actionsDesktop]}>{actions}</View> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  headerDesktop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', columnGap: spacing.lg },
  headerMobile: { flexDirection: 'column', rowGap: spacing.md },
  titles: { flexShrink: 1, rowGap: spacing.xs },
  title: { fontSize: typography.title, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: typography.body, color: colors.textSecondary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  actionsDesktop: { justifyContent: 'flex-end', flexShrink: 0 },
  body: { flex: 1 },
});

export default AdminPage;
