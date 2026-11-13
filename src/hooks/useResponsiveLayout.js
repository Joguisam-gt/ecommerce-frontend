/**
 * Hook de layout responsivo basado en el ancho de la ventana.
 */
import { useWindowDimensions } from 'react-native';
import { BREAKPOINT_DESKTOP } from '../config/constants';

/** Ancho maximo del contenido centrado. */
const CONTENT_MAX_WIDTH = 1200;

/**
 * @returns {{ width: number, height: number, isMobile: boolean, isDesktop: boolean,
 *   columns: number, contentMaxWidth: number, gutter: number }}
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT_DESKTOP;
  // Columnas de la grilla de productos segun el ancho.
  let columns = 4;
  if (width < BREAKPOINT_DESKTOP) columns = 2;
  else if (width < 1100) columns = 3;
  return {
    width,
    height,
    isMobile: !isDesktop,
    isDesktop,
    columns,
    contentMaxWidth: CONTENT_MAX_WIDTH,
    gutter: isDesktop ? 24 : 16,
  };
}

export default useResponsiveLayout;
