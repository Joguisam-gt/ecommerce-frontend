/**
 * Formulario de alta y edicion de proveedor (createSupplierSchema y
 * updateSupplierSchema): nombre, NIT, direccion, telefono, correo, contacto,
 * descripcion de distribucion y catalogo [{ productId, cost }]. En edicion
 * carga el detalle para mostrar el catalogo con nombres y envia solo cambios.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppButton, AppTextInput, Card, ErrorBanner, LoadingState, SectionTitle } from '../../../components';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { createSupplier, getSupplier, updateSupplier } from '../../../services/admin/supplierService';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../../../config/theme';
import ProductPicker from '../inventory/ProductPicker';
import { describeError } from '../inventory/adminHelpers';
import {
  buildCreateSupplierBody,
  buildUpdateSupplierBody,
  emptyCatalogLine,
  emptySupplierForm,
  supplierToForm,
  validateSupplierForm,
} from './supplierBody';

/** Mensajes especificos por codigo de error del backend. */
const ERROR_MESSAGES = {
  SUPPLIER_NIT_IN_USE: 'Ya existe un proveedor con ese NIT.',
  DUPLICATE_PRODUCTS: 'Hay productos repetidos en el catalogo.',
  PRODUCT_NOT_FOUND: 'Hay productos del catalogo que no existen.',
};

/**
 * @param {{ supplierId?: string | null, onSaved: (supplier: object) => void, onCancel: () => void }} props
 * supplierId nulo = alta; con valor = edicion.
 */
