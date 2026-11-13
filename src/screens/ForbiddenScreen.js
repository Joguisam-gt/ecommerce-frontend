/**
 * Pantalla de acceso denegado: el rol actual no tiene permiso para la ruta.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, ScreenContainer } from '../components';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../navigation/NavigationContext';
import { homeRouteForRole } from '../navigation/routes';
import { ROLE_LABELS } from '../config/constants';
import { colors, spacing, typography } from '../config/theme';

/** Pantalla 403. */
export default function ForbiddenScreen() {
  const { role } = useAuth();
  const { reset, goBack, canGoBack } = useNavigation();
  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.code}>403</Text>
        <Text style={styles.title} accessibilityRole="header">
          Acceso denegado
        </Text>
        <Text style={styles.message}>
          {`Tu rol (${ROLE_LABELS[role] || role}) no tiene permiso para ver esta seccion.`}
        </Text>
        <View style={styles.actions}>
          {canGoBack ? <AppButton title="Volver" variant="secondary" onPress={goBack} /> : null}
          <AppButton title="Ir a mi inicio" onPress={() => reset(homeRouteForRole(role))} />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { maxWidth: 520, width: '100%', alignSelf: 'center', alignItems: 'center', padding: spacing.xl },
  code: { fontSize: typography.title, fontWeight: '700', color: colors.danger },
  title: { marginTop: spacing.sm, fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  message: { marginTop: spacing.sm, fontSize: typography.body, color: colors.textSecondary, textAlign: 'center' },
  actions: { marginTop: spacing.xl, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
});
