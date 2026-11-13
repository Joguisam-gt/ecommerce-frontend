/**
 * Directorio de clientes: tabla filtrable (GET /admin/customers segun
 * listCustomersQuerySchema) con las columnas de CustomerDTO: codigo, nombre,
 * correo, telefono, pedidos, articulos, devoluciones, total comprado, metodo
 * preferido y estado. La fila abre el detalle del cliente.
 */
import React from 'react';
import { AdminPage, DataTable, FilterBar, StatusBadge } from '../../components';
import { useQueryFilters } from '../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../hooks/usePaginatedResource';
import { listCustomers } from '../../services/admin/customerService';
import { ROUTES } from '../../navigation/routes';
import { useNavigation } from '../../navigation/NavigationContext';
import { formatDate, formatMoney } from '../../utils/format';
import { describeError, labelOf, PAYMENT_LABELS, PAYMENT_OPTIONS, textOr } from './inventory/adminHelpers';

/** Filtros con las claves exactas del backend. */
const FIELDS = [
  { key: 'userCode', label: 'Codigo', type: 'text', placeholder: 'Codigo de cliente' },
  { key: 'name', label: 'Nombre', type: 'text', placeholder: 'Nombre o apellido' },
  { key: 'email', label: 'Correo', type: 'text', placeholder: 'correo@dominio.com' },
  { key: 'phone', label: 'Telefono', type: 'text', placeholder: '+502 5555-5555' },
  { key: 'isActive', label: 'Activo', type: 'boolean' },
  { key: 'includeInactive', label: 'Incluir inactivos', type: 'boolean' },
  { key: 'preferredPaymentMethod', label: 'Metodo preferido', type: 'select', options: PAYMENT_OPTIONS },
  { key: 'minTotalSpent', label: 'Gasto minimo (Q)', type: 'number', placeholder: '0.00' },
  { key: 'maxTotalSpent', label: 'Gasto maximo (Q)', type: 'number', placeholder: '0.00' },
  { key: 'minPurchasedItems', label: 'Articulos minimos', type: 'number', placeholder: '0' },
];

/** Valores iniciales de filtros. */
const INITIAL = FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});

/** Columnas segun CustomerDTO. */
const COLUMNS = [
  { key: 'userCode', title: 'Codigo', width: 130 },
  { key: 'name', title: 'Nombre', width: 180, flex: 2 },
  { key: 'email', title: 'Correo', width: 200, flex: 2 },
  { key: 'phone', title: 'Telefono', width: 120, render: (row) => textOr(row.phone) },
  { key: 'ordersCount', title: 'Pedidos', width: 80, align: 'right' },
  { key: 'purchasedItems', title: 'Articulos', width: 90, align: 'right' },
  { key: 'returnedItems', title: 'Devueltos', width: 90, align: 'right' },
  { key: 'totalSpent', title: 'Total comprado', width: 130, align: 'right', render: (row) => formatMoney(row.totalSpent) },
  {
    key: 'preferredPaymentMethod',
    title: 'Metodo preferido',
    width: 140,
    render: (row) => labelOf(PAYMENT_LABELS, row.preferredPaymentMethod),
  },
  { key: 'isActive', title: 'Estado', width: 100, render: (row) => <StatusBadge status={Boolean(row.isActive)} /> },
  { key: 'createdAt', title: 'Alta', width: 100, render: (row) => formatDate(row.createdAt) },
];

/** Pantalla del directorio de clientes. */
export default function AdminCustomersScreen() {
  const { navigate } = useNavigation();
  const filters = useQueryFilters(INITIAL);
  const { items, meta, loading, error, reload } = usePaginatedResource(listCustomers, filters.query);

  return (
    <AdminPage title="Clientes" subtitle="Directorio de clientes con metricas de compra.">
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
        onRowPress={(row) => navigate(ROUTES.ADMIN_CUSTOMER_DETAIL, { customerId: row.id })}
        loading={loading}
        error={describeError(error)}
        onRetry={reload}
        emptyMessage="No hay clientes con estos filtros."
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
