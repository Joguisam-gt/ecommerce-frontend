/**
 * Detalle de proveedor (GET /admin/suppliers/:id, SupplierDetailDTO): datos de
 * contacto, descripcion de distribucion, catalogo enriquecido con precios y
 * stock, e historial de compras (GET /admin/purchases?supplierId=...).
 * Params: { supplierId }.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AdminPage,
  AppButton,
  Card,
  DataTable,
  DetailRow,
  ErrorBanner,
  LoadingState,
  SectionTitle,
  StatusBadge,
} from '../../components';
import { useAsync } from '../../hooks/useAsync';
import { useQueryFilters } from '../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../hooks/usePaginatedResource';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { getSupplier } from '../../services/admin/supplierService';
import { listPurchases } from '../../services/admin/purchaseService';
import { ROUTES } from '../../navigation/routes';
import { useNavigation } from '../../navigation/NavigationContext';
import { colors, spacing, typography } from '../../config/theme';
import { formatDate, formatDateTime, formatMoney } from '../../utils/format';
import { describeError, labelOf, PAYMENT_LABELS, textOr } from './inventory/adminHelpers';

/** Columnas del catalogo enriquecido. */
const CATALOG_COLUMNS = [
  { key: 'sku', title: 'SKU', width: 110, render: (row) => textOr(row.sku) },
  { key: 'name', title: 'Producto', width: 180, flex: 2, render: (row) => textOr(row.name, row.productId) },
  { key: 'cost', title: 'Costo proveedor', width: 130, align: 'right', render: (row) => formatMoney(row.cost) },
  { key: 'salePrice', title: 'Precio publico', width: 120, align: 'right', render: (row) => (row.salePrice === null ? '-' : formatMoney(row.salePrice)) },
  { key: 'finalPrice', title: 'Precio final', width: 120, align: 'right', render: (row) => (row.finalPrice === null ? '-' : formatMoney(row.finalPrice)) },
  { key: 'stock', title: 'Stock', width: 80, align: 'right', render: (row) => textOr(row.stock) },
  {
    key: 'isActive',
    title: 'Producto',
    width: 100,
    render: (row) => (row.isActive === null ? '-' : <StatusBadge status={Boolean(row.isActive)} />),
  },
];

/** Columnas del historial de compras (PurchaseDTO). */
const PURCHASE_COLUMNS = [
  { key: 'purchaseNumber', title: 'Compra', width: 130 },
  { key: 'purchasedAt', title: 'Fecha', width: 110, render: (row) => formatDate(row.purchasedAt) },
  { key: 'items', title: 'Lineas', width: 70, align: 'right', render: (row) => String(row.items.length) },
  { key: 'paymentMethod', title: 'Pago', width: 120, render: (row) => labelOf(PAYMENT_LABELS, row.paymentMethod) },
  { key: 'supplierInvoiceNumber', title: 'Fact. proveedor', width: 130, render: (row) => textOr(row.supplierInvoiceNumber) },
  { key: 'totalCost', title: 'Total', width: 120, align: 'right', render: (row) => formatMoney(row.totalCost) },
];

