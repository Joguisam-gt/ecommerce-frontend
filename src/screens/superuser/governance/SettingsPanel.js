/**
 * Panel de configuracion global (GET/PATCH /superuser/settings).
 * - defaultTaxRate se muestra y edita como porcentaje (12 = 0.12) y se envia como fraccion 0..1.
 * - maintenanceMode con Checkbox y aviso de que bloquea el checkout (503 MAINTENANCE_MODE).
 * - Editor de companyBankAccounts (maximo 20, duplicados banco + numero detectados localmente).
 * Al guardar se envian solo los campos modificados; la lista de cuentas va completa si cambio
 * (el PATCH reemplaza la lista). Se confirma con ConfirmModal y los details de VALIDATION_ERROR
 * se muestran por campo.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppTextInput,
  Card,
  Checkbox,
  ConfirmModal,
  DetailRow,
  ErrorBanner,
  LoadingState,
} from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { getSettings, updateSettings } from '../../../services/superuser/settingsService';
import { formatDateTime } from '../../../utils/format';
import { BankAccountEditor } from './BankAccountEditor';
import { describeApiError, fieldErrorsFromApi } from './governanceErrors';
import { PanelNotice } from './PanelNotice';
import {
  MAX_COMPANY_BANK_ACCOUNTS,
  buildSettingsPatch,
  fractionToPercentText,
  mapSettingsDetails,
  newAccount,
  parsePercent,
  toFormAccounts,
  validateAccounts,
} from './settingsForm';

/** Formulario editable a partir de la configuracion del backend. */
function toForm(settings) {
  return {
    taxPercent: fractionToPercentText(settings.defaultTaxRate),
    maintenanceMode: Boolean(settings.maintenanceMode),
    accounts: toFormAccounts(settings.companyBankAccounts),
  };
}

/** Errores vacios del formulario. */
const NO_ERRORS = { byIndex: {} };