export default function SupplierForm({ supplierId = null, onSaved, onCancel }) {
  const { isDesktop } = useResponsiveLayout();
  const isEdit = Boolean(supplierId);
  const [original, setOriginal] = useState(emptySupplierForm());
  const [form, setForm] = useState(emptySupplierForm());
  const [loading, setLoading] = useState(isEdit);
  const [validation, setValidation] = useState({ errors: {}, catalogErrors: [] });
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  // En edicion carga el detalle (catalogo enriquecido) y lo usa como base.
  useEffect(() => {
    if (!supplierId) {
      setOriginal(emptySupplierForm());
      setForm(emptySupplierForm());
      setLoading(false);
      return undefined;
    }
    let alive = true;
    setLoading(true);
    getSupplier(supplierId)
      .then((supplier) => {
        if (!alive) return;
        const base = supplierToForm(supplier);
        setOriginal(base);
        setForm(base);
      })
      .catch((err) => {
        if (alive) setApiError(describeError(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [supplierId]);

  // Cambia un campo de texto.
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Cambia una linea del catalogo.
  const setLine = (key, patch) =>
    setForm((prev) => ({ ...prev, catalog: prev.catalog.map((line) => (line.key === key ? { ...line, ...patch } : line)) }));

  // Agrega y quita lineas del catalogo.
  const addLine = () => setForm((prev) => ({ ...prev, catalog: [...prev.catalog, emptyCatalogLine()] }));
  const removeLine = (key) => setForm((prev) => ({ ...prev, catalog: prev.catalog.filter((line) => line.key !== key) }));

  // Valida y guarda (POST o PATCH con solo los cambios).
  const save = async () => {
    const result = validateSupplierForm(form);
    setValidation(result);
    setApiError(null);
    if (!result.valid) return;
    const body = isEdit ? buildUpdateSupplierBody(form, original) : buildCreateSupplierBody(form);
    if (isEdit && Object.keys(body).length === 0) {
      setApiError('No hay cambios para guardar.');
      return;
    }
    setSaving(true);
    try {
      const saved = isEdit ? await updateSupplier(supplierId, body) : await createSupplier(body);
      onSaved(saved);
    } catch (err) {
      setApiError(ERROR_MESSAGES[err && err.code] || describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const { errors, catalogErrors } = validation;
  const half = isDesktop ? styles.gridItem : null;

  return (
    <Card style={styles.card}>
      <SectionTitle
        title={isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
        subtitle={isEdit ? 'Solo se envian los campos modificados.' : 'El codigo de proveedor lo asigna el sistema.'}
      />
      {apiError ? <ErrorBanner message={apiError} /> : null}
      {loading ? <LoadingState label="Cargando proveedor..." /> : null}

      {!loading ? (
        <View>
          {/* Datos generales */}
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            <AppTextInput style={half} label="Nombre" value={form.name} onChangeText={(t) => setField('name', t)} maxLength={160} error={errors.name} />
            <AppTextInput
              style={half}
              label="NIT"
              value={form.nit}
              onChangeText={(t) => setField('nit', t)}
              placeholder="1234567-8"
              autoCapitalize="characters"
              maxLength={40}
              error={errors.nit}
            />
          </View>
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            <AppTextInput
              style={half}
              label="Telefono"
              value={form.phone}
              onChangeText={(t) => setField('phone', t)}
              keyboardType="phone-pad"
              maxLength={20}
              error={errors.phone}
            />
            <AppTextInput
              style={half}
              label="Correo (opcional)"
              value={form.email}
              onChangeText={(t) => setField('email', t)}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={254}
              error={errors.email}
            />
          </View>
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            <AppTextInput
              style={half}
              label="Persona de contacto (opcional)"
              value={form.contactName}
              onChangeText={(t) => setField('contactName', t)}
              maxLength={120}
              error={errors.contactName}
            />
            <AppTextInput style={half} label="Direccion" value={form.address} onChangeText={(t) => setField('address', t)} maxLength={300} error={errors.address} />
          </View>
          <AppTextInput
            label="Descripcion de distribucion"
            value={form.distributionDescription}
            onChangeText={(t) => setField('distributionDescription', t)}
            multiline
            maxLength={2000}
            error={errors.distributionDescription}
          />

          {/* Catalogo de productos con costo */}
          <Text style={styles.sectionLabel}>{`Catalogo (${form.catalog.length})`}</Text>
          {errors.catalog ? <Text style={styles.error}>{errors.catalog}</Text> : null}
          {form.catalog.length === 0 ? <Text style={styles.muted}>Sin productos en el catalogo.</Text> : null}
          {form.catalog.map((line, index) => {
            const lineError = catalogErrors[index] || {};
            return (
              <View key={line.key} style={styles.line}>
                <View style={styles.lineHeader}>
                  <Text style={styles.lineTitle}>{`Producto ${index + 1}`}</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar producto ${index + 1} del catalogo`}
                    onPress={() => removeLine(line.key)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeText}>Quitar</Text>
                  </TouchableOpacity>
                </View>
                <ProductPicker
                  label="Producto"
                  value={line.product}
                  onSelect={(product) => setLine(line.key, { productId: product ? product.id : '', product })}
                  error={lineError.productId}
                />
                <AppTextInput
                  label="Costo del proveedor (Q)"
                  value={line.cost}
                  onChangeText={(t) => setLine(line.key, { cost: t.replace(/[^0-9.,]/g, '') })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  maxLength={12}
                  error={lineError.cost}
                />
              </View>
            );
          })}
          <AppButton title="Agregar producto al catalogo" variant="secondary" onPress={addLine} style={styles.addButton} />

          {/* Acciones */}
          <View style={styles.actions}>
            <AppButton title="Cancelar" variant="secondary" onPress={onCancel} disabled={saving} />
            <AppButton title={isEdit ? 'Guardar cambios' : 'Crear proveedor'} onPress={save} loading={saving} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  grid: { flexDirection: 'column' },
  gridDesktop: { flexDirection: 'row', gap: spacing.md },
  gridItem: { flex: 1 },
  sectionLabel: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginVertical: spacing.sm },
  muted: { fontSize: typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  error: { fontSize: typography.small, color: colors.danger, marginBottom: spacing.sm },
  line: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineTitle: { fontSize: typography.body, fontWeight: '700', color: colors.textPrimary },
  removeButton: { minHeight: MIN_TOUCH_SIZE, minWidth: MIN_TOUCH_SIZE, justifyContent: 'center', paddingHorizontal: spacing.sm },
  removeText: { color: colors.danger, fontWeight: '600', textDecorationLine: 'underline', fontSize: typography.body },
  addButton: { alignSelf: 'flex-start', marginBottom: spacing.lg },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, flexWrap: 'wrap' },
});
