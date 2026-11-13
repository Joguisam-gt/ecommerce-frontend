/**
 * Desempeno de un producto y su proveedor (ruta ADMIN_REPORT_PRODUCT, params { productId }):
 * GET /admin/reports/products/:id/supplier-performance con filtro de fechas
 * (supplierPerformanceQuerySchema: startDate, endDate). Muestra ventas, devoluciones,
 * perdidas, margen y la tarjeta de contacto del proveedor con su evaluacion de continuidad.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdminPage, AppButton, Card, DetailRow, EmptyState, ErrorBanner, FilterBar, LoadingState } from '../../components';
import { useAsync } from '../../hooks/useAsync';
import { useQueryFilters } from '../../hooks/useQueryFilters';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { getSupplierPerformance } from '../../services/admin/reportService';
import { getSupplier } from '../../services/admin/supplierService';
import { useNavigation } from '../../navigation/NavigationContext';
import { ROUTES } from '../../navigation/routes';
import { colors, spacing, typography } from '../../config/theme';
import { formatMoney, formatNumber, formatPercent } from '../../utils/format';
import { KpiGrid } from './dashboard/KpiGrid';
import { ReportSection } from './reports/ReportSection';
import { SupplierContactCard } from './reports/SupplierContactCard';
import { dayLabel, errorMessage, pickQuery, SUPPLIER_PERFORMANCE_KEYS, validateDateRange } from './reports/reportHelpers';

/** Filtro de fechas (unicos campos del validator). */
const FILTER_FIELDS = [
  { key: 'startDate', label: 'Desde', type: 'date' },
  { key: 'endDate', label: 'Hasta', type: 'date' },
];

/** Base de calculo del margen que informa el backend. */
const MARGIN_BASIS_LABELS = {
  ventas: 'Calculado sobre las ventas del periodo',
  catalogo: 'Calculado sobre el precio de catalogo (sin ventas en el periodo)',
};

