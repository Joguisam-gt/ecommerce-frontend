/**
 * Panel de detalle de una entrada de audit_logs (SuperuserAuditLogResponseDTO): datos basicos con
 * DetailRow y previousState, newState, metadata y snapshot como JSON formateado en monoespaciada.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, Card, DetailRow } from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';
import { ROLE_LABELS } from '../../../config/constants';
import { formatDateTime } from '../../../utils/format';
import { JsonBlock } from './JsonBlock';

/**
 * @param {{ entry: object | null, onClose: () => void }} props
 */
export function AuditLogDetail({ entry, onClose }) {
  // Sin seleccion: indicacion para el usuario.
  if (!entry) {
    return (
      <Card style={styles.card}>
        <Text style={styles.placeholder}>Selecciona una fila para ver el detalle de la entrada.</Text>
      </Card>
    );
  }
  return (
    <Card style={styles.card}>
      {/* Encabezado con cierre */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {entry.action}
        </Text>
        <AppButton title="Cerrar" variant="secondary" onPress={onClose} accessibilityLabel="Cerrar detalle" />
      </View>
      {/* Datos basicos de la entrada */}
      <DetailRow label="Fecha" value={formatDateTime(entry.timestamp || entry.createdAt)} />
      <DetailRow label="Resultado" value={entry.outcome || '-'} />
      <DetailRow label="Actor (id)" value={entry.actorId || 'Sistema'} />
      <DetailRow label="Rol del actor" value={ROLE_LABELS[entry.actorRole] || entry.actorRole || '-'} />
      <DetailRow label="Entidad" value={entry.entity || '-'} />
      <DetailRow label="Coleccion" value={entry.targetCollection || '-'} />
      <DetailRow label="Id objetivo" value={entry.targetId || entry.entityId || '-'} />
      <DetailRow label="IP" value={entry.ip || '-'} />
      <DetailRow label="Agente" value={entry.userAgent || '-'} />
      <DetailRow label="Id de la entrada" value={entry.id} />
      {/* Estados y metadatos como JSON */}
      <View style={styles.jsonArea}>
        <JsonBlock title="Estado anterior (previousState)" value={entry.previousState} />
        <JsonBlock title="Estado nuevo (newState)" value={entry.newState} />
        <JsonBlock title="Metadatos (metadata)" value={entry.metadata} />
        {entry.snapshot ? <JsonBlock title="Copia del registro purgado (snapshot)" value={entry.snapshot} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: { flexShrink: 1, fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary },
  placeholder: { fontSize: typography.body, color: colors.textSecondary },
  jsonArea: { marginTop: spacing.md },
});

export default AuditLogDetail;
