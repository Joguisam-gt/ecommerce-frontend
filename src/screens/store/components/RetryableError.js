/**
 * Mensaje de error con boton "Reintentar": combina ErrorBanner del contrato con un AppButton.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, ErrorBanner } from '../../../components';
import { spacing } from '../../../config/theme';

/** Muestra el error y, si se recibe onRetry, un boton secundario para reintentar. */
export default function RetryableError({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <ErrorBanner message={message} />
      {onRetry ? (
        <AppButton title="Reintentar" variant="secondary" onPress={onRetry} style={styles.button} />
      ) : null}
    </View>
  );
}

// Estilos del bloque de error
const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  button: {
    alignSelf: 'flex-start',
  },
});
