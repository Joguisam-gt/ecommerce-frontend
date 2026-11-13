/**
 * Raiz de la aplicacion: proveedores de autenticacion, carrito y navegacion,
 * y el navegador propio que renderiza la pantalla actual.
 */
import React from 'react';
import { Platform, StatusBar as NativeStatusBar, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { NavigationProvider } from './src/navigation/NavigationContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/config/theme';

/**
 * Margen superior para no quedar bajo la barra de estado en nativo
 * (sin dependencias de safe-area: Android usa la altura real; iOS un valor fijo).
 */
const TOP_INSET = Platform.select({ android: NativeStatusBar.currentHeight || 0, ios: 47, default: 0 });

/** Componente raiz. */
export default function App() {
  return (
    <View style={[styles.root, { paddingTop: TOP_INSET }]}>
      <AuthProvider>
        <CartProvider>
          <NavigationProvider>
            <AppNavigator />
          </NavigationProvider>
        </CartProvider>
      </AuthProvider>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
