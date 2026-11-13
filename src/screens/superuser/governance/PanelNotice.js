/**
 * Aviso en linea de los paneles de gobernanza: borde y texto solidos segun el tono
 * (success, danger o neutral) sobre fondo surface. Sin transparencias.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../config/theme';

/** Color de borde y texto por tono. */
const TONES = {
  success: colors.success,
  danger: colors.danger,
  neutral: colors.textPrimary,
};

/**
 * @param {{ message?: string, tone?: 'success'|'danger'|'neutral', title?: string }} props
 */
export function PanelNotice({ message, tone = 'neutral', title }) {
  // Sin mensaje no se muestra nada.
  if (!message) return null;
  const color = TONES[tone] || TONES.neutral;
  return (
    <View
      style={[styles.box, { borderColor: color }]}
      accessibilityRole={tone === 'danger' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      {title ? <Text style={[styles.title, { color }]}>{title}</Text> : null}
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.xs },
  text: { fontSize: typography.body },
});

export default PanelNotice;
