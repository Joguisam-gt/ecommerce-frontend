/**
 * Encabezado global responsivo: nombre de la tienda (vuelve a Store), etiqueta del
 * rol y acciones segun el rol (Carrito y Mi panel para user, Panel Admin, Panel
 * Superusuario, Iniciar o Cerrar sesion). En movil se compacta en dos filas.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../config/theme';
import { ROLE_LABELS, ROLES } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../navigation/NavigationContext';
import { ROUTES } from '../navigation/routes';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/** Nombre visible de la tienda. */
const STORE_NAME = 'Tienda en linea';

/** Boton compacto del encabezado (area tactil >= 44px). */
function HeaderAction({ label, onPress, primary = false, accessibilityLabel, disabled = false }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.action, primary && styles.actionPrimary]}
    >
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Encabezado global de la aplicacion. */
export function AppHeader() {
  const { role, isAuthenticated, logout, user } = useAuth();
  const { totalItemsCount } = useCart();
  const { navigate, reset, route } = useNavigation();
  const { isMobile, contentMaxWidth, gutter } = useResponsiveLayout();
  const [loggingOut, setLoggingOut] = useState(false);

  /** Cierra la sesion y vuelve al login. */
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      reset(ROUTES.LOGIN);
    }
  };

  /** Navega solo si no se esta ya en esa ruta. */
  const go = (name) => {
    if (route.name !== name) navigate(name);
  };

  // Acciones visibles segun el rol.
  const actions = [];
  if (role === ROLES.USER) {
    actions.push(
      <HeaderAction
        key="cart"
        label={`Carrito (${totalItemsCount})`}
        accessibilityLabel={`Carrito con ${totalItemsCount} articulos`}
        onPress={() => go(ROUTES.CHECKOUT_CART)}
      />,
      <HeaderAction key="dashboard" label="Mi panel" onPress={() => go(ROUTES.USER_DASHBOARD)} />,
    );
  }
  if (role === ROLES.ADMIN) {
    actions.push(<HeaderAction key="admin" label="Panel Admin" onPress={() => go(ROUTES.ADMIN_PANEL)} />);
  }
  if (role === ROLES.SUPERUSER) {
    actions.push(
      <HeaderAction key="superuser" label="Panel Superusuario" onPress={() => go(ROUTES.SUPERUSER_PANEL)} />,
    );
  }
  actions.push(
    isAuthenticated ? (
      <HeaderAction
        key="logout"
        label={loggingOut ? 'Cerrando...' : 'Cerrar sesion'}
        onPress={handleLogout}
        disabled={loggingOut}
      />
    ) : (
      <HeaderAction key="login" label="Iniciar sesion" primary onPress={() => reset(ROUTES.LOGIN)} />
    ),
  );

  const roleLabel = ROLE_LABELS[role] || ROLE_LABELS.guest;
  const identity = user?.firstName ? `${user.firstName} - ${roleLabel}` : roleLabel;

  return (
    <View style={styles.bar} accessibilityRole="header">
      <View
        style={[
          styles.inner,
          { maxWidth: contentMaxWidth, paddingHorizontal: gutter },
          isMobile ? styles.innerMobile : styles.innerDesktop,
        ]}
      >
        {/* Marca y rol. */}
        <View style={styles.brandRow}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel={`${STORE_NAME}, ir al catalogo`}
            onPress={() => go(ROUTES.STORE)}
            style={styles.brand}
          >
            <Text style={styles.brandText} numberOfLines={1}>
              {STORE_NAME}
            </Text>
          </TouchableOpacity>
          <View style={styles.rolePill}>
            <Text style={styles.roleText} numberOfLines={1}>
              {identity}
            </Text>
          </View>
        </View>
        {/* Acciones (en movil pasan a una segunda fila y se ajustan). */}
        <View style={[styles.actions, isMobile && styles.actionsMobile]}>{actions}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inner: { width: '100%', alignSelf: 'center', paddingVertical: spacing.sm },
  innerDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  innerMobile: { flexDirection: 'column', rowGap: spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, columnGap: spacing.sm },
  brand: { minHeight: MIN_TOUCH_SIZE, justifyContent: 'center', flexShrink: 1 },
  brandText: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  rolePill: {
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexShrink: 1,
  },
  roleText: { fontSize: typography.small, color: colors.textSecondary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  actionsMobile: { justifyContent: 'flex-start' },
  action: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary },
  actionTextPrimary: { color: colors.onPrimary },
});

export default AppHeader;
