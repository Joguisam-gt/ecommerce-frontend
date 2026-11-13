/**
 * Barra de busqueda de la tienda: campo de texto con boton "Buscar" y boton "Limpiar".
 * La busqueda se ejecuta solo al enviar (boton o tecla Enter), no en cada pulsacion.
 */
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../config/theme';

/** Longitud maxima admitida por el backend para el parametro search. */
const SEARCH_MAX_LENGTH = 100;

/** Campo de busqueda controlado; onSubmit recibe el texto ya recortado. */
export default function SearchBar({ value, onChangeText, onSubmit, onClear, showClear }) {
  // Envia la busqueda actual recortando espacios
  const handleSubmit = () => onSubmit(value.trim());

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={handleSubmit}
        placeholder="Buscar productos por nombre o descripcion"
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={SEARCH_MAX_LENGTH}
        accessibilityLabel="Buscar productos"
      />
      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleSubmit}
        accessibilityRole="button"
        accessibilityLabel="Buscar"
      >
        <Text style={styles.searchButtonText}>Buscar</Text>
      </TouchableOpacity>
      {showClear ? (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Limpiar busqueda y filtros"
        >
          <Text style={styles.clearButtonText}>Limpiar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// Estilos de la barra de busqueda
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: typography.body,
  },
  searchButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: '700',
  },
  clearButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body,
  },
});
