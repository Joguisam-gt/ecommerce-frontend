/**
 * Detalle de cliente (GET /admin/customers/:id, CustomerDTO): datos de cuenta,
 * metricas (pedidos, articulos, devoluciones, total), metodo de pago preferido
 * con desglose en BarChart, historial de compras (facturas de cliente) y
 * acciones: editar, desactivar y borrado fisico (solo superusuario).
 * Params: { customerId }.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AdminPage,
  AppButton,
  BarChart,
  Card,
  ConfirmModal,
  DataTable,
  DetailRow,
  ErrorBanner,
  KpiCard,
  LoadingState,
  SectionTitle,
  StatusBadge,
} from '../../components';
import { useAsync } from '../../hooks/useAsync';
import { useQueryFilters } from '../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../hooks/usePaginatedResource';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { deactivateCustomer, deleteCustomer, getCustomer } from '../../services/admin/customerService';
import { listInvoices } from '../../services/admin/adminInvoiceService';
import { ROUTES } from '../../navigation/routes';
import { useNavigation } from '../../navigation/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../config/theme';
import { formatDate, formatDateTime, formatMoney, formatNumber } from '../../utils/format';
import CustomerEditForm from './customers/CustomerEditForm';
import { describeError, labelOf, PAYMENT_LABELS, textOr } from './inventory/adminHelpers';

/** Columnas del desglose por metodo de pago. */
const METHOD_COLUMNS = [
  { key: 'method', title: 'Metodo', width: 150, render: (row) => labelOf(PAYMENT_LABELS, row.method) },
  { key: 'orders', title: 'Pedidos', width: 90, align: 'right' },
  { key: 'lastOrderAt', title: 'Ultimo pedido', width: 150, render: (row) => (row.lastOrderAt ? formatDateTime(row.lastOrderAt) : '-') },
];

/** Columnas del historial de compras (AdminInvoiceDTO.summary). */
const HISTORY_COLUMNS = [
  { key: 'invoiceNumber', title: 'Factura', width: 140 },
  { key: 'orderNumber', title: 'Pedido', width: 140, render: (row) => textOr(row.orderNumber) },
  { key: 'issuedAt', title: 'Fecha', width: 110, render: (row) => formatDate(row.issuedAt) },
  { key: 'itemsCount', title: 'Lineas', width: 70, align: 'right' },
  { key: 'paymentMethod', title: 'Pago', width: 120, render: (row) => labelOf(PAYMENT_LABELS, row.paymentMethod) },
  { key: 'status', title: 'Estado', width: 140, render: (row) => <StatusBadge status={row.status} /> },
  { key: 'grandTotal', title: 'Total', width: 120, align: 'right', render: (row) => formatMoney(row.grandTotal) },
];

/** Errores especificos de acciones. */
const ACTION_ERRORS = {
  HARD_DELETE_FORBIDDEN: 'El borrado fisico esta reservado al superusuario.',
  NOT_A_CUSTOMER: 'Esta cuenta no es de un cliente.',
};

/**
 * Historial de facturas del cliente: busca por correo (filtro parcial del
 * backend) y conserva solo las del userId exacto.
 * @param {{ customer: object }} props
 */
function PurchaseHistory({ customer }) {
  const { navigate } = useNavigation();
  const history = useQueryFilters({ entityType: 'cliente', email: customer.email }, { limit: 10 });
  const { items, meta, loading, error, reload } = usePaginatedResource(listInvoices, history.query);
  const rows = items.filter((row) => !row.userId || row.userId === customer.id);

  return (
    <Card style={styles.card}>
      <SectionTitle title="Historial de compras" subtitle="Facturas emitidas al cliente. Toca una para ver su desglose." />
      <DataTable
        columns={HISTORY_COLUMNS}
        data={rows}
        keyExtractor={(row) => row.id}
        onRowPress={(row) => navigate(ROUTES.ADMIN_INVOICE_DETAIL, { invoiceId: row.id })}
        loading={loading}
        error={describeError(error)}
        onRetry={reload}
        emptyMessage="El cliente no tiene compras facturadas."
        pagination={{
          page: history.page,
          totalPages: meta.totalPages || 1,
          total: meta.total || 0,
          onPageChange: history.setPage,
        }}
      />
    </Card>
  );
}

