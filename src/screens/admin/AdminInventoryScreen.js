/**
 * Inventario del panel: listado filtrable de productos con costo, precios,
 * stock y proveedor (GET /admin/inventory segun listInventoryQuerySchema) y la
 * pestana "Mermas" (listado y registro). Params opcionales: { tab: 'mermas',
 * productId } para abrir mermas con un producto precargado.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AdminPage, DataTable, ErrorBanner, FilterBar, StatusBadge, TabBar } from '../../components';
import { useQueryFilters } from '../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../hooks/usePaginatedResource';
import { getInventoryProduct, listInventory } from '../../services/admin/inventoryService';
import { ROUTES } from '../../navigation/routes';
import { useNavigation } from '../../navigation/NavigationContext';
import { colors, radius, typography } from '../../config/theme';
import { formatDate, formatMoney, formatPercent } from '../../utils/format';
import LossesPanel from './inventory/LossesPanel';
import { CATEGORY_OPTIONS, describeError, textOr } from './inventory/adminHelpers';
import useSupplierOptions from './purchases/useSupplierOptions';

/** Pestanas de la pantalla. */
const TABS = [
  { key: 'productos', label: 'Productos' },
  { key: 'mermas', label: 'Mermas' },
];

/** Ordenes admitidos (INVENTORY_SORT_KEYS del backend). */
const SORT_OPTIONS = [
  { value: 'newest', label: 'Mas recientes' },
  { value: 'oldest', label: 'Mas antiguos' },
  { value: 'name_asc', label: 'Nombre A-Z' },
  { value: 'name_desc', label: 'Nombre Z-A' },
  { value: 'price_asc', label: 'Precio menor' },
  { value: 'price_desc', label: 'Precio mayor' },
  { value: 'stock_asc', label: 'Menor stock' },
  { value: 'stock_desc', label: 'Mayor stock' },
];

/** Valores iniciales de los filtros (claves exactas del backend). */
const INITIAL_FILTERS = {
  productName: '',
  supplierId: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  createdFrom: '',
  createdTo: '',
  isActive: '',
  sort: '',
};

/** Pantalla de inventario. */
export default function AdminInventoryScreen() {
  const { route, navigate } = useNavigation();
  const params = (route && route.params) || {};
  const [tab, setTab] = useState(params.tab === 'mermas' ? 'mermas' : 'productos');
  const [lossProduct, setLossProduct] = useState(null);
  const [paramError, setParamError] = useState(null);
  const suppliers = useSupplierOptions();
  const filters = useQueryFilters(INITIAL_FILTERS);
  const { items, meta, loading, error, reload } = usePaginatedResource(listInventory, filters.query);

  // Precarga el producto de mermas cuando llega por params.
  useEffect(() => {
    if (!params.productId || params.tab !== 'mermas') return undefined;
    let alive = true;
    getInventoryProduct(params.productId)
      .then((product) => {
        if (alive && product) setLossProduct(product);
      })
      .catch((err) => {
        if (alive) setParamError(describeError(err));
      });
    return () => {
      alive = false;
    };
  }, [params.productId, params.tab]);

  // Campos de filtro; el proveedor se carga del listado de proveedores.
  const fields = useMemo(
    () => [
      { key: 'productName', label: 'Producto', type: 'text', placeholder: 'Nombre del producto' },
      { key: 'supplierId', label: 'Proveedor', type: 'select', options: suppliers.options },
      { key: 'category', label: 'Categoria', type: 'select', options: CATEGORY_OPTIONS },
      { key: 'minPrice', label: 'Precio minimo (Q)', type: 'number', placeholder: '0.00' },
      { key: 'maxPrice', label: 'Precio maximo (Q)', type: 'number', placeholder: '0.00' },
      { key: 'createdFrom', label: 'Ingreso desde', type: 'date', placeholder: 'AAAA-MM-DD' },
      { key: 'createdTo', label: 'Ingreso hasta', type: 'date', placeholder: 'AAAA-MM-DD' },
      { key: 'isActive', label: 'Disponible en tienda', type: 'boolean' },
      { key: 'sort', label: 'Ordenar por', type: 'select', options: SORT_OPTIONS },
    ],
    [suppliers.options],
  );

  // Columnas segun InventoryProductDTO.
  const columns = useMemo(
    () => [
      {
        key: 'imageUrl',
        title: 'Imagen',
        width: 72,
        flex: 0.6,
        render: (row) =>
          row.imageUrl ? (
            <Image source={{ uri: row.imageUrl }} style={styles.thumb} accessibilityLabel={`Imagen de ${row.name}`} />
          ) : (
            <View style={styles.thumbEmpty} />
          ),
      },
      { key: 'sku', title: 'SKU', width: 120 },
      { key: 'name', title: 'Producto', width: 200, flex: 2 },
      { key: 'category', title: 'Categoria', width: 120 },
      {
        key: 'supplierId',
        title: 'Proveedor',
        width: 160,
        render: (row) => (row.supplierId && suppliers.byId[row.supplierId] ? suppliers.byId[row.supplierId].name : textOr(row.supplierId)),
      },
      {
        key: 'stock',
        title: 'Stock',
        width: 80,
        align: 'right',
        render: (row) => <Text style={row.stock > 0 ? styles.stock : styles.stockOut}>{String(row.stock)}</Text>,
      },
      { key: 'costPrice', title: 'Costo', width: 110, align: 'right', render: (row) => (row.costPrice === null ? '-' : formatMoney(row.costPrice)) },
      { key: 'salePrice', title: 'Precio publico', width: 120, align: 'right', render: (row) => formatMoney(row.salePrice) },
      { key: 'discountPercent', title: 'Desc.', width: 70, align: 'right', render: (row) => formatPercent(row.discountPercent) },
      { key: 'finalPrice', title: 'Precio final', width: 120, align: 'right', render: (row) => formatMoney(row.finalPrice) },
      { key: 'isActive', title: 'Estado', width: 100, render: (row) => <StatusBadge status={Boolean(row.isActive)} /> },
      { key: 'createdAt', title: 'Ingreso', width: 110, render: (row) => formatDate(row.createdAt) },
    ],
    [suppliers.byId],
  );

  return (
    <AdminPage title="Inventario" subtitle="Productos, costos, stock y mermas.">
      <TabBar tabs={TABS} value={tab} onChange={setTab} />
      {paramError ? <ErrorBanner message={paramError} /> : null}

      {/* Pestana de productos */}
      {tab === 'productos' ? (
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
            columns={columns}
            data={items}
            keyExtractor={(row) => row.id}
            onRowPress={(row) => navigate(ROUTES.ADMIN_INVENTORY_DETAIL, { productId: row.id })}
            loading={loading}
            error={describeError(error)}
            onRetry={reload}
            emptyMessage="No hay productos con estos filtros."
            pagination={{
              page: filters.page,
              totalPages: meta.totalPages || 1,
              total: meta.total || 0,
              onPageChange: filters.setPage,
            }}
          />
        </View>
      ) : null}

      {/* Pestana de mermas */}
      {tab === 'mermas' ? <LossesPanel initialProduct={lossProduct} /> : null}
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.muted },
  thumbEmpty: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.muted },
  stock: { fontSize: typography.body, color: colors.textPrimary, textAlign: 'right' },
  stockOut: { fontSize: typography.body, color: colors.danger, fontWeight: '700', textAlign: 'right' },
});
