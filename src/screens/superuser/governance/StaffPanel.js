/**
 * Panel de gestion del personal (GET/POST /superuser/staff, PATCH /:id/role y /:id/status).
 * Listado paginado con filtros de listStaffQuerySchema (role, isActive, search), cambio de rol
 * admin <-> superuser y activacion/desactivacion con ConfirmModal, alta de personal y mensajes
 * claros para LAST_SUPERUSER, SELF_LOCKOUT y SELF_MODIFICATION_FORBIDDEN.
 * Las acciones sobre la propia cuenta (useAuth().user.id) quedan deshabilitadas.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  ConfirmModal,
  DataTable,
  FilterBar,
  StatusBadge,
} from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { ROLE_LABELS } from '../../../config/constants';
import { useAuth } from '../../../context/AuthContext';
import { useQueryFilters } from '../../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../../hooks/usePaginatedResource';
import { changeStaffRole, changeStaffStatus, listStaff } from '../../../services/superuser/staffService';
import { formatDateTime } from '../../../utils/format';
import { describeApiError } from './governanceErrors';
import { PanelNotice } from './PanelNotice';
import { StaffCreateForm } from './StaffCreateForm';
import { STAFF_ROLES, nextStaffRole } from './staffForm';

/** Filtros exactos de listStaffQuerySchema (los valores 'all' y '' no se envian). */
const FILTER_FIELDS = [
  { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Nombre o correo' },
  {
    key: 'role',
    label: 'Rol',
    type: 'select',
    options: STAFF_ROLES.map((role) => ({ label: ROLE_LABELS[role] || role, value: role })),
  },
  {
    key: 'isActive',
    label: 'Estado',
    type: 'select',
    options: [
      { label: 'Activas', value: 'true' },
      { label: 'Inactivas', value: 'false' },
    ],
  },
];

/** Valores iniciales de los filtros. */
const INITIAL_FILTERS = { search: '', role: 'all', isActive: 'all' };

/** Nombre completo de una cuenta. */
function fullName(row) {
  return `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Sin nombre';
}

export function StaffPanel() {
  const { user } = useAuth();
  const selfId = user ? user.id : null;
  const filters = useQueryFilters(INITIAL_FILTERS);
  const { items, meta, loading, error, reload } = usePaginatedResource(listStaff, filters.query);
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState('');
  // Accion pendiente de confirmacion: { type: 'role'|'status', row, value }.
  const [pending, setPending] = useState(null);
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState(false);

  /** Abre la confirmacion de una accion de fila. */
  const askAction = (type, row) => {
    setActionError('');
    setNotice('');
    setPending({ type, row, value: type === 'role' ? nextStaffRole(row.role) : !row.isActive });
  };

  /** Cierra la confirmacion (salvo durante el envio). */
  const closeModal = () => {
    if (acting) return;
    setPending(null);
    setActionError('');
  };

  /** Ejecuta la accion confirmada y recarga el listado. */
  const confirmAction = async () => {
    if (!pending) return;
    setActing(true);
    setActionError('');
    try {
      if (pending.type === 'role') {
        await changeStaffRole(pending.row.id, pending.value);
        setNotice(`${fullName(pending.row)} ahora es ${ROLE_LABELS[pending.value] || pending.value}. Sus sesiones fueron cerradas.`);
      } else {
        await changeStaffStatus(pending.row.id, pending.value);
        setNotice(`La cuenta de ${fullName(pending.row)} fue ${pending.value ? 'activada' : 'desactivada'}.`);
      }
      setPending(null);
      reload();
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setActing(false);
    }
  };

  /** Alta completada: oculta el formulario y recarga. */
  const handleCreated = (created) => {
    setShowCreate(false);
    setNotice(`Cuenta creada: ${created ? created.email : ''}.`);
    reload();
  };

  /** Columnas del listado: nombre, correo, rol, estado, ultimo acceso y acciones. */
  const columns = [
    {
      key: 'name',
      title: 'Nombre',
      width: 180,
      flex: 2,
      render: (row) => (row.id === selfId ? `${fullName(row)} (tu)` : fullName(row)),
    },
    { key: 'email', title: 'Correo', width: 220, flex: 2, render: (row) => row.email },
    { key: 'role', title: 'Rol', width: 130, render: (row) => ROLE_LABELS[row.role] || row.role },
    {
      key: 'isActive',
      title: 'Estado',
      width: 110,
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'lastLoginAt',
      title: 'Ultimo acceso',
      width: 150,
      render: (row) => (row.lastLoginAt ? formatDateTime(row.lastLoginAt) : 'Nunca'),
    },
    {
      key: 'actions',
      title: 'Acciones',
      width: 300,
      flex: 3,
      render: (row) => {
        const isSelf = row.id === selfId;
        // La propia cuenta no se puede degradar ni desactivar desde aqui.
        if (isSelf) return <Text style={styles.selfNote}>Tu cuenta: sin acciones</Text>;
        return (
          <View style={styles.rowActions}>
            <AppButton
              title={row.role === 'superuser' ? 'Hacer admin' : 'Hacer superusuario'}
              variant="secondary"
              onPress={() => askAction('role', row)}
              accessibilityLabel={`Cambiar rol de ${fullName(row)}`}
              style={styles.rowButton}
            />
            <AppButton
              title={row.isActive ? 'Desactivar' : 'Activar'}
              variant={row.isActive ? 'danger' : 'primary'}
              onPress={() => askAction('status', row)}
              accessibilityLabel={`${row.isActive ? 'Desactivar' : 'Activar'} cuenta de ${fullName(row)}`}
              style={styles.rowButton}
            />
          </View>
        );
      },
    },
  ];

  /** Texto del modal segun la accion pendiente. */
  const modalTitle = pending && pending.type === 'role' ? 'Cambiar rol' : pending && pending.value ? 'Activar cuenta' : 'Desactivar cuenta';
  const modalMessage = !pending
    ? ''
    : pending.type === 'role'
      ? `${fullName(pending.row)} (${pending.row.email}) pasara de ${ROLE_LABELS[pending.row.role] || pending.row.role} a ${ROLE_LABELS[pending.value] || pending.value}. Se cerraran todas sus sesiones activas.`
      : pending.value
        ? `Se reactivara la cuenta de ${fullName(pending.row)} (${pending.row.email}).`
        : `Se desactivara la cuenta de ${fullName(pending.row)} (${pending.row.email}) y se cerraran sus sesiones. Si es el ultimo superusuario activo, el sistema lo impedira.`;
  const dangerous = pending && (pending.type === 'status' ? !pending.value : pending.value === 'admin');

  return (
    <View>
      {/* Cabecera del panel con el boton de alta */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            Personal administrativo
          </Text>
          <Text style={styles.subtitle}>Administradores y superusuarios con acceso al panel.</Text>
        </View>
        {!showCreate ? (
          <AppButton title="Nuevo miembro" onPress={() => { setNotice(''); setShowCreate(true); }} />
        ) : null}
      </View>

      <PanelNotice message={notice} tone="success" />
      {showCreate ? <StaffCreateForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} /> : null}

      {/* Filtros y listado paginado */}
      <FilterBar
        fields={FILTER_FIELDS}
        values={filters.values}
        onChange={filters.setValue}
        onApply={filters.apply}
        onReset={filters.reset}
        applying={loading}
      />
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(row) => row.id}
        loading={loading}
        error={error ? describeApiError(error) : null}
        onRetry={reload}
        emptyMessage="No hay personal que coincida con los filtros."
        pagination={{
          page: (meta && meta.page) || filters.page,
          totalPages: (meta && meta.totalPages) || 1,
          total: (meta && meta.total) || 0,
          onPageChange: filters.setPage,
        }}
      />

      {/* Confirmacion de cambio de rol o estado */}
      <ConfirmModal
        visible={Boolean(pending)}
        title={modalTitle}
        message={modalMessage}
        confirmLabel={pending && pending.type === 'role' ? 'Cambiar rol' : pending && pending.value ? 'Activar' : 'Desactivar'}
        tone={dangerous ? 'danger' : 'primary'}
        onConfirm={confirmAction}
        onCancel={closeModal}
        loading={acting}
      >
        <PanelNotice message={actionError} tone="danger" />
      </ConfirmModal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerText: { flexShrink: 1 },
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: typography.small, color: colors.textSecondary, marginTop: spacing.xs },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rowButton: { paddingHorizontal: spacing.md },
  selfNote: { fontSize: typography.small, color: colors.textSecondary, fontStyle: 'italic' },
});

export default StaffPanel;
