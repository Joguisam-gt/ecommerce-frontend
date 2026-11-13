/**
 * Formulario de alta de cupon (POST /admin/coupons). Codigo manual o generado por el
 * backend (se omite "code"), porcentaje de descuento, descripcion, vigencia
 * (fecha de expiracion XOR cupon permanente), limites de uso y productos aplicables.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppTextInput, Card, Checkbox, DateField, ErrorBanner } from '../../../components';
import { createCoupon } from '../../../services/admin/adminCouponService';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { colors, radius, spacing, typography } from '../../../config/theme';
import { formatDate } from '../../../utils/format';
import { errorMessage, fieldErrorsFromDetails, toDayString } from '../reports/reportHelpers';
import { buildCouponBody, EMPTY_COUPON_FORM, EXPIRATION_ERROR_CODES, validateCouponForm } from './couponHelpers';

/**
 * @param {{ selected: Record<string, { id: string, name: string }>, onChooseProducts: () => void,
 *   onClearProducts: () => void, onCreated: (coupon: object) => void }} props
 */
export function CouponForm({ selected, onChooseProducts, onClearProducts, onCreated }) {
  const { isDesktop } = useResponsiveLayout();
  const [form, setForm] = useState(EMPTY_COUPON_FORM);
  const [errors, setErrors] = useState({});
  const [bannerError, setBannerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const selectedList = Object.values(selected);

  // Actualiza un campo y limpia su error.
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  // Fecha y permanente son excluyentes: al elegir uno se limpia el otro.
  const setExpiresAt = (value) => {
    setForm((prev) => ({ ...prev, expiresAt: value, isPermanent: value ? false : prev.isPermanent }));
    setErrors((prev) => ({ ...prev, expiresAt: undefined }));
  };
  const setPermanent = (checked) => {
    setForm((prev) => ({ ...prev, isPermanent: checked, expiresAt: checked ? '' : prev.expiresAt }));
    setErrors((prev) => ({ ...prev, expiresAt: undefined }));
  };

  // Traduce los errores del backend al campo correspondiente o al banner.
  const applyServerError = (err) => {
    if (err && err.code === 'COUPON_CODE_TAKEN') {
      setErrors({ code: 'Ya existe un cupon con ese codigo.' });
    } else if (err && EXPIRATION_ERROR_CODES.includes(err.code)) {
      setErrors({ expiresAt: errorMessage(err) });
    } else if (err && err.code === 'VALIDATION_ERROR') {
      const mapped = fieldErrorsFromDetails(err.details);
      setErrors(mapped);
      setBannerError(Object.keys(mapped).length ? 'Revisa los campos marcados.' : errorMessage(err));
    } else {
      // PRODUCTS_NOT_FOUND, COUPON_CODE_GENERATION_FAILED, permisos, red, etc.
      setBannerError(errorMessage(err));
    }
  };

  // Valida localmente y envia el cuerpo exacto de createCouponSchema.
  const submit = async () => {
    setBannerError('');
    setCreated(null);
    const localErrors = validateCouponForm(form, selectedList.length);
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setBannerError('Revisa los campos marcados.');
      return;
    }
    setSubmitting(true);
    try {
      const coupon = await createCoupon(buildCouponBody(form, selectedList.map((p) => p.id)));
      setCreated(coupon);
      setForm(EMPTY_COUPON_FORM);
      setErrors({});
      onCreated(coupon);
    } catch (err) {
      applyServerError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Fecha minima de expiracion: hoy (el backend exige fecha futura).
  const today = toDayString(new Date());
  const half = isDesktop ? styles.half : null;

  return (
    <Card>
      <Text style={styles.title} accessibilityRole="header">
        Nuevo cupon
      </Text>
      <ErrorBanner message={bannerError} />

      {/* Confirmacion del cupon creado */}
      {created ? (
        <View style={styles.success} accessibilityLiveRegion="polite">
          <Text style={styles.successTitle}>Cupon creado</Text>
          <Text style={styles.successCode} selectable>
            {created.code}
          </Text>
          <Text style={styles.successText}>
            {created.isPermanent ? 'Permanente' : `Expira el ${formatDate(created.expiresAt)}`}
            {` - ${created.discountPercent}% de descuento`}
          </Text>
        </View>
      ) : null}

      {/* Codigo: manual o generado por el backend */}
      <Text style={styles.label}>Codigo del cupon</Text>
      {form.codeMode === 'manual' ? (
        <AppTextInput
          value={form.code}
          onChangeText={(text) => setField('code', text.toUpperCase())}
          error={errors.code}
          placeholder="Ej.: VERANO2026"
          autoCapitalize="characters"
          maxLength={30}
          accessibilityLabel="Codigo del cupon"
        />
      ) : (
        <View style={styles.autoBox}>
          <Text style={styles.autoText}>
            El codigo se generara automaticamente al guardar (10 caracteres sin simbolos ambiguos).
          </Text>
        </View>
      )}
      <View style={styles.row}>
        {form.codeMode === 'manual' ? (
          <AppButton
            title="Generar Codigo Aleatorio"
            variant="secondary"
            onPress={() => {
              setField('codeMode', 'auto');
              setField('code', '');
            }}
            style={styles.inlineButton}
          />
        ) : (
          <AppButton title="Escribir codigo manual" variant="secondary" onPress={() => setField('codeMode', 'manual')} style={styles.inlineButton} />
        )}
      </View>

      {/* Descuento y descripcion */}
      <View style={isDesktop ? styles.columns : null}>
        <AppTextInput
          label="Descuento (%)"
          value={form.discountPercent}
          onChangeText={(text) => setField('discountPercent', text.replace(/[^0-9]/g, ''))}
          error={errors.discountPercent}
          keyboardType="number-pad"
          placeholder="1 a 100"
          maxLength={3}
          style={half}
        />
        <AppTextInput
          label="Descripcion (opcional)"
          value={form.description}
          onChangeText={(text) => setField('description', text)}
          error={errors.description}
          placeholder="Uso interno o para el cliente"
          maxLength={500}
          style={half}
        />
      </View>

      {/* Vigencia: fecha de expiracion o permanente */}
      <Text style={styles.label}>Vigencia</Text>
      <View style={isDesktop ? styles.columns : null}>
        <View style={half}>
          <DateField
            label="Fecha de expiracion"
            value={form.expiresAt}
            onChange={setExpiresAt}
            error={errors.expiresAt}
            minDate={today}
          />
        </View>
        <View style={[half, styles.permanent]}>
          <Checkbox label="Cupon Permanente (sin fecha de expiracion)" checked={form.isPermanent} onChange={setPermanent} />
        </View>
      </View>

      {/* Limites de uso opcionales */}
      <View style={isDesktop ? styles.columns : null}>
        <AppTextInput
          label="Limite total de usos (opcional)"
          value={form.maxUses}
          onChangeText={(text) => setField('maxUses', text.replace(/[^0-9]/g, ''))}
          error={errors.maxUses}
          keyboardType="number-pad"
          placeholder="Sin limite"
          maxLength={7}
          style={half}
        />
        <AppTextInput
          label="Limite de usos por cliente (opcional)"
          value={form.maxUsesPerUser}
          onChangeText={(text) => setField('maxUsesPerUser', text.replace(/[^0-9]/g, ''))}
          error={errors.maxUsesPerUser}
          keyboardType="number-pad"
          placeholder="Sin limite"
          maxLength={7}
          style={half}
        />
      </View>

      {/* Productos aplicables seleccionados en la pestana de productos */}
      <Text style={styles.label}>Productos aplicables</Text>
      <Text style={styles.help}>
        {selectedList.length === 0
          ? 'Cupon global: aplica a todo el catalogo.'
          : `${selectedList.length} producto(s): ${selectedList
              .slice(0, 5)
              .map((p) => p.name)
              .join(', ')}${selectedList.length > 5 ? '...' : ''}`}
      </Text>
      {errors.applicableProductIds ? <Text style={styles.fieldError}>{errors.applicableProductIds}</Text> : null}
      <View style={styles.row}>
        <AppButton title="Elegir productos" variant="secondary" onPress={onChooseProducts} style={styles.inlineButton} />
        {selectedList.length > 0 ? (
          <AppButton title="Quitar productos" variant="secondary" onPress={onClearProducts} style={styles.inlineButton} />
        ) : null}
      </View>

      <AppButton title="Crear cupon" onPress={submit} loading={submitting} style={styles.submit} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  label: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  help: { fontSize: typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  fieldError: { fontSize: typography.small, color: colors.danger, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  inlineButton: { marginRight: spacing.sm, marginBottom: spacing.sm },
  columns: { flexDirection: 'row', marginHorizontal: -spacing.sm },
  half: { flex: 1, marginHorizontal: spacing.sm },
  permanent: { justifyContent: 'center' },
  autoBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  autoText: { color: colors.textPrimary, fontSize: typography.body },
  success: {
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successTitle: { color: colors.success, fontWeight: '700', fontSize: typography.body },
  successCode: { color: colors.textPrimary, fontWeight: '700', fontSize: typography.title, marginVertical: spacing.xs },
  successText: { color: colors.textSecondary, fontSize: typography.small },
  submit: { marginTop: spacing.md },
});

export default CouponForm;
