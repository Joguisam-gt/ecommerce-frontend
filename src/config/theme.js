/**
 * Tema visual unico de la aplicacion: paleta solida, espaciados, radios y tipografia.
 * Es el unico archivo donde se permiten valores hexadecimales.
 */

/** Paleta de colores solidos (sin transparencias ni degradados). */
export const colors = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  border: '#D1D5DB',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  primary: '#111827',
  onPrimary: '#FFFFFF',
  success: '#047857',
  danger: '#B91C1C',
  muted: '#E5E7EB',
  overlay: '#374151',
};

/** Escala de espaciados en puntos. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** Radios de borde. */
export const radius = { sm: 4, md: 8 };

/** Tamanos de fuente. */
export const typography = { title: 22, subtitle: 18, body: 15, small: 13 };

/** Altura minima de las areas tactiles (accesibilidad). */
export const MIN_TOUCH_SIZE = 44;

export default { colors, spacing, radius, typography, MIN_TOUCH_SIZE };
