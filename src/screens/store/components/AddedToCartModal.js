/**
 * Modal nativo de exito al agregar un producto al carrito, con dos acciones:
 * "Seguir comprando" y "Ir al carrito". Overlay solido colors.overlay y tarjeta surface.
 */
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components';
import { colors, radius, spacing, typography } from '../../../config/theme';

/** Modal de confirmacion; onContinue cierra y onGoToCart navega al carrito. */
export default function AddedToCartModal({ visible, message, onContinue, onGoToCart }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title} accessibilityRole="header">
            Producto agregado
          </Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <AppButton title="Seguir comprando" variant="secondary" onPress={onContinue} />
            <AppButton title="Ir al carrito" onPress={onGoToCart} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Estilos del modal
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.success,
  },
  message: {
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
