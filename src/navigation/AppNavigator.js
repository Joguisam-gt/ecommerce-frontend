/**
 * Navegador de la app: muestra AppHeader (salvo en Login) y la pantalla actual
 * envuelta en ProtectedRoute. Las rutas Admin* y Superuser* se envuelven ademas en
 * AdminShell (menu del panel).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from './NavigationContext';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminShell } from './AdminShell';
import { ROUTES, SHELL_ROUTES } from './routes';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../config/theme';
import LoginScreen from '../screens/auth/LoginScreen';
import ForbiddenScreen from '../screens/ForbiddenScreen';
import StoreScreen from '../screens/store/StoreScreen';
import ProductDetailScreen from '../screens/store/ProductDetailScreen';
import UserDashboardScreen from '../screens/user/UserDashboardScreen';
import CheckoutCartScreen from '../screens/user/CheckoutCartScreen';
import PosPaymentScreen from '../screens/user/PosPaymentScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminCouponsScreen from '../screens/admin/AdminCouponsScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminReportProductScreen from '../screens/admin/AdminReportProductScreen';
import AdminInventoryScreen from '../screens/admin/AdminInventoryScreen';
import AdminInventoryDetailScreen from '../screens/admin/AdminInventoryDetailScreen';
import AdminPurchasesScreen from '../screens/admin/AdminPurchasesScreen';
import AdminSuppliersScreen from '../screens/admin/AdminSuppliersScreen';
import AdminSupplierDetailScreen from '../screens/admin/AdminSupplierDetailScreen';
import AdminCustomersScreen from '../screens/admin/AdminCustomersScreen';
import AdminCustomerDetailScreen from '../screens/admin/AdminCustomerDetailScreen';
import AdminInvoicesScreen from '../screens/admin/AdminInvoicesScreen';
import AdminInvoiceDetailScreen from '../screens/admin/AdminInvoiceDetailScreen';
import SuperuserGovernanceScreen from '../screens/superuser/SuperuserGovernanceScreen';

/** Mapa nombre de ruta -> componente de pantalla. */
const SCREENS = {
  [ROUTES.LOGIN]: LoginScreen,
  [ROUTES.STORE]: StoreScreen,
  [ROUTES.PRODUCT_DETAIL]: ProductDetailScreen,
  [ROUTES.USER_DASHBOARD]: UserDashboardScreen,
  [ROUTES.CHECKOUT_CART]: CheckoutCartScreen,
  [ROUTES.POS_PAYMENT]: PosPaymentScreen,
  [ROUTES.ADMIN_PANEL]: AdminDashboardScreen,
  [ROUTES.ADMIN_COUPONS]: AdminCouponsScreen,
  [ROUTES.ADMIN_REPORTS]: AdminReportsScreen,
  [ROUTES.ADMIN_REPORT_PRODUCT]: AdminReportProductScreen,
  [ROUTES.ADMIN_INVENTORY]: AdminInventoryScreen,
  [ROUTES.ADMIN_INVENTORY_DETAIL]: AdminInventoryDetailScreen,
  [ROUTES.ADMIN_PURCHASES]: AdminPurchasesScreen,
  [ROUTES.ADMIN_SUPPLIERS]: AdminSuppliersScreen,
  [ROUTES.ADMIN_SUPPLIER_DETAIL]: AdminSupplierDetailScreen,
  [ROUTES.ADMIN_CUSTOMERS]: AdminCustomersScreen,
  [ROUTES.ADMIN_CUSTOMER_DETAIL]: AdminCustomerDetailScreen,
  [ROUTES.ADMIN_INVOICES]: AdminInvoicesScreen,
  [ROUTES.ADMIN_INVOICE_DETAIL]: AdminInvoiceDetailScreen,
  [ROUTES.SUPERUSER_PANEL]: SuperuserGovernanceScreen,
  [ROUTES.FORBIDDEN]: ForbiddenScreen,
};

/** Renderiza la ruta actual. */
export function AppNavigator() {
  const { route } = useNavigation();
  // Rutas desconocidas muestran la pantalla de acceso denegado.
  const Screen = SCREENS[route.name] || ForbiddenScreen;
  const showHeader = route.name !== ROUTES.LOGIN;
  const inShell = SHELL_ROUTES.includes(route.name);
  return (
    <View style={styles.root}>
      {showHeader ? <AppHeader /> : null}
      <View style={styles.content}>
        <ProtectedRoute name={route.name} params={route.params}>
          {/* El menu del panel solo se monta si el rol tiene acceso (dentro de ProtectedRoute). */}
          {inShell ? (
            <AdminShell>
              {/* La key fuerza un montaje limpio al cambiar de entrada de la pila. */}
              <Screen key={route.key} />
            </AdminShell>
          ) : (
            <Screen key={route.key} />
          )}
        </ProtectedRoute>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});

export default AppNavigator;
