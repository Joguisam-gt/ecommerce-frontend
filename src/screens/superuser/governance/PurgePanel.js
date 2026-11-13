/**
 * Panel de purga segura (DELETE /superuser/purge/:collection/:id): borrado fisico irreversible de un
 * registro ya desactivado de users, products, suppliers o coupons. Valida el ObjectId, explica las
 * reglas (NOT_SOFT_DELETED, FISCAL_INTEGRITY_LOCK, auditoria record.purged) y exige escribir
 * `PURGAR <coleccion>/<id>` en un ConfirmModal de tono danger antes de llamar a purgeRecord.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppTextInput, Card, ConfirmModal, DetailRow, SegmentedControl } from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { PURGEABLE_COLLECTIONS, purgeRecord } from '../../../services/superuser/purgeService';
import { describeApiError, describeReferences } from './governanceErrors';
import { PanelNotice } from './PanelNotice';

/** ObjectId de MongoDB en hexadecimal. */
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

/** Etiquetas en espanol de las colecciones purgables. */
const COLLECTION_LABELS = {
  users: 'Usuarios',
  products: 'Productos',
  suppliers: 'Proveedores',
  coupons: 'Cupones',
};

/** Como se desactiva antes cada tipo de registro. */
const SOFT_DELETE_HINTS = {
  users: 'Desactiva la cuenta (estado inactivo) desde Clientes o Personal.',
  products: 'Desactiva el producto desde el catalogo.',
  suppliers: 'Desactiva el proveedor desde Proveedores y reasigna sus productos.',
  coupons: 'Desactiva el cupon desde Cupones.',
};

/** Mensajes especificos de la purga (con 404 claro). */
const PURGE_MESSAGES = {
  RECORD_NOT_FOUND: 'No se encontro ningun registro con ese id en la coleccion elegida (404).',
  NOT_FOUND: 'No se encontro ningun registro con ese id en la coleccion elegida (404).',
  FORBIDDEN: 'Acceso denegado (403): solo un superusuario con permiso de borrado fisico puede purgar.',
};

