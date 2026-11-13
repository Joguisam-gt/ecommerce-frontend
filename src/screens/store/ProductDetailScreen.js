/**
 * Detalle publico de un producto (params { productId }).
 * Muestra imagen, precios, IVA, valoracion, stock, metodos de pago y recogida en tienda, y permite
 * agregar al carrito solo a cuentas de cliente (rol 'user'). Gestiona el 409 INSUFFICIENT_STOCK
 * con un modal nativo y ajusta el selector de cantidad al stock disponible.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AppButton,
  Card,
  DiscountBadge,
  ErrorBanner,
  InfoModal,
  LoadingState,
  PriceTag,
  QuantitySelector,
  ScreenContainer,
} from '../../components';
import { PAYMENT_METHOD_LABELS, ROLES } from '../../config/constants';
import { colors, radius, spacing, typography } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useNavigation } from '../../navigation/NavigationContext';
import { ROUTES } from '../../navigation/routes';
import * as storeService from '../../services/storeService';
import { formatPercent } from '../../utils/format';
import AddedToCartModal from './components/AddedToCartModal';
import RetryableError from './components/RetryableError';

/** Cantidad maxima que acepta el carrito por linea. */
const MAX_QUANTITY = 999;

/** Mensaje exacto para el error de stock insuficiente segun las unidades disponibles. */
export function insufficientStockMessage(availableStock) {
  if (availableStock <= 0) return 'Este producto ya no tiene unidades disponibles en inventario';
  if (availableStock === 1) return 'Solo hay disponible 1 unidad en inventario';
  return `Solo hay disponibles ${availableStock} unidades en inventario`;
}

/** Obtiene availableStock de un ApiError (details normalizado o cuerpo crudo). */
function readAvailableStock(error) {
  const candidates = [
    error && error.details && error.details.availableStock,
    error && error.body && error.body.availableStock,
    error && error.body && error.body.error && error.body.error.details
      ? error.body.error.details.availableStock
      : undefined,
  ];
  const found = candidates.find((value) => value !== undefined && value !== null);
  const parsed = Number(found);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : null;
}