export function SettingsPanel() {
  const { isDesktop, width } = useResponsiveLayout();
  // En pantallas anchas las tarjetas de cuenta van en 2 columnas (campos internos apilados).
  const accountGrid = width >= 1100;
  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState(NO_ERRORS);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  /** Carga la configuracion actual. */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const settings = await getSettings();
      setOriginal(settings);
      setForm(toForm(settings));
      setErrors(NO_ERRORS);
    } catch (error) {
      setLoadError(describeApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Cuerpo del PATCH con solo lo modificado (vacio si no hay cambios). */
  const patch = useMemo(() => (original && form ? buildSettingsPatch(original, form) : {}), [original, form]);
  const hasChanges = Object.keys(patch).length > 0;

  /** Actualiza un campo escalar del formulario. */
  const setField = (key, value) => {
    setNotice('');
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'taxPercent') setErrors((prev) => ({ ...prev, taxPercent: undefined }));
  };

  /** Actualiza un campo de una cuenta y limpia su error. */
  const setAccountField = (index, field, value) => {
    setNotice('');
    setForm((prev) => ({
      ...prev,
      accounts: prev.accounts.map((account, i) => (i === index ? { ...account, [field]: value } : account)),
    }));
    setErrors((prev) => {
      const current = prev.byIndex[index];
      if (!current || !current[field]) return prev;
      return { ...prev, byIndex: { ...prev.byIndex, [index]: { ...current, [field]: undefined } } };
    });
  };

  /** Agrega una cuenta vacia (maximo 20). */
  const addAccount = () => {
    if (form.accounts.length >= MAX_COMPANY_BANK_ACCOUNTS) return;
    setNotice('');
    setForm((prev) => ({ ...prev, accounts: [...prev.accounts, newAccount()] }));
  };

  /** Quita una cuenta; los errores por indice se descartan porque cambian las posiciones. */
  const removeAccount = (index) => {
    setNotice('');
    setForm((prev) => ({ ...prev, accounts: prev.accounts.filter((_, i) => i !== index) }));
    setErrors((prev) => ({ ...prev, byIndex: {} }));
  };

  /** Valida localmente; si todo es correcto abre la confirmacion. */
  const requestSave = () => {
    setSaveError('');
    const tax = parsePercent(form.taxPercent);
    const accountErrors = validateAccounts(form.accounts);
    const next = { byIndex: accountErrors.byIndex, list: accountErrors.list || undefined, taxPercent: tax.error || undefined };
    setErrors(next);
    const invalid = tax.error || accountErrors.list || Object.keys(accountErrors.byIndex).length > 0;
    if (invalid) {
      setSaveError('Corrige los campos marcados antes de guardar.');
      return;
    }
    if (hasChanges) setConfirming(true);
  };

  /** Envia el PATCH confirmado y sincroniza el formulario con la respuesta. */
  const confirmSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const saved = await updateSettings(patch);
      setOriginal(saved);
      setForm(toForm(saved));
      setErrors(NO_ERRORS);
      setConfirming(false);
      setNotice('Configuracion guardada. Los cambios aplican a las compras futuras.');
    } catch (error) {
      setErrors({ byIndex: {}, ...mapSettingsDetails(fieldErrorsFromApi(error)) });
      setSaveError(describeApiError(error));
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  // Estados de carga inicial.
  if (loading && !form) return <LoadingState label="Cargando configuracion..." />;
  if (loadError && !form) {
    return (
      <View>
        <ErrorBanner message={loadError} />
        <AppButton title="Reintentar" variant="secondary" onPress={load} />
      </View>
    );
  }
  if (!form) return null;

  /** Resumen legible de los cambios para el modal. */
  const changeLines = [];
  if (patch.defaultTaxRate !== undefined) {
    changeLines.push(`IVA por defecto: ${fractionToPercentText(original.defaultTaxRate)}% -> ${fractionToPercentText(patch.defaultTaxRate)}%`);
  }
  if (patch.maintenanceMode !== undefined) {
    changeLines.push(`Modo mantenimiento: ${patch.maintenanceMode ? 'ACTIVADO (bloquea el checkout)' : 'desactivado'}`);
  }
  if (patch.companyBankAccounts !== undefined) {
    changeLines.push(`Cuentas bancarias: se reemplazara la lista completa (${patch.companyBankAccounts.length} cuenta(s)).`);
  }

  return (
    <View>
      <Text style={styles.title} accessibilityRole="header">
        Configuracion global
      </Text>
      <PanelNotice message={notice} tone="success" />
      <PanelNotice message={saveError} tone="danger" />
      <PanelNotice message={errors.root} tone="danger" />

      {/* Datos generales: IVA y modo mantenimiento (2 columnas en escritorio) */}
      <Card style={styles.card}>
        <View style={isDesktop ? styles.row : null}>
          <View style={isDesktop ? styles.cell : null}>
            <AppTextInput
              label="IVA por defecto (%)"
              value={form.taxPercent}
              onChangeText={(v) => setField('taxPercent', v)}
              error={errors.taxPercent}
              keyboardType="decimal-pad"
              placeholder="12"
              maxLength={6}
            />
            <Text style={styles.hint}>
              Se guarda como fraccion: {form.taxPercent || '0'}% = {parsePercent(form.taxPercent).fraction ?? '-'}
            </Text>
          </View>
          <View style={isDesktop ? styles.cell : null}>
            <Checkbox
              label="Modo mantenimiento"
              checked={form.maintenanceMode}
              onChange={() => setField('maintenanceMode', !form.maintenanceMode)}
            />
            {errors.maintenanceMode ? <Text style={styles.error}>{errors.maintenanceMode}</Text> : null}
            <Text style={[styles.hint, form.maintenanceMode && styles.warning]}>
              Mientras este activo, el checkout del POS responde 503 (MAINTENANCE_MODE) y los clientes no pueden
              completar compras. El resto de la tienda sigue visible.
            </Text>
          </View>
        </View>
        {/* Metadatos de la ultima modificacion */}
        <DetailRow label="Ultima modificacion" value={original.updatedAt ? formatDateTime(original.updatedAt) : 'Sin cambios registrados'} />
        <DetailRow label="Modificado por (id)" value={original.updatedBy || '-'} />
      </Card>

      {/* Editor de cuentas bancarias */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionText}>
          <Text style={styles.subtitle} accessibilityRole="header">
            Cuentas bancarias de la empresa ({form.accounts.length}/{MAX_COMPANY_BANK_ACCOUNTS})
          </Text>
          <Text style={styles.hint}>Al guardar, esta lista reemplaza por completo la registrada.</Text>
        </View>
        <AppButton
          title="Agregar cuenta"
          variant="secondary"
          onPress={addAccount}
          disabled={form.accounts.length >= MAX_COMPANY_BANK_ACCOUNTS || saving}
        />
      </View>
      {errors.list ? <Text style={styles.error}>{errors.list}</Text> : null}
      {form.accounts.length === 0 ? (
        <Text style={styles.empty}>No hay cuentas registradas. La tienda no mostrara cuentas para transferencias.</Text>
      ) : null}
      <View style={accountGrid ? styles.accountsGrid : null}>
        {form.accounts.map((account, index) => (
          <View key={account.localKey} style={accountGrid ? styles.accountCell : null}>
            <BankAccountEditor
              index={index}
              account={account}
              errors={errors.byIndex[index]}
              isDesktop={isDesktop && !accountGrid}
              disabled={saving}
              onChange={(field, value) => setAccountField(index, field, value)}
              onRemove={() => removeAccount(index)}
            />
          </View>
        ))}
      </View>

      {/* Acciones de guardado */}
      <View style={styles.actions}>
        <AppButton
          title="Descartar cambios"
          variant="secondary"
          onPress={() => { setForm(toForm(original)); setErrors(NO_ERRORS); setSaveError(''); }}
          disabled={!hasChanges || saving}
        />
        <AppButton title="Guardar configuracion" onPress={requestSave} disabled={!hasChanges} loading={saving} />
      </View>

      {/* Confirmacion antes del PATCH */}
      <ConfirmModal
        visible={confirming}
        title="Guardar configuracion global"
        message="Se aplicaran los siguientes cambios a toda la tienda:"
        confirmLabel="Guardar"
        tone={patch.maintenanceMode === true ? 'danger' : 'primary'}
        onConfirm={confirmSave}
        onCancel={() => { if (!saving) setConfirming(false); }}
        loading={saving}
      >
        {changeLines.map((line) => (
          <Text key={line} style={styles.changeLine}>
            - {line}
          </Text>
        ))}
      </ConfirmModal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  subtitle: { fontSize: typography.body, fontWeight: '700', color: colors.textPrimary },
  card: { padding: spacing.lg, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.xl },
  cell: { flex: 1 },
  hint: { fontSize: typography.small, color: colors.textSecondary, marginBottom: spacing.sm },
  warning: { color: colors.danger, fontWeight: '600' },
  error: { fontSize: typography.small, color: colors.danger, marginBottom: spacing.sm },
  empty: { fontSize: typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionText: { flexShrink: 1 },
  accountsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.sm },
  accountCell: { width: '50%', paddingHorizontal: spacing.sm },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  changeLine: { fontSize: typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
});

export default SettingsPanel;
