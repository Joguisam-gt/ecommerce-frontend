/**
 * Contexto de autenticacion: usuario actual, rol, arranque de sesion y acciones
 * de login/logout. La sesion se restaura con la cookie de refresh al montar.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { setAccessToken, setUnauthorizedHandler } from '../services/apiClient';
import { ROLES } from '../config/constants';

const AuthContext = createContext(null);

/** Proveedor de autenticacion. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Restaura la sesion al montar y registra el manejador de sesion invalida.
  useEffect(() => {
    let active = true;
    setUnauthorizedHandler(() => {
      if (active) setUser(null);
    });
    authService
      .restoreSession()
      .then((restored) => {
        if (active) setUser(restored ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsBootstrapping(false);
      });
    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  /** Inicia sesion y devuelve el usuario; los errores (ApiError) se propagan a la pantalla. */
  const login = useCallback(async (email, password) => {
    const { user: loggedUser } = await authService.login({ email, password });
    setUser(loggedUser ?? null);
    return loggedUser;
  }, []);

  /** Cierra la sesion (servidor y local). */
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  /** Continua como visitante: descarta cualquier sesion local. */
  const continueAsGuest = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const role = user?.role || ROLES.GUEST;

  /** Indica si el rol actual esta entre los indicados. */
  const hasRole = useCallback((...roles) => roles.flat().includes(role), [role]);

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthenticated: Boolean(user),
      isGuest: !user,
      isBootstrapping,
      login,
      logout,
      continueAsGuest,
      hasRole,
    }),
    [user, role, isBootstrapping, login, logout, continueAsGuest, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook de acceso al contexto de autenticacion. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export default AuthContext;
