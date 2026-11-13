/**
 * Panel de detalle de una compra (GET /admin/purchases/:id, PurchaseDTO con
 * factura de proveedor): datos generales, lineas con costo anterior y la
 * factura contable generada (SupplierInvoiceDTO).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, DataTable, DetailRow, ErrorBanner, LoadingState, SectionTitle, StatusBadge } from '../../../components';
import { useAsync } from '../../../hooks/useAsync';
import { getPurchase } from '../../../services/admin/purchaseService';
import { ROUTES } from '../../../navigation/routes';
import { useNavigation } from '../../../navigation/NavigationContext';
import { colors, spacing, typography } from '../../../config/theme';
import { formatDateTime, formatMoney, formatPercent } from '../../../utils/format';
import { describeError, labelOf, PAYMENT_LABELS, textOr } from '../inventory/adminHelpers';

/** Columnas de las lineas de la compra. */
const ITEM_COLUMNS = [
  { key: 'sku', title: 'SKU', width: 110 },
  { key: 'name', title: 'Producto', width: 180, flex: 2 },
  { key: 'quantity', title: 'Cant.', width: 70, align: 'right' },
  { key: 'unitCost', title: 'Costo unit.', width: 110, align: 'right', render: (row) => formatMoney(row.unitCost) },
  {
    key: 'previousCost',
    title: 'Costo anterior',
    width: 120,
    align: 'right',
    render: (row) => (row.previousCost === null ? '-' : formatMoney(row.previousCost)),
  },
  { key: 'total', title: 'Total', width: 110, align: 'right', render: (row) => formatMoney(row.total) },
];

/** Columnas de las lineas de la factura del proveedor. */
const INVOICE_COLUMNS = [
  { key: 'name', title: 'Producto', width: 180, flex: 2 },
  { key: 'quantity', title: 'Cant.', width: 70, align: 'right' },
  { key: 'unitPrice', title: 'Precio unit.', width: 110, align: 'right', render: (row) => formatMoney(row.unitPrice) },
  { key: 'discount', title: 'Descuento', width: 100, align: 'right', render: (row) => formatMoney(row.discount) },
  { key: 'taxRatePercent', title: 'IVA %', width: 70, align: 'right', render: (row) => formatPercent(row.taxRatePercent) },
  { key: 'tax', title: 'IVA', width: 100, align: 'right', render: (row) => formatMoney(row.tax) },
  { key: 'total', title: 'Total', width: 110, align: 'right', render: (row) => formatMoney(row.total) },
];

/**
 * @param {{ purchaseId: string, onClose?: () => void }} props
 */
export default function PurchaseDetail({ purchaseId, onClose }) {
  const { navigate } = useNavigation();
  const { data: purchase, error, isLoading, reload } = useAsync(() => getPurchase(purchaseId), [purchaseId]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <SectionTitle title={purchase ? `Compra ${purchase.purchaseNumber}` : 'Detalle de compra'} style={styles.title} />
        {onClose ? <AppButton title="Cerrar" variant="secondary" onPress={onClose} /> : null}
      </View>
      {isLoading ? <LoadingState label="Cargando compra..." /> : null}
      {error ? (
        <View style={styles.block}>
          <ErrorBanner message={describeError(error)} />
          <AppButton title="Reintentar" variant="secondary" onPress={reload} />
        </View>
      ) : null}

      {purchase && !isLoading ? (
        <View>
          {/* Datos generales */}
          <DetailRow label="Proveedor">
            <Text style={styles.value}>{`${purchase.supplier.supplierCode} - ${purchase.supplier.name}`}</Text>
            <Text style={styles.meta}>{`NIT ${purchase.supplier.nit}`}</Text>
          </DetailRow>
          <DetailRow label="Fecha de compra" value={formatDateTime(purchase.purchasedAt)} />
          <DetailRow label="Registrada" value={formatDateTime(purchase.createdAt)} />
          <DetailRow label="Metodo de pago" value={labelOf(PAYMENT_LABELS, purchase.paymentMethod)} />
          <DetailRow label="Factura del proveedor" value={textOr(purchase.supplierInvoiceNumber)} />
          <DetailRow label="Notas" value={textOr(purchase.notes)} />
          <DetailRow label="Total">
            <Text style={styles.total}>{formatMoney(purchase.totalCost)}</Text>
          </DetailRow>
          <AppButton
            title="Ver proveedor"
            variant="secondary"
            style={styles.inlineButton}
            onPress={() => navigate(ROUTES.ADMIN_SUPPLIER_DETAIL, { supplierId: purchase.supplierId })}
          />

          {/* Lineas de la compra */}
          <Text style={styles.section}>Productos comprados</Text>
          <DataTable
            columns={ITEM_COLUMNS}
            data={purchase.items}
            keyExtractor={(row) => row.productId}
            onRowPress={(row) => navigate(ROUTES.ADMIN_INVENTORY_DETAIL, { productId: row.productId })}
            emptyMessage="Sin lineas."
            dense
          />

          {/* Factura contable del proveedor */}
          <Text style={styles.section}>Factura de proveedor</Text>
          {purchase.invoice ? (
            <View>
              <DetailRow label="Numero" value={purchase.invoice.invoiceNumber} />
              <DetailRow label="Emitida" value={formatDateTime(purchase.invoice.issuedAt)} />
              <DetailRow label="Estado">
                <StatusBadge status={purchase.invoice.status} />
              </DetailRow>
              <DetailRow label="Emisor" value={`${purchase.invoice.entityName} (NIT ${purchase.invoice.nit})`} />
              <DataTable
                columns={INVOICE_COLUMNS}
                data={purchase.invoice.items}
                keyExtractor={(row) => row.productId}
                emptyMessage="Sin lineas."
                dense
              />
              <DetailRow label="Subtotal" value={formatMoney(purchase.invoice.subtotal)} />
              <DetailRow label="Descuentos" value={formatMoney(purchase.invoice.discountTotal)} />
              <DetailRow label="IVA" value={formatMoney(purchase.invoice.taxTotal)} />
              <DetailRow label="Total general">
                <Text style={styles.total}>{formatMoney(purchase.invoice.grandTotal)}</Text>
              </DetailRow>
              <AppButton
                title="Abrir factura"
                variant="secondary"
                style={styles.inlineButton}
                onPress={() => navigate(ROUTES.ADMIN_INVOICE_DETAIL, { invoiceId: purchase.invoice.id })}
              />
            </View>
          ) : (
            <Text style={styles.meta}>La compra no tiene factura asociada.</Text>
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, marginBottom: spacing.md },
  block: { gap: spacing.sm, marginBottom: spacing.md },
  value: { fontSize: typography.body, color: colors.textPrimary },
  meta: { fontSize: typography.small, color: colors.textSecondary },
  total: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  section: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  inlineButton: { alignSelf: 'flex-start', marginTop: spacing.md },
});
