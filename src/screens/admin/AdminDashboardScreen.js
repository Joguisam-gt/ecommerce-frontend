/**
 * Panel de administracion (ruta ADMIN_PANEL): KPIs generales de los ultimos 30 dias
 * (GET /admin/reports/general) y cola de conciliacion de transferencias
 * (GET /admin/orders/pending-verification) con panel de detalle y visor de comprobante.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdminPage, AppButton, Card, DataTable, ErrorBanner, LoadingState, StatusBadge } from '../../components';
import { useAsync } from '../../hooks/useAsync';
import { useQueryFilters } from '../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../hooks/usePaginatedResource';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { listPendingVerification } from '../../services/admin/adminOrderService';
import { getGeneralReport } from '../../services/admin/reportService';
import { colors, spacing, typography } from '../../config/theme';
import { formatDateTime, formatMoney, formatNumber } from '../../utils/format';
import { KpiGrid } from './dashboard/KpiGrid';
import { ReconciliationPanel } from './dashboard/ReconciliationPanel';
import { dayLabel, errorMessage, lastDaysRange, sumBy } from './reports/reportHelpers';

/** Columnas de la cola de conciliacion. */
const QUEUE_COLUMNS = [
  { key: 'orderNumber', title: 'Pedido', width: 150 },
  { key: 'customer', title: 'Cliente', width: 180, render: (row) => (row.customer ? row.customer.name : '-') },
  { key: 'createdAt', title: 'Fecha', width: 150, render: (row) => formatDateTime(row.createdAt) },
  { key: 'total', title: 'Total', width: 120, align: 'right', render: (row) => formatMoney(row.totals ? row.totals.grandTotal : 0) },
  { key: 'bank', title: 'Banco', width: 140, render: (row) => (row.payment && row.payment.bankTransfer ? row.payment.bankTransfer.bankName : '-') },
  {
    key: 'transferAmount',
    title: 'Monto transferido',
    width: 150,
    align: 'right',
    render: (row) => (row.payment && row.payment.bankTransfer ? formatMoney(row.payment.bankTransfer.transferAmount) : '-'),
  },
  {
    key: 'authorization',
    title: 'Autorizacion',
    width: 150,
    render: (row) => (row.payment && row.payment.bankTransfer ? row.payment.bankTransfer.authorizationNumber : '-'),
  },
  { key: 'status', title: 'Estado', width: 170, render: (row) => <StatusBadge status={row.status} /> },
];

