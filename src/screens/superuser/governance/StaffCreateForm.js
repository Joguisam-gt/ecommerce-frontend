/**
 * Formulario de alta de personal (POST /superuser/staff) con los campos exactos de createStaffSchema:
 * firstName, lastName, email, phone (opcional), password y role (admin | superuser).
 * Escritorio: campos en 2 columnas; movil: apilados.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppTextInput, Card, SegmentedControl } from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { ROLE_LABELS } from '../../../config/constants';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { createStaff } from '../../../services/superuser/staffService';
import { describeApiError, fieldErrorsFromApi } from './governanceErrors';
import { PanelNotice } from './PanelNotice';
import { EMPTY_STAFF_FORM, STAFF_ROLES, buildCreateStaffBody, validateStaffForm } from './staffForm';

/** Opciones del selector de rol del alta. */
const ROLE_OPTIONS = STAFF_ROLES.map((role) => ({ label: ROLE_LABELS[role] || role, value: role }));

/**
 * @param {{ onCreated: (user: object) => void, onCancel: () => void }} props
 */
export function StaffCreateForm({ onCreated, onCancel }) {
  const { isDesktop } = useResponsiveLayout();
  const [form, setForm] = useState(EMPTY_STAFF_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /** Actualiza un campo y limpia su error. */
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  /** Valida localmente y envia el alta; mapea VALIDATION_ERROR y EMAIL_IN_USE a los campos. */
  const handleSubmit = async () => {
    setSubmitError('');
    const localErrors = validateStaffForm(form);
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;
    setSubmitting(true);
    try {
      const created = await createStaff(buildCreateStaffBody(form));
      setForm(EMPTY_STAFF_FORM);
      onCreated(created);
    } catch (error) {
      const fieldMap = fieldErrorsFromApi(error);
      if (error && error.code === 'EMAIL_IN_USE') fieldMap.email = 'Ese correo ya esta registrado';
      setErrors(fieldMap);
      setSubmitError(describeApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  /** Fila de 2 columnas en escritorio. */
  const rowStyle = isDesktop ? styles.row : null;
  const cellStyle = isDesktop ? styles.cell : null;

  return (
    <Card style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Nuevo miembro del personal
      </Text>
      <PanelNotice message={submitError} tone="danger" />
      {/* Nombre y apellido */}
      <View style={rowStyle}>
        <View style={cellStyle}>
          <AppTextInput
            label="Nombre"
            value={form.firstName}
            onChangeText={(v) => setField('firstName', v)}
            error={errors.firstName}
            autoCapitalize="words"
            maxLength={80}
          />
        </View>
        <View style={cellStyle}>
          <AppTextInput
            label="Apellido"
            value={form.lastName}
            onChangeText={(v) => setField('lastName', v)}
            error={errors.lastName}
            autoCapitalize="words"
            maxLength={80}
          />
        </View>
      </View>
      {/* Correo y telefono */}
      <View style={rowStyle}>
        <View style={cellStyle}>
          <AppTextInput
            label="Correo electronico"
            value={form.email}
            onChangeText={(v) => setField('email', v)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
            maxLength={254}
          />
        </View>
        <View style={cellStyle}>
          <AppTextInput
            label="Telefono (opcional)"
            value={form.phone}
            onChangeText={(v) => setField('phone', v)}
            error={errors.phone}
            keyboardType="phone-pad"
            placeholder="+502 5555-5555"
            maxLength={20}
          />
        </View>
      </View>
      {/* Contrasena y rol */}
      <View style={rowStyle}>
        <View style={cellStyle}>
          <AppTextInput
            label="Contrasena temporal"
            value={form.password}
            onChangeText={(v) => setField('password', v)}
            error={errors.password}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder="Minimo 8, con mayuscula, minuscula y numero"
          />
        </View>
        <View style={cellStyle}>
          <Text style={styles.label}>Rol</Text>
          <SegmentedControl
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(v) => setField('role', v)}
            accessibilityLabel="Rol del nuevo miembro"
          />
          {errors.role ? <Text style={styles.error}>{errors.role}</Text> : null}
        </View>
      </View>
      {/* Acciones */}
      <View style={styles.actions}>
        <AppButton title="Cancelar" variant="secondary" onPress={onCancel} disabled={submitting} />
        <AppButton title="Crear cuenta" onPress={handleSubmit} loading={submitting} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg, padding: spacing.lg },
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.lg },
  cell: { flex: 1 },
  label: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  error: { fontSize: typography.small, color: colors.danger, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, flexWrap: 'wrap' },
});

export default StaffCreateForm;
