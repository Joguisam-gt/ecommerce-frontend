/**
 * Hook generico para cargas asincronas con estado de carga, error y recarga.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta `fn` al montar y cada vez que cambian `deps`.
 * @param {() => Promise<any>} fn
 * @param {any[]} [deps]
 * @returns {{ data: any, error: any, isLoading: boolean, reload: () => Promise<any> }}
 */
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Contador de ejecuciones para ignorar respuestas obsoletas.
  const runRef = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  /** Lanza la carga y guarda su resultado si sigue siendo la mas reciente. */
  const reload = useCallback(async () => {
    runRef.current += 1;
    const run = runRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (run === runRef.current) setData(result);
      return result;
    } catch (err) {
      if (run === runRef.current) setError(err);
      return null;
    } finally {
      if (run === runRef.current) setIsLoading(false);
    }
  }, []);

  // Recarga cuando cambian las dependencias; invalida la ejecucion al desmontar.
  useEffect(() => {
    reload();
    return () => {
      runRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, isLoading, reload };
}

export default useAsync;
