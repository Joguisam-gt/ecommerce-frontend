/**
 * Tarjeta de producto para la grilla del catalogo: imagen con insignia de descuento
 * superpuesta, nombre, categoria, precio y valoracion.
 */
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../config/theme';
import { DiscountBadge } from './DiscountBadge';
import { PriceTag } from './PriceTag';

/** Texto de valoracion sin iconos: "4.5 de 5 (12 resenas)". */
function ratingText(rating) {
  const count = Number(rating?.count ?? 0);
  if (!count) return 'Sin resenas';
  const average = Number(rating?.average ?? 0).toFixed(1);
  return `${average} de 5 (${count} ${count === 1 ? 'resena' : 'resenas'})`;
}

/**
 * @param {{ product: object, onPress?: Function, width?: number }} props
 */
export function ProductCard({ product, onPress, width }) {
  if (!product) return null;
  const outOfStock = Number(product.stock ?? 0) <= 0;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Ver ${product.name}`}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, width ? { width } : null]}
    >
      {/* Imagen con la insignia superpuesta en posicion absoluta. */}
      <View style={styles.imageWrap}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel={product.name}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>Sin imagen</Text>
          </View>
        )}
        {product.hasDiscount ? (
          <DiscountBadge percent={product.discountPercent} style={styles.badge} />
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.category ? <Text style={styles.meta}>{product.category}</Text> : null}
        <PriceTag
          originalPrice={product.originalPrice}
          finalPrice={product.finalPrice}
          hasDiscount={product.hasDiscount}
          size="sm"
        />
        <Text style={styles.meta}>{ratingText(product.rating)}</Text>
        {outOfStock ? <Text style={styles.outOfStock}>Agotado</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.muted },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textSecondary, fontSize: typography.small },
  badge: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  body: { padding: spacing.md, rowGap: spacing.xs },
  name: { fontSize: typography.body, fontWeight: '600', color: colors.textPrimary },
  meta: { fontSize: typography.small, color: colors.textSecondary },
  outOfStock: { fontSize: typography.small, color: colors.danger, fontWeight: '600' },
});

export default ProductCard;
