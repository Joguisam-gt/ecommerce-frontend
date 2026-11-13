/**
 * Panel de detalle de una transferencia pendiente: datos del pago, visor del comprobante
 * y acciones Aprobar / Rechazar (PATCH /admin/orders/:id/reconcile) con ConfirmModal.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppTextInput, Card, ConfirmModal, DetailRow, ErrorBanner, StatusBadge } from '../../../components';
import { reconcileOrder } from '../../../services/admin/adminOrderService';
import { colors, spacing, typography } from '../../../config/theme';
import { formatDateTime, formatMoney } from '../../../utils/format';
import { errorMessage } from '../reports/reportHelpers';
import { ReceiptViewer } from './ReceiptViewer';

/** Limites del motivo de rechazo (reconcileOrderSchema: minLength 3, maxLength 500). */
const REASON_MIN = 3;
const REASON_MAX = 500;

/**
 * @param {{ order: object, onResolved: (result: object, action: string) => void,
 *   onConflict: () => void, onClose: () => void }} props
 */
export function ReconciliationPanel({ order, onResolved, onConflict, onClose }) {
  const [modal, setModal] = useState(null); // 'approve' | 'reject' | null
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Al cambiar de orden se limpian el formulario y los errores.
  useEffect(() => {
    setModal(null);
    setReason('');
    setReasonError('');
    setError('');
  }, [order && order.id]);

  const transfer = (order && order.payment && order.payment.bankTransfer) || null;

  // Cierra el modal activo sin enviar.
  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setReasonError('');
  };

  // Envia la decision al backend; el motivo solo se envia al rechazar.
  const submit = async (action) => {
    const trimmed = reason.trim();
    if (action === 'reject' && (trimmed.length < REASON_MIN || trimmed.length > REASON_MAX)) {
      setReasonError(`El motivo es obligatorio (${REASON_MIN} a ${REASON_MAX} caracteres).`);
      return;
    }
    const body = action === 'reject' ? { action, reason: trimmed } : { action };
    setSubmitting(true);
    setError('');
    try {
      const result = await reconcileOrder(order.id, body);
      setModal(null);
      setReason('');
      onResolved(result, action);
    } catch (err) {
      setModal(null);
      // 409: la orden ya fue conciliada o su factura cambio; se refresca la cola.
      if (err && err.status === 409) {
        setError(`${errorMessage(err)} La cola se actualizo.`);
        onConflict();
      } else if (err && err.status === 400 && Array.isArray(err.details)) {
        setError(err.details.map((d) => d.message).join(' '));
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={styles.card}>
      {/* Encabezado del panel */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Pedido {order.orderNumber}
        </Text>
        <StatusBadge status={order.status} />
      </View>

      <ErrorBanner message={error} />

      {/* Datos del cliente y del pedido */}
      <DetailRow label="Cliente" value={order.customer ? order.customer.name : '-'} />
      <DetailRow label="Correo" value={(order.customer && order.customer.email) || '-'} />
      <DetailRow label="Telefono" value={(order.customer && order.customer.phone) || '-'} />
      <DetailRow label="Fecha" value={formatDateTime(order.createdAt)} />
      <DetailRow label="Total del pedido" value={formatMoney(order.totals ? order.totals.grandTotal : 0)} />

      {/* Datos de la transferencia */}
      <Text style={styles.section}>Transferencia</Text>
      {transfer ? (
        <>
          <DetailRow label="Banco" value={transfer.bankName} />
          <DetailRow label="Cuenta de origen" value={transfer.senderAccountNumber || '-'} />
          <DetailRow label="Monto transferido" value={formatMoney(transfer.transferAmount)} />
          <DetailRow label="Autorizacion" value={transfer.authorizationNumber} />
          {order.totals && Number(transfer.transferAmount) !== Number(order.totals.grandTotal) ? (
            <Text style={styles.warning}>El monto transferido no coincide con el total del pedido.</Text>
          ) : null}
        </>
      ) : (
        <Text style={styles.muted}>Sin datos de transferencia.</Text>
      )}

      {/* Comprobante */}
      <Text style={styles.section}>Comprobante</Text>
      <ReceiptViewer url={transfer ? transfer.receiptUrl : null} />

      {/* Acciones */}
      <View style={styles.actions}>
        <AppButton title="Aprobar" onPress={() => setModal('approve')} disabled={submitting} style={styles.action} />
        <AppButton title="Rechazar" variant="danger" onPress={() => setModal('reject')} disabled={submitting} style={styles.action} />
        <AppButton title="Cerrar" variant="secondary" onPress={onClose} disabled={submitting} style={styles.action} />
      </View>

      {/* Confirmacion de aprobacion */}
      <ConfirmModal
        visible={modal === 'approve'}
        title="Aprobar transferencia"
        message={`Se marcara el pedido ${order.orderNumber} como pagado y su factura como pagada.`}
        confirmLabel="Aprobar"
        tone="primary"
        loading={submitting}
        onConfirm={() => submit('approve')}
        onCancel={closeModal}
      />

      {/* Confirmacion de rechazo con motivo obligatorio */}
      <ConfirmModal
        visible={modal === 'reject'}
        title="Rechazar transferencia"
        message={`Se rechazara el pedido ${order.orderNumber}: se anula la factura, se devuelve el stock y se libera el cupon.`}
        confirmLabel="Rechazar"
        tone="danger"
        loading={submitting}
        onConfirm={() => submit('reject')}
        onCancel={closeModal}
      >
        <AppTextInput
          label="Motivo del rechazo (obligatorio)"
          value={reason}
          onChangeText={(text) => {
            setReason(text);
            if (reasonError) setReasonError('');
          }}
          error={reasonError}
          placeholder="Ej.: el monto no coincide con el comprobante"
          maxLength={REASON_MAX}
          multiline
        />
      </ConfirmModal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginRight: spacing.sm },
  section: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  muted: { color: colors.textSecondary, fontSize: typography.body },
  warning: { color: colors.danger, fontSize: typography.small, marginTop: spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, marginHorizontal: -spacing.xs },
  action: { flexGrow: 1, margin: spacing.xs, minWidth: 120 },
});

export default ReconciliationPanel;
