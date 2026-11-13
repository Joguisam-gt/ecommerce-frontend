/**
 * Tabla de datos nativa y responsiva.
 * - Escritorio: columnas con `flex` que ocupan todo el ancho disponible.
 * - Movil: un unico ScrollView horizontal contiene cabecera y filas, con anchos
 *   fijos (`width`), para que ambas se desplacen juntas.
 * Integra estados de carga, error con reintento, vacio y barra de paginacion.
 */
import React from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../config/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppButton } from './AppButton';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { LoadingState } from './LoadingState';

/** Ancho por defecto de una columna en movil. */
const DEFAULT_WIDTH = 140;
/** Maximo de filas renderizadas con map; por encima se usa FlatList. */
const MAP_THRESHOLD = 100;

/** Alineacion de texto y de contenido segun `align`. */
const ALIGN = {
  left: { text: 'left', items: 'flex-start' },
  right: { text: 'right', items: 'flex-end' },
  center: { text: 'center', items: 'center' },
};

/** Devuelve el valor de una celda: render(row) o row[key]. */
function cellContent(column, row) {
  if (typeof column.render === 'function') return column.render(row);
  const value = row?.[column.key];
  return value === null || value === undefined || value === '' ? '-' : value;
}

/** Mensaje legible de un error (ApiError o texto). */
function errorMessage(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  return error.message || 'No se pudieron cargar los datos.';
}

/** Barra de paginacion "Anterior / Pagina X de Y / Siguiente". */
function PaginationBar({ page = 1, totalPages = 1, total, onPageChange, disabled }) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(Math.max(1, Number(page) || 1), safeTotalPages);
  const canPrev = current > 1 && !disabled;
  const canNext = current < safeTotalPages && !disabled;
  return (
    <View style={styles.pagination}>
      <AppButton
        title="Anterior"
        variant="secondary"
        onPress={() => onPageChange && onPageChange(current - 1)}
        disabled={!canPrev}
        accessibilityLabel="Pagina anterior"
      />
      <View style={styles.pageInfo}>
        <Text style={styles.pageText} accessibilityLiveRegion="polite">
          Pagina {current} de {safeTotalPages}
        </Text>
        {Number.isFinite(total) ? <Text style={styles.totalText}>{total} registros</Text> : null}
      </View>
      <AppButton
        title="Siguiente"
        variant="secondary"
        onPress={() => onPageChange && onPageChange(current + 1)}
        disabled={!canNext}
        accessibilityLabel="Pagina siguiente"
      />
    </View>
  );
}

/**
 * @param {{
 *   columns: { key: string, title: string, width?: number, flex?: number,
 *     align?: 'left'|'right'|'center', render?: (row: any) => React.ReactNode|string }[],
 *   data: any[], keyExtractor?: (row: any, index: number) => string, onRowPress?: (row: any) => void,
 *   loading?: boolean, error?: any, onRetry?: Function, emptyMessage?: string,
 *   pagination?: { page: number, totalPages: number, total?: number, onPageChange: (p: number) => void },
 *   selectedKey?: string, dense?: boolean, emptyTitle?: string }} props
 */
