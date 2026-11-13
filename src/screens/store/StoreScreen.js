/**
 * Pantalla publica de la tienda (visitantes y usuarios autenticados).
 * Sin filtros muestra cuatro secciones (Destacados, Mejor valorados, Nuevos, En descuento) cargadas en
 * paralelo; con busqueda o categoria muestra una cuadricula de resultados paginada con "Cargar mas".
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  EmptyState,
  LoadingState,
  ProductCard,
  ScreenContainer,
} from '../../components';
import { colors, spacing, typography } from '../../config/theme';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useNavigation } from '../../navigation/NavigationContext';
import { ROUTES } from '../../navigation/routes';
import * as storeService from '../../services/storeService';
import CategoryFilterBar from './components/CategoryFilterBar';
import ProductSection from './components/ProductSection';
import RetryableError from './components/RetryableError';
import SearchBar from './components/SearchBar';

/** Productos por seccion de portada. */
const SECTION_LIMIT = 8;
/** Productos por pagina en la cuadricula de resultados. */
const RESULTS_PAGE_SIZE = 12;

/** Definicion de las secciones de portada y sus filtros para storeService.listProducts. */
const HOME_SECTIONS = [
  { key: 'featured', title: 'Destacados', params: { featured: true } },
  { key: 'topRated', title: 'Mejor valorados', params: { topRated: true, sort: 'top_rated' } },
  { key: 'newArrivals', title: 'Nuevos', params: { newArrivals: true, sort: 'newest' } },
  { key: 'onSale', title: 'En descuento', params: { onSale: true, sort: 'discount_desc' } },
];

/** Estado inicial de la cuadricula de resultados. */
const INITIAL_RESULTS = {
  items: [],
  page: 0,
  totalPages: 0,
  total: 0,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  error: null,
};

/** Extrae un mensaje legible de cualquier error. */
const errorMessage = (error) => (error && error.message) || 'Ocurrio un error inesperado.';

