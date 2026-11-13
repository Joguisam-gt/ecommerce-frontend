/**
 * Navegador propio sin dependencias: pila de rutas en memoria.
 *
 * Ruta inicial: Login. Mientras AuthContext restaura la sesion se muestra un
 * LoadingState; si la sesion se restaura con un usuario, se reinicia la pila en
 * la ruta de inicio de su rol.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { ROUTES, homeRouteForRole } from './routes';

const NavigationContext = createContext(null);

/** Contador para claves unicas de cada entrada de la pila. */
let keySeed = 0;

/** Crea una entrada de la pila. */
function makeEntry(name, params) {
  keySeed += 1;
  return { key: `${name}-${keySeed}`, name, params: params || {} };
}

/** Proveedor de navegacion (debe ir dentro de AuthProvider). */
export function NavigationProvider({ children }) {
  const { isBootstrapping, user, role } = useAuth();
  const [stack, setStack] = useState(() => [makeEntry(ROUTES.LOGIN)]);
  const bootstrapHandled = useRef(false);

  /** Apila una ruta nueva. */
  const navigate = useCallback((name, params) => {
    setStack((prev) => [...prev, makeEntry(name, params)]);
  }, []);

  /** Vuelve a la ruta anterior si existe. */
  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  /** Reinicia la pila con una unica ruta. */
  const reset = useCallback((name, params) => {
    setStack([makeEntry(name, params)]);
  }, []);

  // Tras restaurar la sesion, envia al usuario a la ruta de inicio de su rol (una sola vez).
  useEffect(() => {
    if (isBootstrapping || bootstrapHandled.current) return;
    bootstrapHandled.current = true;
    if (user) reset(homeRouteForRole(role));
  }, [isBootstrapping, user, role, reset]);

  const current = stack[stack.length - 1];

  const value = useMemo(
    () => ({
      route: { key: current.key, name: current.name, params: current.params },
      navigate,
      goBack,
      reset,
      canGoBack: stack.length > 1,
    }),
    [current, navigate, goBack, reset, stack.length],
  );

  // Mientras se restaura la sesion no se muestra ninguna pantalla.
  if (isBootstrapping) return <LoadingState label="Cargando sesion..." />;

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

/** Hook de navegacion: { route, navigate, goBack, reset, canGoBack }. */
export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation debe usarse dentro de NavigationProvider');
  return ctx;
}

export default NavigationContext;