/** Fila etiqueta / valor de la ficha tecnica. */
function InfoRow({ label, value, valueStyle }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { route, navigate, goBack, canGoBack } = useNavigation();
  const { role, isGuest } = useAuth();
  const { addItem } = useCart();
  const { isDesktop } = useResponsiveLayout();
  const productId = route && route.params ? route.params.productId : undefined;

  // Estado de carga del producto
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Estado de la compra
  const [quantity, setQuantity] = useState(1);
  const [stockOverride, setStockOverride] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [stockModal, setStockModal] = useState({ visible: false, message: '', available: 0 });

  // Evita actualizar estado tras desmontar
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Carga el producto desde el catalogo publico
  const loadProduct = useCallback(async () => {
    if (!productId) {
      setLoadError('No se indico el producto a mostrar.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await storeService.getProduct(productId);
      if (!mountedRef.current) return;
      setProduct(data);
      setStockOverride(null);
      setQuantity(1);
    } catch (error) {
      if (!mountedRef.current) return;
      setLoadError(error && error.status === 404 ? 'El producto no existe o ya no esta disponible.' : (error && error.message) || 'No se pudo cargar el producto.');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Vuelve a la tienda usando la pila si es posible
  const handleBack = () => {
    if (canGoBack) goBack();
    else navigate(ROUTES.STORE);
  };

  // Stock efectivo: el reportado por el 409 tiene prioridad sobre el cargado
  const stock = stockOverride !== null ? stockOverride : Math.max(0, Number(product && product.stock) || 0);
  const maxQuantity = Math.min(stock, MAX_QUANTITY);
  const isOutOfStock = stock <= 0;

  // Agrega al carrito segun el rol del usuario
  const handleAddToCart = async () => {
    setActionError(null);
    setInfoMessage(null);
    if (isGuest || role === ROLES.GUEST) {
      navigate(ROUTES.LOGIN, { redirectTo: ROUTES.PRODUCT_DETAIL, redirectParams: { productId } });
      return;
    }
    if (role !== ROLES.USER) {
      setInfoMessage('La compra esta disponible solo para cuentas de cliente.');
      return;
    }
    setIsAdding(true);
    try {
      await addItem(productId, quantity);
      if (mountedRef.current) setSuccessVisible(true);
    } catch (error) {
      if (!mountedRef.current) return;
      if (error && error.status === 409 && error.code === 'INSUFFICIENT_STOCK') {
        const available = readAvailableStock(error);
        setStockModal({
          visible: true,
          message: available === null ? error.message : insufficientStockMessage(available),
          available: available === null ? stock : available,
        });
      } else if (error && error.status !== 401) {
        setActionError((error && error.message) || 'No se pudo agregar el producto al carrito.');
      }
    } finally {
      if (mountedRef.current) setIsAdding(false);
    }
  };

  // Cierra el modal de stock y ajusta el selector al maximo disponible
  const closeStockModal = () => {
    const available = stockModal.available;
    setStockModal({ visible: false, message: '', available: 0 });
    setStockOverride(available);
    setQuantity((current) => Math.max(1, Math.min(current, available, MAX_QUANTITY)));
  };

  // Cierra el modal de exito y navega al carrito
  const goToCart = () => {
    setSuccessVisible(false);
    navigate(ROUTES.CHECKOUT_CART);
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Cargando producto..." />
      </ScreenContainer>
    );
  }
  if (loadError || !product) {
    return (
      <ScreenContainer>
        <View style={styles.page}>
          <RetryableError message={loadError || 'No se pudo cargar el producto.'} onRetry={loadProduct} />
          <AppButton title="Volver a la tienda" variant="secondary" onPress={handleBack} />
        </View>
      </ScreenContainer>
    );
  }

  const rating = product.rating || { average: 0, count: 0 };
  const paymentMethods = Array.isArray(product.acceptedPaymentMethods) ? product.acceptedPaymentMethods : [];

  return (
    <ScreenContainer>
      <View style={styles.page}>
        <TouchableOpacity
          style={styles.backLink}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Volver a la tienda"
        >
          <Text style={styles.backLinkText}>Volver a la tienda</Text>
        </TouchableOpacity>

        <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
          {/* Imagen del producto con placeholder solido */}
          <View style={[styles.imageColumn, isDesktop && styles.imageColumnDesktop]}>
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.image}
                resizeMode="cover"
                accessibilityRole="image"
                accessibilityLabel={`Imagen de ${product.name}`}
              />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} accessibilityLabel="Producto sin imagen">
                <Text style={styles.placeholderText}>Sin imagen</Text>
              </View>
            )}
          </View>

          {/* Datos del producto y acciones de compra */}
          <View style={[styles.infoColumn, isDesktop && styles.infoColumnDesktop]}>
            <Text style={styles.category}>{product.category}</Text>
            <Text style={styles.name} accessibilityRole="header">
              {product.name}
            </Text>
            <Text style={styles.sku}>SKU: {product.sku}</Text>

            <View style={styles.priceRow}>
              <PriceTag
                originalPrice={product.originalPrice}
                finalPrice={product.finalPrice}
                hasDiscount={product.hasDiscount}
                size="large"
              />
              {product.hasDiscount ? <DiscountBadge percent={product.discountPercent} /> : null}
            </View>

            <Card style={styles.detailsCard}>
              <InfoRow label="IVA" value={formatPercent(product.taxRatePercent)} />
              <InfoRow
                label="Valoracion"
                value={`${Number(rating.average || 0).toFixed(1)} de 5 (${rating.count || 0} ${
                  rating.count === 1 ? 'resena' : 'resenas'
                })`}
              />
              <InfoRow
                label="Disponibilidad"
                value={isOutOfStock ? 'Agotado' : `En stock: ${stock} ${stock === 1 ? 'unidad' : 'unidades'}`}
                valueStyle={isOutOfStock ? styles.danger : styles.success}
              />
              <InfoRow
                label="Recogida"
                value={
                  product.pickupAvailable
                    ? 'Disponible para recoger en tienda'
                    : 'No disponible para recoger en tienda'
                }
                valueStyle={product.pickupAvailable ? styles.success : styles.textSecondary}
              />
              <InfoRow
                label="Metodos de pago"
                value={
                  paymentMethods.length
                    ? paymentMethods.map((method) => PAYMENT_METHOD_LABELS[method] || method).join(', ')
                    : 'No especificados'
                }
              />
            </Card>

            {product.description ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.sectionLabel}>Descripcion</Text>
                <Text style={styles.description}>{product.description}</Text>
              </View>
            ) : null}

            {/* Seleccion de cantidad y boton de compra */}
            <View style={styles.purchase}>
              {!isOutOfStock ? (
                <View style={styles.quantityRow}>
                  <Text style={styles.sectionLabel}>Cantidad</Text>
                  <QuantitySelector
                    value={quantity}
                    min={1}
                    max={maxQuantity}
                    onChange={(next) => setQuantity(Math.max(1, Math.min(next, maxQuantity)))}
                  />
                </View>
              ) : null}
              <AppButton
                title={isOutOfStock ? 'Agotado' : 'Agregar al Carrito'}
                onPress={handleAddToCart}
                loading={isAdding}
                disabled={isAdding || isOutOfStock}
              />
              {infoMessage ? (
                <View style={styles.infoNotice} accessibilityRole="alert">
                  <Text style={styles.infoNoticeText}>{infoMessage}</Text>
                </View>
              ) : null}
              {actionError ? <ErrorBanner message={actionError} /> : null}
            </View>

            <AppButton title="Volver a la tienda" variant="secondary" onPress={handleBack} />
          </View>
        </View>
      </View>

      <AddedToCartModal
        visible={successVisible}
        message={`Se agrego ${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} de ${product.name} a tu carrito.`}
        onContinue={() => setSuccessVisible(false)}
        onGoToCart={goToCart}
      />

      <InfoModal
        visible={stockModal.visible}
        variant="error"
        title="Stock insuficiente"
        message={stockModal.message}
        onClose={closeStockModal}
        actionLabel="Entendido"
      />
    </ScreenContainer>
  );
}

// Estilos del detalle de producto
const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  backLink: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backLinkText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    textDecorationLine: 'underline',
  },
  layout: {
    flexDirection: 'column',
    gap: spacing.xl,
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageColumn: {
    width: '100%',
  },
  imageColumnDesktop: {
    flex: 1,
    maxWidth: 520,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  infoColumn: {
    gap: spacing.md,
  },
  infoColumnDesktop: {
    flex: 1,
  },
  category: {
    color: colors.textSecondary,
    fontSize: typography.small,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '700',
  },
  sku: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  detailsCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  success: {
    color: colors.success,
  },
  danger: {
    color: colors.danger,
  },
  textSecondary: {
    color: colors.textSecondary,
  },
  descriptionBlock: {
    gap: spacing.xs,
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  description: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  purchase: {
    gap: spacing.md,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  infoNotice: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoNoticeText: {
    color: colors.textPrimary,
    fontSize: typography.body,
  },
});