/** Pantalla de detalle de proveedor. */
export default function AdminSupplierDetailScreen() {
  const { route, navigate, goBack, canGoBack } = useNavigation();
  const supplierId = route && route.params ? route.params.supplierId : undefined;
  const { isDesktop } = useResponsiveLayout();
  const { data: supplier, error, isLoading, reload } = useAsync(
    () => (supplierId ? getSupplier(supplierId) : Promise.resolve(null)),
    [supplierId],
  );
  // Historial de compras paginado del proveedor.
  const history = useQueryFilters({ supplierId: supplierId || '' }, { limit: 10 });
  const purchases = usePaginatedResource(listPurchases, history.query);

  // Volver al listado.
  const back = () => (canGoBack ? goBack() : navigate(ROUTES.ADMIN_SUPPLIERS));

  const actions = (
    <>
      <AppButton title="Volver" variant="secondary" onPress={back} />
      {supplier && supplier.isActive ? (
        <AppButton title="Registrar compra" onPress={() => navigate(ROUTES.ADMIN_PURCHASES, { supplierId: supplier.id, openForm: true })} />
      ) : null}
    </>
  );

  // Sin parametro de proveedor.
  if (!supplierId) {
    return (
      <AdminPage title="Proveedor" actions={actions}>
        <ErrorBanner message="No se indico el proveedor a consultar." />
      </AdminPage>
    );
  }

  // Total comprado en la pagina actual del historial (referencia rapida).
  const pageTotal = purchases.items.reduce((sum, row) => sum + Math.round(Number(row.totalCost) * 100), 0) / 100;

  return (
    <AdminPage
      title={supplier ? supplier.name : 'Proveedor'}
      subtitle={supplier ? `${supplier.supplierCode} - NIT ${supplier.nit}` : undefined}
      actions={actions}
    >
      {isLoading ? <LoadingState label="Cargando proveedor..." /> : null}
      {error ? (
        <View style={styles.block}>
          <ErrorBanner message={describeError(error)} />
          <AppButton title="Reintentar" variant="secondary" onPress={reload} />
        </View>
      ) : null}

      {supplier && !isLoading ? (
        <View>
          <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
            {/* Datos de contacto */}
            <Card style={[styles.card, isDesktop && styles.column]}>
              <SectionTitle title="Contacto" />
              <DetailRow label="Codigo" value={supplier.supplierCode} />
              <DetailRow label="NIT" value={supplier.nit} />
              <DetailRow label="Contacto" value={textOr(supplier.contactName)} />
              <DetailRow label="Telefono" value={textOr(supplier.phone)} />
              <DetailRow label="Correo" value={textOr(supplier.email)} />
              <DetailRow label="Direccion" value={textOr(supplier.address)} />
              <DetailRow label="Estado">
                <StatusBadge status={Boolean(supplier.isActive)} />
              </DetailRow>
              <DetailRow label="Alta" value={formatDateTime(supplier.createdAt)} />
              <DetailRow label="Actualizado" value={formatDateTime(supplier.updatedAt)} />
            </Card>
            {/* Distribucion */}
            <Card style={[styles.card, isDesktop && styles.column]}>
              <SectionTitle title="Distribucion" />
              <Text style={styles.paragraph}>{textOr(supplier.distributionDescription, 'Sin descripcion.')}</Text>
            </Card>
          </View>

          {/* Catalogo */}
          <Card style={styles.card}>
            <SectionTitle title={`Catalogo (${supplier.catalog.length})`} subtitle="Toca un producto para ver su inventario." />
            <DataTable
              columns={CATALOG_COLUMNS}
              data={supplier.catalog}
              keyExtractor={(row) => row.productId}
              onRowPress={(row) => navigate(ROUTES.ADMIN_INVENTORY_DETAIL, { productId: row.productId })}
              emptyMessage="El proveedor no tiene productos en su catalogo."
            />
          </Card>

          {/* Historial de compras */}
          <Card style={styles.card}>
            <SectionTitle
              title="Historial de compras"
              subtitle={`${purchases.meta.total || 0} compras registradas. Total en esta pagina: ${formatMoney(pageTotal)}.`}
            />
            <DataTable
              columns={PURCHASE_COLUMNS}
              data={purchases.items}
              keyExtractor={(row) => row.id}
              onRowPress={(row) => navigate(ROUTES.ADMIN_PURCHASES, { purchaseId: row.id, supplierId: supplier.id })}
              loading={purchases.loading}
              error={describeError(purchases.error)}
              onRetry={purchases.reload}
              emptyMessage="Sin compras registradas a este proveedor."
              pagination={{
                page: history.page,
                totalPages: purchases.meta.totalPages || 1,
                total: purchases.meta.total || 0,
                onPageChange: history.setPage,
              }}
            />
          </Card>
        </View>
      ) : null}
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm, marginBottom: spacing.lg },
  layout: { gap: spacing.lg },
  layoutDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1 },
  card: { marginBottom: spacing.lg },
  paragraph: { fontSize: typography.body, color: colors.textPrimary, lineHeight: 22 },
});
