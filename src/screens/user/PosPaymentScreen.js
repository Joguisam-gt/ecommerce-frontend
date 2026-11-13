/**
 * Punto de venta (rol user): cupon, resumen siempre visible, seleccion del
 * metodo de pago (contra entrega, tarjeta tokenizada o transferencia) y envio
 * a POST /pos/checkout con Idempotency-Key. Los payloads se arman campo a
 * campo segun checkout.validator.js del backend (rechaza campos extra) y
 * nunca incluyen numero de tarjeta ni CVV.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppTextInput,
  Card,
  EmptyState,
  ErrorBanner,
  InfoModal,
  LoadingState,
  ScreenContainer,
  SectionTitle,
} from '../../components';
import { PAYMENT_METHODS } from '../../config/constants';
import { colors, radius, spacing, typography } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useNavigation } from '../../navigation/NavigationContext';
import { ROUTES } from '../../navigation/routes';
import { getPublicConfig } from '../../services/configService';
import { checkout, generateIdempotencyKey } from '../../services/posService';
import { formatPercent } from '../../utils/format';
import BankTransferForm, { initialTransfer, receiptUrlOf, validateTransfer } from './components/BankTransferForm';
import CardPaymentForm from './components/CardPaymentForm';
import CashOnDeliveryForm, { validateContact } from './components/CashOnDeliveryForm';
import CouponPanel from './components/CouponPanel';
import OrderConfirmation from './components/OrderConfirmation';
import OrderSummary from './components/OrderSummary';
import PaymentMethodSelector from './components/PaymentMethodSelector';
import {
  NIT_PATTERN,
  buildShippingAddress,
  checkoutErrorFeedback,
  hasAddress,
  initialContact,
  omitEmpty,
  parseAmount,
  taxRateToPercent,
} from './components/checkoutHelpers';

/** Resumen fijo al hacer scroll (solo web; en nativo no existe position sticky). */
const STICKY_WEB = Platform.OS === 'web' ? { position: 'sticky', top: spacing.lg } : null;

/** Largo maximo de las notas (igual que el backend). */
const NOTES_MAX = 1000;

/**
 * Campos de contacto opcionales validos (tarjeta y transferencia).
 * Solo incluye lo que el usuario lleno y paso la validacion local.
 * @param {object} contact
 */
function optionalContactFields(contact) {
  const fields = omitEmpty({
    customerName: contact.customerName,
    email: contact.email,
    phone: contact.phone,
  });
  if (hasAddress(contact)) fields.shippingAddress = buildShippingAddress(contact);
  return fields;
}