export default function StoreScreen() {
  const { navigate } = useNavigation();
  const { width, isDesktop, columns, contentMaxWidth, gutter } = useResponsiveLayout();

  // Texto escrito en el buscador y filtros realmente aplicados
  const [searchText, setSearchText] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [category, setCategory] = useState(null);
  const isFiltering = Boolean(activeSearch) || Boolean(category);

  // Estado de la portada
  const [sections, setSections] = useState({});
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeRefreshing, setHomeRefreshing] = useState(false);
  const [homeLoaded, setHomeLoaded] = useState(false);

  // Estado de los resultados filtrados
  const [results, setResults] = useState(INITIAL_RESULTS);

  // Evita actualizar estado tras desmontar y descarta respuestas obsoletas de resultados
  const mountedRef = useRef(true);
  const resultsRequestRef = useRef(0);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Ancho de tarjeta: cuadricula usa columns; el carrusel movil muestra unas dos tarjetas visibles
  const { gridCardWidth, carouselCardWidth } = useMemo(() => {
    const available = Math.max(Math.min(width, contentMaxWidth) - gutter * 2, 200);
    const grid = Math.floor((available - gutter * (columns - 1)) / columns) - 1;
    const carousel = Math.min(220, Math.floor((available - gutter) / 2));
    return { gridCardWidth: grid, carouselCardWidth: carousel };
  }, [width, contentMaxWidth, gutter, columns]);

  // Carga las cuatro secciones en paralelo; una falla no afecta a las demas
  const loadHome = useCallback(async ({ refreshing = false } = {}) => {
    if (refreshing) setHomeRefreshing(true);
    else setHomeLoading(true);
    const settled = await Promise.allSettled(
      HOME_SECTIONS.map((section) =>
        storeService.listProducts({ ...section.params, limit: SECTION_LIMIT, page: 1 }),
      ),
    );
    if (!mountedRef.current) return;
    const next = {};
    HOME_SECTIONS.forEach((section, index) => {
      const outcome = settled[index];
      next[section.key] =
        outcome.status === 'fulfilled'
          ? { items: (outcome.value && outcome.value.items) || [], error: null }
          : { items: [], error: errorMessage(outcome.reason) };
    });
    setSections(next);
    setHomeLoaded(true);
    setHomeLoading(false);
    setHomeRefreshing(false);
  }, []);

  // Carga una pagina de resultados; mode: 'replace' | 'append' | 'refresh'
  const loadResults = useCallback(
    async (page, mode = 'replace') => {
      const requestId = ++resultsRequestRef.current;
      setResults((prev) => ({
        ...(mode === 'append' ? prev : { ...prev, items: mode === 'refresh' ? prev.items : [] }),
        isLoading: mode === 'replace',
        isLoadingMore: mode === 'append',
        isRefreshing: mode === 'refresh',
        error: null,
      }));
      try {
        const params = { page, limit: RESULTS_PAGE_SIZE };
        if (activeSearch) params.search = activeSearch;
        if (category) params.category = category;
        const response = await storeService.listProducts(params);
        if (!mountedRef.current || requestId !== resultsRequestRef.current) return;
        const items = (response && response.items) || [];
        const meta = (response && response.meta) || {};
        setResults((prev) => ({
          items: mode === 'append' ? [...prev.items, ...items] : items,
          page: meta.page || page,
          totalPages: meta.totalPages || 0,
          total: typeof meta.total === 'number' ? meta.total : items.length,
          isLoading: false,
          isLoadingMore: false,
          isRefreshing: false,
          error: null,
        }));
      } catch (error) {
        if (!mountedRef.current || requestId !== resultsRequestRef.current) return;
        setResults((prev) => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
          isRefreshing: false,
          error: errorMessage(error),
        }));
      }
    },
    [activeSearch, category],
  );

  // Recarga resultados al cambiar filtros; la portada se carga una sola vez al necesitarse
  useEffect(() => {
    if (isFiltering) {
      loadResults(1, 'replace');
    } else {
      resultsRequestRef.current += 1;
      setResults(INITIAL_RESULTS);
      if (!homeLoaded) loadHome();
    }
  }, [isFiltering, loadResults, homeLoaded, loadHome]);

  // Navega al detalle del producto
  const openProduct = useCallback(
    (productId) => navigate(ROUTES.PRODUCT_DETAIL, { productId }),
    [navigate],
  );

  // Aplica la busqueda enviada desde la barra
  const handleSearchSubmit = (text) => setActiveSearch(text);

  // Limpia busqueda y categoria para volver a la portada
  const handleClear = () => {
    setSearchText('');
    setActiveSearch('');
    setCategory(null);
  };

  // Solicita la siguiente pagina si existe
  const handleLoadMore = () => {
    if (results.isLoading || results.isLoadingMore) return;
    if (results.page < results.totalPages) loadResults(results.page + 1, 'append');
  };

  // Portada con las cuatro secciones
  const renderHome = () => {
    if (homeLoading && !homeLoaded) return <LoadingState label="Cargando productos..." />;
    const allFailed =
      homeLoaded && HOME_SECTIONS.every((section) => sections[section.key] && sections[section.key].error);
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.homeContent}
        refreshControl={
          <RefreshControl
            refreshing={homeRefreshing}
            onRefresh={() => loadHome({ refreshing: true })}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {allFailed ? (
          <RetryableError
            message="No se pudieron cargar los productos de la tienda."
            onRetry={() => loadHome()}
          />
        ) : null}
        {HOME_SECTIONS.map((section) => {
          const state = sections[section.key] || { items: [], error: null };
          return (
            <ProductSection
              key={section.key}
              title={section.title}
              items={state.items}
              error={allFailed ? null : state.error}
              isDesktop={isDesktop}
              cardWidth={isDesktop ? gridCardWidth : carouselCardWidth}
              gutter={gutter}
              onPressProduct={openProduct}
            />
          );
        })}
      </ScrollView>
    );
  };

  // Texto del contador de resultados y filtros aplicados
  const resultsSummary = () => {
    const parts = [];
    if (activeSearch) parts.push(`"${activeSearch}"`);
    if (category) parts.push(`categoria ${category}`);
    const noun = results.total === 1 ? 'resultado' : 'resultados';
    return `${results.total} ${noun}${parts.length ? ` para ${parts.join(' en ')}` : ''}`;
  };

  // Cuadricula de resultados con paginacion
  const renderResults = () => {
    if (results.isLoading) return <LoadingState label="Buscando productos..." />;
    if (results.error && results.items.length === 0) {
      return <RetryableError message={results.error} onRetry={() => loadResults(1, 'replace')} />;
    }
    const hasMore = results.page < results.totalPages;
    return (
      <FlatList
        key={`results-${columns}`}
        style={styles.flex}
        data={results.items}
        numColumns={columns}
        keyExtractor={(product) => product.id}
        columnWrapperStyle={{ gap: gutter }}
        contentContainerStyle={[styles.resultsContent, { gap: gutter }]}
        renderItem={({ item }) => (
          <ProductCard product={item} width={gridCardWidth} onPress={() => openProduct(item.id)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={results.isRefreshing}
            onRefresh={() => loadResults(1, 'refresh')}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <Text style={styles.counter} accessibilityRole="text" accessibilityLiveRegion="polite">
            {resultsSummary()}
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            title="Sin resultados"
            message="No encontramos productos con esos criterios. Prueba con otra busqueda o categoria."
          />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {results.error ? (
              <RetryableError message={results.error} onRetry={handleLoadMore} />
            ) : null}
            {hasMore ? (
              <AppButton
                title="Cargar mas"
                variant="secondary"
                onPress={handleLoadMore}
                loading={results.isLoadingMore}
                disabled={results.isLoadingMore}
              />
            ) : null}
          </View>
        }
      />
    );
  };

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.flex}>
        <View style={styles.filters}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            onSubmit={handleSearchSubmit}
            onClear={handleClear}
            showClear={isFiltering || searchText.length > 0}
          />
          <CategoryFilterBar selected={category} onSelect={setCategory} />
        </View>
        {isFiltering ? renderResults() : renderHome()}
      </View>
    </ScreenContainer>
  );
}

// Estilos de la pantalla de tienda
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  filters: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  homeContent: {
    paddingBottom: spacing.xxl,
  },
  resultsContent: {
    paddingBottom: spacing.xxl,
  },
  counter: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginBottom: spacing.xs,
  },
  footer: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
});
