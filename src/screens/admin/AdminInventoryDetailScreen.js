/**
 * Detalle de un producto del inventario (GET /admin/inventory/:id,
 * InventoryProductDetailDTO): imagen, descripcion, precios, costo, stock y
 * proveedor. Acciones: registrar compra (prellenada) y registrar merma.
 * Params: { productId }.
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  AdminPage,
  AppButton,
  Card,
  DetailRow,
  ErrorBanner,
  LoadingState,
  SectionTitle,
  StatusBadge,
} from '../../components';
import { useAsync } from '../../hooks/useAsync';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { getInventoryProduct } from '../../services/admin/inventoryService';
import { ROUTES } from '../../navigation/routes';
import { useNavigation } from '../../navigation/NavigationContext';
import { colors, radius, spacing, typography } from '../../config/theme';
import { formatDateTime, formatMoney, formatPercent } from '../../utils/format';
import { describeError, textOr } from './inventory/adminHelpers';

/** Pantalla de detalle de producto del inventario. */
export default function AdminInventoryDetailScreen() {
  const { route, navigate, goBack, canGoBack } = useNavigation();
  const productId = route && route.params ? route.params.productId : undefined;
  const { isDesktop } = useResponsiveLayout();
  const { data: product, error, isLoading, reload } = useAsync(
    () => (productId ? getInventoryProduct(productId) : Promise.resolve(null)),
    [productId],
  );

  // Volver al listado (o a la pantalla anterior).
  const back = () => (canGoBack ? goBack() : navigate(ROUTES.ADMIN_INVENTORY));

  // Acciones de la cabecera.
  const actions = (
    <>
      <AppButton title="Volver" variant="secondary" onPress={back} />
      {product ? (
        <>
          <AppButton
            title="Registrar merma"
            variant="secondary"
            onPress={() => navigate(ROUTES.ADMIN_INVENTORY, { tab: 'mermas', productId: product.id })}
          />
          <AppButton title="Registrar compra" onPress={() => navigate(ROUTES.ADMIN_PURCHASES, { productId: product.id })} />
        </>
      ) : null}
    </>
  );

  // Sin parametro de producto.
  if (!productId) {
    return (
      <AdminPage title="Producto" actions={actions}>
        <ErrorBanner message="No se indico el producto a consultar." />
      </AdminPage>
    );
  }

  // Margen bruto unitario sobre el precio final (solo si hay costo).
  const margin = product && product.costPrice !== null ? product.finalPrice - product.costPrice : null;

  return (
    <AdminPage title={product ? product.name : 'Producto'} subtitle={product ? `SKU ${product.sku}` : undefined} actions={actions}>
      {isLoading ? <LoadingState label="Cargando producto..." /> : null}
      {error ? (
        <View style={styles.block}>
          <ErrorBanner message={describeError(error)} />
          <AppButton title="Reintentar" variant="secondary" onPress={reload} />
        </View>
      ) : null}

      {product && !isLoading ? (
        <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
          {/* Imagen y descripcion */}
          <Card style={[styles.card, isDesktop && styles.mediaColumn]}>
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.image}
                resizeMode="contain"
                accessibilityLabel={`Imagen de ${product.name}`}
              />
            ) : (
              <View style={[styles.image, styles.imageEmpty]}>
                <Text style={styles.muted}>Sin imagen</Text>
              </View>
            )}
            <SectionTitle title="Descripcion" />
            <Text style={styles.description}>{textOr(product.description, 'Sin descripcion.')}</Text>
          </Card>

          <View style={isDesktop ? styles.infoColumn : null}>
            {/* Precios, costo y stock */}
            <Card style={styles.card}>
              <SectionTitle title="Precios y stock" />
              <DetailRow label="Costo" value={product.costPrice === null ? 'Sin costo registrado' : formatMoney(product.costPrice)} />
              <DetailRow label="Precio publico" value={formatMoney(product.salePrice)} />
              <DetailRow label="Descuento" value={formatPercent(product.discountPercent)} />
              <DetailRow label="Precio final" value={formatMoney(product.finalPrice)} />
              <DetailRow label="Margen unitario" value={margin === null ? '-' : formatMoney(margin)} />
              <DetailRow label="Stock">
                <Text style={product.stock > 0 ? styles.value : styles.danger}>
                  {product.stock > 0 ? `${product.stock} unidades` : 'Agotado'}
                </Text>
              </DetailRow>
              <DetailRow label="Categoria" value={product.category} />
              <DetailRow label="Estado">
                <StatusBadge status={Boolean(product.isActive)} />
              </DetailRow>
              <DetailRow label="Creado" value={formatDateTime(product.createdAt)} />
              <DetailRow label="Actualizado" value={formatDateTime(product.updatedAt)} />
            </Card>

            {/* Proveedor */}
            <Card style={styles.card}>
              <SectionTitle title="Proveedor" />
              {product.supplier ? (
                <>
                  <DetailRow label="Codigo" value={product.supplier.supplierCode} />
                  <DetailRow label="Nombre" value={product.supplier.name} />
                  <DetailRow label="NIT" value={product.supplier.nit} />
                  <DetailRow label="Telefono" value={product.supplier.phone} />
                  <DetailRow label="Direccion" value={product.supplier.address} />
                  <DetailRow label="Distribucion" value={product.supplier.distributionDescription} />
                  <DetailRow label="Estado">
                    <StatusBadge status={Boolean(product.supplier.isActive)} />
                  </DetailRow>
                  <AppButton
                    title="Ver proveedor"
                    variant="secondary"
                    style={styles.inlineButton}
                    onPress={() => navigate(ROUTES.ADMIN_SUPPLIER_DETAIL, { supplierId: product.supplier.id })}
                  />
                </>
              ) : (
                <Text style={styles.muted}>Este producto no tiene proveedor asignado.</Text>
              )}
            </Card>
          </View>
        </View>
      ) : null}
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm, marginBottom: spacing.lg },
  layout: { gap: spacing.lg },
  layoutDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  mediaColumn: { flex: 2 },
  infoColumn: { flex: 3, gap: spacing.lg },
  card: { marginBottom: spacing.lg },
  image: { width: '100%', height: 260, borderRadius: radius.md, backgroundColor: colors.muted, marginBottom: spacing.lg },
  imageEmpty: { alignItems: 'center', justifyContent: 'center' },
  description: { fontSize: typography.body, color: colors.textPrimary, lineHeight: 22 },
  value: { fontSize: typography.body, color: colors.textPrimary },
  danger: { fontSize: typography.body, color: colors.danger, fontWeight: '700' },
  muted: { fontSize: typography.body, color: colors.textSecondary },
  inlineButton: { marginTop: spacing.md, alignSelf: 'flex-start' },
});
