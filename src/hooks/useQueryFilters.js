/**
 * Hook de filtros de listado: separa los valores en edicion (`values`) de los
 * aplicados (`applied`) y construye el `query` final con paginacion.
 */
import { useCallback, useMemo, useRef, useState } from 'react';

/** Limite por defecto de elementos por pagina. */
const DEFAULT_LIMIT = 20;

/** Indica si un valor de filtro se considera vacio (no se envia al backend). */
function isEmptyValue(value) {
  return value === '' || value === null || value === undefined || value === 'all';
}

/** Copia un objeto de filtros quitando los valores vacios. */
function compact(values) {
  const out = {};
  Object.entries(values || {}).forEach(([key, value]) => {
    if (isEmptyValue(value)) return;
    out[key] = typeof value === 'string' ? value.trim() : value;
    if (out[key] === '') delete out[key];
  });
  return out;
}

/**
 * @param {object} [initial] valores iniciales de los filtros
 * @param {{ limit?: number }} [options]
 * @returns {{ values: object, setValue: (key: string, v: any) => void, applied: object,
 *   apply: () => void, reset: () => void, page: number, setPage: (p: number) => void,
 *   query: object, limit: number }}
 */
export function useQueryFilters(initial = {}, options = {}) {
  const limit = options.limit || DEFAULT_LIMIT;
  // Los valores iniciales se congelan en el primer render para que reset sea estable.
  const initialRef = useRef(initial || {});
  const [values, setValues] = useState(() => ({ ...initialRef.current }));
  const [applied, setApplied] = useState(() => ({ ...initialRef.current }));
  const [page, setPageState] = useState(1);
  // Copia sincronizada de los valores en edicion para que apply lea siempre lo ultimo.
  const valuesRef = useRef(values);
  valuesRef.current = values;

  /** Cambia un valor en edicion (no dispara la consulta hasta apply). */
  const setValue = useCallback((key, value) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      valuesRef.current = next;
      return next;
    });
  }, []);

  /** Aplica los valores en edicion y vuelve a la pagina 1. */
  const apply = useCallback(() => {
    setApplied({ ...valuesRef.current });
    setPageState(1);
  }, []);

  /** Restablece los filtros iniciales (en edicion y aplicados) y la pagina 1. */
  const reset = useCallback(() => {
    setValues({ ...initialRef.current });
    setApplied({ ...initialRef.current });
    setPageState(1);
  }, []);

  /** Cambia de pagina (minimo 1). */
  const setPage = useCallback((next) => {
    const n = Number(next);
    setPageState(Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1);
  }, []);

  // Query final: filtros aplicados sin vacios + pagina + limite.
  const query = useMemo(() => ({ ...compact(applied), page, limit }), [applied, page, limit]);

  return { values, setValue, applied, apply, reset, page, setPage, query, limit };
}

export default useQueryFilters;
