/**
 * Proveedores: tabla filtrable (GET /admin/suppliers segun
 * listSuppliersQuerySchema: supplierCode, name, address, isActive) con las
 * columnas de SupplierDTO; alta y edicion, desactivacion y reactivacion, y
 * borrado fisico solo para superusuario (409 si tiene compras).
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AdminPage, AppButton, ConfirmModal, DataTable, ErrorBanner, FilterBar, StatusBadge } from '../../components';
import { useQueryFilters } from '../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../hooks/usePaginatedResource';
import { deactivateSupplier, deleteSupplier, listSuppliers, updateSupplier } from '../../services/admin/supplierService';
import { ROUTES } from '../../navigation/routes';
import { useNavigation } from '../../navigation/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../../config/theme';
import { formatDate } from '../../utils/format';
import SupplierForm from './suppliers/SupplierForm';
import { describeError, textOr } from './inventory/adminHelpers';

/** Prefijos admitidos por el filtro supplierCode del backend. */
const SUPPLIER_CODE_FILTER = /^(P|PR|PRV|PRV-[0-9]*)$/i;

/** Filtros visibles. */
const FIELDS = [
  { key: 'supplierCode', label: 'Codigo', type: 'text', placeholder: 'PRV-000001' },
  { key: 'name', label: 'Nombre', type: 'text', placeholder: 'Nombre del proveedor' },
  { key: 'address', label: 'Direccion', type: 'text', placeholder: 'Zona, ciudad...' },
  { key: 'isActive', label: 'Activo', type: 'boolean' },
];

/** Mensajes por codigo de error en acciones. */
const ACTION_ERRORS = {
  SUPPLIER_HAS_PURCHASES: 'No se puede eliminar: el proveedor tiene compras registradas. Desactivalo en su lugar.',
  HARD_DELETE_FORBIDDEN: 'El borrado fisico esta reservado al superusuario.',
};

/**
 * Boton compacto de accion dentro de una fila.
 * @param {{ label: string, onPress: Function, tone?: 'default'|'danger' }} props
 */
