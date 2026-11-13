/**
 * Modal informativo nativo: overlay solido (colors.overlay, sin alfa) y tarjeta blanca.
 */
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../config/theme';
import { AppButton } from './AppButton';

/** Color del titulo segun la variante. */
const TITLE_COLORS = { info: colors.textPrimary, error: colors.danger, success: colors.success };

/**
 * @param {{ visible: boolean, title?: string, message?: string, onClose: Function,
 *   variant?: 'info'|'error'|'success', actionLabel?: string, children?: React.ReactNode }} props
 */
export function InfoModal({ visible, title, message, onClose, variant = 'info', actionLabel = 'Entendido', children }) {
  return (
    <Modal visible={Boolean(visible)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          {title ? (
            <Text style={[styles.title, { color: TITLE_COLORS[variant] || colors.textPrimary }]} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}
          <AppButton
            title={actionLabel}
            onPress={onClose}
            variant={variant === 'error' ? 'danger' : 'primary'}
            style={styles.action}
          />
        </View>
      </View>
    </Modal>
  );
}

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
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  title: { fontSize: typography.subtitle, fontWeight: '700', marginBottom: spacing.sm },
  message: { fontSize: typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  action: { marginTop: spacing.sm },
});

export default InfoModal;
