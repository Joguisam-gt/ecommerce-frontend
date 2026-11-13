/**
 * Visor paginado de audit_logs (GET /superuser/audit-logs, solo lectura).
 * Filtros de superuserAuditLogsQuerySchema: action, actorId, role, targetCollection, startDate, endDate;
 * tamano de pagina hasta 100. Al seleccionar una fila se abre el detalle con previousState, newState y
 * metadata en JSON. Escritorio: detalle al lado de la tabla; movil: debajo.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DataTable, FilterBar, SegmentedControl } from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { ROLE_LABELS } from '../../../config/constants';
import { useQueryFilters } from '../../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../../hooks/usePaginatedResource';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { listAuditLogs } from '../../../services/superuser/auditLogService';
import { formatDateTime } from '../../../utils/format';
import { AuditLogDetail } from './AuditLogDetail';
import { AUDIT_COLLECTIONS, AUDIT_PAGE_SIZES, validateAuditFilters } from './auditLogHelpers';
import { describeApiError } from './governanceErrors';
import { PanelNotice } from './PanelNotice';

/** Filtros exactos del backend (role = rol del actor). */
const FILTER_FIELDS = [
  { key: 'action', label: 'Accion', type: 'text', placeholder: 'record.purged' },
  { key: 'actorId', label: 'Id del actor', type: 'text', placeholder: '24 caracteres hexadecimales' },
  {
    key: 'role',
    label: 'Rol del actor',
    type: 'select',
    options: ['superuser', 'admin', 'user'].map((role) => ({ label: ROLE_LABELS[role] || role, value: role })),
  },
  {
    key: 'targetCollection',
    label: 'Coleccion',
    type: 'select',
    options: AUDIT_COLLECTIONS.map((name) => ({ label: name, value: name })),
  },
  { key: 'startDate', label: 'Desde', type: 'date', placeholder: 'AAAA-MM-DD' },
  { key: 'endDate', label: 'Hasta', type: 'date', placeholder: 'AAAA-MM-DD' },
];

/** Valores iniciales de los filtros. */
const INITIAL_FILTERS = { action: '', actorId: '', role: 'all', targetCollection: 'all', startDate: '', endDate: '' };

/** Opciones del tamano de pagina. */
const PAGE_SIZE_OPTIONS = AUDIT_PAGE_SIZES.map((size) => ({ label: String(size), value: size }));

/** Columnas: fecha, actor, rol, accion, coleccion e id objetivo. */
const COLUMNS = [
  { key: 'timestamp', title: 'Fecha', width: 150, render: (row) => formatDateTime(row.timestamp || row.createdAt) },
  { key: 'actorId', title: 'Actor', width: 210, flex: 2, render: (row) => row.actorId || 'Sistema' },
  { key: 'actorRole', title: 'Rol', width: 120, render: (row) => ROLE_LABELS[row.actorRole] || row.actorRole || '-' },
  { key: 'action', title: 'Accion', width: 180, flex: 2, render: (row) => row.action },
  { key: 'targetCollection', title: 'Coleccion', width: 140, render: (row) => row.targetCollection || '-' },
  { key: 'targetId', title: 'Id objetivo', width: 210, flex: 2, render: (row) => row.targetId || '-' },
];

export function AuditLogPanel() {
  const { isDesktop } = useResponsiveLayout();
  const [pageSize, setPageSize] = useState(AUDIT_PAGE_SIZES[0]);
  // El hook incluye page y limit (tamano elegido, maximo 100) en el query.
  const filters = useQueryFilters(INITIAL_FILTERS, { limit: pageSize });
  const [filterError, setFilterError] = useState('');
  const [selected, setSelected] = useState(null);

  const { items, meta, loading, error, reload } = usePaginatedResource(listAuditLogs, filters.query);

  /** Valida los filtros en el cliente antes de aplicarlos (mismas reglas del backend). */
  const handleApply = () => {
    const problem = validateAuditFilters(filters.values);
    setFilterError(problem || '');
    if (!problem) {
      setSelected(null);
      filters.apply();
    }
  };

  /** Restablece filtros y seleccion. */
  const handleReset = () => {
    setFilterError('');
    setSelected(null);
    filters.reset();
  };

  /** Cambia el tamano de pagina y vuelve a la primera pagina. */
  const handlePageSize = (size) => {
    setPageSize(size);
    filters.setPage(1);
  };

  const table = (
    <DataTable
      columns={COLUMNS}
      data={items}
      keyExtractor={(row) => row.id}
      onRowPress={(row) => setSelected(row)}
      selectedKey={selected ? selected.id : undefined}
      loading={loading}
      error={error ? describeApiError(error) : null}
      onRetry={reload}
      emptyMessage="No hay entradas de auditoria para estos filtros."
      dense
      pagination={{
        page: (meta && meta.page) || filters.page,
        totalPages: (meta && meta.totalPages) || 1,
        total: (meta && meta.total) || 0,
        onPageChange: filters.setPage,
      }}
    />
  );

  return (
    <View>
      <Text style={styles.title} accessibilityRole="header">
        Bitacora de auditoria
      </Text>
      <Text style={styles.subtitle}>Registro inmutable de las acciones sensibles. Solo lectura.</Text>

      {/* Filtros y tamano de pagina */}
      <FilterBar
        fields={FILTER_FIELDS}
        values={filters.values}
        onChange={filters.setValue}
        onApply={handleApply}
        onReset={handleReset}
        applying={loading}
      />
      <PanelNotice message={filterError} tone="danger" />
      <View style={styles.pageSizeRow}>
        <Text style={styles.label}>Entradas por pagina</Text>
        <SegmentedControl
          options={PAGE_SIZE_OPTIONS}
          value={pageSize}
          onChange={handlePageSize}
          accessibilityLabel="Entradas por pagina"
        />
      </View>

      {/* Tabla y detalle: lado a lado en escritorio, apilados en movil */}
      {isDesktop ? (
        <View style={styles.split}>
          <View style={styles.tableCol}>{table}</View>
          <View style={styles.detailCol}>
            <AuditLogDetail entry={selected} onClose={() => setSelected(null)} />
          </View>
        </View>
      ) : (
        <View>
          {table}
          {selected ? (
            <View style={styles.detailBelow}>
              <AuditLogDetail entry={selected} onClose={() => setSelected(null)} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: typography.small, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  label: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  pageSizeRow: { marginBottom: spacing.sm },
  split: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  tableCol: { flex: 3, minWidth: 0 },
  detailCol: { flex: 2, minWidth: 280 },
  detailBelow: { marginTop: spacing.lg },
});

export default AuditLogPanel;