function RowAction({ label, onPress, tone = 'default' }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.rowAction, tone === 'danger' && styles.rowActionDanger]}
    >
      <Text style={[styles.rowActionText, tone === 'danger' && styles.rowActionTextDanger]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Pantalla de proveedores. */
export default function AdminSuppliersScreen() {
  const { navigate } = useNavigation();
  const { hasRole } = useAuth();
  const isSuperuser = hasRole('superuser');
  const filters = useQueryFilters({ supplierCode: '', name: '', address: '', isActive: '' });
  const { items, meta, loading, error, reload } = usePaginatedResource(listSuppliers, filters.query);
  const [editor, setEditor] = useState(null); // null | { supplierId: string | null }
  const [pending, setPending] = useState(null); // { type: 'deactivate'|'delete'|'activate', supplier }
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [filterError, setFilterError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Aplica filtros validando el formato del codigo (evita un 400).
  const applyFilters = () => {
    const code = String(filters.values.supplierCode || '').trim();
    if (code && !SUPPLIER_CODE_FILTER.test(code)) {
      setFilterError('Codigo invalido: usa PRV-000001 o un prefijo como PRV-0001.');
      return;
    }
    setFilterError(null);
    filters.apply();
  };

  // Ejecuta la accion confirmada.
  const runAction = async () => {
    if (!pending) return;
    setWorking(true);
    setActionError(null);
    const { type, supplier } = pending;
    try {
      if (type === 'deactivate') await deactivateSupplier(supplier.id);
      if (type === 'activate') await updateSupplier(supplier.id, { isActive: true });
      if (type === 'delete') await deleteSupplier(supplier.id);
      const verbs = { deactivate: 'desactivado', activate: 'reactivado', delete: 'eliminado' };
      setNotice(`Proveedor ${supplier.supplierCode} ${verbs[type]}.`);
      setPending(null);
      reload();
    } catch (err) {
      setPending(null);
      setActionError(ACTION_ERRORS[err && err.code] || describeError(err));
    } finally {
      setWorking(false);
    }
  };

  // Tras guardar en el formulario.
  const handleSaved = (supplier) => {
    setEditor(null);
    setNotice(supplier ? `Proveedor ${supplier.supplierCode} guardado.` : 'Proveedor guardado.');
    reload();
  };

  // Columnas segun SupplierDTO + acciones.
  const columns = [
    { key: 'supplierCode', title: 'Codigo', width: 120 },
    { key: 'name', title: 'Nombre', width: 180, flex: 2 },
    { key: 'nit', title: 'NIT', width: 110 },
    { key: 'contactName', title: 'Contacto', width: 150, render: (row) => textOr(row.contactName) },
    { key: 'phone', title: 'Telefono', width: 120, render: (row) => textOr(row.phone) },
    { key: 'email', title: 'Correo', width: 180, flex: 1.5, render: (row) => textOr(row.email) },
    { key: 'address', title: 'Direccion', width: 180, flex: 1.5, render: (row) => textOr(row.address) },
    { key: 'catalog', title: 'Catalogo', width: 90, align: 'right', render: (row) => String((row.catalog || []).length) },
    { key: 'isActive', title: 'Estado', width: 100, render: (row) => <StatusBadge status={Boolean(row.isActive)} /> },
    { key: 'createdAt', title: 'Alta', width: 100, render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      title: 'Acciones',
      width: isSuperuser ? 270 : 190,
      flex: 2,
      render: (row) => (
        <View style={styles.rowActions}>
          <RowAction label="Editar" onPress={() => setEditor({ supplierId: row.id })} />
          {row.isActive ? (
            <RowAction label="Desactivar" onPress={() => setPending({ type: 'deactivate', supplier: row })} />
          ) : (
            <RowAction label="Reactivar" onPress={() => setPending({ type: 'activate', supplier: row })} />
          )}
          {isSuperuser ? <RowAction label="Eliminar" tone="danger" onPress={() => setPending({ type: 'delete', supplier: row })} /> : null}
        </View>
      ),
    },
  ];

  // Texto del modal segun la accion pendiente.
  const modalCopy = {
    deactivate: { title: 'Desactivar proveedor', message: 'El proveedor no podra recibir nuevas compras. Puedes reactivarlo despues.', label: 'Desactivar', tone: 'primary' },
    activate: { title: 'Reactivar proveedor', message: 'El proveedor volvera a estar disponible para compras.', label: 'Reactivar', tone: 'primary' },
    delete: {
      title: 'Eliminar proveedor definitivamente',
      message: 'Borrado fisico irreversible. Solo es posible si el proveedor no tiene compras registradas.',
      label: 'Eliminar',
      tone: 'danger',
    },
  };
  const copy = pending ? modalCopy[pending.type] : null;

  return (
    <AdminPage
      title="Proveedores"
      subtitle="Directorio, catalogo y estado de proveedores."
      actions={!editor ? <AppButton title="Nuevo proveedor" onPress={() => setEditor({ supplierId: null })} /> : null}
    >
      {notice ? (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
      {actionError ? <ErrorBanner message={actionError} /> : null}

      {/* Formulario de alta o edicion */}
      {editor ? (
        <SupplierForm key={editor.supplierId || 'nuevo'} supplierId={editor.supplierId} onSaved={handleSaved} onCancel={() => setEditor(null)} />
      ) : null}

      {/* Listado */}
      {filterError ? <ErrorBanner message={filterError} /> : null}
      <FilterBar
        fields={FIELDS}
        values={filters.values}
        onChange={filters.setValue}
        onApply={applyFilters}
        onReset={() => {
          setFilterError(null);
          filters.reset();
        }}
        applying={loading}
      />
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(row) => row.id}
        onRowPress={(row) => navigate(ROUTES.ADMIN_SUPPLIER_DETAIL, { supplierId: row.id })}
        loading={loading}
        error={describeError(error)}
        onRetry={reload}
        emptyMessage="No hay proveedores con estos filtros."
        pagination={{
          page: filters.page,
          totalPages: meta.totalPages || 1,
          total: meta.total || 0,
          onPageChange: filters.setPage,
        }}
      />

      {/* Confirmacion de desactivar, reactivar o eliminar */}
      <ConfirmModal
        visible={Boolean(pending)}
        title={copy ? copy.title : ''}
        message={pending ? `${copy.message} Proveedor: ${pending.supplier.supplierCode} - ${pending.supplier.name}.` : ''}
        confirmLabel={copy ? copy.label : 'Confirmar'}
        tone={copy ? copy.tone : 'primary'}
        requireText={pending && pending.type === 'delete' ? pending.supplier.supplierCode : undefined}
        requireTextLabel={pending && pending.type === 'delete' ? `Escribe ${pending.supplier.supplierCode} para confirmar` : undefined}
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
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  rowAction: {
    minHeight: MIN_TOUCH_SIZE,
    minWidth: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowActionDanger: { borderColor: colors.danger },
  rowActionText: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary },
  rowActionTextDanger: { color: colors.danger },
});