/** Pantalla de detalle de cliente. */
export default function AdminCustomerDetailScreen() {
  const { route, navigate, goBack, canGoBack } = useNavigation();
  const customerId = route && route.params ? route.params.customerId : undefined;
  const { hasRole } = useAuth();
  const isSuperuser = hasRole('superuser');
  const { isDesktop } = useResponsiveLayout();
  const { data: customer, error, isLoading, reload } = useAsync(
    () => (customerId ? getCustomer(customerId) : Promise.resolve(null)),
    [customerId],
  );
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(null); // 'deactivate' | 'delete'
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Volver al directorio.
  const back = () => (canGoBack ? goBack() : navigate(ROUTES.ADMIN_CUSTOMERS));

  // Ejecuta la accion confirmada (desactivar o borrar).
  const runAction = async () => {
    setWorking(true);
    setActionError(null);
    try {
      if (pending === 'deactivate') {
        await deactivateCustomer(customer.id);
        setPending(null);
        setNotice('Cliente desactivado. Sus sesiones fueron revocadas.');
        reload();
      } else if (pending === 'delete') {
        await deleteCustomer(customer.id);
        setPending(null);
        navigate(ROUTES.ADMIN_CUSTOMERS);
      }
    } catch (err) {
      setPending(null);
      setActionError(ACTION_ERRORS[err && err.code] || describeError(err));
    } finally {
      setWorking(false);
    }
  };

  // Tras editar: recarga las metricas.
  const handleSaved = () => {
    setEditing(false);
    setNotice('Cliente actualizado.');
    reload();
  };

  const actions = (
    <>
      <AppButton title="Volver" variant="secondary" onPress={back} />
      {customer && !editing ? <AppButton title="Editar" variant="secondary" onPress={() => setEditing(true)} /> : null}
      {customer && customer.isActive ? <AppButton title="Desactivar" variant="secondary" onPress={() => setPending('deactivate')} /> : null}
      {customer && isSuperuser ? <AppButton title="Eliminar" variant="danger" onPress={() => setPending('delete')} /> : null}
    </>
  );

  // Sin parametro de cliente.
  if (!customerId) {
    return (
      <AdminPage title="Cliente" actions={actions}>
        <ErrorBanner message="No se indico el cliente a consultar." />
      </AdminPage>
    );
  }

  // Datos del grafico de metodos de pago (pedidos por metodo).
  const chartData = customer
    ? (customer.paymentMethods || []).map((entry) => ({ label: labelOf(PAYMENT_LABELS, entry.method), value: entry.orders }))
    : [];

  return (
    <AdminPage title={customer ? customer.name : 'Cliente'} subtitle={customer ? `Codigo ${customer.userCode}` : undefined} actions={actions}>
      {notice ? (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
      {actionError ? <ErrorBanner message={actionError} /> : null}
      {isLoading ? <LoadingState label="Cargando cliente..." /> : null}
      {error ? (
        <View style={styles.block}>
          <ErrorBanner message={describeError(error)} />
          <AppButton title="Reintentar" variant="secondary" onPress={reload} />
        </View>
      ) : null}

      {customer && !isLoading ? (
        <View>
          {editing ? <CustomerEditForm customer={customer} onSaved={handleSaved} onCancel={() => setEditing(false)} /> : null}

          {/* Metricas */}
          <View style={[styles.kpis, isDesktop && styles.kpisDesktop]}>
            <View style={isDesktop ? styles.kpi : null}>
              <KpiCard label="Pedidos" value={formatNumber(customer.ordersCount)} />
            </View>
            <View style={isDesktop ? styles.kpi : null}>
              <KpiCard label="Articulos comprados" value={formatNumber(customer.purchasedItems)} />
            </View>
            <View style={isDesktop ? styles.kpi : null}>
              <KpiCard
                label="Articulos devueltos"
                value={formatNumber(customer.returnedItems)}
                tone={customer.returnedItems > 0 ? 'danger' : 'default'}
              />
            </View>
            <View style={isDesktop ? styles.kpi : null}>
              <KpiCard label="Total comprado" value={formatMoney(customer.totalSpent)} tone="success" />
            </View>
          </View>

          <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
            {/* Datos de la cuenta */}
            <Card style={[styles.card, isDesktop && styles.column]}>
              <SectionTitle title="Datos del cliente" />
              <DetailRow label="Codigo" value={customer.userCode} />
              <DetailRow label="Nombre" value={customer.firstName} />
              <DetailRow label="Apellido" value={customer.lastName} />
              <DetailRow label="Correo" value={customer.email} />
              <DetailRow label="Telefono" value={textOr(customer.phone)} />
              <DetailRow label="Estado">
                <StatusBadge status={Boolean(customer.isActive)} />
              </DetailRow>
              <DetailRow label="Cliente desde" value={formatDateTime(customer.createdAt)} />
            </Card>

            {/* Metodo de pago preferido y desglose */}
            <Card style={[styles.card, isDesktop && styles.column]}>
              <SectionTitle title="Metodos de pago" />
              <DetailRow label="Preferido" value={labelOf(PAYMENT_LABELS, customer.preferredPaymentMethod)} />
              <View style={styles.chart}>
                <BarChart data={chartData} formatValue={(v) => `${formatNumber(v)} pedidos`} emptyMessage="Sin pedidos registrados." />
              </View>
              {customer.paymentMethods && customer.paymentMethods.length > 0 ? (
                <DataTable columns={METHOD_COLUMNS} data={customer.paymentMethods} keyExtractor={(row) => row.method} dense />
              ) : null}
            </Card>
          </View>

          <PurchaseHistory customer={customer} />
        </View>
      ) : null}

      {/* Confirmaciones */}
      <ConfirmModal
        visible={pending === 'deactivate'}
        title="Desactivar cliente"
        message={customer ? `${customer.name} no podra iniciar sesion y sus sesiones activas se revocaran.` : ''}
        confirmLabel="Desactivar"
        loading={working}
        onConfirm={runAction}
        onCancel={() => setPending(null)}
      />
      <ConfirmModal
        visible={pending === 'delete'}
        title="Eliminar cliente definitivamente"
        message={
          customer
            ? `Borrado fisico irreversible de ${customer.name}. Los pedidos y facturas conservan su copia de los datos.`
            : ''
        }
        confirmLabel="Eliminar"
        tone="danger"
        requireText={customer ? customer.userCode : undefined}
        requireTextLabel={customer ? `Escribe ${customer.userCode} para confirmar` : undefined}
        loading={working}
        onConfirm={runAction}
        onCancel={() => setPending(null)}
      />
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  notice: { borderWidth: 1, borderColor: colors.success, backgroundColor: colors.surface, padding: spacing.md, marginBottom: spacing.lg },
  noticeText: { color: colors.success, fontWeight: '600', fontSize: typography.body },
  block: { gap: spacing.sm, marginBottom: spacing.lg },
  kpis: { gap: spacing.md, marginBottom: spacing.lg },
  kpisDesktop: { flexDirection: 'row' },
  kpi: { flex: 1 },
  layout: { gap: spacing.lg },
  layoutDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1 },
  card: { marginBottom: spacing.lg },
  chart: { marginVertical: spacing.md },
});
