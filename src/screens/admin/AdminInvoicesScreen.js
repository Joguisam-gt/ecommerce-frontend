/**
 * Facturacion administrativa: tabla filtrable de facturas de clientes y de
 * proveedores (GET /admin/invoices segun listAdminInvoicesQuerySchema: nit,
 * entityName, email, shippingAddress, paymentMethod, entityType, status,
 * startDate, endDate) con las columnas de AdminInvoiceDTO.summary.
 */
import React from 'react';
import { AdminPage, DataTable, FilterBar, StatusBadge } from '../../components';
import { useQueryFilters } from '../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../hooks/usePaginatedResource';
import { listInvoices } from '../../services/admin/adminInvoiceService';
import { ROUTES } from '../../navigation/routes';
import { useNavigation } from '../../navigation/NavigationContext';
import { formatDate, formatMoney } from '../../utils/format';
import {
  describeError,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  labelOf,
  PAYMENT_LABELS,
  PAYMENT_OPTIONS,
  textOr,
} from './inventory/adminHelpers';

/** Filtros con las claves exactas del backend. */
const FIELDS = [
  { key: 'entityType', label: 'Tipo', type: 'select', options: ENTITY_TYPE_OPTIONS },
  { key: 'status', label: 'Estado', type: 'select', options: INVOICE_STATUS_OPTIONS },
  { key: 'paymentMethod', label: 'Metodo de pago', type: 'select', options: PAYMENT_OPTIONS },
  { key: 'nit', label: 'NIT', type: 'text', placeholder: '1234567-8 o CF' },
  { key: 'entityName', label: 'Nombre del receptor/emisor', type: 'text', placeholder: 'Nombre' },
  { key: 'email', label: 'Correo', type: 'text', placeholder: 'correo@dominio.com' },
  { key: 'shippingAddress', label: 'Direccion', type: 'text', placeholder: 'Ciudad, linea...' },
  { key: 'startDate', label: 'Desde', type: 'date', placeholder: 'AAAA-MM-DD' },
  { key: 'endDate', label: 'Hasta', type: 'date', placeholder: 'AAAA-MM-DD' },
];

/** Valores iniciales. */
const INITIAL = FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});

/** Referencia del documento origen: pedido (cliente) o compra (proveedor). */
function referenceOf(row) {
  if (row.entityType === 'proveedor') return row.purchaseId ? `Compra ${row.purchaseId.slice(-6)}` : '-';
  return textOr(row.orderNumber);
}

/** Columnas segun AdminInvoiceDTO.summary. */
const COLUMNS = [
  { key: 'invoiceNumber', title: 'Factura', width: 140 },
  { key: 'issuedAt', title: 'Emision', width: 110, render: (row) => formatDate(row.issuedAt) },
  { key: 'entityType', title: 'Tipo', width: 100, render: (row) => labelOf(ENTITY_TYPE_LABELS, row.entityType) },
  { key: 'nit', title: 'NIT', width: 110 },
  { key: 'entityName', title: 'Receptor/Emisor', width: 180, flex: 2 },
  { key: 'email', title: 'Correo', width: 180, flex: 1.5, render: (row) => textOr(row.email) },
  { key: 'reference', title: 'Pedido/Compra', width: 140, render: referenceOf },
  { key: 'paymentMethod', title: 'Pago', width: 120, render: (row) => labelOf(PAYMENT_LABELS, row.paymentMethod) },
  { key: 'itemsCount', title: 'Lineas', width: 70, align: 'right' },
  { key: 'status', title: 'Estado', width: 140, render: (row) => <StatusBadge status={row.status} /> },
  { key: 'grandTotal', title: 'Total', width: 120, align: 'right', render: (row) => formatMoney(row.grandTotal) },
];

/** Pantalla del listado de facturas. */
export default function AdminInvoicesScreen() {
  const { navigate } = useNavigation();
  const filters = useQueryFilters(INITIAL);
  const { items, meta, loading, error, reload } = usePaginatedResource(listInvoices, filters.query);

  return (
    <AdminPage title="Facturacion" subtitle="Facturas de venta (clientes) y de compra (proveedores).">
      <FilterBar
        fields={FIELDS}
        values={filters.values}
        onChange={filters.setValue}
        onApply={filters.apply}
        onReset={filters.reset}
        applying={loading}
      />
      <DataTable
        columns={COLUMNS}
        data={items}
        keyExtractor={(row) => row.id}
        onRowPress={(row) => navigate(ROUTES.ADMIN_INVOICE_DETAIL, { invoiceId: row.id })}
        loading={loading}
        error={describeError(error)}
        onRetry={reload}
        emptyMessage="No hay facturas con estos filtros."
        pagination={{
          page: filters.page,
          totalPages: meta.totalPages || 1,
          total: meta.total || 0,
          onPageChange: filters.setPage,
        }}
      />
    </AdminPage>
  );
}