/** Pantalla principal del panel de administracion. */
export default function AdminDashboardScreen() {
  const { isDesktop } = useResponsiveLayout();
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');

  // Rango fijo de los KPIs: ultimos 30 dias (se calcula una vez por montaje).
  const range = useMemo(() => lastDaysRange(30), []);

  // KPIs generales: el endpoint solo acepta startDate/endDate/category/productName/umbrales.
  const report = useAsync(() => getGeneralReport({ startDate: range.startDate, endDate: range.endDate }), [range]);

  // Cola paginada: el backend solo admite page y limit.
  const { query, page, setPage } = useQueryFilters({});
  const queue = usePaginatedResource(listPendingVerification, query);
  const meta = queue.meta || {};

  // Refresca cola y KPIs (tras conciliar o a peticion del usuario).
  const refreshAll = useCallback(() => {
    queue.reload();
    report.reload();
  }, [queue, report]);

  // Tras aprobar o rechazar: aviso, cierre del panel y recarga.
  const handleResolved = (result, action) => {
    const orderNumber = result && result.order ? result.order.orderNumber : selected && selected.orderNumber;
    setNotice(action === 'approve' ? `Pedido ${orderNumber} aprobado.` : `Pedido ${orderNumber} rechazado.`);
    setSelected(null);
    refreshAll();
  };

  // Conflicto 409: la orden ya no esta pendiente; se recarga la cola manteniendo el aviso del panel.
  const handleConflict = () => {
    refreshAll();
  };

  // Tarjetas de indicadores a partir del reporte general.
  const kpis = useMemo(() => {
    const data = report.data;
    if (!data) return [];
    const sales = data.salesSummary || {};
    const losses = data.losses || {};
    const inventory = (data.inventoryStatus && data.inventoryStatus.totals) || {};
    return [
      { key: 'revenue', label: 'Ventas totales', value: formatMoney(sales.revenue), tone: 'success' },
      { key: 'orders', label: 'Pedidos', value: formatNumber(sales.ordersCount) },
      { key: 'ticket', label: 'Ticket promedio', value: formatMoney(sales.averageTicket) },
      { key: 'units', label: 'Unidades vendidas', value: formatNumber(sales.unitsSold) },
      { key: 'losses', label: 'Perdidas', value: formatMoney(losses.totalLoss), hint: `${formatNumber(losses.totalUnits)} unidades`, tone: 'danger' },
      { key: 'coupons', label: 'Cupones usados', value: formatNumber(sumBy(data.couponRanking, 'uses')) },
      { key: 'lowStock', label: 'Stock bajo', value: formatNumber(inventory.lowStockCount), tone: inventory.lowStockCount > 0 ? 'danger' : 'default' },
      { key: 'pending', label: 'Transferencias pendientes', value: formatNumber(meta.total || 0) },
    ];
  }, [report.data, meta.total]);

  // Si la orden seleccionada ya no esta en la pagina actual, se usa la version mas reciente.
  const selectedOrder = useMemo(() => {
    if (!selected) return null;
    const fresh = (queue.items || []).find((item) => item.id === selected.id);
    return fresh || selected;
  }, [selected, queue.items]);

  return (
    <AdminPage
      title="Panel de administracion"
      subtitle={`Indicadores del ${dayLabel(range.startDate)} al ${dayLabel(range.endDate)}`}
      actions={<AppButton title="Actualizar" variant="secondary" onPress={refreshAll} />}
    >
      {/* KPIs generales */}
      {report.isLoading && !report.data ? <LoadingState label="Cargando indicadores..." /> : null}
      {report.error ? (
        <Card style={styles.block}>
          <ErrorBanner message={errorMessage(report.error)} />
          <AppButton title="Reintentar" variant="secondary" onPress={report.reload} />
        </Card>
      ) : null}
      {kpis.length > 0 ? <KpiGrid items={kpis} /> : null}

      {/* Cola de conciliacion */}
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Cola de conciliacion de transferencias
      </Text>
      <Text style={styles.sectionHint}>Selecciona una orden para revisar el comprobante y aprobar o rechazar el pago.</Text>
      {notice ? (
        <Card style={styles.notice}>
          <Text style={styles.noticeText} accessibilityLiveRegion="polite">
            {notice}
          </Text>
        </Card>
      ) : null}

      <View style={isDesktop ? styles.splitDesktop : null}>
        <View style={isDesktop ? styles.tableDesktop : null}>
          <DataTable
            columns={QUEUE_COLUMNS}
            data={queue.items || []}
            keyExtractor={(row) => row.id}
            onRowPress={(row) => {
              setNotice('');
              setSelected(row);
            }}
            selectedKey={selectedOrder ? selectedOrder.id : undefined}
            loading={queue.loading}
            error={queue.error}
            onRetry={queue.reload}
            emptyMessage="No hay transferencias pendientes de verificacion."
            pagination={{ page, totalPages: meta.totalPages || 1, total: meta.total || 0, onPageChange: setPage }}
          />
        </View>

        {/* Detalle: a la derecha en escritorio, debajo en movil */}
        {selectedOrder ? (
          <View style={isDesktop ? styles.detailDesktop : styles.detailMobile}>
            <ReconciliationPanel
              order={selectedOrder}
              onResolved={handleResolved}
              onConflict={handleConflict}
              onClose={() => setSelected(null)}
            />
          </View>
        ) : null}
      </View>
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg },
  sectionHint: { fontSize: typography.small, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  notice: { marginBottom: spacing.md, borderColor: colors.success },
  noticeText: { color: colors.success, fontSize: typography.body, fontWeight: '600' },
  splitDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  tableDesktop: { flex: 3, minWidth: 0 },
  detailDesktop: { flex: 2, marginLeft: spacing.lg, minWidth: 0 },
  detailMobile: { marginTop: spacing.lg },
});
