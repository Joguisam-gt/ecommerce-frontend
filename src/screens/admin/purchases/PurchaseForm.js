/**
 * Formulario de registro de compra a proveedor (POST /admin/purchases segun
 * createPurchaseSchema): proveedor activo, lineas dinamicas de producto,
 * cantidad y costo unitario, metodo de pago, numero de factura del proveedor,
 * fecha y notas. Calcula el total y confirma con ConfirmModal.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AppButton,
  AppTextInput,
  Card,
  ConfirmModal,
  DateField,
  ErrorBanner,
  LoadingState,
  SectionTitle,
  SegmentedControl,
} from '../../../components';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { getInventoryProduct } from '../../../services/admin/inventoryService';
import { createPurchase } from '../../../services/admin/purchaseService';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../../../config/theme';
import { formatMoney } from '../../../utils/format';
import ProductPicker from '../inventory/ProductPicker';
import { describeError, PAYMENT_OPTIONS } from '../inventory/adminHelpers';
import {
  buildPurchaseBody,
  emptyPurchaseForm,
  emptyPurchaseLine,
  lineTotal,
  MAX_PURCHASE_ITEMS,
  purchaseTotal,
  validatePurchaseForm,
} from './purchaseBody';
import useSupplierOptions from './useSupplierOptions';

/**
 * @param {{ initialProductId?: string, initialSupplierId?: string,
 *   onCreated?: (purchase: object) => void, onCancel?: () => void }} props
 */
