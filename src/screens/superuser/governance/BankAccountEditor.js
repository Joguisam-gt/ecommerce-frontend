/**
 * Tarjeta editable de una cuenta bancaria de la empresa (bankAccountSchema del backend):
 * banco (COMPANY_BANKS), numero, titular, tipo (monetaria | ahorro) e isActive, con boton para quitarla.
 * Escritorio: numero y titular en 2 columnas; movil: apilados.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppTextInput, Card, Checkbox, SegmentedControl } from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { ACCOUNT_TYPES, COMPANY_BANKS } from './settingsForm';

/** Opciones de banco y tipo de cuenta. */
const BANK_OPTIONS = COMPANY_BANKS.map((bank) => ({ label: bank, value: bank }));
const TYPE_LABELS = { monetaria: 'Monetaria', ahorro: 'Ahorro' };
const TYPE_OPTIONS = ACCOUNT_TYPES.map((type) => ({ label: TYPE_LABELS[type] || type, value: type }));

/**
 * @param {{ index: number, account: object, errors?: Record<string, string>, isDesktop: boolean,
 *   disabled?: boolean, onChange: (field: string, value: any) => void, onRemove: () => void }} props
 */
export function BankAccountEditor({ index, account, errors = {}, isDesktop, disabled, onChange, onRemove }) {
  const cellStyle = isDesktop ? styles.cell : null;
  return (
    <Card style={[styles.card, Object.keys(errors).length > 0 && styles.cardError]}>
      {/* Encabezado de la tarjeta */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Cuenta {index + 1}
        </Text>
        <AppButton
          title="Quitar"
          variant="secondary"
          onPress={onRemove}
          disabled={disabled}
          accessibilityLabel={`Quitar cuenta ${index + 1}`}
        />
      </View>

      {/* Banco */}
      <Text style={styles.label}>Banco</Text>
      <SegmentedControl
        options={BANK_OPTIONS}
        value={account.bankName}
        onChange={(v) => onChange('bankName', v)}
        accessibilityLabel={`Banco de la cuenta ${index + 1}`}
        disabled={disabled}
      />
      {errors.bankName ? <Text style={styles.error}>{errors.bankName}</Text> : null}

      {/* Numero y titular */}
      <View style={isDesktop ? styles.row : null}>
        <View style={cellStyle}>
          <AppTextInput
            label="Numero de cuenta"
            value={account.accountNumber}
            onChangeText={(v) => onChange('accountNumber', v)}
            error={errors.accountNumber}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            placeholder="123-456789-0"
            maxLength={30}
            editable={!disabled}
          />
        </View>
        <View style={cellStyle}>
          <AppTextInput
            label="Titular"
            value={account.accountHolder}
            onChangeText={(v) => onChange('accountHolder', v)}
            error={errors.accountHolder}
            autoCapitalize="words"
            maxLength={120}
            editable={!disabled}
          />
        </View>
      </View>

      {/* Tipo y estado */}
      <View style={isDesktop ? styles.row : null}>
        <View style={cellStyle}>
          <Text style={styles.label}>Tipo de cuenta</Text>
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={account.accountType}
            onChange={(v) => onChange('accountType', v)}
            accessibilityLabel={`Tipo de la cuenta ${index + 1}`}
            disabled={disabled}
          />
          {errors.accountType ? <Text style={styles.error}>{errors.accountType}</Text> : null}
        </View>
        <View style={[cellStyle, styles.checkboxCell]}>
          <Checkbox
            label="Activa (visible en la tienda para transferencias)"
            checked={Boolean(account.isActive)}
            onChange={() => onChange('isActive', !account.isActive)}
            disabled={disabled}
          />
          {errors.isActive ? <Text style={styles.error}>{errors.isActive}</Text> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, marginBottom: spacing.md },
  cardError: { borderColor: colors.danger },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { fontSize: typography.body, fontWeight: '700', color: colors.textPrimary },
  label: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  error: { fontSize: typography.small, color: colors.danger, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.lg },
  cell: { flex: 1 },
  checkboxCell: { justifyContent: 'center', marginBottom: spacing.md },
});

export default BankAccountEditor;