export function PurgePanel() {
  const { isDesktop } = useResponsiveLayout();
  const collections = Array.isArray(PURGEABLE_COLLECTIONS) && PURGEABLE_COLLECTIONS.length > 0
    ? PURGEABLE_COLLECTIONS
    : Object.keys(COLLECTION_LABELS);
  const [collection, setCollection] = useState(collections[0]);
  const [recordId, setRecordId] = useState('');
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [purging, setPurging] = useState(false);
  const [result, setResult] = useState(null);
  const [errorText, setErrorText] = useState('');

  const id = recordId.trim();
  const idValid = OBJECT_ID_PATTERN.test(id);
  const confirmPhrase = `PURGAR ${collection}/${id}`;

  /** Abre la confirmacion explicita si el id es valido. */
  const requestPurge = () => {
    setTouched(true);
    setResult(null);
    setErrorText('');
    if (idValid) setConfirming(true);
  };

  /** Ejecuta la purga y muestra el resultado del backend o el error mapeado. */
  const confirmPurge = async () => {
    setPurging(true);
    try {
      const data = await purgeRecord(collection, id);
      setResult(data || { collection, id, purged: true });
      setRecordId('');
      setTouched(false);
    } catch (error) {
      const references = describeReferences(error);
      let message = describeApiError(error, PURGE_MESSAGES);
      if (error && error.code === 'NOT_SOFT_DELETED') message = `${message} ${SOFT_DELETE_HINTS[collection] || ''}`;
      if (references) message = `${message} Referencias: ${references}.`;
      setErrorText(message.trim());
    } finally {
      setPurging(false);
      setConfirming(false);
    }
  };

  /** Advertencias de la operacion. */
  const warning = (
    <Card style={[styles.card, styles.warningCard]}>
      <Text style={styles.warningTitle} accessibilityRole="header">
        Operacion irreversible
      </Text>
      <Text style={styles.warningText}>- El registro se elimina fisicamente de la base de datos y no se puede recuperar.</Text>
      <Text style={styles.warningText}>
        - Solo se purgan registros desactivados previamente (borrado logico). Si sigue activo, el servidor responde
        NOT_SOFT_DELETED.
      </Text>
      <Text style={styles.warningText}>
        - Si tiene pedidos, facturas o compras asociadas, se bloquea por integridad fiscal (FISCAL_INTEGRITY_LOCK).
      </Text>
      <Text style={styles.warningText}>
        - Cada purga queda registrada en la bitacora como record.purged con una copia del registro.
      </Text>
    </Card>
  );

  return (
    <View>
      <Text style={styles.title} accessibilityRole="header">
        Purga de registros
      </Text>
      <PanelNotice message={errorText} tone="danger" title="No se pudo purgar" />
      {result ? (
        <Card style={[styles.card, styles.resultCard]}>
          <Text style={styles.resultTitle} accessibilityRole="header">
            Registro purgado
          </Text>
          <DetailRow label="Coleccion" value={result.collection} />
          <DetailRow label="Id" value={result.id} />
          <DetailRow label="Purgado" value={result.purged ? 'Si' : 'No'} />
          <DetailRow label="Entrada de auditoria" value={result.auditLogId || '-'} />
        </Card>
      ) : null}

      {/* Formulario y advertencia: 2 columnas en escritorio */}
      <View style={isDesktop ? styles.row : null}>
        <View style={isDesktop ? styles.cell : null}>
          <Card style={styles.card}>
            <Text style={styles.label}>Coleccion</Text>
            <SegmentedControl
              options={collections.map((name) => ({ label: COLLECTION_LABELS[name] || name, value: name }))}
              value={collection}
              onChange={(value) => { setCollection(value); setResult(null); setErrorText(''); }}
              accessibilityLabel="Coleccion a purgar"
              disabled={purging}
            />
            <AppTextInput
              label="Id del registro (ObjectId)"
              value={recordId}
              onChangeText={(value) => { setRecordId(value); setErrorText(''); }}
              onBlur={() => setTouched(true)}
              error={touched && !idValid ? 'Debe tener 24 caracteres hexadecimales (0-9, a-f).' : undefined}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="64b7f0c2a1b2c3d4e5f60718"
              maxLength={30}
            />
            <Text style={styles.hint}>{SOFT_DELETE_HINTS[collection]}</Text>
            <AppButton
              title="Purgar registro"
              variant="danger"
              onPress={requestPurge}
              disabled={!idValid}
              loading={purging}
              accessibilityLabel={`Purgar registro de ${COLLECTION_LABELS[collection] || collection}`}
            />
          </Card>
        </View>
        <View style={isDesktop ? styles.cell : null}>{warning}</View>
      </View>

      {/* Confirmacion explicita con texto obligatorio */}
      <ConfirmModal
        visible={confirming}
        title="Confirmar purga definitiva"
        message={`Vas a eliminar para siempre ${collection}/${id}. Esta accion no se puede deshacer.`}
        confirmLabel="Purgar definitivamente"
        tone="danger"
        requireText={confirmPhrase}
        requireTextLabel={`Escribe exactamente: ${confirmPhrase}`}
        onConfirm={confirmPurge}
        onCancel={() => { if (!purging) setConfirming(false); }}
        loading={purging}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  cell: { flex: 1 },
  label: { fontSize: typography.small, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  hint: { fontSize: typography.small, color: colors.textSecondary, marginBottom: spacing.md },
  warningCard: { borderColor: colors.danger, borderLeftWidth: 4 },
  warningTitle: { fontSize: typography.body, fontWeight: '700', color: colors.danger, marginBottom: spacing.sm },
  warningText: { fontSize: typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
  resultCard: { borderColor: colors.success, borderLeftWidth: 4 },
  resultTitle: { fontSize: typography.body, fontWeight: '700', color: colors.success, marginBottom: spacing.sm },
});

export default PurgePanel;
