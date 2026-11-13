/**
 * Seccion de productos de la portada de la tienda (Destacados, Mejor valorados, etc.).
 * En movil es un FlatList horizontal; en escritorio una cuadricula con ancho de tarjeta calculado.
 * Un error o una lista vacia solo afectan a esta seccion.
 */
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ErrorBanner, ProductCard, SectionTitle } from '../../../components';
import { colors, spacing, typography } from '../../../config/theme';

/** Renderiza una seccion con titulo y sus productos segun el layout recibido. */
export default function ProductSection({
  title,
  subtitle,
  items,
  error,
  isDesktop,
  cardWidth,
  gutter,
  onPressProduct,
}) {
  // Contenido segun estado: error, vacio, cuadricula de escritorio o carrusel movil
  let content;
  if (error) {
    content = <ErrorBanner message={`No se pudo cargar esta seccion. ${error}`} />;
  } else if (!items || items.length === 0) {
    content = <Text style={styles.emptyText}>No hay productos en esta seccion por ahora.</Text>;
  } else if (isDesktop) {
    content = (
      <View style={[styles.grid, { gap: gutter }]}>
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            width={cardWidth}
            onPress={() => onPressProduct(product.id)}
          />
        ))}
      </View>
    );
  } else {
    content = (
      <FlatList
        horizontal
        data={items}
        keyExtractor={(product) => product.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: gutter }}
        renderItem={({ item }) => (
          <ProductCard product={item} width={cardWidth} onPress={() => onPressProduct(item.id)} />
        )}
      />
    );
  }

  return (
    <View style={styles.section} accessibilityLabel={`Seccion ${title}`}>
      <SectionTitle title={title} subtitle={subtitle} />
      {content}
    </View>
  );
}

// Estilos de la seccion
const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    paddingVertical: spacing.sm,
  },
});
