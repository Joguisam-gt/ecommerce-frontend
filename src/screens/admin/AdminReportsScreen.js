/**
 * Reportes generales (ruta ADMIN_REPORTS): GET /admin/reports/general con filtros de
 * generalReportQuerySchema (startDate, endDate, category, productName, lowStockThreshold,
 * topLimit) y secciones de ventas, perdidas, inventario, cupones y metodos de pago.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AdminPage, AppButton, Card, ErrorBanner, FilterBar, LoadingState } from '../../components';
import { useAsync } from '../../hooks/useAsync';
import { useQueryFilters } from '../../hooks/useQueryFilters';
import { getGeneralReport } from '../../services/admin/reportService';
import { useNavigation } from '../../navigation/NavigationContext';
import { ROUTES } from '../../navigation/routes';
import { CATEGORIES } from '../../config/constants';
import { colors, spacing, typography } from '../../config/theme';
import { CouponsSection, InventorySection, LossesSection, PaymentMethodsSection, SalesSection } from './reports/ReportSections';
import { dayLabel, errorMessage, GENERAL_REPORT_KEYS, lastDaysRange, pickQuery, validateDateRange } from './reports/reportHelpers';

/** Campos del filtro (claves identicas al validator del backend). */
const FILTER_FIELDS = [
  { key: 'startDate', label: 'Desde', type: 'date' },
  { key: 'endDate', label: 'Hasta', type: 'date' },
  {
    key: 'category',
    label: 'Categoria',
    type: 'select',
    options: CATEGORIES.filter((c) => c !== 'Todas').map((c) => ({ label: c, value: c })),
  },
  { key: 'productName', label: 'Producto', type: 'text', placeholder: 'Nombre del producto' },
  { key: 'lowStockThreshold', label: 'Umbral de stock bajo', type: 'number', placeholder: '5' },
  { key: 'topLimit', label: 'Productos en el top', type: 'number', placeholder: '10 (max. 50)' },
];

/** Pantalla de reportes del panel de administracion. */
export default function AdminReportsScreen() {
  const { navigate } = useNavigation();

  // Filtros con rango por defecto de los ultimos 30 dias.
  const initial = useMemo(
    () => ({ ...lastDaysRange(30), category: '', productName: '', lowStockThreshold: '', topLimit: '' }),
    [],
  );
  const filters = useQueryFilters(initial);

  // Solo los campos que admite el backend (useQueryFilters agrega page y limit, que aqui sobran).
  const reportQuery = useMemo(() => pickQuery(filters.query, GENERAL_REPORT_KEYS), [filters.query]);
  const rangeError = validateDateRange(reportQuery);
  const queryKey = JSON.stringify(reportQuery);

  // Carga del reporte; si el rango es invalido no se consulta.
  const report = useAsync(() => (rangeError ? Promise.resolve(null) : getGeneralReport(reportQuery)), [queryKey]);

  // Navega al detalle de desempeno del producto.
  const openProduct = (productId) => navigate(ROUTES.ADMIN_REPORT_PRODUCT, { productId });

  const data = report.data;
  const periodText = reportQuery.startDate || reportQuery.endDate
    ? `Periodo: ${dayLabel(reportQuery.startDate) || 'inicio'} a ${dayLabel(reportQuery.endDate) || 'hoy'}`
    : 'Periodo: todo el historial';

  return (
    <AdminPage
      title="Reportes"
      subtitle="Ventas, perdidas, inventario, cupones y metodos de pago."
      actions={<AppButton title="Actualizar" variant="secondary" onPress={report.reload} />}
    >
      <FilterBar
        fields={FILTER_FIELDS}
        values={filters.values}
        onChange={filters.setValue}
        onApply={filters.apply}
        onReset={filters.reset}
        applying={report.isLoading}
      />
      <Text style={styles.period}>{periodText}</Text>

      {/* Estados de carga y error */}
      <ErrorBanner message={rangeError} />
      {report.isLoading && !data ? <LoadingState label="Generando reporte..." /> : null}
      {report.error ? (
        <Card style={styles.block}>
          <ErrorBanner message={errorMessage(report.error)} />
          <AppButton title="Reintentar" variant="secondary" onPress={report.reload} />
        </Card>
      ) : null}

      {/* Secciones del reporte */}
      {data && !rangeError ? (
        <>
          <SalesSection report={data} onProductPress={openProduct} />
          <LossesSection report={data} />
          <InventorySection report={data} onProductPress={openProduct} />
          <CouponsSection report={data} />
          <PaymentMethodsSection report={data} />
        </>
      ) : null}
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  period: { fontSize: typography.small, color: colors.textSecondary, marginVertical: spacing.md },
  block: { marginBottom: spacing.lg },
});
