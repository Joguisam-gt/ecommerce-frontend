/**
 * Formulario de contacto y direccion de envio. En contra entrega todos los
 * datos de contacto y la direccion son obligatorios; en tarjeta o
 * transferencia se muestra como seccion opcional (necesaria si algun
 * producto no admite retiro en tienda).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTextInput, Card } from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { isNonEmpty, isValidEmail, isValidPhone } from '../../../utils/validators';
import { COUNTRY_PATTERN, hasAddress } from './checkoutHelpers';

/**
 * Valida contacto y direccion. Con required=false solo valida lo que se lleno
 * y exige linea 1 + ciudad si se empezo a escribir la direccion.
 * @param {object} contact
 * @param {boolean} required
 * @returns {Record<string, string>} Errores por campo (vacio si es valido).
 */
export function validateContact(contact, required) {
  const errors = {};
  const name = contact.customerName.trim();
  const email = contact.email.trim();
  const phone = contact.phone.trim();

  // Contacto
  if (required || name) {
    if (!isNonEmpty(name) || name.length < 2) errors.customerName = 'Ingresa tu nombre completo (minimo 2 letras).';
  }
  if (required || email) {
    if (!isValidEmail(email)) errors.email = 'Ingresa un correo valido.';
  }
  if (required || phone) {
    if (!isValidPhone(phone)) errors.phone = 'Ingresa un telefono valido (7 a 20 digitos).';
  }

  // Direccion
  if (required || hasAddress(contact)) {
    if (!isNonEmpty(contact.line1.trim())) errors.line1 = 'Ingresa la direccion.';
    if (!isNonEmpty(contact.city.trim())) errors.city = 'Ingresa la ciudad.';
    if (!COUNTRY_PATTERN.test(contact.country.trim())) errors.country = 'Usa el codigo de pais de 2 letras (p. ej. GT).';
  }
  return errors;
}

/**
 * @param {{ value: object, errors: Record<string, string>, required: boolean,
 *   onChange: (field: string, text: string) => void }} props
 */
export default function CashOnDeliveryForm({ value, errors, required, onChange }) {
  const suffix = required ? '' : ' (opcional)';

  return (
    <Card style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        {required ? 'Datos de entrega' : 'Datos de contacto y envio (opcional)'}
      </Text>
      <Text style={styles.hint}>
        {required
          ? 'Pagaras al recibir tu pedido. Todos los campos marcados son obligatorios.'
          : 'Completa la direccion si algun producto requiere envio a domicilio.'}
      </Text>

      {/* Contacto */}
      <AppTextInput
        label={`Nombre completo${suffix}`}
        value={value.customerName}
        onChangeText={(text) => onChange('customerName', text)}
        error={errors.customerName}
        autoCapitalize="words"
        maxLength={160}
      />
      <AppTextInput
        label={`Correo electronico${suffix}`}
        value={value.email}
        onChangeText={(text) => onChange('email', text)}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        maxLength={254}
      />
      <AppTextInput
        label={`Telefono${suffix}`}
        value={value.phone}
        onChangeText={(text) => onChange('phone', text)}
        error={errors.phone}
        keyboardType="phone-pad"
        placeholder="+502 5555-5555"
        maxLength={20}
      />

      {/* Direccion de envio */}
      <AppTextInput
        label={`Direccion (linea 1)${suffix}`}
        value={value.line1}
        onChangeText={(text) => onChange('line1', text)}
        error={errors.line1}
        maxLength={200}
      />
      <View style={styles.row}>
        <View style={styles.cell}>
          <AppTextInput
            label={`Ciudad${suffix}`}
            value={value.city}
            onChangeText={(text) => onChange('city', text)}
            error={errors.city}
            maxLength={100}
          />
        </View>
        <View style={styles.cell}>
          <AppTextInput
            label="Departamento (opcional)"
            value={value.state}
            onChangeText={(text) => onChange('state', text)}
            error={errors.state}
            maxLength={100}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <AppTextInput
            label="Codigo postal (opcional)"
            value={value.postalCode}
            onChangeText={(text) => onChange('postalCode', text)}
            error={errors.postalCode}
            maxLength={20}
          />
        </View>
        <View style={styles.cell}>
          <AppTextInput
            label="Pais"
            value={value.country}
            onChangeText={(text) => onChange('country', text.toUpperCase())}
            error={errors.country}
            autoCapitalize="characters"
            maxLength={2}
          />
        </View>
      </View>
    </Card>
  );
}

/* Estilos del formulario */
const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  cell: {
    flexGrow: 1,
    flexBasis: 200,
    paddingHorizontal: spacing.xs,
  },
});
