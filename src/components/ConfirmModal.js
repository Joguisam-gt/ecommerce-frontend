/**
 * Modal de confirmacion nativo con overlay solido (colors.overlay). Si se indica
 * `requireText`, el boton de confirmar solo se habilita cuando el usuario escribe
 * exactamente ese texto (confirmacion explicita de acciones destructivas).
 */
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../config/theme';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';

/**
 * @param {{ visible: boolean, title: string, message?: string, confirmLabel?: string,
 *   cancelLabel?: string, tone?: 'primary'|'danger', requireText?: string, requireTextLabel?: string,
 *   onConfirm: Function, onCancel: Function, loading?: boolean, confirmDisabled?: boolean,
 *   children?: React.ReactNode }} props
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  requireText,
  requireTextLabel,
  onConfirm,
  onCancel,
  loading = false,
  confirmDisabled = false,
  children,
}) {
  const [typed, setTyped] = useState('');

  // Limpia el texto escrito cada vez que el modal se abre o cierra.
  useEffect(() => {
    setTyped('');
  }, [visible]);

  const textMatches = !requireText || typed === requireText;
  const canConfirm = textMatches && !confirmDisabled && !loading;

  /** Cierra salvo que haya una operacion en curso. */
  const handleCancel = () => {
    if (!loading && onCancel) onCancel();
  };

  return (
    <Modal visible={Boolean(visible)} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Text
              style={[styles.title, tone === 'danger' && styles.titleDanger]}
              accessibilityRole="header"
            >
              {title}
            </Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {children}
            {/* Confirmacion escrita: el texto debe coincidir exactamente. */}
            {requireText ? (
              <AppTextInput
                label={requireTextLabel || `Escribe "${requireText}" para confirmar`}
                value={typed}
                onChangeText={setTyped}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                error={typed.length > 0 && !textMatches ? 'El texto no coincide.' : undefined}
              />
            ) : null}
            <View style={styles.actions}>
              <AppButton title={cancelLabel} variant="secondary" onPress={handleCancel} disabled={loading} style={styles.button} />
              <AppButton
                title={confirmLabel}
                variant={tone === 'danger' ? 'danger' : 'primary'}
                onPress={() => canConfirm && onConfirm && onConfirm(typed)}
                disabled={!canConfirm}
                loading={loading}
                style={styles.button}
              />
            </View>
          </ScrollView>
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
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { padding: spacing.xl },
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  titleDanger: { color: colors.danger },
  message: { fontSize: typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  button: { flexGrow: 1, flexBasis: 140 },
});

export default ConfirmModal;
