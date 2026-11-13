/**
 * Listado de cupones (GET /admin/coupons) con filtro por estado (activos por defecto) y
 * por codigo, y accion "Desactivar" (PATCH /admin/coupons/:id/deactivate) con ConfirmModal.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, ConfirmModal, DataTable, ErrorBanner, FilterBar, SegmentedControl, StatusBadge } from '../../../components';
import { useQueryFilters } from '../../../hooks/useQueryFilters';
import { usePaginatedResource } from '../../../hooks/usePaginatedResource';
import { deactivateCoupon, listCoupons } from '../../../services/admin/adminCouponService';
import { colors, spacing, typography } from '../../../config/theme';
import { formatDate, formatMoney } from '../../../utils/format';
import { errorMessage } from '../reports/reportHelpers';
import { couponDiscountLabel, couponStatus } from './couponHelpers';

/** Opciones del filtro de estado (isActive del validator; 'all' se omite en la query). */
const STATUS_OPTIONS = [
  { label: 'Activos', value: 'true' },
  { label: 'Inactivos', value: 'false' },
  { label: 'Todos', value: 'all' },
];

/** Filtro por codigo (listCouponsQuerySchema.code). */
const FILTER_FIELDS = [{ key: 'code', label: 'Codigo', type: 'text', placeholder: 'Ej.: VERANO2026' }];

/** @param {{ reloadSignal: number }} props Cambia reloadSignal para forzar la recarga (p. ej. tras crear). */
export function CouponList({ reloadSignal }) {
  const filters = useQueryFilters({ code: '' });
  const [status, setStatus] = useState('true');
  const [target, setTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  // Query final: filtros aplicados + estado ('all' no envia isActive).
  const query = useMemo(() => {
    const next = { ...filters.query };
    if (status !== 'all') next.isActive = status;
    return next;
  }, [filters.query, status]);
  const coupons = usePaginatedResource(listCoupons, query);
  const meta = coupons.meta || {};

  // Recarga cuando el padre avisa (cupon recien creado); se ignora el primer render.
  const firstSignal = useRef(true);
  const reloadRef = useRef(coupons.reload);
  reloadRef.current = coupons.reload;
  useEffect(() => {
    if (firstSignal.current) {
      firstSignal.current = false;
      return;
    }
    reloadRef.current();
  }, [reloadSignal]);

  // Cambiar de estado vuelve a la primera pagina.
  const changeStatus = (value) => {
    setStatus(value);
    filters.setPage(1);
  };

  // Desactiva el cupon elegido y recarga el listado.
  const confirmDeactivate = async () => {
    setDeactivating(true);
    setActionError('');
    try {
      await deactivateCoupon(target.id);
      setNotice(`Cupon ${target.code} desactivado.`);
      setTarget(null);
      coupons.reload();
    } catch (err) {
      setTarget(null);
      setActionError(errorMessage(err));
      if (err && err.status === 409) coupons.reload();
    } finally {
      setDeactivating(false);
    }
  };

  // Columnas: codigo, descuento, expiracion, usos, estado y accion.
  const columns = useMemo(
    () => [
      { key: 'code', title: 'Codigo', width: 150 },
      { key: 'discount', title: 'Descuento', width: 110, align: 'right', render: (row) => couponDiscountLabel(row, formatMoney) },
      { key: 'expiresAt', title: 'Expiracion', width: 130, render: (row) => (row.isPermanent ? 'Permanente' : formatDate(row.expiresAt)) },
      {
        key: 'uses',
        title: 'Usos',
        width: 120,
        align: 'right',
        render: (row) => `${row.usedCount || 0} / ${row.maxUses ? row.maxUses : 'sin limite'}`,
      },
      { key: 'scope', title: 'Alcance', width: 130, render: (row) => (row.isGlobal ? 'Global' : `${row.applicableProductIds.length} producto(s)`) },
      { key: 'status', title: 'Estado', width: 130, render: (row) => <StatusBadge status={couponStatus(row)} /> },
      {
        key: 'actions',
        title: 'Acciones',
        width: 150,
        render: (row) =>
          row.isActive ? (
            <AppButton
              title="Desactivar"
              variant="danger"
              onPress={() => {
                setNotice('');
                setTarget(row);
              }}
              accessibilityLabel={`Desactivar cupon ${row.code}`}
            />
          ) : (
            <Text style={styles.muted}>-</Text>
          ),
      },
    ],
    [],
  );

  return (
    <View>
      {/* Filtros: estado y codigo */}
      <Text style={styles.label}>Estado</Text>
      <SegmentedControl options={STATUS_OPTIONS} value={status} onChange={changeStatus} accessibilityLabel="Filtrar por estado" />
      <FilterBar
        fields={FILTER_FIELDS}
        values={filters.values}
        onChange={filters.setValue}
        onApply={filters.apply}
        onReset={filters.reset}
        applying={coupons.loading}
      />

      <ErrorBanner message={actionError} />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <DataTable
        columns={columns}
        data={coupons.items || []}
        keyExtractor={(row) => row.id}
        loading={coupons.loading}
        error={coupons.error}
        onRetry={coupons.reload}
        emptyMessage="No hay cupones con estos filtros."
        pagination={{
          page: filters.page,
          totalPages: meta.totalPages || 1,
          total: meta.total || 0,
          onPageChange: filters.setPage,
        }}
      />

      {/* Confirmacion de desactivacion */}
      <ConfirmModal
        visible={Boolean(target)}
        title="Desactivar cupon"
        message={target ? `El cupon ${target.code} dejara de aplicarse a nuevas compras.` : ''}
        confirmLabel="Desactivar"
        tone="danger"
        loading={deactivating}
        onConfirm={confirmDeactivate}
        onCancel={() => (deactivating ? null : setTarget(null))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  muted: { color: colors.textSecondary, fontSize: typography.body },
  notice: { color: colors.success, fontSize: typography.body, fontWeight: '600', marginBottom: spacing.md },
});

export default CouponList;
