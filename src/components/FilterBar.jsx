/**
 * Barra de filtros controlada (estado en useQueryFilters). Tipos de campo: text,
 * number, date (AAAA-MM-DD validado), select y boolean (chips con opcion "Todos").
 * Escritorio: campos en fila con ajuste; movil: columna plegable ("Mostrar filtros").
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../config/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { DateField, dateFieldError } from './DateField';

/** Opciones fijas de los filtros booleanos. */
const BOOLEAN_OPTIONS = [
  { label: 'Si', value: 'true' },
  { label: 'No', value: 'false' },
];

/** Opcion "Todos" que representa el filtro vacio. */
const ALL_OPTION = { label: 'Todos', value: '' };

/** Compara valores de chip tolerando booleanos, numeros y vacios. */
function sameValue(a, b) {
  const norm = (v) => (v === null || v === undefined || v === 'all' ? '' : String(v));
  return norm(a) === norm(b);
}

/** Grupo de chips de seleccion unica. */
function ChipGroup({ label, options, value, onSelect }) {
  return (
    <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = sameValue(option.value, value);
        return (
          <TouchableOpacity
            key={`${label}-${String(option.value)}`}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ checked: selected, selected }}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.85}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * @param {{ fields: { key: string, label: string, type: 'text'|'number'|'date'|'select'|'boolean',
 *   options?: { label: string, value: any }[], placeholder?: string }[],
 *   values: object, onChange: (key: string, value: any) => void, onApply: Function,
 *   onReset?: Function, applying?: boolean }} props
 */
export function FilterBar({ fields = [], values = {}, onChange, onApply, onReset, applying = false }) {
  const { isDesktop } = useResponsiveLayout();
  const [expanded, setExpanded] = useState(false);

  // Fechas invalidas bloquean la aplicacion de filtros.
  const hasInvalidDate = fields.some((f) => f.type === 'date' && dateFieldError(values[f.key]));
  const activeCount = fields.filter((f) => !sameValue(values[f.key], '')).length;

  /** Cambia un valor del filtro. */
  const change = (key, value) => onChange && onChange(key, value);

  /** Renderiza el control segun el tipo de campo. */
  const renderField = (field) => {
    const value = values[field.key];
    switch (field.type) {
      case 'select':
      case 'boolean': {
        const base = field.type === 'boolean' ? field.options || BOOLEAN_OPTIONS : field.options || [];
        // Se agrega "Todos" salvo que las opciones ya incluyan el valor vacio.
        const options = base.some((o) => sameValue(o.value, '')) ? base : [ALL_OPTION, ...base];
        return (
          <View>
            <Text style={styles.label}>{field.label}</Text>
            <ChipGroup label={field.label} options={options} value={value} onSelect={(v) => change(field.key, v)} />
          </View>
        );
      }
      case 'date':
        return (
          <DateField
            label={field.label}
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(v) => change(field.key, v)}
            placeholder={field.placeholder || 'AAAA-MM-DD'}
          />
        );
      case 'number':
        return (
          <AppTextInput
            label={field.label}
            value={value === null || value === undefined ? '' : String(value)}
            onChangeText={(text) => change(field.key, text.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            placeholder={field.placeholder}
            autoCapitalize="none"
            onSubmitEditing={() => !hasInvalidDate && onApply && onApply()}
          />
        );
      default:
        return (
          <AppTextInput
            label={field.label}
            value={value === null || value === undefined ? '' : String(value)}
            onChangeText={(text) => change(field.key, text)}
            placeholder={field.placeholder}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => !hasInvalidDate && onApply && onApply()}
          />
        );
    }
  };

  const showFields = isDesktop || expanded;

  return (
    <View style={styles.container}>
      {/* En movil los filtros se pliegan para ahorrar espacio. */}
      {!isDesktop ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Ocultar filtros' : 'Mostrar filtros'}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((prev) => !prev)}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>
            {expanded ? 'Ocultar filtros' : 'Mostrar filtros'}
            {activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
        </TouchableOpacity>
      ) : null}
      {showFields ? (
        <View>
          <View style={[styles.fields, isDesktop ? styles.fieldsDesktop : styles.fieldsMobile]}>
            {fields.map((field) => (
              <View
                key={field.key}
                style={[
                  isDesktop ? styles.fieldDesktop : styles.fieldMobile,
                  isDesktop && (field.type === 'select' || field.type === 'boolean') && styles.fieldWide,
                ]}
              >
                {renderField(field)}
              </View>
            ))}
          </View>
          <View style={styles.buttons}>
            <AppButton
              title="Aplicar filtros"
              onPress={onApply}
              loading={applying}
              disabled={hasInvalidDate}
              style={styles.button}
            />
            {onReset ? (
              <AppButton title="Limpiar" variant="secondary" onPress={onReset} disabled={applying} style={styles.button} />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  toggle: { minHeight: MIN_TOUCH_SIZE, justifyContent: 'center' },
  toggleText: { fontSize: typography.body, fontWeight: '600', color: colors.textPrimary },
  fields: { gap: spacing.md },
  fieldsDesktop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  fieldsMobile: { flexDirection: 'column', marginTop: spacing.sm },
  fieldDesktop: { flexGrow: 1, flexBasis: 200, minWidth: 180, maxWidth: 320 },
  fieldWide: { maxWidth: 520 },
  fieldMobile: { width: '100%' },
  label: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.small, color: colors.textPrimary },
  chipTextSelected: { color: colors.onPrimary, fontWeight: '600' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: { minWidth: 140 },
});

export default FilterBar;
