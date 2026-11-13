/**
 * Formulario de tarjeta (PCI-DSS). El numero completo y el CVV viven solo en
 * el estado local de este componente; la pantalla nunca los recibe. Expone
 * por ref un metodo tokenize() que valida, tokeniza en memoria y limpia de
 * inmediato el numero y el CVV, devolviendo solo { paymentToken, last4,
 * cardHolderName, cardBrand }. Nunca se registran en consola.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTextInput, Card, SegmentedControl } from '../../../components';
import { CARD_BRANDS } from '../../../config/constants';
import { colors, radius, spacing, typography } from '../../../config/theme';
import { tokenizeCard } from '../../../services/paymentTokenizer';
import { isNonEmpty, isValidCvv, isValidExpiry, luhnCheck } from '../../../utils/validators';
import { cardLengthFor, cvvLengthFor, digitsOnly, formatCardNumber, formatExpiryInput } from './checkoutHelpers';

/** Opciones de marca para el SegmentedControl. */
const BRAND_OPTIONS = CARD_BRANDS.map((brand) => ({ label: brand, value: brand }));

/**
 * @param {{ disabled?: boolean }} props
 * @param {React.Ref<{ tokenize: () => Promise<object | null>, clear: () => void }>} ref
 */
function CardPaymentForm({ disabled = false }, ref) {
  const [brand, setBrand] = useState(CARD_BRANDS[0]);
  const [holderName, setHolderName] = useState('');
  const [cardDigits, setCardDigits] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState({});
  const [tokenizedLast4, setTokenizedLast4] = useState(null);
  const mountedRef = useRef(true);

  /* Al desmontar: marca el componente y descarta los datos sensibles */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* Borra del estado el numero completo y el CVV */
  const clearSensitive = () => {
    if (!mountedRef.current) return;
    setCardDigits('');
    setCvv('');
  };

  /* Cambio de marca: recorta numero y CVV a la longitud de la nueva marca */
  const handleBrand = (next) => {
    setBrand(next);
    setCardDigits((prev) => prev.slice(0, cardLengthFor(next)));
    setCvv((prev) => prev.slice(0, cvvLengthFor(next)));
  };

  /* Solo digitos en el numero, con limite por marca */
  const handleNumber = (text) => {
    setCardDigits(digitsOnly(text).slice(0, cardLengthFor(brand)));
    setTokenizedLast4(null);
  };

  /* Valida todos los campos localmente; devuelve errores por campo */
  const validate = () => {
    const next = {};
    if (!isNonEmpty(holderName.trim()) || holderName.trim().length < 2) {
      next.holderName = 'Ingresa el nombre del titular tal como aparece en la tarjeta.';
    }
    if (cardDigits.length !== cardLengthFor(brand) || !luhnCheck(cardDigits)) {
      next.number = `Numero de tarjeta invalido (${cardLengthFor(brand)} digitos).`;
    }
    if (!isValidExpiry(expiry)) next.expiry = 'Fecha invalida o vencida (MM/AA).';
    if (!isValidCvv(cvv, brand)) next.cvv = `El CVV debe tener ${cvvLengthFor(brand)} digitos.`;
    return next;
  };

  /* API imperativa para la pantalla: tokenize() y clear() */
  useImperativeHandle(ref, () => ({
    async tokenize() {
      const found = validate();
      setErrors(found);
      if (Object.keys(found).length > 0) return null;
      try {
        const result = await tokenizeCard({ number: cardDigits, holderName: holderName.trim(), brand, expiry, cvv });
        if (mountedRef.current) setTokenizedLast4(result.last4);
        // Lista blanca: exactamente los cuatro campos del cardPaymentSchema.
        return {
          paymentToken: result.paymentToken,
          last4: result.last4,
          cardHolderName: result.cardHolderName,
          cardBrand: result.cardBrand,
        };
      } finally {
        clearSensitive();
      }
    },
    clear() {
      clearSensitive();
    },
  }));

  return (
    <Card style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Pago con tarjeta
      </Text>

      {/* Marca de la tarjeta */}
      <Text style={styles.label}>Marca</Text>
      <SegmentedControl options={BRAND_OPTIONS} value={brand} onChange={handleBrand} />

      {/* Datos de la tarjeta */}
      <View style={styles.fields}>
        <AppTextInput
          label="Titular de la tarjeta"
          value={holderName}
          onChangeText={setHolderName}
          error={errors.holderName}
          autoCapitalize="characters"
          maxLength={120}
        />
        <AppTextInput
          label="Numero de tarjeta"
          value={formatCardNumber(cardDigits, brand)}
          onChangeText={handleNumber}
          error={errors.number}
          keyboardType="number-pad"
          placeholder={brand === 'Amex' ? '0000 000000 00000' : '0000 0000 0000 0000'}
          maxLength={cardLengthFor(brand) + 3}
          autoComplete="off"
        />
        <View style={styles.row}>
          <View style={styles.cell}>
            <AppTextInput
              label="Vencimiento (MM/AA)"
              value={expiry}
              onChangeText={(text) => setExpiry(formatExpiryInput(text))}
              error={errors.expiry}
              keyboardType="number-pad"
              placeholder="MM/AA"
              maxLength={5}
            />
          </View>
          <View style={styles.cell}>
            <AppTextInput
              label="CVV"
              value={cvv}
              onChangeText={(text) => setCvv(digitsOnly(text).slice(0, cvvLengthFor(brand)))}
              error={errors.cvv}
              keyboardType="number-pad"
              secureTextEntry
              autoComplete="off"
              maxLength={cvvLengthFor(brand)}
            />
          </View>
        </View>
      </View>

      {/* Estado tras tokenizar (solo ultimos 4) */}
      {tokenizedLast4 && !disabled ? (
        <Text style={styles.tokenized}>
          Tarjeta terminada en {tokenizedLast4} tokenizada. Si el pago no se completa, vuelve a ingresar el numero y el CVV.
        </Text>
      ) : null}

      {/* Aviso de seguridad */}
      <View style={styles.notice} accessibilityRole="text">
        <Text style={styles.noticeText}>
          Los datos de la tarjeta se tokenizan en este dispositivo; solo se envian el token y los ultimos 4 digitos.
        </Text>
      </View>
    </Card>
  );
}

export default forwardRef(CardPaymentForm);

/* Estilos del formulario de tarjeta */
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
  label: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fields: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  cell: {
    flexGrow: 1,
    flexBasis: 140,
    paddingHorizontal: spacing.xs,
  },
  tokenized: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  notice: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  noticeText: {
    fontSize: typography.small,
    color: colors.textPrimary,
  },
});
