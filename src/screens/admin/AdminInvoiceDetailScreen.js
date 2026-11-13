/**
 * Detalle fiscal de una factura (GET /admin/invoices/:id, AdminInvoiceDTO.detail):
 * numero, fecha, estado, tipo de entidad, NIT y nombre del receptor/emisor,
 * lineas con cantidad, precio unitario, descuento, IVA y total, totales,
 * metodo de pago, direccion y el pedido o compra asociado. Params: { invoiceId }.
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
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { getInvoice } from '../../services/admin/adminInvoiceService';
import { ROUTES } from '../../navigation/routes';
import { useNavigation } from '../../navigation/NavigationContext';
import { colors, spacing, typography } from '../../config/theme';
import { formatDateTime, formatMoney, formatPercent } from '../../utils/format';
import { describeError, ENTITY_TYPE_LABELS, labelOf, PAYMENT_LABELS, textOr } from './inventory/adminHelpers';

/** Etiquetas del tipo de identificacion fiscal (NIT_TYPES del backend). */
const NIT_TYPE_LABELS = { nit: 'NIT', user_code: 'Codigo de cliente' };

/** Columnas del desglose de lineas. */
const LINE_COLUMNS = [
  { key: 'sku', title: 'SKU', width: 110 },
  { key: 'name', title: 'Producto', width: 180, flex: 2 },
  { key: 'quantity', title: 'Cant.', width: 70, align: 'right' },
  { key: 'unitPrice', title: 'Precio unit.', width: 110, align: 'right', render: (row) => formatMoney(row.unitPrice) },
  { key: 'lineSubtotal', title: 'Subtotal', width: 110, align: 'right', render: (row) => formatMoney(row.lineSubtotal) },
  { key: 'discount', title: 'Descuento', width: 100, align: 'right', render: (row) => formatMoney(row.discount) },
  { key: 'taxRatePercent', title: 'IVA %', width: 70, align: 'right', render: (row) => formatPercent(row.taxRatePercent) },
  { key: 'tax', title: 'IVA', width: 100, align: 'right', render: (row) => formatMoney(row.tax) },
  { key: 'total', title: 'Total', width: 110, align: 'right', render: (row) => formatMoney(row.total) },
];

