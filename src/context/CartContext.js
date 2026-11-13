/**
 * Contexto del carrito. Solo sincroniza con /cart cuando el rol es 'user';
 * para otros roles el carrito es null y el contador 0. Los metodos de mutacion
 * actualizan `cart` con la respuesta y propagan los ApiError a la pantalla.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as cartService from '../services/cartService';
import { ApiError } from '../services/apiClient';
import { useAuth } from './AuthContext';
import { ROLES } from '../config/constants';

const CartContext = createContext(null);

/** Proveedor del carrito (debe ir dentro de AuthProvider). */
export function CartProvider({ children }) {
  const { user, role } = useAuth();
  const isUser = role === ROLES.USER;
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Identifica la sesion vigente para descartar respuestas de una sesion anterior.
  const sessionRef = useRef(0);

  /** Recarga el carrito; no lanza: guarda el error en `error` y devuelve el carrito o null. */
  const refreshCart = useCallback(async () => {
    if (!isUser) return null;
    const session = sessionRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const data = await cartService.getCart();
      if (session === sessionRef.current) setCart(data);
      return data;
    } catch (err) {
      if (session === sessionRef.current) setError(err);
      return null;
    } finally {
      if (session === sessionRef.current) setIsLoading(false);
    }
  }, [isUser]);

  // Al cambiar de usuario o de rol se reinicia y, si es 'user', se carga el carrito.
  useEffect(() => {
    sessionRef.current += 1;
    setCart(null);
    setError(null);
    setIsLoading(false);
    if (isUser) refreshCart();
  }, [isUser, user?.id, refreshCart]);

  /** Ejecuta una mutacion del carrito y guarda el resultado. */
  const mutate = useCallback(
    async (operation) => {
      if (!isUser) {
        const guest = role === ROLES.GUEST;
        throw new ApiError({
          status: guest ? 401 : 403,
          code: guest ? 'UNAUTHORIZED' : 'FORBIDDEN',
          message: guest ? 'Inicia sesion para usar el carrito.' : 'Tu rol no puede usar el carrito.',
        });
      }
      const session = sessionRef.current;
      const data = await operation();
      if (session === sessionRef.current) {
        setCart(data);
        setError(null);
      }
      return data;
    },
    [isUser, role],
  );

  /** Agrega un producto. */
  const addItem = useCallback((productId, qty) => mutate(() => cartService.addItem(productId, qty)), [mutate]);
  /** Cambia la cantidad de un producto. */
  const updateItem = useCallback((productId, qty) => mutate(() => cartService.updateItem(productId, qty)), [mutate]);
  /** Quita un producto. */
  const removeItem = useCallback((productId) => mutate(() => cartService.removeItem(productId)), [mutate]);
  /** Aplica un cupon (422 si es invalido; el carrito no cambia). */
  const applyCoupon = useCallback((code) => mutate(() => cartService.applyCoupon(code)), [mutate]);
  /** Quita el cupon. */
  const removeCoupon = useCallback(() => mutate(() => cartService.removeCoupon()), [mutate]);

  const totalItemsCount = isUser ? Number(cart?.summary?.totalItemsCount ?? 0) : 0;

  const value = useMemo(
    () => ({
      cart: isUser ? cart : null,
      totalItemsCount,
      isLoading,
      error,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      removeCoupon,
    }),
    [isUser, cart, totalItemsCount, isLoading, error, refreshCart, addItem, updateItem, removeItem, applyCoupon, removeCoupon],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Hook de acceso al carrito. */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}

export default CartContext;
