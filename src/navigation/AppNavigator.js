/**
 * Navegador de la app: muestra AppHeader (salvo en Login) y la pantalla actual
 * envuelta en ProtectedRoute.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from './NavigationContext';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from './routes';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../config/theme';
import LoginScreen from '../screens/auth/LoginScreen';
import ForbiddenScreen from '../screens/ForbiddenScreen';
import StoreScreen from '../screens/store/StoreScreen';
import ProductDetailScreen from '../screens/store/ProductDetailScreen';
import UserDashboardScreen from '../screens/user/UserDashboardScreen';
import CheckoutCartScreen from '../screens/user/CheckoutCartScreen';
import PosPaymentScreen from '../screens/user/PosPaymentScreen';
import AdminPanelScreen from '../screens/admin/AdminPanelScreen';
import SuperuserPanelScreen from '../screens/superuser/SuperuserPanelScreen';

/** Mapa nombre de ruta -> componente de pantalla. */
const SCREENS = {
  [ROUTES.LOGIN]: LoginScreen,
  [ROUTES.STORE]: StoreScreen,
  [ROUTES.PRODUCT_DETAIL]: ProductDetailScreen,
  [ROUTES.USER_DASHBOARD]: UserDashboardScreen,
  [ROUTES.CHECKOUT_CART]: CheckoutCartScreen,
  [ROUTES.POS_PAYMENT]: PosPaymentScreen,
  [ROUTES.ADMIN_PANEL]: AdminPanelScreen,
  [ROUTES.SUPERUSER_PANEL]: SuperuserPanelScreen,
  [ROUTES.FORBIDDEN]: ForbiddenScreen,
};

/** Renderiza la ruta actual. */
export function AppNavigator() {
  const { route } = useNavigation();
  // Rutas desconocidas muestran la pantalla de acceso denegado.
  const Screen = SCREENS[route.name] || ForbiddenScreen;
  const showHeader = route.name !== ROUTES.LOGIN;
  return (
    <View style={styles.root}>
      {showHeader ? <AppHeader /> : null}
      <View style={styles.content}>
        <ProtectedRoute name={route.name} params={route.params}>
          {/* La key fuerza un montaje limpio al cambiar de entrada de la pila. */}
          <Screen key={route.key} />
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