export function DataTable({
  columns = [],
  data = [],
  keyExtractor,
  onRowPress,
  loading = false,
  error,
  onRetry,
  emptyMessage = 'No hay registros para mostrar.',
  pagination,
  selectedKey,
  dense = false,
  emptyTitle = 'Sin resultados',
}) {
  const { isDesktop } = useResponsiveLayout();
  const rows = Array.isArray(data) ? data : [];
  const totalWidth = columns.reduce((sum, c) => sum + (c.width || DEFAULT_WIDTH), 0);

  /** Clave estable de una fila. */
  const getKey = (row, index) => {
    if (keyExtractor) return String(keyExtractor(row, index));
    return String(row?.id ?? row?._id ?? index);
  };

  /** Estilo de tamano de una celda segun la vista. */
  const sizeStyle = (column) =>
    isDesktop ? { flex: column.flex ?? 1, minWidth: 0 } : { width: column.width || DEFAULT_WIDTH };

  /** Celda de cabecera. */
  const renderHeaderCell = (column) => {
    const align = ALIGN[column.align] || ALIGN.left;
    return (
      <View key={column.key} style={[styles.cell, dense && styles.cellDense, sizeStyle(column), { alignItems: align.items }]}>
        <Text style={[styles.headerText, { textAlign: align.text }]} numberOfLines={2}>
          {column.title}
        </Text>
      </View>
    );
  };

  /** Celda de datos: texto si render devuelve string/numero, nodo en otro caso. */
  const renderCell = (column, row) => {
    const align = ALIGN[column.align] || ALIGN.left;
    const content = cellContent(column, row);
    const isText = typeof content === 'string' || typeof content === 'number';
    return (
      <View key={column.key} style={[styles.cell, dense && styles.cellDense, sizeStyle(column), { alignItems: align.items }]}>
        {isText ? (
          <Text style={[styles.cellText, { textAlign: align.text }]} numberOfLines={isDesktop ? 3 : 2}>
            {String(content)}
          </Text>
        ) : (
          content
        )}
      </View>
    );
  };

  /** Fila completa (pulsable si hay onRowPress). */
  const renderRow = (row, index) => {
    const key = getKey(row, index);
    const selected = selectedKey !== undefined && selectedKey !== null && String(selectedKey) === key;
    // Filas alternas surface/background; el borde iguala el fondo salvo si esta seleccionada.
    const background = index % 2 === 0 ? colors.surface : colors.background;
    const rowStyle = [
      styles.row,
      dense && styles.rowDense,
      { backgroundColor: background, borderColor: selected ? colors.primary : background },
    ];
    const cells = columns.map((column) => renderCell(column, row));
    if (onRowPress) {
      return (
        <TouchableOpacity
          key={key}
          accessibilityRole="button"
          accessibilityLabel={`Fila ${index + 1}. Ver detalle`}
          accessibilityState={{ selected }}
          onPress={() => onRowPress(row)}
          activeOpacity={0.85}
          style={rowStyle}
        >
          {cells}
        </TouchableOpacity>
      );
    }
    return (
      <View key={key} style={rowStyle}>
        {cells}
      </View>
    );
  };

  /** Cuerpo de la tabla: map para listas cortas, FlatList sin scroll propio para largas. */
  const renderBody = () => {
    if (rows.length <= MAP_THRESHOLD) return rows.map((row, index) => renderRow(row, index));
    return (
      <FlatList
        data={rows}
        scrollEnabled={false}
        keyExtractor={(row, index) => getKey(row, index)}
        renderItem={({ item, index }) => renderRow(item, index)}
      />
    );
  };

  const message = errorMessage(error);
  const firstLoad = loading && rows.length === 0 && !message;

  // Contenido segun el estado.
  let content;
  if (message) {
    content = (
      <View style={styles.stateBox}>
        <ErrorBanner message={message} />
        {onRetry ? <AppButton title="Reintentar" variant="secondary" onPress={onRetry} style={styles.retry} /> : null}
      </View>
    );
  } else if (firstLoad) {
    content = <LoadingState label="Cargando datos..." />;
  } else if (rows.length === 0) {
    content = <EmptyState title={emptyTitle} message={emptyMessage} />;
  } else {
    const table = (
      // En movil: suma de anchos + bordes (tabla 1px y filas 2px por lado).
      <View style={[styles.table, !isDesktop && { width: totalWidth + 6 }]} accessibilityRole="list">
        <View style={[styles.headerRow, dense && styles.rowDense]} accessibilityRole="header">
          {columns.map(renderHeaderCell)}
        </View>
        {renderBody()}
      </View>
    );
    content = isDesktop ? (
      table
    ) : (
      <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
        {table}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Indicador discreto cuando se recarga con datos ya visibles. */}
      {loading && !firstLoad && !message ? (
        <View style={styles.refreshing}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.refreshingText}>Actualizando...</Text>
        </View>
      ) : null}
      {content}
      {pagination && !message && rows.length > 0 ? (
        <PaginationBar
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
          disabled={loading}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    // Mismo borde de 2px que las filas para que las columnas queden alineadas.
    borderWidth: 2,
    borderColor: colors.muted,
    borderBottomColor: colors.border,
    minHeight: MIN_TOUCH_SIZE,
  },
  row: {
    flexDirection: 'row',
    minHeight: MIN_TOUCH_SIZE,
    borderWidth: 2,
    alignItems: 'stretch',
  },
  rowDense: { minHeight: MIN_TOUCH_SIZE },
  cell: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  cellDense: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  headerText: { fontSize: typography.small, fontWeight: '700', color: colors.textPrimary },
  cellText: { fontSize: typography.small, color: colors.textPrimary },
  stateBox: { rowGap: spacing.sm },
  retry: { alignSelf: 'flex-start' },
  refreshing: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm, marginBottom: spacing.sm },
  refreshingText: { fontSize: typography.small, color: colors.textSecondary },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.sm,
    marginTop: spacing.md,
  },
  pageInfo: { flexShrink: 1, alignItems: 'center' },
  pageText: { fontSize: typography.body, fontWeight: '600', color: colors.textPrimary },
  totalText: { fontSize: typography.small, color: colors.textSecondary },
});

export default DataTable;