export default function PurchaseForm({ initialProductId, initialSupplierId, onCreated, onCancel }) {
  const { isDesktop } = useResponsiveLayout();
  const suppliers = useSupplierOptions({ onlyActive: true });
  const [form, setForm] = useState(() => ({ ...emptyPurchaseForm(), supplierId: initialSupplierId || '' }));
  const [validation, setValidation] = useState({ errors: {}, lineErrors: [] });
  const [prefillError, setPrefillError] = useState(null);
  const [prefilling, setPrefilling] = useState(Boolean(initialProductId));
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Prellenado desde el detalle de inventario: producto, costo y su proveedor.
  useEffect(() => {
    if (!initialProductId) return undefined;
    let alive = true;
    setPrefilling(true);
    getInventoryProduct(initialProductId)
      .then((product) => {
        if (!alive || !product) return;
        const line = {
          ...emptyPurchaseLine(),
          productId: product.id,
          product,
          unitCost: product.costPrice === null || product.costPrice === undefined ? '' : String(product.costPrice),
        };
        setForm((prev) => ({
          ...prev,
          supplierId: prev.supplierId || (product.supplier && product.supplier.isActive ? product.supplier.id : ''),
          items: [line],
        }));
      })
      .catch((err) => {
        if (alive) setPrefillError(describeError(err));
      })
      .finally(() => {
        if (alive) setPrefilling(false);
      });
    return () => {
      alive = false;
    };
  }, [initialProductId]);

  const total = useMemo(() => purchaseTotal(form.items), [form.items]);
  const supplierName = suppliers.byId[form.supplierId] ? suppliers.byId[form.supplierId].name : '';

  // Cambia un campo general.
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Cambia un campo de una linea.
  const setLine = (key, patch) =>
    setForm((prev) => ({ ...prev, items: prev.items.map((line) => (line.key === key ? { ...line, ...patch } : line)) }));

  // Elige el producto de una linea y propone su costo actual.
  const selectProduct = (key, product) => {
    if (!product) {
      setLine(key, { productId: '', product: null });
      return;
    }
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line) => {
        if (line.key !== key) return line;
        const cost = line.unitCost || (product.costPrice === null || product.costPrice === undefined ? '' : String(product.costPrice));
        return { ...line, productId: product.id, product, unitCost: cost };
      }),
    }));
  };

  // Agrega y elimina lineas.
  const addLine = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyPurchaseLine()] }));
  const removeLine = (key) => setForm((prev) => ({ ...prev, items: prev.items.filter((line) => line.key !== key) }));

  // Valida antes de confirmar.
  const requestConfirm = () => {
    const result = validatePurchaseForm(form);
    setValidation(result);
    setApiError(null);
    if (result.valid) setConfirming(true);
  };

  // Envia la compra y entrega la compra creada (con su factura) al padre.
  const submit = async () => {
    setSaving(true);
    try {
      const purchase = await createPurchase(buildPurchaseBody(form));
      setConfirming(false);
      setForm({ ...emptyPurchaseForm() });
      setValidation({ errors: {}, lineErrors: [] });
      if (onCreated) onCreated(purchase);
    } catch (err) {
      setConfirming(false);
      setApiError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const { errors, lineErrors } = validation;

  return (
    <Card style={styles.card}>
      <SectionTitle title="Registrar compra a proveedor" subtitle="Aumenta el stock, actualiza el costo y genera la factura del proveedor." />
      {apiError ? <ErrorBanner message={apiError} /> : null}
      {prefillError ? <ErrorBanner message={`No se pudo prellenar el producto: ${prefillError}`} /> : null}
      {prefilling ? <LoadingState label="Cargando producto..." /> : null}

      {/* Proveedor (solo activos: el backend rechaza inactivos con 409) */}
      <Text style={styles.label}>Proveedor</Text>
      {suppliers.loading ? <LoadingState label="Cargando proveedores..." /> : null}
      {suppliers.error ? <ErrorBanner message={suppliers.error} /> : null}
      {!suppliers.loading && suppliers.options.length === 0 && !suppliers.error ? (
        <Text style={styles.muted}>No hay proveedores activos registrados.</Text>
      ) : null}
      <SegmentedControl
        accessibilityLabel="Proveedor de la compra"
        options={suppliers.options}
        value={form.supplierId}
        onChange={(value) => setField('supplierId', value)}
      />
      {errors.supplierId ? <Text style={styles.error}>{errors.supplierId}</Text> : null}

      {/* Datos generales */}
      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        <AppTextInput
          style={isDesktop ? styles.gridItem : null}
          label="No. de factura del proveedor (opcional)"
          value={form.supplierInvoiceNumber}
          onChangeText={(text) => setField('supplierInvoiceNumber', text)}
          maxLength={60}
          autoCapitalize="characters"
          error={errors.supplierInvoiceNumber}
        />
        <DateField
          style={isDesktop ? styles.gridItem : null}
          label="Fecha de compra (opcional)"
          value={form.purchasedAt}
          onChange={(value) => setField('purchasedAt', value)}
          error={errors.purchasedAt}
        />
      </View>
      <Text style={styles.label}>Metodo de pago</Text>
      <SegmentedControl
        accessibilityLabel="Metodo de pago de la compra"
        options={PAYMENT_OPTIONS}
        value={form.paymentMethod}
        onChange={(value) => setField('paymentMethod', value)}
      />

      {/* Lineas dinamicas */}
      <Text style={styles.sectionLabel}>{`Productos (${form.items.length})`}</Text>
      {errors.items ? <Text style={styles.error}>{errors.items}</Text> : null}
      {form.items.map((line, index) => {
        const lineError = lineErrors[index] || {};
        return (
          <View key={line.key} style={styles.line}>
            <View style={styles.lineHeader}>
              <Text style={styles.lineTitle}>{`Linea ${index + 1}`}</Text>
              {form.items.length > 1 ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar linea ${index + 1}`}
                  onPress={() => removeLine(line.key)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeText}>Quitar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <ProductPicker
              label="Producto"
              value={line.product}
              onSelect={(product) => selectProduct(line.key, product)}
              error={lineError.productId}
            />
            <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
              <AppTextInput
                style={isDesktop ? styles.gridItem : null}
                label="Cantidad"
                value={line.quantity}
                onChangeText={(text) => setLine(line.key, { quantity: text.replace(/[^0-9]/g, '') })}
                keyboardType="number-pad"
                maxLength={6}
                error={lineError.quantity}
              />
              <AppTextInput
                style={isDesktop ? styles.gridItem : null}
                label="Costo unitario (Q)"
                value={line.unitCost}
                onChangeText={(text) => setLine(line.key, { unitCost: text.replace(/[^0-9.,]/g, '') })}
                keyboardType="decimal-pad"
                placeholder="0.00"
                maxLength={12}
                error={lineError.unitCost}
              />
              <View style={[styles.lineTotalBox, isDesktop && styles.gridItem]}>
                <Text style={styles.label}>Total de linea</Text>
                <Text style={styles.lineTotal}>{formatMoney(lineTotal(line))}</Text>
              </View>
            </View>
          </View>
        );
      })}
      <AppButton
        title="Agregar producto"
        variant="secondary"
        onPress={addLine}
        disabled={form.items.length >= MAX_PURCHASE_ITEMS}
        style={styles.addButton}
      />

      <AppTextInput
        label="Notas (opcional)"
        value={form.notes}
        onChangeText={(text) => setField('notes', text)}
        multiline
        maxLength={1000}
        error={errors.notes}
      />

      {/* Total y acciones */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total de la compra</Text>
        <Text style={styles.totalValue}>{formatMoney(total)}</Text>
      </View>
      <View style={styles.actions}>
        {onCancel ? <AppButton title="Cancelar" variant="secondary" onPress={onCancel} /> : null}
        <AppButton title="Registrar compra" onPress={requestConfirm} disabled={saving || prefilling} />
      </View>

      <ConfirmModal
        visible={confirming}
        title="Confirmar compra"
        message={`Proveedor: ${supplierName || '-'}. Lineas: ${form.items.length}. Total: ${formatMoney(
          total,
        )}. Se aumentara el stock y se generara la factura del proveedor.`}
        confirmLabel="Registrar compra"
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
  sectionLabel: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginVertical: spacing.sm },
  muted: { fontSize: typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  error: { fontSize: typography.small, color: colors.danger, marginBottom: spacing.sm },
  grid: { flexDirection: 'column' },
  gridDesktop: { flexDirection: 'row', gap: spacing.md },
  gridItem: { flex: 1 },
  line: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  lineTitle: { fontSize: typography.body, fontWeight: '700', color: colors.textPrimary },
  removeButton: { minHeight: MIN_TOUCH_SIZE, minWidth: MIN_TOUCH_SIZE, justifyContent: 'center', paddingHorizontal: spacing.sm },
  removeText: { color: colors.danger, fontWeight: '600', textDecorationLine: 'underline', fontSize: typography.body },
  lineTotalBox: { justifyContent: 'center', marginBottom: spacing.md },
  lineTotal: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  addButton: { alignSelf: 'flex-start', marginBottom: spacing.lg },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  totalLabel: { fontSize: typography.subtitle, fontWeight: '600', color: colors.textPrimary },
  totalValue: { fontSize: typography.title, fontWeight: '700', color: colors.textPrimary },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, flexWrap: 'wrap' },
});