/** Pantalla de desempeno de producto y proveedor. */
export default function AdminReportProductScreen() {
  const { route, navigate, goBack, canGoBack } = useNavigation();
  const { isDesktop } = useResponsiveLayout();
  const productId = route.params ? route.params.productId : undefined;

  // Filtro de fechas: vacio = todo el historial del producto.
  const filters = useQueryFilters({ startDate: '', endDate: '' });
  const perfQuery = useMemo(() => pickQuery(filters.query, SUPPLIER_PERFORMANCE_KEYS), [filters.query]);
  const rangeError = validateDateRange(perfQuery);
  const queryKey = JSON.stringify(perfQuery);

  // Reporte de desempeno del producto.
  const perf = useAsync(
    () => (!productId || rangeError ? Promise.resolve(null) : getSupplierPerformance(productId, perfQuery)),
    [productId, queryKey],
  );
  const data = perf.data;
  const supplierId = data && data.supplier ? data.supplier.id : null;

  // Detalle del proveedor (NIT, contacto, correo, direccion); si falla se usan los datos del reporte.
  const supplier = useAsync(() => (supplierId ? getSupplier(supplierId) : Promise.resolve(null)), [supplierId]);

  // Vuelve a la lista de reportes.
  const back = () => (canGoBack ? goBack() : navigate(ROUTES.ADMIN_REPORTS));
  const backButton = <AppButton title="Volver a reportes" variant="secondary" onPress={back} />;

  // Sin productId en los parametros no hay nada que consultar.
  if (!productId) {
    return (
      <AdminPage title="Desempeno de producto" actions={backButton}>
        <EmptyState title="Producto no indicado" message="Abre esta pantalla desde un producto del reporte general." />
      </AdminPage>
    );
  }

  // Indicadores de ventas, devoluciones, perdidas y margen.
  const margin = (data && data.grossMargin) || {};
  const kpis = data
    ? [
        { key: 'units', label: 'Unidades vendidas', value: formatNumber(data.unitsSold) },
        { key: 'revenue', label: 'Ingresos', value: formatMoney(data.revenue), tone: 'success' },
        { key: 'net', label: 'Ingresos netos', value: formatMoney(data.netRevenue), hint: 'Descontando devoluciones' },
        {
          key: 'returns',
          label: 'Devoluciones',
          value: formatNumber(data.returnedUnits),
          hint: `Tasa ${formatPercent((Number(data.returnRate) || 0) * 100)}`,
          tone: data.returnedUnits > 0 ? 'danger' : 'default',
        },
        { key: 'lossUnits', label: 'Unidades perdidas', value: formatNumber(data.lossUnits), tone: data.lossUnits > 0 ? 'danger' : 'default' },
        { key: 'lossCost', label: 'Costo de perdidas', value: formatMoney(data.lossCost), tone: data.lossCost > 0 ? 'danger' : 'default' },
        {
          key: 'margin',
          label: 'Margen bruto',
          value: margin.percent === null || margin.percent === undefined ? 'Sin dato' : formatPercent(margin.percent),
          hint: margin.grossProfit === null || margin.grossProfit === undefined ? 'Sin costo registrado' : `Utilidad ${formatMoney(margin.grossProfit)}`,
          tone: margin.percent === null || margin.percent === undefined ? 'default' : margin.percent < 5 ? 'danger' : 'success',
        },
      ]
    : [];

  // Comparativo de importes: ingresos netos frente a perdidas y utilidad.
  const chartData = data
    ? [
        { label: 'Ingresos', value: Number(data.revenue) || 0 },
        { label: 'Ingresos netos', value: Number(data.netRevenue) || 0 },
        { label: 'Utilidad bruta', value: Math.max(0, Number(margin.grossProfit) || 0) },
        { label: 'Costo de perdidas', value: Number(data.lossCost) || 0 },
      ]
    : [];

  const periodText =
    perfQuery.startDate || perfQuery.endDate
      ? `Periodo: ${dayLabel(perfQuery.startDate) || 'inicio'} a ${dayLabel(perfQuery.endDate) || 'hoy'}`
      : 'Periodo: todo el historial';

  return (
    <AdminPage
      title={data ? data.name : 'Desempeno de producto'}
      subtitle={data ? `SKU ${data.sku} - ${data.category}` : 'Ventas, perdidas, margen y proveedor'}
      actions={backButton}
    >
      <FilterBar
        fields={FILTER_FIELDS}
        values={filters.values}
        onChange={filters.setValue}
        onApply={filters.apply}
        onReset={filters.reset}
        applying={perf.isLoading}
      />
      <Text style={styles.period}>{periodText}</Text>

      {/* Estados de carga y error (404 PRODUCT_NOT_FOUND, validacion, red) */}
      <ErrorBanner message={rangeError} />
      {perf.isLoading && !data ? <LoadingState label="Cargando desempeno..." /> : null}
      {perf.error ? (
        <Card style={styles.block}>
          <ErrorBanner message={errorMessage(perf.error)} />
          <AppButton title="Reintentar" variant="secondary" onPress={perf.reload} />
        </Card>
      ) : null}

      {data && !rangeError ? (
        <>
          <KpiGrid items={kpis} />
          <View style={isDesktop ? styles.split : null}>
            {/* Metricas y precios del producto */}
            <View style={isDesktop ? styles.main : null}>
              <ReportSection
                title="Resultados del producto"
                chart={{ title: 'Importes del periodo', data: chartData, formatValue: formatMoney }}
              >
                <DetailRow label="Estado" value={data.isActive ? 'Activo' : 'Inactivo'} />
                <DetailRow label="Stock actual" value={formatNumber(data.stock)} />
                <DetailRow label="Precio de costo" value={data.costPrice === null ? 'Sin costo' : formatMoney(data.costPrice)} />
                <DetailRow label="Precio de venta" value={data.salePrice === null ? '-' : formatMoney(data.salePrice)} />
                <DetailRow label="Precio efectivo" value={data.effectivePrice === null ? '-' : formatMoney(data.effectivePrice)} />
                <DetailRow label="Margen por unidad" value={margin.unitMargin === null || margin.unitMargin === undefined ? '-' : formatMoney(margin.unitMargin)} />
                <DetailRow label="Base del margen" value={MARGIN_BASIS_LABELS[margin.basis] || 'Sin dato'} />
              </ReportSection>
            </View>

            {/* Proveedor y evaluacion de continuidad */}
            <View style={isDesktop ? styles.side : null}>
              {supplier.isLoading && supplierId ? <LoadingState label="Cargando proveedor..." /> : null}
              <SupplierContactCard
                performance={data}
                supplierDetail={supplier.data}
                detailError={supplier.error ? 'No se pudo cargar el detalle completo del proveedor; se muestran los datos del reporte.' : ''}
              />
            </View>
          </View>
        </>
      ) : null}
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  period: { fontSize: typography.small, color: colors.textSecondary, marginVertical: spacing.md },
  block: { marginBottom: spacing.lg },
  split: { flexDirection: 'row', alignItems: 'flex-start' },
  main: { flex: 3, marginRight: spacing.lg, minWidth: 0 },
  side: { flex: 2, minWidth: 0 },
});
