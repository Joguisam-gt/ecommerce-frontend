/**
 * Formulario de edicion de cliente (PATCH /admin/customers/:id segun
 * updateCustomerSchema): nombre, apellido, telefono y codigo de cliente.
 * Solo envia los campos modificados; telefono o codigo vacios se envian null.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppTextInput, Card, ErrorBanner, SectionTitle } from '../../../components';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { updateCustomer } from '../../../services/admin/customerService';
import { spacing } from '../../../config/theme';
import { describeError } from '../inventory/adminHelpers';
import { buildUpdateCustomerBody, customerToForm, validateCustomerForm } from './customerBody';

/** Mensajes por codigo de error del backend. */
const ERROR_MESSAGES = {
  USER_CODE_IN_USE: 'El codigo de cliente ya esta en uso.',
  NOT_A_CUSTOMER: 'Esta cuenta no es de un cliente.',
};

/**
 * @param {{ customer: object, onSaved: (account: object) => void, onCancel: () => void }} props
 */
export default function CustomerEditForm({ customer, onSaved, onCancel }) {
  const { isDesktop } = useResponsiveLayout();
  const original = useMemo(() => customerToForm(customer), [customer]);
  const [form, setForm] = useState(original);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Cambia un campo.
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Valida y envia solo los cambios.
  const save = async () => {
    const nextErrors = validateCustomerForm(form);
    setErrors(nextErrors);
    setApiError(null);
    if (Object.keys(nextErrors).length > 0) return;
    const body = buildUpdateCustomerBody(form, original);
    if (Object.keys(body).length === 0) {
      setApiError('No hay cambios para guardar.');
      return;
    }
    setSaving(true);
    try {
      const account = await updateCustomer(customer.id, body);
      onSaved(account);
    } catch (err) {
      setApiError(ERROR_MESSAGES[err && err.code] || describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const half = isDesktop ? styles.gridItem : null;

  return (
    <Card style={styles.card}>
      <SectionTitle title="Editar cliente" subtitle="El correo, el rol y el estado no se editan desde aqui." />
      {apiError ? <ErrorBanner message={apiError} /> : null}
      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        <AppTextInput style={half} label="Nombre" value={form.firstName} onChangeText={(t) => setField('firstName', t)} maxLength={80} error={errors.firstName} />
        <AppTextInput style={half} label="Apellido" value={form.lastName} onChangeText={(t) => setField('lastName', t)} maxLength={80} error={errors.lastName} />
      </View>
      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        <AppTextInput
          style={half}
          label="Telefono (vacio para eliminarlo)"
          value={form.phone}
          onChangeText={(t) => setField('phone', t)}
          keyboardType="phone-pad"
          maxLength={20}
          error={errors.phone}
        />
        <AppTextInput
          style={half}
          label="Codigo de cliente (vacio para usar el predeterminado)"
          value={form.userCode}
          onChangeText={(t) => setField('userCode', t)}
          autoCapitalize="characters"
          maxLength={40}
          error={errors.userCode}
        />
      </View>
      <View style={styles.actions}>
        <AppButton title="Cancelar" variant="secondary" onPress={onCancel} disabled={saving} />
        <AppButton title="Guardar cambios" onPress={save} loading={saving} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  grid: { flexDirection: 'column' },
  gridDesktop: { flexDirection: 'row', gap: spacing.md },
  gridItem: { flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, flexWrap: 'wrap' },
});
