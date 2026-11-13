/**
 * Hook de carga de listados paginados: ejecuta `fetcher(query)` cuando cambia el
 * contenido de `query` y descarta las respuestas obsoletas.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/** Meta vacia por defecto. */
const EMPTY_META = { total: 0, page: 1, limit: 0, totalPages: 1 };

/**
 * @param {(query: object) => Promise<{ items: any[], meta: object }>} fetcher
 * @param {object} query
 * @returns {{ items: any[], meta: object, loading: boolean, error: any, reload: () => Promise<void> }}
 */
export function usePaginatedResource(fetcher, query) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Contador de peticiones: solo se aplica la respuesta de la mas reciente.
  const requestRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const queryKey = JSON.stringify(query || {});
  const queryRef = useRef(query);
  queryRef.current = query;

  /** Lanza la carga con el query actual. */
  const reload = useCallback(async () => {
    requestRef.current += 1;
    const requestId = requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(queryRef.current || {});
      if (requestId !== requestRef.current) return;
      setItems(Array.isArray(result?.items) ? result.items : []);
      setMeta({ ...EMPTY_META, ...(result?.meta || {}) });
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, []);

  // Recarga cuando cambia el contenido del query; invalida peticiones al desmontar.
  useEffect(() => {
    reload();
    return () => {
      requestRef.current += 1;
    };
  }, [queryKey, reload]);

  return { items, meta, loading, error, reload };
}

export default usePaginatedResource;