export default function PosPaymentScreen() {
  const { user } = useAuth();
  const { cart, isLoading, refreshCart, applyCoupon, removeCoupon } = useCart();
  const { navigate } = useNavigation();
  const { isDesktop } = useResponsiveLayout();

  const [config, setConfig] = useState({ defaultTaxRate: null, companyBankAccounts: [] });
  const [configError, setConfigError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [method, setMethod] = useState(PAYMENT_METHODS.CASH_ON_DELIVERY);
  const [contact, setContact] = useState(() => initialContact(user));
  const [contactErrors, setContactErrors] = useState({});
  const [transfer, setTransfer] = useState(() => initialTransfer(0));
  const [transferErrors, setTransferErrors] = useState({});
  const [nit, setNit] = useState('CF');
  const [notes, setNotes] = useState('');
  const [extraErrors, setExtraErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const cardRef = useRef(null);
  const submittingRef = useRef(false);
  const idempotencyKeyRef = useRef(null);
  const amountTouchedRef = useRef(false);

  const summary = cart && cart.summary;
  const grandTotal = summary ? Number(summary.grandTotal) || 0 : 0;
  const items = (cart && cart.items) || [];
  const issues = (cart && cart.issues) || [];
  const taxPercent = taxRateToPercent(config.defaultTaxRate);

  /* Carga en paralelo la configuracion publica y el carrito */
  useEffect(() => {
    let active = true;
    Promise.allSettled([getPublicConfig(), refreshCart()]).then(([configResult]) => {
      if (!active) return;
      if (configResult.status === 'fulfilled') {
        setConfig(configResult.value);
      } else {
        setConfigError('No se pudo cargar la configuracion de la tienda (IVA y cuentas bancarias).');
      }
      setInitialLoading(false);
    });
    return () => {
      active = false;
    };
    // Solo al montar.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Prellena el monto de la transferencia con el total mientras el usuario no lo edite */
  useEffect(() => {
    if (amountTouchedRef.current) return;
    setTransfer((prev) => ({ ...prev, transferAmount: grandTotal > 0 ? grandTotal.toFixed(2) : '' }));
  }, [grandTotal]);

  /* Clave de idempotencia: una por intento de pedido, reutilizada en reintentos */
  const getIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = generateIdempotencyKey();
    return idempotencyKeyRef.current;
  };

  /* Actualiza un campo de contacto y limpia su error */
  const handleContactChange = useCallback((field, text) => {
    setContact((prev) => ({ ...prev, [field]: text }));
    setContactErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  /* Aplica un parche al formulario de transferencia */
  const handleTransferChange = useCallback((patch) => {
    if (Object.prototype.hasOwnProperty.call(patch, 'transferAmount')) amountTouchedRef.current = true;
    setTransfer((prev) => ({ ...prev, ...patch }));
    setTransferErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => delete next[key]);
      if (patch.file || patch.uploadedUrl) delete next.receipt;
      return next;
    });
  }, []);

  /* Cambio de metodo: limpia errores y avisos del metodo anterior */
  const handleMethodChange = (next) => {
    setMethod(next);
    setFeedback(null);
    setContactErrors({});
    setTransferErrors({});
  };

  /* Cupon: los errores se propagan al panel (no se altera el precio) */
  const handleApplyCoupon = useCallback(async (code) => {
    await applyCoupon(code);
  }, [applyCoupon]);
  const handleRemoveCoupon = useCallback(async () => {
    await removeCoupon();
  }, [removeCoupon]);

  /* Valida NIT y notas (comunes a todos los metodos) */
  const validateCommon = () => {
    const errors = {};
    const nitValue = nit.trim().toUpperCase();
    if (nitValue && !NIT_PATTERN.test(nitValue)) errors.nit = 'NIT invalido (p. ej. 1234567-8 o CF).';
    if (notes.length > NOTES_MAX) errors.notes = `Las notas no pueden superar ${NOTES_MAX} caracteres.`;
    return errors;
  };

  /* Campos comunes opcionales: se omiten si estan vacios */
  const commonFields = () => omitEmpty({ nit: nit.trim().toUpperCase(), notes });

  /**
   * Arma el payload del metodo actual. Devuelve null si hay errores locales.
   * La tokenizacion de tarjeta va al final para no descartar el numero si otro campo falla.
   */
  const buildPayload = async () => {
    const common = validateCommon();
    setExtraErrors(common);

    if (method === PAYMENT_METHODS.CASH_ON_DELIVERY) {
      // Contra entrega: contacto y direccion obligatorios, sin "payment".
      const errors = validateContact(contact, true);
      setContactErrors(errors);
      if (Object.keys(errors).length > 0 || Object.keys(common).length > 0) return null;
      return {
        paymentMethod: PAYMENT_METHODS.CASH_ON_DELIVERY,
        customerName: contact.customerName.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        shippingAddress: buildShippingAddress(contact),
        ...commonFields(),
      };
    }

    // Tarjeta y transferencia: contacto opcional.
    const contactErrs = validateContact(contact, false);
    setContactErrors(contactErrs);

    if (method === PAYMENT_METHODS.BANK_TRANSFER) {
      const errors = validateTransfer(transfer);
      setTransferErrors(errors);
      if (Object.keys(errors).length > 0 || Object.keys(contactErrs).length > 0 || Object.keys(common).length > 0) {
        return null;
      }
      return {
        paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
        ...optionalContactFields(contact),
        ...commonFields(),
        payment: {
          bankName: transfer.bankName,
          senderAccountNumber: transfer.senderAccountNumber.trim(),
          transferAmount: parseAmount(transfer.transferAmount),
          authorizationNumber: transfer.authorizationNumber.trim(),
          receiptUrl: receiptUrlOf(transfer),
        },
      };
    }

    // Tarjeta: valida el resto antes de tokenizar.
    if (Object.keys(contactErrs).length > 0 || Object.keys(common).length > 0) return null;
    if (!cardRef.current) return null;
    const payment = await cardRef.current.tokenize();
    if (!payment) return null;
    return {
      paymentMethod: PAYMENT_METHODS.CARD,
      ...optionalContactFields(contact),
      ...commonFields(),
      payment,
    };
  };

  /* Envio del pedido con proteccion contra doble envio */
  const handleSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setFeedback(null);
    try {
      let payload;
      try {
        payload = await buildPayload();
      } catch (err) {
        setFeedback({ message: (err && err.message) || 'No se pudieron validar los datos de pago.', details: [] });
        return;
      }
      if (!payload) {
        setFeedback({ message: 'Revisa los campos marcados en el formulario.', details: [] });
        return;
      }

      const result = await checkout(payload, getIdempotencyKey());
      // Exito: nueva clave para el proximo pedido y carrito vacio.
      idempotencyKeyRef.current = null;
      setConfirmedOrder(result.order || null);
      refreshCart().catch(() => {});
    } catch (err) {
      const info = checkoutErrorFeedback(err);
      if (info.kind === 'stock') {
        setStockModal(info.message);
      } else if (info.kind === 'coupon') {
        setFeedback({ message: info.message, details: [] });
        refreshCart().catch(() => {});
      } else {
        if (info.kind === 'idempotency') idempotencyKeyRef.current = null;
        setFeedback({ message: info.message, details: info.details });
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  /* Pedido confirmado */
  if (confirmedOrder) {
    return (
      <ScreenContainer>
        <SectionTitle title="Pago" />
        <OrderConfirmation
          order={confirmedOrder}
          onGoStore={() => navigate(ROUTES.STORE)}
          onGoDashboard={() => navigate(ROUTES.USER_DASHBOARD)}
        />
      </ScreenContainer>
    );
  }

  /* Carga inicial */
  if ((initialLoading || isLoading) && !cart) {
    return (
      <ScreenContainer>
        <LoadingState label="Preparando el pago..." />
      </ScreenContainer>
    );
  }

  /* Carrito vacio */
  if (items.length === 0) {
    return (
      <ScreenContainer>
        <SectionTitle title="Pago" />
        <EmptyState title="Tu carrito esta vacio" message="Agrega productos para poder pagar.">
          <AppButton title="Ir a la tienda" onPress={() => navigate(ROUTES.STORE)} />
        </EmptyState>
      </ScreenContainer>
    );
  }

  const blockedByIssues = issues.length > 0;

  return (
    <ScreenContainer>
      <SectionTitle title="Pago" subtitle="Elige tu metodo de pago y confirma tu pedido." />
      {configError ? <ErrorBanner message={configError} /> : null}
      {taxPercent !== null ? (
        <Text style={styles.taxInfo}>Tasa de IVA vigente: {formatPercent(taxPercent)}</Text>
      ) : null}

      <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
        {/* Columna de formularios */}
        <View style={isDesktop ? styles.mainDesktop : null}>
          <CouponPanel
            coupon={cart && cart.coupon}
            disabled={submitting}
            onApply={handleApplyCoupon}
            onRemove={handleRemoveCoupon}
          />

          <PaymentMethodSelector value={method} onChange={handleMethodChange} />

          {/* Vista condicional segun el metodo */}
          {method === PAYMENT_METHODS.CARD ? <CardPaymentForm ref={cardRef} disabled={submitting} /> : null}
          {method === PAYMENT_METHODS.BANK_TRANSFER ? (
            <BankTransferForm
              value={transfer}
              errors={transferErrors}
              grandTotal={grandTotal}
              companyBankAccounts={config.companyBankAccounts}
              disabled={submitting}
              onChange={handleTransferChange}
            />
          ) : null}
          <CashOnDeliveryForm
            value={contact}
            errors={contactErrors}
            required={method === PAYMENT_METHODS.CASH_ON_DELIVERY}
            onChange={handleContactChange}
          />

          {/* Datos de facturacion comunes */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Facturacion
            </Text>
            <AppTextInput
              label="NIT (opcional, CF = consumidor final)"
              value={nit}
              onChangeText={(text) => setNit(text.replace(/\s/g, '').toUpperCase())}
              error={extraErrors.nit}
              autoCapitalize="characters"
              maxLength={20}
            />
            <AppTextInput
              label="Notas del pedido (opcional)"
              value={notes}
              onChangeText={setNotes}
              error={extraErrors.notes}
              multiline
              maxLength={NOTES_MAX}
            />
          </Card>
        </View>

        {/* Resumen siempre visible y boton de pago */}
        <View style={isDesktop ? [styles.summaryDesktop, STICKY_WEB] : styles.summaryMobile}>
          <OrderSummary summary={summary} coupon={cart && cart.coupon} taxRate={taxPercent}>
            {blockedByIssues ? (
              <View style={styles.alert} accessibilityRole="alert">
                <Text style={styles.alertText}>Hay productos sin inventario suficiente. Ajusta tu carrito.</Text>
                <AppButton title="Volver al carrito" variant="secondary" onPress={() => navigate(ROUTES.CHECKOUT_CART)} />
              </View>
            ) : null}

            {feedback ? (
              <View style={styles.alert} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                <Text style={styles.alertText}>{feedback.message}</Text>
                {feedback.details.map((detail, index) => (
                  <Text key={`${detail.field}-${index}`} style={styles.alertDetail}>
                    {detail.field ? `${detail.field}: ` : ''}
                    {detail.message}
                  </Text>
                ))}
              </View>
            ) : null}

            <AppButton
              title={submitting ? 'Procesando...' : 'Confirmar pedido'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || blockedByIssues || items.length === 0}
              accessibilityLabel="Confirmar pedido y pagar"
            />
            <View style={styles.gap} />
            <AppButton
              title="Volver al carrito"
              variant="secondary"
              onPress={() => navigate(ROUTES.CHECKOUT_CART)}
              disabled={submitting}
            />
          </OrderSummary>
        </View>
      </View>

      {/* Inventario insuficiente al confirmar */}
      <InfoModal
        visible={stockModal !== null}
        title="Inventario insuficiente"
        message={stockModal || ''}
        variant="error"
        actionLabel="Volver al carrito"
        onClose={() => {
          setStockModal(null);
          navigate(ROUTES.CHECKOUT_CART);
        }}
      />
    </ScreenContainer>
  );
}

/* Estilos de la pantalla de pago */
const styles = StyleSheet.create({
  taxInfo: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  layout: {
    flexDirection: 'column',
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainDesktop: {
    flex: 2,
    marginRight: spacing.lg,
  },
  summaryDesktop: {
    flex: 1,
  },
  summaryMobile: {
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  alert: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertText: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  alertDetail: {
    color: colors.danger,
    fontSize: typography.small,
    marginTop: spacing.xs,
  },
  gap: {
    height: spacing.sm,
  },
});
