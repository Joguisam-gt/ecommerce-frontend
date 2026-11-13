/**
 * Marco del panel de administracion y superusuario: menu lateral fijo (240px) en
 * escritorio y barra horizontal desplazable en movil. La seccion "Superusuario"
 * solo aparece para ese rol y las rutas de detalle resaltan su modulo padre.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../config/theme';
import { ROLES } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useNavigation } from './NavigationContext';
import { ADMIN_NAV_ITEMS, SUPERUSER_NAV_ITEMS, activeNavRoute } from './routes';

/** Ancho del menu lateral en escritorio. */
const SIDEBAR_WIDTH = 240;

/** Elemento del menu (area tactil >= 44px). */
function NavItem({ item, active, onPress, compact }) {
  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.item, compact && styles.itemCompact, active && styles.itemActive]}
    >
      <Text style={[styles.itemText, active && styles.itemTextActive]} numberOfLines={compact ? 1 : 2}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

/** @param {{ children: React.ReactNode }} props */
export function AdminShell({ children }) {
  const { role } = useAuth();
  const { route, navigate } = useNavigation();
  const { isDesktop } = useResponsiveLayout();
  const isSuperuser = role === ROLES.SUPERUSER;
  const active = activeNavRoute(route.name);

  // Secciones del menu segun el rol.
  const sections = [{ key: 'admin', title: 'Administracion', items: ADMIN_NAV_ITEMS }];
  if (isSuperuser) sections.push({ key: 'superuser', title: 'Superusuario', items: SUPERUSER_NAV_ITEMS });

  /** Navega al modulo salvo que ya este en esa misma ruta. */
  const go = (name) => {
    if (route.name !== name) navigate(name);
  };

  if (isDesktop) {
    return (
      <View style={styles.rowRoot}>
        <View style={styles.sidebar} accessibilityRole="menu" accessibilityLabel="Menu del panel">
          <ScrollView contentContainerStyle={styles.sidebarContent}>
            {sections.map((section) => (
              <View key={section.key} style={styles.section}>
                <Text style={styles.sectionTitle} accessibilityRole="header">
                  {section.title}
                </Text>
                {section.items.map((item) => (
                  <NavItem key={item.route} item={item} active={active === item.route} onPress={() => go(item.route)} />
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  // Movil: barra superior desplazable con todos los elementos (con separador por seccion).
  return (
    <View style={styles.columnRoot}>
      <View style={styles.topBar} accessibilityRole="menu" accessibilityLabel="Menu del panel">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topBarContent}>
          {sections.map((section, index) => (
            <View key={section.key} style={styles.topSection}>
              {index > 0 ? <View style={styles.divider} /> : null}
              {section.items.map((item) => (
                <NavItem
                  key={item.route}
                  item={item}
                  compact
                  active={active === item.route}
                  onPress={() => go(item.route)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowRoot: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  columnRoot: { flex: 1, flexDirection: 'column', backgroundColor: colors.background },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  sidebarContent: { padding: spacing.md, rowGap: spacing.lg },
  section: { rowGap: spacing.xs },
  sectionTitle: {
    fontSize: typography.small,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  content: { flex: 1 },
  item: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  itemCompact: { borderColor: colors.border },
  itemActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  itemText: { fontSize: typography.body, color: colors.textPrimary },
  itemTextActive: { color: colors.onPrimary, fontWeight: '700' },
  topBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topBarContent: { padding: spacing.sm, columnGap: spacing.sm, flexDirection: 'row' },
  topSection: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm },
  divider: { width: 1, height: 28, backgroundColor: colors.border },
});

export default AdminShell;
