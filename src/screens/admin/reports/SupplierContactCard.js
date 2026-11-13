/**
 * Tarjeta de contacto del proveedor de un producto con la evaluacion de continuidad.
 * Datos base: `supplier` del reporte de desempeno (id, supplierCode, name, phone,
 * distributionDescription). NIT, contacto, correo y direccion se completan con el
 * detalle del proveedor (GET /admin/suppliers/:id) cuando esta disponible.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, DetailRow } from '../../../components';
import { colors, radius, spacing, typography } from '../../../config/theme';

/**
 * Recomendaciones del backend (SUPPLIER_RECOMMENDATIONS en report.pipeline.js).
 * Criterio del backend: 'cambiar_proveedor' si devoluciones >= 20 % o margen < 5 %;
 * 'evaluar' si devoluciones >= 10 %, margen < 20 % o margen desconocido; si no, 'continuar'.
 */
const RECOMMENDATIONS = {
  continuar: { label: 'Continuar con el proveedor', tone: 'success' },
  evaluar: { label: 'Evaluar al proveedor', tone: 'neutral' },
  cambiar_proveedor: { label: 'Considerar cambio de proveedor', tone: 'danger' },
};

/**
 * Evaluacion de respaldo SOLO si el backend no envia `recommendation`: compara ingresos
 * netos con el costo de las perdidas. Si las perdidas superan el 20 % de los ingresos netos
 * (o hay perdidas sin ventas) se sugiere evaluar; en otro caso, continuar. Texto neutro.
 * @param {object} performance
 */
function fallbackEvaluation(performance) {
  const net = Number(performance.netRevenue) || 0;
  const loss = Number(performance.lossCost) || 0;
  if (loss > 0 && (net <= 0 || loss / net > 0.2)) {
    return { key: 'evaluar', reasons: ['las perdidas son altas frente a las ventas del periodo'] };
  }
  return { key: 'continuar', reasons: ['las perdidas son bajas frente a las ventas del periodo'] };
}

/**
 * @param {{ performance: object, supplierDetail?: object | null, detailError?: string }} props
 */
export function SupplierContactCard({ performance, supplierDetail, detailError }) {
  const supplier = performance.supplier;

  // Recomendacion del backend o, si falta, la evaluacion de respaldo.
  const evaluation = performance.recommendation
    ? { key: performance.recommendation, reasons: performance.recommendationReasons || [] }
    : fallbackEvaluation(performance);
  const info = RECOMMENDATIONS[evaluation.key] || { label: evaluation.key, tone: 'neutral' };
  const toneStyle = info.tone === 'success' ? styles.toneSuccess : info.tone === 'danger' ? styles.toneDanger : styles.toneNeutral;
  const toneText = info.tone === 'success' ? styles.textSuccess : info.tone === 'danger' ? styles.textDanger : styles.textNeutral;

  // Datos de contacto combinados (el detalle completo tiene prioridad).
  const detail = supplierDetail || {};
  const value = (key) => detail[key] || (supplier && supplier[key]) || 'No registrado';

  return (
    <Card style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Proveedor
      </Text>

      {supplier ? (
        <>
          <DetailRow label="Nombre" value={value('name')} />
          <DetailRow label="Codigo" value={value('supplierCode')} />
          <DetailRow label="NIT" value={value('nit')} />
          <DetailRow label="Contacto" value={value('contactName')} />
          <DetailRow label="Telefono" value={value('phone')} />
          <DetailRow label="Correo" value={value('email')} />
          <DetailRow label="Direccion" value={value('address')} />
          <DetailRow label="Distribucion" value={value('distributionDescription')} />
          {supplierDetail && supplierDetail.isActive === false ? (
            <Text style={styles.inactive}>El proveedor esta inactivo.</Text>
          ) : null}
          {detailError ? <Text style={styles.note}>{detailError}</Text> : null}
        </>
      ) : (
        <Text style={styles.note}>El producto no tiene un proveedor asignado.</Text>
      )}

      {/* Evaluacion de continuidad */}
      <View style={[styles.evaluation, toneStyle]} accessibilityRole="summary">
        <Text style={styles.evaluationLabel}>Evaluacion de continuidad</Text>
        <Text style={[styles.evaluationValue, toneText]}>{info.label}</Text>
        {evaluation.reasons.length > 0 ? (
          <Text style={styles.reasons}>Motivo: {evaluation.reasons.join('; ')}.</Text>
        ) : null}
        <Text style={styles.criteria}>
          {performance.recommendation
            ? 'Criterio del sistema: devoluciones de 20 % o mas, o margen bruto menor a 5 %, sugieren cambio; devoluciones de 10 % o mas, margen menor a 20 % o sin costo registrado sugieren evaluar.'
            : 'Evaluacion estimada: compara el costo de las perdidas con los ingresos netos del periodo.'}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { fontSize: typography.subtitle, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  note: { fontSize: typography.small, color: colors.textSecondary, marginTop: spacing.sm },
  evaluation: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  toneSuccess: { borderColor: colors.success },
  toneDanger: { borderColor: colors.danger },
  toneNeutral: { borderColor: colors.border },
  evaluationLabel: { fontSize: typography.small, color: colors.textSecondary, fontWeight: '600' },
  evaluationValue: { fontSize: typography.subtitle, fontWeight: '700', marginTop: spacing.xs },
  textSuccess: { color: colors.success },
  textDanger: { color: colors.danger },
  inactive: { color: colors.danger, fontSize: typography.body, marginTop: spacing.sm },
  textNeutral: { color: colors.textPrimary },
  reasons: { fontSize: typography.body, color: colors.textPrimary, marginTop: spacing.sm },
  criteria: { fontSize: typography.small, color: colors.textSecondary, marginTop: spacing.sm },
});

export default SupplierContactCard;
