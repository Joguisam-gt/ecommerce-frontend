/**
 * Guardia de rutas: aplica ROUTE_ACCESS segun el rol actual.
 * - Visitante en ruta que exige sesion: reinicia a Login con redirectTo y redirectParams.
 * - Rol sin permiso: muestra ForbiddenScreen.
 */
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from './NavigationContext';
import { ROUTES, canAccessRoute } from './routes';
import { ROLES } from '../config/constants';
import { LoadingState } from '../components/LoadingState';
import ForbiddenScreen from '../screens/ForbiddenScreen';

/** @param {{ name: string, params?: object, children: React.ReactNode }} props */
export function ProtectedRoute({ name, params, children }) {
  const { role } = useAuth();
  const { reset } = useNavigation();
  const allowed = canAccessRoute(name, role);
  const mustLogin = !allowed && role === ROLES.GUEST;

  // Redirige al login conservando el destino solicitado.
  useEffect(() => {
    if (mustLogin) reset(ROUTES.LOGIN, { redirectTo: name, redirectParams: params || {} });
  }, [mustLogin, name, params, reset]);

  if (allowed) return children;
  if (mustLogin) return <LoadingState label="Redirigiendo al inicio de sesion..." />;
  return <ForbiddenScreen />;
}

export default ProtectedRoute;
