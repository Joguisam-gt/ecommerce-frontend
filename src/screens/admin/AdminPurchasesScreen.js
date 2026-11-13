/**
 * Compras a proveedores: listado filtrable (GET /admin/purchases segun
 * listPurchasesQuerySchema: supplierId, from, to), formulario de registro y
 * panel de detalle con la factura del proveedor.
 * Params opcionales: { productId } abre el formulario prellenado;
 * { purchaseId } abre el detalle; { supplierId } filtra y preselecciona;
 * { openForm: true } abre el formulario vacio.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdminPage, AppButton, DataTable, ErrorBanner, FilterBar } from '../../components';
import { useQueryFilters } from '../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../hooks/usePaginatedResource';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { listPurchases } from '../../services/admin/purchaseService';
import { useNavigation } from '../../navigation/NavigationContext';
import { colors, spacing, typography } from '../../config/theme';
import { formatDate, formatMoney } from '../../utils/format';
import PurchaseDetail from './purchases/PurchaseDetail';
import PurchaseForm from './purchases/PurchaseForm';
import useSupplierOptions from './purchases/useSupplierOptions';
import { describeError, labelOf, PAYMENT_LABELS, textOr } from './inventory/adminHelpers';

/** Columnas segun PurchaseDTO. */
const COLUMNS = [
  { key: 'purchaseNumber', title: 'Compra', width: 130 },
  { key: 'purchasedAt', title: 'Fecha', width: 110, render: (row) => formatDate(row.purchasedAt) },
  { key: 'supplierCode', title: 'Cod. proveedor', width: 130, render: (row) => row.supplier.supplierCode },
  { key: 'supplierName', title: 'Proveedor', width: 180, flex: 2, render: (row) => row.supplier.name },
  { key: 'supplierNit', title: 'NIT', width: 110, render: (row) => row.supplier.nit },
  { key: 'items', title: 'Lineas', width: 70, align: 'right', render: (row) => String(row.items.length) },
  { key: 'paymentMethod', title: 'Pago', width: 120, render: (row) => labelOf(PAYMENT_LABELS, row.paymentMethod) },
  { key: 'supplierInvoiceNumber', title: 'Fact. proveedor', width: 130, render: (row) => textOr(row.supplierInvoiceNumber) },
  { key: 'totalCost', title: 'Total', width: 120, align: 'right', render: (row) => formatMoney(row.totalCost) },
];

/** Pantalla de compras. */
export default function AdminPurchasesScreen() {
  const { route } = useNavigation();
  const params = (route && route.params) || {};
  const { isDesktop } = useResponsiveLayout();
  const suppliers = useSupplierOptions();
  const [showForm, setShowForm] = useState(Boolean(params.productId || params.openForm));
  const [selectedId, setSelectedId] = useState(params.purchaseId || null);
  const [notice, setNotice] = useState(null);
  const filters = useQueryFilters({ supplierId: params.supplierId || '', from: '', to: '' });
  const { items, meta, loading, error, reload } = usePaginatedResource(listPurchases, filters.query);

  // Filtros: proveedor cargado del listado de proveedores y rango de fechas.
  const fields = useMemo(
    () => [
      { key: 'supplierId', label: 'Proveedor', type: 'select', options: suppliers.options },
      { key: 'from', label: 'Desde', type: 'date', placeholder: 'AAAA-MM-DD' },
      { key: 'to', label: 'Hasta', type: 'date', placeholder: 'AAAA-MM-DD' },
    ],
    [suppliers.options],
  );

  // Tras registrar: cierra el formulario, recarga y abre el detalle.
  const handleCreated = (purchase) => {
    setShowForm(false);
    setNotice(purchase ? `Compra ${purchase.purchaseNumber} registrada por ${formatMoney(purchase.totalCost)}.` : 'Compra registrada.');
    if (purchase) setSelectedId(purchase.id);
    reload();
  };

  const actions = !showForm ? <AppButton title="Nueva compra" onPress={() => setShowForm(true)} /> : null;

  // Listado con filtros.
  const list = (
    <View>
      {suppliers.error ? <ErrorBanner message={`Proveedores: ${suppliers.error}`} /> : null}
      <FilterBar
        fields={fields}
        values={filters.values}
        onChange={filters.setValue}
        onApply={filters.apply}
        onReset={filters.reset}
        applying={loading}
      />
      <DataTable
        columns={COLUMNS}
        data={items}
        keyExtractor={(row) => row.id}
        onRowPress={(row) => setSelectedId(row.id)}
        selectedKey={selectedId}
        loading={loading}
        error={describeError(error)}
        onRetry={reload}
        emptyMessage="No hay compras con estos filtros."
        pagination={{
          page: filters.page,
          totalPages: meta.totalPages || 1,
          total: meta.total || 0,
          onPageChange: filters.setPage,
        }}
      />
    </View>
  );

  return (
    <AdminPage title="Compras" subtitle="Compras a proveedores y sus facturas." actions={actions}>
      {notice ? (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      {/* Formulario de registro */}
      {showForm ? (
        <PurchaseForm
          initialProductId={params.productId}
          initialSupplierId={params.supplierId}
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {/* Listado y detalle: lado a lado en escritorio, apilados en movil */}
      {selectedId && isDesktop ? (
        <View style={styles.split}>
          <View style={styles.listColumn}>{list}</View>
          <View style={styles.detailColumn}>
            <PurchaseDetail purchaseId={selectedId} onClose={() => setSelectedId(null)} />
          </View>
        </View>
      ) : (
        <View>
          {selectedId ? <PurchaseDetail purchaseId={selectedId} onClose={() => setSelectedId(null)} /> : null}
          {list}
        </View>
      )}
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  notice: { borderWidth: 1, borderColor: colors.success, backgroundColor: colors.surface, padding: spacing.md, marginBottom: spacing.lg },
  noticeText: { color: colors.success, fontWeight: '600', fontSize: typography.body },
  split: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  listColumn: { flex: 3, minWidth: 0 },
  detailColumn: { flex: 2, minWidth: 0 },
});
