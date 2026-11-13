/**
 * Formulario de registro de merma (POST /admin/inventory/losses): producto,
 * cantidad, motivo (vencido o danado), notas y fecha opcional. Confirma con
 * ConfirmModal y muestra el stock anterior y el nuevo devueltos en meta.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppTextInput,
  Card,
  ConfirmModal,
  DateField,
  ErrorBanner,
  SectionTitle,
  SegmentedControl,
} from '../../../components';
import { getInventoryProduct, recordLossWithStock } from '../../../services/admin/inventoryService';
import { colors, spacing, typography } from '../../../config/theme';
import { formatMoney } from '../../../utils/format';
import ProductPicker from './ProductPicker';
import { describeError, LOSS_REASON_LABELS, LOSS_REASON_OPTIONS } from './adminHelpers';
import { buildLossBody, EMPTY_LOSS_FORM, validateLossForm } from './lossBody';

/**
 * Normaliza la respuesta de recordLossWithStock ({ data, meta }).
 * @param {{ data: object, meta: object }} result
 */
function splitResult(result) {
  if (result && result.data) return { loss: result.data, meta: result.meta || null };
  return { loss: result, meta: null };
}

/**
 * @param {{ initialProduct?: object | null, onRecorded?: () => void }} props
 */
export default function RecordLossForm({ initialProduct = null, onRecorded }) {
  const [product, setProduct] = useState(initialProduct);
  const [form, setForm] = useState({ ...EMPTY_LOSS_FORM, productId: initialProduct ? initialProduct.id : '' });
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [outcome, setOutcome] = useState(null);

  // Si cambia el producto inicial (params de ruta), se precarga.
  useEffect(() => {
    if (initialProduct && initialProduct.id) {
      setProduct(initialProduct);
      setForm((prev) => ({ ...prev, productId: initialProduct.id }));
    }
  }, [initialProduct]);

  // Actualiza un campo del formulario.
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Elige o limpia el producto.
  const handleProduct = (next) => {
    setProduct(next);
    setField('productId', next ? next.id : '');
  };

  // Valida y abre la confirmacion.
  const requestConfirm = () => {
    const nextErrors = validateLossForm(form);
    setErrors(nextErrors);
    setApiError(null);
    if (Object.keys(nextErrors).length === 0) setConfirming(true);
  };

  // Envia la merma y obtiene el stock anterior/nuevo.
  const submit = async () => {
    setSaving(true);
    setApiError(null);
    const body = buildLossBody(form);
    try {
      const { loss, meta } = splitResult(await recordLossWithStock(body));
      let stock = meta;
      // Si el servicio no expone meta, se deriva del stock actual del producto.
      if (!stock || stock.newStock === undefined) {
        const fresh = await getInventoryProduct(body.productId);
        stock = { previousStock: fresh.stock + body.quantity, newStock: fresh.stock };
      }
      setOutcome({ loss, previousStock: stock.previousStock, newStock: stock.newStock, productName: product ? product.name : '' });
      setConfirming(false);
      setForm({ ...EMPTY_LOSS_FORM });
      setProduct(null);
      if (onRecorded) onRecorded();
    } catch (err) {
      setConfirming(false);
      // 409 de stock insuficiente: muestra las unidades disponibles.
      if (err && err.code === 'INSUFFICIENT_STOCK' && err.details) {
        setApiError(`Stock insuficiente: solo hay ${err.details.availableStock} unidades disponibles.`);
      } else {
        setApiError(describeError(err));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <SectionTitle title="Registrar merma" subtitle="Descuenta del stock unidades vencidas o danadas." />
      {apiError ? <ErrorBanner message={apiError} /> : null}

      {/* Resultado del ultimo registro con meta de stock */}
      {outcome ? (
        <View style={styles.outcome} accessibilityLiveRegion="polite">
          <Text style={styles.outcomeTitle}>Merma registrada</Text>
          <Text style={styles.outcomeText}>
            {`${outcome.productName || (outcome.loss && outcome.loss.productName) || 'Producto'}: stock anterior ${
              outcome.previousStock
            }, stock nuevo ${outcome.newStock}.`}
          </Text>
          {outcome.loss && outcome.loss.totalLoss !== undefined ? (
            <Text style={styles.outcomeText}>{`Perdida valorizada: ${formatMoney(outcome.loss.totalLoss)}`}</Text>
          ) : null}
        </View>
      ) : null}

      <ProductPicker label="Producto" value={product} onSelect={handleProduct} error={errors.productId} />
      <AppTextInput
        label="Cantidad"
        value={form.quantity}
        onChangeText={(text) => setField('quantity', text.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="Unidades"
        error={errors.quantity}
        maxLength={6}
      />
      <Text style={styles.label}>Motivo</Text>
      <SegmentedControl
        accessibilityLabel="Motivo de la merma"
        options={LOSS_REASON_OPTIONS}
        value={form.reason}
        onChange={(value) => setField('reason', value)}
      />
      {errors.reason ? <Text style={styles.error}>{errors.reason}</Text> : null}
      <DateField
        label="Fecha de la merma (opcional)"
        value={form.occurredAt}
        onChange={(value) => setField('occurredAt', value)}
        error={errors.occurredAt}
      />
      <AppTextInput
        label="Notas (opcional)"
        value={form.notes}
        onChangeText={(text) => setField('notes', text)}
        multiline
        maxLength={1000}
        error={errors.notes}
      />
      <AppButton title="Registrar merma" onPress={requestConfirm} disabled={saving} />

      {/* Confirmacion explicita antes de descontar stock */}
      <ConfirmModal
        visible={confirming}
        title="Confirmar merma"
        message={`Se descontaran ${form.quantity || 0} unidades de ${product ? product.name : 'el producto'} por motivo "${
          LOSS_REASON_LABELS[form.reason] || form.reason
        }". Esta accion no se puede deshacer.`}
        confirmLabel="Registrar"
        tone="danger"
        loading={saving}
        onConfirm={submit}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  label: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  error: { fontSize: typography.small, color: colors.danger, marginBottom: spacing.sm },
  outcome: {
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  outcomeTitle: { color: colors.success, fontWeight: '700', fontSize: typography.body, marginBottom: spacing.xs },
  outcomeText: { color: colors.textPrimary, fontSize: typography.body },
});
