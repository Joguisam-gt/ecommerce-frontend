/**
 * Tarjeta contenedora: fondo surface, borde de 1px y radio medio.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../config/theme';

/** @param {{ children: React.ReactNode, style?: object }} props */
export function Card({ children, style, ...rest }) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
});

export default Card;
