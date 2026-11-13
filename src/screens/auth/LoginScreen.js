/**
 * Pantalla de inicio de sesion.
 *
 * Formulario de correo y contrasena con validacion local, errores del backend
 * (401 credenciales, 423/429 bloqueo) y acceso como visitante. Tras el login
 * redirige a params.redirectTo si el rol tiene acceso; si no, al inicio del rol.
 * En escritorio usa dos columnas (panel informativo y formulario); en movil una.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppTextInput,
  Card,
  ErrorBanner,
  ScreenContainer,
} from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../navigation/NavigationContext';
import { ROUTES, canAccessRoute, homeRouteForRole } from '../../navigation/routes';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { isNonEmpty, isValidEmail } from '../../utils/validators';
import { colors, radius, spacing, typography } from '../../config/theme';
import { ROLES } from '../../config/constants';

/** Ventajas listadas en el panel informativo. */
const HIGHLIGHTS = [
  'Catalogo de tecnologia, comida, hogar, ropa y deportes.',
  'Precios en quetzales con descuentos e IVA desglosado.',
  'Pago contra entrega, con tarjeta o por transferencia bancaria.',
  'Sesion protegida con cookies seguras.',
];

/** Traduce un ApiError del login a un mensaje para el usuario. */
function loginErrorMessage(error) {
  if (!error) return '';
  if (error.status === 401) return 'Correo o contrasena incorrectos.';
  // 423 (cuenta bloqueada) y 429 (demasiados intentos): se muestra el mensaje del backend.
  if (error.status === 423 || error.status === 429) {
    return error.message || 'La cuenta esta bloqueada temporalmente. Intenta mas tarde.';
  }
  return error.message || 'No se pudo iniciar sesion. Intenta de nuevo.';
}

/** Pantalla de login. */
export default function LoginScreen() {
  const { login, continueAsGuest } = useAuth();
  const { route, reset } = useNavigation();
  const { isDesktop } = useResponsiveLayout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = route.params?.redirectTo;
  const redirectParams = route.params?.redirectParams || {};

  /** Valida el formulario localmente; devuelve true si es valido. */
  const validate = () => {
    const errors = {};
    if (!isValidEmail(email)) errors.email = 'Ingresa un correo valido.';
    if (!isNonEmpty(password)) errors.password = 'Ingresa tu contrasena.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** Envia las credenciales y redirige segun el rol. */
  const handleSubmit = async () => {
    setFormError('');
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      const role = user?.role || ROLES.GUEST;
      if (redirectTo && redirectTo !== ROUTES.LOGIN && canAccessRoute(redirectTo, role)) {
        reset(redirectTo, redirectParams);
      } else {
        reset(homeRouteForRole(role));
      }
    } catch (error) {
      setFormError(loginErrorMessage(error));
      setSubmitting(false);
    }
  };

  /** Entra como visitante al catalogo (o al destino si es publico). */
  const handleGuest = () => {
    continueAsGuest();
    if (redirectTo && redirectTo !== ROUTES.LOGIN && canAccessRoute(redirectTo, ROLES.GUEST)) {
      reset(redirectTo, redirectParams);
    } else {
      reset(homeRouteForRole(ROLES.GUEST));
    }
  };

  // Panel informativo de la tienda.
  const infoPanel = (
    <View style={[styles.info, isDesktop ? styles.infoDesktop : styles.infoMobile]}>
      <Text style={styles.infoTitle} accessibilityRole="header">
        Tienda en linea
      </Text>
      <Text style={styles.infoSubtitle}>
        Compra en minutos y da seguimiento a tus pedidos desde tu panel.
      </Text>
      {HIGHLIGHTS.map((item) => (
        <View key={item} style={styles.highlightRow}>
          <View style={styles.bullet} />
          <Text style={styles.highlightText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  // Tarjeta del formulario.
  const formCard = (
    <Card style={[styles.form, isDesktop && styles.formDesktop]}>
      <Text style={styles.formTitle} accessibilityRole="header">
        Iniciar sesion
      </Text>
      {redirectTo ? (
        <Text style={styles.formHint}>Inicia sesion para continuar con tu compra.</Text>
      ) : (
        <Text style={styles.formHint}>Ingresa con tu correo y contrasena.</Text>
      )}
      <ErrorBanner message={formError} />
      <AppTextInput
        label="Correo electronico"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
        }}
        error={fieldErrors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="correo@ejemplo.com"
        maxLength={254}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <AppTextInput
        label="Contrasena"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={fieldErrors.password}
        secureTextEntry
        autoCapitalize="none"
        placeholder="Tu contrasena"
        maxLength={128}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />
      <AppButton title="Iniciar sesion" onPress={handleSubmit} loading={submitting} style={styles.submit} />
      <View style={styles.divider} />
      <AppButton
        title="Continuar como visitante"
        variant="secondary"
        onPress={handleGuest}
        disabled={submitting}
      />
    </Card>
  );

  return (
    <ScreenContainer contentStyle={styles.centered}>
      <View style={[styles.layout, isDesktop ? styles.layoutDesktop : styles.layoutMobile]}>
        {infoPanel}
        {formCard}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { justifyContent: 'center' },
  layout: { width: '100%', maxWidth: 980, alignSelf: 'center' },
  layoutDesktop: { flexDirection: 'row', alignItems: 'stretch', columnGap: spacing.xl },
  layoutMobile: { flexDirection: 'column', rowGap: spacing.lg },
  info: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.xl,
    rowGap: spacing.md,
  },
  infoDesktop: { flex: 1, justifyContent: 'center' },
  infoMobile: { padding: spacing.lg },
  infoTitle: { fontSize: typography.title, fontWeight: '700', color: colors.onPrimary },
  infoSubtitle: { fontSize: typography.body, color: colors.onPrimary },
  highlightRow: { flexDirection: 'row', alignItems: 'flex-start', columnGap: spacing.sm },
  bullet: { width: 8, height: 8, marginTop: 6, borderRadius: radius.sm, backgroundColor: colors.success },
  highlightText: { flex: 1, fontSize: typography.small, color: colors.onPrimary },
  form: { padding: spacing.xl },
  formDesktop: { flex: 1, maxWidth: 440 },
  formTitle: { fontSize: typography.title, fontWeight: '700', color: colors.textPrimary },
  formHint: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  submit: { marginTop: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
});
