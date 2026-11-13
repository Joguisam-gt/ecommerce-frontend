/**
 * Tabla filtrable de productos aplicables (GET /admin/coupons/applicable-products) con
 * seleccion multiple para el campo applicableProductIds del alta de cupon.
 * Filtros segun applicableProductsQuerySchema: name, category, availability, minPrice, maxPrice.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Checkbox, DataTable, FilterBar } from '../../../components';
import { useQueryFilters } from '../../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../../hooks/usePaginatedResource';
import { listApplicableProducts } from '../../../services/admin/adminCouponService';
import { CATEGORIES } from '../../../config/constants';
import { colors, spacing, typography } from '../../../config/theme';
import { formatMoney } from '../../../utils/format';

/** Campos del filtro (claves identicas a las del validator). */
const FILTER_FIELDS = [
  { key: 'name', label: 'Buscar por nombre', type: 'text', placeholder: 'Nombre del producto' },
  {
    key: 'category',
    label: 'Categoria',
    type: 'select',
    options: CATEGORIES.filter((c) => c !== 'Todas').map((c) => ({ label: c, value: c })),
  },
  {
    key: 'availability',
    label: 'Disponibilidad',
    type: 'select',
    options: [
      { label: 'Disponible', value: 'inStock' },
      { label: 'Agotado', value: 'outOfStock' },
    ],
  },
  { key: 'minPrice', label: 'Precio minimo', type: 'number', placeholder: '0.00' },
  { key: 'maxPrice', label: 'Precio maximo', type: 'number', placeholder: '0.00' },
];

/** Valores iniciales del filtro. */
const INITIAL_FILTERS = { name: '', category: '', availability: '', minPrice: '', maxPrice: '' };

/**
 * @param {{ selected: Record<string, { id: string, name: string }>,
 *   onToggle: (product: object) => void, onClear: () => void }} props
 */
export function ApplicableProductsSection({ selected, onToggle, onClear }) {
  const filters = useQueryFilters(INITIAL_FILTERS);
  const products = usePaginatedResource(listApplicableProducts, filters.query);
  const meta = products.meta || {};
  const selectedCount = Object.keys(selected).length;

  // Columnas: seleccion, nombre, precio, categoria y disponibilidad.
  const columns = useMemo(
    () => [
      {
        key: 'select',
        title: 'Incluir',
        width: 90,
        align: 'center',
        render: (row) => <Checkbox label="" checked={Boolean(selected[row.id])} onChange={() => onToggle(row)} />,
      },
      { key: 'name', title: 'Nombre', width: 200, flex: 2 },
      { key: 'sku', title: 'SKU', width: 120 },
      { key: 'price', title: 'Precio', width: 120, align: 'right', render: (row) => formatMoney(row.price) },
      { key: 'category', title: 'Categoria', width: 130 },
      {
        key: 'stock',
        title: 'Disponibilidad',
        width: 150,
        render: (row) =>
          row.stock > 0 ? (
            <Text style={styles.available}>{`Disponible (${row.stock})`}</Text>
          ) : (
            <Text style={styles.soldOut}>Agotado</Text>
          ),
      },
    ],
    [selected, onToggle],
  );

  return (
    <View>
      <FilterBar
        fields={FILTER_FIELDS}
        values={filters.values}
        onChange={filters.setValue}
        onApply={filters.apply}
        onReset={filters.reset}
        applying={products.loading}
      />

      {/* Resumen de la seleccion */}
      <View style={styles.selectionRow}>
        <Text style={styles.selectionText}>
          {selectedCount === 0
            ? 'Sin productos seleccionados: el cupon sera global (aplica a todo el catalogo).'
            : `${selectedCount} producto(s) seleccionado(s) para el cupon.`}
        </Text>
        {selectedCount > 0 ? <AppButton title="Limpiar seleccion" variant="secondary" onPress={onClear} /> : null}
      </View>

      <DataTable
        columns={columns}
        data={products.items || []}
        keyExtractor={(row) => row.id}
        onRowPress={onToggle}
        loading={products.loading}
        error={products.error}
        onRetry={products.reload}
        emptyMessage="No hay productos que coincidan con los filtros."
        pagination={{
          page: filters.page,
          totalPages: meta.totalPages || 1,
          total: meta.total || 0,
          onPageChange: filters.setPage,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  selectionText: { flex: 1, minWidth: 220, color: colors.textSecondary, fontSize: typography.body, marginRight: spacing.sm },
  available: { color: colors.success, fontSize: typography.body, fontWeight: '600' },
  soldOut: { color: colors.danger, fontSize: typography.body, fontWeight: '600' },
});

export default ApplicableProductsSection;
