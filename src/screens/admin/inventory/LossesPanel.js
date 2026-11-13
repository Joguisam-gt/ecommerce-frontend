/**
 * Seccion "Mermas" del inventario: formulario de registro y listado paginado
 * de mermas (GET /admin/inventory/losses) con filtros de motivo y fechas
 * (listLossesQuerySchema: productId, reason, from, to).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DataTable, FilterBar, SectionTitle } from '../../../components';
import { useQueryFilters } from '../../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../../hooks/usePaginatedResource';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { listLosses } from '../../../services/admin/inventoryService';
import { spacing } from '../../../config/theme';
import { formatDate, formatMoney } from '../../../utils/format';
import RecordLossForm from './RecordLossForm';
import { describeError, LOSS_REASON_LABELS, LOSS_REASON_OPTIONS, labelOf, textOr } from './adminHelpers';

/** Filtros visibles del listado de mermas. */
const LOSS_FILTER_FIELDS = [
  { key: 'reason', label: 'Motivo', type: 'select', options: LOSS_REASON_OPTIONS },
  { key: 'from', label: 'Desde', type: 'date', placeholder: 'AAAA-MM-DD' },
  { key: 'to', label: 'Hasta', type: 'date', placeholder: 'AAAA-MM-DD' },
];

/** Columnas segun InventoryLossDTO. */
const LOSS_COLUMNS = [
  { key: 'occurredAt', title: 'Fecha', width: 110, render: (row) => formatDate(row.occurredAt) },
  { key: 'sku', title: 'SKU', width: 120 },
  { key: 'productName', title: 'Producto', width: 200, flex: 2 },
  { key: 'category', title: 'Categoria', width: 120 },
  { key: 'quantity', title: 'Cantidad', width: 90, align: 'right' },
  { key: 'reason', title: 'Motivo', width: 100, render: (row) => labelOf(LOSS_REASON_LABELS, row.reason) },
  { key: 'unitCost', title: 'Costo unit.', width: 110, align: 'right', render: (row) => formatMoney(row.unitCost) },
  { key: 'totalLoss', title: 'Perdida', width: 110, align: 'right', render: (row) => formatMoney(row.totalLoss) },
  { key: 'notes', title: 'Notas', width: 200, flex: 2, render: (row) => textOr(row.notes) },
];

/**
 * @param {{ initialProduct?: object | null }} props Producto precargado (params de ruta).
 */
export default function LossesPanel({ initialProduct = null }) {
  const { isDesktop } = useResponsiveLayout();
  const filters = useQueryFilters({ reason: '', from: '', to: '' });
  const { items, meta, loading, error, reload } = usePaginatedResource(listLosses, filters.query);

  return (
    <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
      {/* Formulario de registro */}
      <View style={isDesktop ? styles.formColumn : null}>
        <RecordLossForm initialProduct={initialProduct} onRecorded={reload} />
      </View>
      {/* Historial de mermas */}
      <View style={isDesktop ? styles.tableColumn : null}>
        <SectionTitle title="Historial de mermas" />
        <FilterBar
          fields={LOSS_FILTER_FIELDS}
          values={filters.values}
          onChange={filters.setValue}
          onApply={filters.apply}
          onReset={filters.reset}
          applying={loading}
        />
        <DataTable
          columns={LOSS_COLUMNS}
          data={items}
          keyExtractor={(row) => row.id}
          loading={loading}
          error={describeError(error)}
          onRetry={reload}
          emptyMessage="No hay mermas registradas con estos filtros."
          pagination={{
            page: filters.page,
            totalPages: (meta && meta.totalPages) || 1,
            total: (meta && meta.total) || 0,
            onPageChange: filters.setPage,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: { gap: spacing.lg },
  layoutDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  formColumn: { flex: 2, minWidth: 300 },
  tableColumn: { flex: 3, minWidth: 0 },
});
