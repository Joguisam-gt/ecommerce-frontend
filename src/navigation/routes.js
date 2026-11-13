/**
 * Definicion de rutas, permisos por rol y ruta de inicio de cada rol.
 */
import { ROLES } from '../config/constants';

/** Nombres de ruta. */
export const ROUTES = {
  LOGIN: 'Login',
  STORE: 'Store',
  PRODUCT_DETAIL: 'ProductDetail',
  USER_DASHBOARD: 'UserDashboard',
  CHECKOUT_CART: 'CheckoutCart',
  POS_PAYMENT: 'PosPayment',
  ADMIN_PANEL: 'AdminPanel',
  SUPERUSER_PANEL: 'SuperuserPanel',
  FORBIDDEN: 'Forbidden',
};

/** Todos los roles (rutas publicas). */
const ALL_ROLES = [ROLES.GUEST, ROLES.USER, ROLES.ADMIN, ROLES.SUPERUSER];

/** Roles permitidos por ruta. */
export const ROUTE_ACCESS = {
  [ROUTES.LOGIN]: ALL_ROLES,
  [ROUTES.STORE]: ALL_ROLES,
  [ROUTES.PRODUCT_DETAIL]: ALL_ROLES,
  [ROUTES.USER_DASHBOARD]: [ROLES.USER],
  [ROUTES.CHECKOUT_CART]: [ROLES.USER],
  [ROUTES.POS_PAYMENT]: [ROLES.USER],
  [ROUTES.ADMIN_PANEL]: [ROLES.ADMIN, ROLES.SUPERUSER],
  [ROUTES.SUPERUSER_PANEL]: [ROLES.SUPERUSER],
  [ROUTES.FORBIDDEN]: ALL_ROLES,
};

/** Indica si un rol puede acceder a la ruta (rutas desconocidas: denegado). */
export function canAccessRoute(name, role) {
  const allowed = ROUTE_ACCESS[name];
  return Array.isArray(allowed) && allowed.includes(role || ROLES.GUEST);
}

/** Indica si la ruta exige una sesion iniciada. */
export function requiresAuth(name) {
  const allowed = ROUTE_ACCESS[name];
  return Array.isArray(allowed) && !allowed.includes(ROLES.GUEST);
}

/** Ruta de inicio segun el rol. */
export function homeRouteForRole(role) {
  switch (role) {
    case ROLES.USER:
      return ROUTES.USER_DASHBOARD;
    case ROLES.ADMIN:
      return ROUTES.ADMIN_PANEL;
    case ROLES.SUPERUSER:
      return ROUTES.SUPERUSER_PANEL;
    default:
      return ROUTES.STORE;
  }
}