/** Direccion en una linea de texto. */
function addressText(address) {
  if (!address) return '-';
  return [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ');
}

/** Pantalla de detalle de factura. */
export default function AdminInvoiceDetailScreen() {
  const { route, navigate, goBack, canGoBack } = useNavigation();
  const invoiceId = route && route.params ? route.params.invoiceId : undefined;
  const { isDesktop } = useResponsiveLayout();
  const { data: invoice, error, isLoading, reload } = useAsync(
    () => (invoiceId ? getInvoice(invoiceId) : Promise.resolve(null)),
    [invoiceId],
  );

  // Volver al listado.
  const back = () => (canGoBack ? goBack() : navigate(ROUTES.ADMIN_INVOICES));
  const isSupplier = invoice && invoice.entityType === 'proveedor';

  // Acciones hacia el documento y la entidad asociados.
  const actions = (
    <>
      <AppButton title="Volver" variant="secondary" onPress={back} />
      {invoice && isSupplier && invoice.purchaseId ? (
        <AppButton title="Ver compra" variant="secondary" onPress={() => navigate(ROUTES.ADMIN_PURCHASES, { purchaseId: invoice.purchaseId })} />
      ) : null}
      {invoice && isSupplier && invoice.supplierId ? (
        <AppButton title="Ver proveedor" variant="secondary" onPress={() => navigate(ROUTES.ADMIN_SUPPLIER_DETAIL, { supplierId: invoice.supplierId })} />
      ) : null}
      {invoice && !isSupplier && invoice.userId ? (
        <AppButton title="Ver cliente" variant="secondary" onPress={() => navigate(ROUTES.ADMIN_CUSTOMER_DETAIL, { customerId: invoice.userId })} />
      ) : null}
    </>
  );

  // Sin parametro de factura.
  if (!invoiceId) {
    return (
      <AdminPage title="Factura" actions={actions}>
        <ErrorBanner message="No se indico la factura a consultar." />
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title={invoice ? `Factura ${invoice.invoiceNumber}` : 'Factura'}
      subtitle={invoice ? `${labelOf(ENTITY_TYPE_LABELS, invoice.entityType)} - ${formatDateTime(invoice.issuedAt)}` : undefined}
      actions={actions}
    >
      {isLoading ? <LoadingState label="Cargando factura..." /> : null}
      {error ? (
        <View style={styles.block}>
          <ErrorBanner message={describeError(error)} />
          <AppButton title="Reintentar" variant="secondary" onPress={reload} />
        </View>
      ) : null}

      {invoice && !isLoading ? (
        <View>
          <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
            {/* Encabezado fiscal */}
            <Card style={[styles.card, isDesktop && styles.column]}>
              <SectionTitle title="Documento" />
              <DetailRow label="Numero / serie" value={invoice.invoiceNumber} />
              <DetailRow label="Fecha de emision" value={formatDateTime(invoice.issuedAt)} />
              <DetailRow label="Estado">
                <StatusBadge status={invoice.status} />
              </DetailRow>
              <DetailRow label="Tipo" value={labelOf(ENTITY_TYPE_LABELS, invoice.entityType)} />
              <DetailRow label="Moneda" value={invoice.currency} />
              <DetailRow label="Metodo de pago" value={labelOf(PAYMENT_LABELS, invoice.paymentMethod)} />
              {isSupplier ? (
                <DetailRow label="Compra asociada" value={textOr(invoice.purchaseId)} />
              ) : (
                <DetailRow label="Pedido asociado" value={textOr(invoice.orderNumber, textOr(invoice.orderId))} />
              )}
              {invoice.voidedAt ? <DetailRow label="Anulada el" value={formatDateTime(invoice.voidedAt)} /> : null}
              {invoice.voidReason ? <DetailRow label="Motivo de anulacion" value={invoice.voidReason} /> : null}
            </Card>

            {/* Receptor (cliente) o emisor (proveedor) */}
            <Card style={[styles.card, isDesktop && styles.column]}>
              <SectionTitle title={isSupplier ? 'Emisor (proveedor)' : 'Receptor (cliente)'} />
              <DetailRow label={labelOf(NIT_TYPE_LABELS, invoice.nitType)} value={invoice.nit} />
              <DetailRow label="Nombre" value={invoice.entityName} />
              <DetailRow label="Correo" value={textOr(invoice.email)} />
              <DetailRow label="Direccion" value={addressText(invoice.shippingAddress)} />
            </Card>
          </View>

          {/* Lineas */}
          <Card style={styles.card}>
            <SectionTitle title={`Detalle (${invoice.items.length} lineas)`} />
            <DataTable columns={LINE_COLUMNS} data={invoice.items} keyExtractor={(row, index) => `${row.productId}-${index}`} emptyMessage="Sin lineas." />
          </Card>

          {/* Totales */}
          <Card style={[styles.card, isDesktop && styles.totalsDesktop]}>
            <SectionTitle title="Totales" />
            <DetailRow label="Subtotal" value={formatMoney(invoice.totals.subtotal)} />
            <DetailRow label="Descuentos" value={`- ${formatMoney(invoice.totals.discountTotal)}`} />
            <DetailRow label="IVA total" value={formatMoney(invoice.totals.taxTotal)} />
            <DetailRow label="Total general">
              <Text style={styles.grandTotal}>{formatMoney(invoice.totals.grandTotal)}</Text>
            </DetailRow>
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
  totalsDesktop: { alignSelf: 'flex-end', minWidth: 420 },
  grandTotal: { fontSize: typography.title, fontWeight: '700', color: colors.textPrimary },
});
