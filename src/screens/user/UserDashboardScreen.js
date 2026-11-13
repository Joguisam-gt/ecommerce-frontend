/**
 * Panel del usuario (rol user): saludo, resumen del carrito y accesos
 * rapidos. En escritorio las tarjetas van en fila; en movil, en columna.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, ErrorBanner, ScreenContainer, SectionTitle } from '../../components';
import { colors, spacing, typography } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useNavigation } from '../../navigation/NavigationContext';
import { ROUTES } from '../../navigation/routes';
import { formatMoney } from '../../utils/format';
import { fullNameOf } from './components/checkoutHelpers';

/** Accesos rapidos del panel. */
const QUICK_LINKS = [
  { key: 'store', title: 'Tienda', description: 'Explora productos, ofertas y novedades.', route: ROUTES.STORE, label: 'Ir a la tienda' },
  { key: 'cart', title: 'Caja', description: 'Revisa cantidades, descuentos e IVA.', route: ROUTES.CHECKOUT_CART, label: 'Abrir caja' },
  { key: 'pay', title: 'Pagar', description: 'Contra entrega, tarjeta o transferencia.', route: ROUTES.POS_PAYMENT, label: 'Ir al pago' },
];

export default function UserDashboardScreen() {
  const { user } = useAuth();
  const { cart, totalItemsCount, isLoading, error, refreshCart } = useCart();
  const { navigate } = useNavigation();
  const { isDesktop } = useResponsiveLayout();
  const grandTotal = cart && cart.summary ? cart.summary.grandTotal : 0;
  const itemsCount = totalItemsCount || 0;

  /* Sincroniza el carrito al entrar al panel */
  useEffect(() => {
    refreshCart().catch(() => {});
    // Solo al montar.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Primer nombre para el saludo */
  const firstName = (user && user.firstName) || fullNameOf(user).split(' ')[0] || 'cliente';

  return (
    <ScreenContainer>
      <SectionTitle title={`Hola, ${firstName}`} subtitle="Este es tu panel de compras." />
      {error ? <ErrorBanner message={error.message || 'No se pudo cargar tu carrito.'} /> : null}

      <View style={[styles.cards, isDesktop && styles.cardsDesktop]}>
        {/* Resumen del carrito */}
        <Card style={[styles.card, isDesktop && styles.cardDesktop]}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            Tu carrito
          </Text>
          <Text style={styles.metric} accessibilityLabel={`${itemsCount} articulos en el carrito`}>
            {itemsCount} {itemsCount === 1 ? 'articulo' : 'articulos'}
          </Text>
          <Text style={styles.total}>{isLoading && !cart ? 'Cargando...' : formatMoney(grandTotal)}</Text>
          <Text style={styles.caption}>Total con descuentos e IVA</Text>
          <View style={styles.buttons}>
            <AppButton title="Ver carrito" onPress={() => navigate(ROUTES.CHECKOUT_CART)} disabled={itemsCount === 0} />
            <View style={styles.gap} />
            <AppButton title="Seguir comprando" variant="secondary" onPress={() => navigate(ROUTES.STORE)} />
          </View>
        </Card>

        {/* Accesos rapidos */}
        {QUICK_LINKS.map((link) => (
          <Card key={link.key} style={[styles.card, isDesktop && styles.cardDesktop]}>
            <Text style={styles.cardTitle} accessibilityRole="header">
              {link.title}
            </Text>
            <Text style={styles.description}>{link.description}</Text>
            <AppButton
              title={link.label}
              variant="secondary"
              onPress={() => navigate(link.route)}
              disabled={link.route === ROUTES.POS_PAYMENT && itemsCount === 0}
            />
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}

/* Estilos del panel */
const styles = StyleSheet.create({
  cards: {
    flexDirection: 'column',
  },
  cardsDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardDesktop: {
    flexGrow: 1,
    flexBasis: 240,
    marginHorizontal: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  metric: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  total: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  caption: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  buttons: {
    marginTop: spacing.sm,
  },
  gap: {
    height: spacing.sm,
  },
});
