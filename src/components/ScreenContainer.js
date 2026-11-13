/**
 * Contenedor de pantalla: fondo de la app y contenido centrado con ancho maximo y margenes responsivos.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../config/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * @param {{ children: React.ReactNode, scroll?: boolean, contentStyle?: object }} props
 */
export function ScreenContainer({ children, scroll = true, contentStyle }) {
  const { contentMaxWidth, gutter } = useResponsiveLayout();
  // Bloque central con ancho maximo y margen lateral.
  const inner = (
    <View style={[styles.inner, { maxWidth: contentMaxWidth, paddingHorizontal: gutter }, contentStyle]}>
      {children}
    </View>
  );
  if (!scroll) return <View style={styles.root}>{inner}</View>;
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {inner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: spacing.xl,
  },
});

export default ScreenContainer;
