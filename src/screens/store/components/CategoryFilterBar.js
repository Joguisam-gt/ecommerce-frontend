/**
 * Barra horizontal de categorias de la tienda. El chip activo usa colors.primary.
 * La opcion 'Todas' representa "sin filtro de categoria".
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '../../../config/theme';
import { CATEGORIES } from '../../../config/constants';

/** Valor de CATEGORIES que equivale a no filtrar. */
export const ALL_CATEGORIES = 'Todas';

/** Lista horizontal de chips; selected es la categoria activa o null para 'Todas'. */
export default function CategoryFilterBar({ selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      accessibilityRole="tablist"
    >
      {CATEGORIES.map((category) => {
        // 'Todas' esta activo cuando no hay categoria seleccionada
        const isAll = category === ALL_CATEGORIES;
        const isActive = isAll ? !selected : selected === category;
        return (
          <TouchableOpacity
            key={category}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(isAll ? null : category)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Categoria ${category}`}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{category}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// Estilos de los chips de categoria
const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: typography.body,
  },
  chipTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
