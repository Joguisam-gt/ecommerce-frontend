/**
 * Selector de producto del inventario: busca por nombre (GET /admin/inventory
 * con productName) y devuelve el producto elegido. Se usa en mermas, lineas de
 * compra y catalogo de proveedor.
 */
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { listInventory } from '../../../services/admin/inventoryService';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../../../config/theme';
import { formatMoney } from '../../../utils/format';
import { describeError } from './adminHelpers';

/** Maximo de resultados mostrados por busqueda. */
const RESULT_LIMIT = 8;

/**
 * @param {{ label?: string, value: object | null, onSelect: (product: object | null) => void,
 *   error?: string, disabled?: boolean, supplierId?: string }} props
 * value: producto elegido ({ id, name, sku, stock, costPrice }) o null.
 */
export default function ProductPicker({ label = 'Producto', value, onSelect, error, disabled = false, supplierId }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Busca productos por nombre (opcionalmente del proveedor indicado).
  const search = async () => {
    const productName = term.trim();
    if (!productName) return;
    setLoading(true);
    setSearchError(null);
    try {
      const query = { productName, limit: RESULT_LIMIT, page: 1 };
      if (supplierId) query.supplierId = supplierId;
      const { items } = await listInventory(query);
      setResults(items || []);
      setSearched(true);
    } catch (err) {
      setSearchError(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  // Elige un producto y limpia la busqueda.
  const choose = (product) => {
    onSelect(product);
    setResults([]);
    setTerm('');
    setSearched(false);
  };

  // Producto ya elegido: resumen con opcion de cambiarlo.
  if (value && value.id) {
    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={[styles.selected, error ? styles.selectedError : null]}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName} numberOfLines={2}>
              {value.name || value.id}
            </Text>
            <Text style={styles.meta}>
              {value.sku ? `SKU ${value.sku}` : `Id ${value.id}`}
              {value.stock !== undefined && value.stock !== null ? ` - Stock ${value.stock}` : ''}
            </Text>
          </View>
          {!disabled ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cambiar producto"
              onPress={() => onSelect(null)}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>Cambiar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {/* Campo de busqueda + boton */}
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel={`Buscar ${label.toLowerCase()} por nombre`}
          value={term}
          onChangeText={setTerm}
          onSubmitEditing={search}
          placeholder="Nombre del producto"
          placeholderTextColor={colors.textSecondary}
          editable={!disabled}
          style={[styles.input, error ? styles.inputError : null]}
          maxLength={100}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Buscar producto"
          onPress={search}
          disabled={disabled || loading}
          style={styles.searchButton}
        >
          {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.searchText}>Buscar</Text>}
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {searchError ? <Text style={styles.error}>{searchError}</Text> : null}
      {/* Resultados de la busqueda */}
      {results.length > 0 ? (
        <View style={styles.results}>
          {results.map((product) => (
            <TouchableOpacity
              key={product.id}
              accessibilityRole="button"
              accessibilityLabel={`Elegir ${product.name}`}
              onPress={() => choose(product)}
              style={styles.resultRow}
            >
              <Text style={styles.resultName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.meta}>
                {`SKU ${product.sku} - Stock ${product.stock}`}
                {product.costPrice !== null && product.costPrice !== undefined ? ` - Costo ${formatMoney(product.costPrice)}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {searched && results.length === 0 && !loading ? <Text style={styles.meta}>Sin coincidencias.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.danger },
  searchButton: {
    minHeight: MIN_TOUCH_SIZE,
    minWidth: 88,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchText: { color: colors.onPrimary, fontWeight: '600', fontSize: typography.body },
  results: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  resultRow: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
    justifyContent: 'center',
  },
  resultName: { fontSize: typography.body, color: colors.textPrimary, fontWeight: '600' },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedError: { borderColor: colors.danger },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: typography.body, color: colors.textPrimary, fontWeight: '600' },
  meta: { fontSize: typography.small, color: colors.textSecondary, marginTop: spacing.xs },
  linkButton: { minHeight: MIN_TOUCH_SIZE, minWidth: MIN_TOUCH_SIZE, paddingHorizontal: spacing.sm, justifyContent: 'center' },
  linkText: { color: colors.primary, fontWeight: '600', textDecorationLine: 'underline', fontSize: typography.body },
  error: { marginTop: spacing.xs, fontSize: typography.small, color: colors.danger },
});
