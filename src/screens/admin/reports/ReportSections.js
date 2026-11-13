/**
 * Secciones del reporte general (ReportResponseDTO.general): ventas, perdidas por
 * vencidos y danados, inventario, cupones usados y metodos de pago.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart, DataTable } from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { formatMoney, formatNumber } from '../../../utils/format';
import { ReportSection } from './ReportSection';
import { lossReasonLabel, paymentMethodLabel, sumBy } from './reportHelpers';

/** Filas por pagina en las tablas locales (el reporte llega completo). */
const PAGE_SIZE = 15;

/** Hook de paginacion local para listas ya cargadas. */
function useLocalPage(rows) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const slice = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  return { slice, pagination: { page: current, totalPages, total: rows.length, onPageChange: setPage } };
}

/** Ventas: resumen, top de productos y agregado por categoria de ese top. */
export function SalesSection({ report, onProductPress }) {
  const summary = report.salesSummary || {};
  const top = report.topProducts || [];

  // Agrega por categoria los productos del top (el backend no entrega un desglose por categoria completo).
  const byCategory = useMemo(() => {
    const map = {};
    top.forEach((row) => {
      const key = row.category || 'Sin categoria';
      map[key] = (map[key] || 0) + (Number(row.revenue) || 0);
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [top]);

  const columns = [
    { key: 'name', title: 'Producto', width: 200, flex: 2 },
    { key: 'sku', title: 'SKU', width: 120 },
    { key: 'category', title: 'Categoria', width: 130 },
    { key: 'unitsSold', title: 'Unidades', width: 100, align: 'right', render: (r) => formatNumber(r.unitsSold) },
    { key: 'ordersCount', title: 'Pedidos', width: 100, align: 'right', render: (r) => formatNumber(r.ordersCount) },
    { key: 'revenue', title: 'Ingresos', width: 130, align: 'right', render: (r) => formatMoney(r.revenue) },
  ];

  return (
    <ReportSection
      title="Ventas"
      subtitle="Pedidos confirmados, pagados, en proceso, enviados o entregados dentro del rango."
      kpis={[
        { key: 'revenue', label: 'Ingresos', value: formatMoney(summary.revenue), tone: 'success' },
        { key: 'orders', label: 'Pedidos', value: formatNumber(summary.ordersCount) },
        { key: 'units', label: 'Unidades vendidas', value: formatNumber(summary.unitsSold) },
        { key: 'ticket', label: 'Ticket promedio', value: formatMoney(summary.averageTicket) },
      ]}
      chart={{
        title: 'Ingresos por producto (top)',
        data: top.map((r) => ({ label: r.name, value: Number(r.revenue) || 0 })),
        formatValue: formatMoney,
      }}
    >
      {byCategory.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Ingresos por categoria (sobre los productos del top)</Text>
          <BarChart data={byCategory} formatValue={formatMoney} />
        </View>
      ) : null}
      <Text style={styles.hint}>Pulsa un producto para ver su desempeno y su proveedor.</Text>
      <DataTable
        columns={columns}
        data={top}
        keyExtractor={(r, i) => r.productId || `${r.sku}-${i}`}
        onRowPress={(r) => r.productId && onProductPress(r.productId)}
        emptyMessage="Sin ventas en el rango seleccionado."
      />
    </ReportSection>
  );
}

/** Perdidas: mermas por vencidos y danados. */
export function LossesSection({ report }) {
  const losses = report.losses || {};
  const byReason = losses.byReason || [];
  const columns = [
    { key: 'reason', title: 'Motivo', width: 140, render: (r) => lossReasonLabel(r.reason) },
    { key: 'units', title: 'Unidades', width: 110, align: 'right', render: (r) => formatNumber(r.units) },
    { key: 'records', title: 'Registros', width: 110, align: 'right', render: (r) => formatNumber(r.records) },
    { key: 'totalLoss', title: 'Perdida', width: 140, align: 'right', render: (r) => formatMoney(r.totalLoss) },
  ];
  return (
    <ReportSection
      title="Perdidas por vencidos y danados"
      subtitle="Mermas registradas en inventario, valoradas al costo del momento."
      kpis={[
        { key: 'loss', label: 'Perdida total', value: formatMoney(losses.totalLoss), tone: 'danger' },
        { key: 'units', label: 'Unidades perdidas', value: formatNumber(losses.totalUnits) },
        { key: 'records', label: 'Registros', value: formatNumber(losses.records) },
      ]}
      chart={{
        title: 'Perdida por motivo',
        data: byReason.map((r) => ({ label: lossReasonLabel(r.reason), value: Number(r.totalLoss) || 0 })),
        formatValue: formatMoney,
        tone: 'danger',
      }}
    >
      <DataTable columns={columns} data={byReason} keyExtractor={(r) => r.reason} emptyMessage="Sin mermas en el rango seleccionado." />
    </ReportSection>
  );
}

/** Inventario: totales valorados y productos con stock bajo resaltado. */
export function InventorySection({ report, onProductPress }) {
  const status = report.inventoryStatus || {};
  const totals = status.totals || {};
  const products = status.products || [];
  const { slice, pagination } = useLocalPage(products);
  const columns = [
    { key: 'name', title: 'Producto', width: 200, flex: 2 },
    { key: 'sku', title: 'SKU', width: 120 },
    { key: 'category', title: 'Categoria', width: 130 },
    { key: 'stock', title: 'Stock', width: 90, align: 'right', render: (r) => formatNumber(r.stock) },
    { key: 'costPrice', title: 'Costo', width: 110, align: 'right', render: (r) => (r.costPrice === null ? 'Sin costo' : formatMoney(r.costPrice)) },
    { key: 'salePrice', title: 'Precio', width: 110, align: 'right', render: (r) => (r.salePrice === null ? '-' : formatMoney(r.salePrice)) },
    { key: 'inventoryCost', title: 'Valor al costo', width: 130, align: 'right', render: (r) => formatMoney(r.inventoryCost) },
    {
      key: 'lowStock',
      title: 'Estado',
      width: 120,
      render: (r) =>
        r.lowStock ? <Text style={styles.danger}>Stock bajo</Text> : <Text style={styles.success}>Normal</Text>,
    },
  ];
  return (
    <ReportSection
      title="Inventario"
      subtitle={`Stock bajo: ${formatNumber(status.lowStockThreshold)} unidades o menos.`}
      kpis={[
        { key: 'products', label: 'Productos', value: formatNumber(totals.products) },
        { key: 'units', label: 'Unidades en stock', value: formatNumber(totals.units) },
        { key: 'cost', label: 'Valor al costo', value: formatMoney(totals.inventoryCost) },
        { key: 'retail', label: 'Valor de venta', value: formatMoney(totals.inventoryRetail) },
        {
          key: 'low',
          label: 'Con stock bajo',
          value: formatNumber(totals.lowStockCount),
          tone: totals.lowStockCount > 0 ? 'danger' : 'default',
        },
      ]}
    >
      <DataTable
        columns={columns}
        data={slice}
        keyExtractor={(r, i) => r.productId || `${r.sku}-${i}`}
        onRowPress={(r) => r.productId && onProductPress(r.productId)}
        emptyMessage="Sin productos para los filtros seleccionados."
        pagination={pagination}
        dense
      />
    </ReportSection>
  );
}

/** Cupones usados: ranking por usos con descuento otorgado. */
export function CouponsSection({ report }) {
  const ranking = report.couponRanking || [];
  const columns = [
    { key: 'code', title: 'Cupon', width: 150 },
    { key: 'uses', title: 'Usos', width: 90, align: 'right', render: (r) => formatNumber(r.uses) },
    { key: 'totalDiscount', title: 'Descuento otorgado', width: 160, align: 'right', render: (r) => formatMoney(r.totalDiscount) },
    { key: 'revenue', title: 'Ventas asociadas', width: 150, align: 'right', render: (r) => formatMoney(r.revenue) },
  ];
  return (
    <ReportSection
      title="Cupones usados"
      kpis={[
        { key: 'uses', label: 'Usos de cupones', value: formatNumber(sumBy(ranking, 'uses')) },
        { key: 'discount', label: 'Descuento otorgado', value: formatMoney(sumBy(ranking, 'totalDiscount')), tone: 'danger' },
        { key: 'revenue', label: 'Ventas con cupon', value: formatMoney(sumBy(ranking, 'revenue')), tone: 'success' },
      ]}
      chart={{
        title: 'Usos por cupon',
        data: ranking.map((r) => ({ label: r.code, value: Number(r.uses) || 0 })),
        formatValue: formatNumber,
      }}
    >
      <DataTable columns={columns} data={ranking} keyExtractor={(r) => r.code} emptyMessage="No se usaron cupones en el rango." />
    </ReportSection>
  );
}

/** Metodos de pago: pedidos e ingresos por metodo. */
export function PaymentMethodsSection({ report }) {
  const rows = report.paymentMethodBreakdown || [];
  const columns = [
    { key: 'method', title: 'Metodo', width: 200, flex: 2, render: (r) => paymentMethodLabel(r.method) },
    { key: 'ordersCount', title: 'Pedidos', width: 100, align: 'right', render: (r) => formatNumber(r.ordersCount) },
    { key: 'revenue', title: 'Ingresos', width: 140, align: 'right', render: (r) => formatMoney(r.revenue) },
  ];
  return (
    <ReportSection
      title="Metodos de pago"
      chart={{
        title: 'Ingresos por metodo',
        data: rows.map((r) => ({ label: paymentMethodLabel(r.method), value: Number(r.revenue) || 0 })),
        formatValue: formatMoney,
        tone: 'success',
      }}
    >
      <DataTable columns={columns} data={rows} keyExtractor={(r) => r.method || 'sin-metodo'} emptyMessage="Sin pagos en el rango." />
    </ReportSection>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: typography.small, color: colors.textSecondary, marginBottom: spacing.sm },
  block: { marginBottom: spacing.md },
  blockTitle: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  danger: { color: colors.danger, fontWeight: '600', fontSize: typography.body },
  success: { color: colors.success, fontWeight: '600', fontSize: typography.body },
});
