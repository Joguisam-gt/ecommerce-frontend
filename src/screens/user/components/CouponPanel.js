/**
 * Panel de cupon: valida un codigo contra el backend (POST /cart/coupon) y
 * muestra el cupon aplicado o el motivo de rechazo. Un cupon invalido no
 * altera el precio: el total siempre se lee de cart.summary.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppTextInput, Card } from '../../../components';
import { colors, radius, spacing, typography } from '../../../config/theme';
import { formatMoney } from '../../../utils/format';
import { COUPON_PATTERN, couponErrorMessage } from './checkoutHelpers';

/**
 * @param {{ coupon: object | null, disabled?: boolean,
 *   onApply: (code: string) => Promise<void>, onRemove: () => Promise<void> }} props
 */
export default function CouponPanel({ coupon, disabled = false, onApply, onRemove }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const applied = coupon && coupon.applied;

  /* Normaliza la entrada: mayusculas y sin espacios */
  const handleChange = (text) => {
    setCode(text.replace(/\s/g, '').toUpperCase());
    if (error) setError(null);
  };

  /* Valida localmente y luego contra el backend */
  const handleApply = async () => {
    if (!COUPON_PATTERN.test(code)) {
      setError('Codigo invalido: usa de 3 a 30 letras, numeros, guion o guion bajo.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onApply(code);
      setCode('');
    } catch (err) {
      setError(couponErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  /* Quita el cupon aplicado */
  const handleRemove = async () => {
    setBusy(true);
    setError(null);
    try {
      await onRemove();
    } catch (err) {
      setError((err && err.message) || 'No se pudo quitar el cupon.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Cupon de descuento
      </Text>

      {applied ? (
        /* Cupon vigente aplicado al carrito */
        <View style={styles.appliedBox} accessibilityLiveRegion="polite">
          <View style={styles.appliedText}>
            <Text style={styles.appliedTitle}>Cupon aplicado: {coupon.code}</Text>
            <Text style={styles.appliedDiscount}>Descuento: -{formatMoney(coupon.discount || 0)}</Text>
          </View>
          <AppButton title="Quitar" variant="secondary" onPress={handleRemove} loading={busy} disabled={disabled || busy} />
        </View>
      ) : (
        /* Formulario para validar un codigo */
        <View>
          <AppTextInput
            label="Codigo del cupon"
            value={code}
            onChangeText={handleChange}
            placeholder="Ej. VERANO10"
            autoCapitalize="characters"
            maxLength={30}
          />
          <AppButton
            title="Validar"
            onPress={handleApply}
            loading={busy}
            disabled={disabled || busy || code.length === 0}
          />
        </View>
      )}

      {/* Cupon guardado que dejo de aplicar (motivo del backend) */}
      {coupon && coupon.applied === false ? (
        <View style={styles.alert} accessibilityRole="alert">
          <Text style={styles.alertText}>
            El cupon {coupon.code} no se aplico: {coupon.message || couponErrorMessage({ code: coupon.reason })}
          </Text>
          <AppButton title="Quitar cupon" variant="secondary" onPress={handleRemove} disabled={disabled || busy} />
        </View>
      ) : null}

      {/* Error al validar: el precio no cambia */}
      {error ? (
        <View style={styles.alert} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Text style={styles.alertText}>{error}</Text>
          <Text style={styles.alertHint}>El total de tu pedido no cambio.</Text>
        </View>
      ) : null}
    </Card>
  );
}

/* Estilos del panel */
const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  appliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  appliedText: {
    flex: 1,
    minWidth: 160,
    marginRight: spacing.sm,
  },
  appliedTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.success,
  },
  appliedDiscount: {
    fontSize: typography.body,
    color: colors.success,
    marginTop: spacing.xs,
  },
  alert: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  alertText: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: '600',
  },
  alertHint: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginTop: spacing.xs,
  },
});
