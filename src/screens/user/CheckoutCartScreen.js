/**
 * Caja (rol user): lineas del carrito con cantidad editable, descuentos e IVA
 * por linea, avisos de inventario y resumen del pedido. Escritorio: lista a
 * la izquierda (flex 2) y resumen a la derecha (flex 1); movil: resumen debajo.
 */
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  Card,
  EmptyState,
  ErrorBanner,
  InfoModal,
  LoadingState,
  ScreenContainer,
  SectionTitle,
} from '../../components';
import { colors, radius, spacing, typography } from '../../config/theme';
import { useCart } from '../../context/CartContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useNavigation } from '../../navigation/NavigationContext';
import { ROUTES } from '../../navigation/routes';
import CartLineItem from './components/CartLineItem';
import OrderSummary from './components/OrderSummary';
import { stockMessage } from './components/checkoutHelpers';

/** Resumen fijo al hacer scroll (solo web; en nativo no existe position sticky). */
const STICKY_WEB = Platform.OS === 'web' ? { position: 'sticky', top: spacing.lg } : null;

/**
 * Texto de un problema del carrito (cart.issues).
 * @param {{ code: string, requested?: number, availableStock?: number }} issue
 * @param {string} name Nombre del producto.
 */
function issueText(issue, name) {
  if (issue.code === 'INSUFFICIENT_STOCK') {
    return `${name}: Solicitaste ${issue.requested}, solo hay ${issue.availableStock} disponibles`;
  }
  if (issue.code === 'PRODUCT_UNAVAILABLE') return `${name}: el producto ya no esta disponible`;
  return `${name}: ${issue.code}`;
}

export default function CheckoutCartScreen() {
  const { cart, isLoading, error, refreshCart, updateItem, removeItem } = useCart();
  const { navigate } = useNavigation();
  const { isDesktop } = useResponsiveLayout();
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null);
  const [actionError, setActionError] = useState(null);

  /* Recarga el carrito al montar para tener precios y stock al dia */
  useEffect(() => {
    refreshCart().catch(() => {});
    // Solo al montar.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Cambio de cantidad; 409 INSUFFICIENT_STOCK abre el modal informativo */
  const handleQuantity = async (productId, quantity) => {
    setBusyId(productId);
    setActionError(null);
    try {
      await updateItem(productId, quantity);
    } catch (err) {
      if (err && err.code === 'INSUFFICIENT_STOCK') {
        setModal({ title: 'Inventario insuficiente', message: stockMessage(err) });
      } else {
        setActionError((err && err.message) || 'No se pudo actualizar la cantidad.');
      }
    } finally {
      setBusyId(null);
    }
  };

  /* Quita una linea del carrito */
  const handleRemove = async (productId) => {
    setBusyId(productId);
    setActionError(null);
    try {
      await removeItem(productId);
    } catch (err) {
      setActionError((err && err.message) || 'No se pudo quitar el producto.');
    } finally {
      setBusyId(null);
    }
  };

  const items = (cart && cart.items) || [];
  const issues = (cart && cart.issues) || [];
  const hasIssues = issues.length > 0;

  /* Carga inicial */
  if (isLoading && !cart) {
    return (
      <ScreenContainer>
        <LoadingState label="Cargando tu carrito..." />
      </ScreenContainer>
    );
  }

  /* Carrito vacio */
  if (!error && items.length === 0) {
    return (
      <ScreenContainer>
        <SectionTitle title="Caja" />
        <EmptyState title="Tu carrito esta vacio" message="Agrega productos desde la tienda para continuar.">
          <AppButton title="Ir a la tienda" onPress={() => navigate(ROUTES.STORE)} />
        </EmptyState>
      </ScreenContainer>
    );
  }

  /* Nombre de producto por id (para los avisos de inventario) */
  const nameOf = (productId) => {
    const found = items.find((item) => item.productId === productId);
    return found ? found.name : 'Producto';
  };

  return (
    <ScreenContainer>
      <SectionTitle title="Caja" subtitle="Revisa tu pedido antes de pagar." />
      {error ? <ErrorBanner message={error.message || 'No se pudo cargar el carrito.'} /> : null}
      {actionError ? <ErrorBanner message={actionError} /> : null}

      {/* Problemas de inventario reportados por el backend */}
      {hasIssues ? (
        <View style={styles.issues} accessibilityRole="alert">
          <Text style={styles.issuesTitle}>Ajusta tu carrito antes de pagar:</Text>
          {issues.map((issue) => (
            <Text key={`${issue.productId}-${issue.code}`} style={styles.issueText}>
              {issueText(issue, nameOf(issue.productId))}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
        {/* Lista de lineas */}
        <View style={isDesktop ? styles.listDesktop : null}>
          <Card>
            {items.map((item) => (
              <CartLineItem
                key={item.productId}
                item={item}
                issue={issues.find((issue) => issue.productId === item.productId)}
                busy={busyId === item.productId}
                compact={!isDesktop}
                onChangeQuantity={(qty) => handleQuantity(item.productId, qty)}
                onRemove={() => handleRemove(item.productId)}
              />
            ))}
          </Card>
        </View>

        {/* Resumen y accion de pago */}
        <View style={isDesktop ? [styles.summaryDesktop, STICKY_WEB] : styles.summaryMobile}>
          <OrderSummary summary={cart && cart.summary} coupon={cart && cart.coupon}>
            <AppButton
              title="Proceder al pago"
              onPress={() => navigate(ROUTES.POS_PAYMENT)}
              disabled={items.length === 0 || hasIssues || busyId !== null}
              accessibilityLabel="Proceder al pago"
            />
            {hasIssues ? (
              <Text style={styles.blocked}>Corrige los avisos de inventario para continuar.</Text>
            ) : null}
            <View style={styles.gap} />
            <AppButton title="Seguir comprando" variant="secondary" onPress={() => navigate(ROUTES.STORE)} />
          </OrderSummary>
        </View>
      </View>

      {/* Modal de inventario insuficiente */}
      <InfoModal
        visible={modal !== null}
        title={modal ? modal.title : ''}
        message={modal ? modal.message : ''}
        variant="error"
        onClose={() => setModal(null)}
      />
    </ScreenContainer>
  );
}

/* Estilos de la caja */
const styles = StyleSheet.create({
  layout: {
    flexDirection: 'column',
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listDesktop: {
    flex: 2,
    marginRight: spacing.lg,
  },
  summaryDesktop: {
    flex: 1,
  },
  summaryMobile: {
    marginTop: spacing.lg,
  },
  issues: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  issuesTitle: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: typography.body,
    marginBottom: spacing.xs,
  },
  issueText: {
    color: colors.danger,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  blocked: {
    color: colors.danger,
    fontSize: typography.small,
    marginTop: spacing.sm,
  },
  gap: {
    height: spacing.sm,
  },
});
