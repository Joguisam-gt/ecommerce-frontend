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
  ADMIN_COUPONS: 'AdminCoupons',
  ADMIN_REPORTS: 'AdminReports',
  ADMIN_REPORT_PRODUCT: 'AdminReportProduct',
  ADMIN_INVENTORY: 'AdminInventory',
  ADMIN_INVENTORY_DETAIL: 'AdminInventoryDetail',
  ADMIN_PURCHASES: 'AdminPurchases',
  ADMIN_SUPPLIERS: 'AdminSuppliers',
  ADMIN_SUPPLIER_DETAIL: 'AdminSupplierDetail',
  ADMIN_CUSTOMERS: 'AdminCustomers',
  ADMIN_CUSTOMER_DETAIL: 'AdminCustomerDetail',
  ADMIN_INVOICES: 'AdminInvoices',
  ADMIN_INVOICE_DETAIL: 'AdminInvoiceDetail',
  SUPERUSER_PANEL: 'SuperuserPanel',
  FORBIDDEN: 'Forbidden',
};

/** Roles con acceso al panel de administracion. */
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPERUSER];

/** Rutas del panel de administracion (todas comparten ADMIN_ROLES). */
export const ADMIN_ROUTES = [
  ROUTES.ADMIN_PANEL,
  ROUTES.ADMIN_COUPONS,
  ROUTES.ADMIN_REPORTS,
  ROUTES.ADMIN_REPORT_PRODUCT,
  ROUTES.ADMIN_INVENTORY,
  ROUTES.ADMIN_INVENTORY_DETAIL,
  ROUTES.ADMIN_PURCHASES,
  ROUTES.ADMIN_SUPPLIERS,
  ROUTES.ADMIN_SUPPLIER_DETAIL,
  ROUTES.ADMIN_CUSTOMERS,
  ROUTES.ADMIN_CUSTOMER_DETAIL,
  ROUTES.ADMIN_INVOICES,
  ROUTES.ADMIN_INVOICE_DETAIL,
];

/** Rutas exclusivas del superusuario. */
export const SUPERUSER_ROUTES = [ROUTES.SUPERUSER_PANEL];

/** Rutas que se muestran dentro de AdminShell (menu lateral del panel). */
export const SHELL_ROUTES = [...ADMIN_ROUTES, ...SUPERUSER_ROUTES];

/** Elementos del menu del panel de administracion. */
export const ADMIN_NAV_ITEMS = [
  { route: ROUTES.ADMIN_PANEL, label: 'Resumen y conciliacion' },
  { route: ROUTES.ADMIN_COUPONS, label: 'Cupones' },
  { route: ROUTES.ADMIN_INVENTORY, label: 'Inventario' },
  { route: ROUTES.ADMIN_PURCHASES, label: 'Compras' },
  { route: ROUTES.ADMIN_SUPPLIERS, label: 'Proveedores' },
  { route: ROUTES.ADMIN_CUSTOMERS, label: 'Clientes' },
  { route: ROUTES.ADMIN_INVOICES, label: 'Facturas' },
  { route: ROUTES.ADMIN_REPORTS, label: 'Reportes' },
];

/** Elementos del menu exclusivos del superusuario. */
export const SUPERUSER_NAV_ITEMS = [{ route: ROUTES.SUPERUSER_PANEL, label: 'Gobernanza' }];

/** Ruta de detalle -> modulo padre que se resalta en el menu. */
export const NAV_PARENT_ROUTE = {
  [ROUTES.ADMIN_REPORT_PRODUCT]: ROUTES.ADMIN_REPORTS,
  [ROUTES.ADMIN_INVENTORY_DETAIL]: ROUTES.ADMIN_INVENTORY,
  [ROUTES.ADMIN_SUPPLIER_DETAIL]: ROUTES.ADMIN_SUPPLIERS,
  [ROUTES.ADMIN_CUSTOMER_DETAIL]: ROUTES.ADMIN_CUSTOMERS,
  [ROUTES.ADMIN_INVOICE_DETAIL]: ROUTES.ADMIN_INVOICES,
};

/** Ruta del menu que debe resaltarse para la ruta actual. */
export function activeNavRoute(name) {
  return NAV_PARENT_ROUTE[name] || name;
}

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
  // Todas las rutas Admin*: admin y superuser.
  ...Object.fromEntries(ADMIN_ROUTES.map((name) => [name, ADMIN_ROLES])),
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
