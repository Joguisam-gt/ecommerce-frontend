/**
 * Gestion de cupones (ruta ADMIN_COUPONS): pestanas de alta de cupon, productos
 * aplicables (seleccion para applicableProductIds) y listado con desactivacion.
 */
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AdminPage, TabBar } from '../../components';
import { spacing } from '../../config/theme';
import { ApplicableProductsSection } from './coupons/ApplicableProductsSection';
import { CouponForm } from './coupons/CouponForm';
import { CouponList } from './coupons/CouponList';

/** Pestanas internas de la pantalla. */
const TABS = [
  { key: 'create', label: 'Nuevo cupon' },
  { key: 'products', label: 'Productos aplicables' },
  { key: 'list', label: 'Cupones' },
];

/** Pantalla de cupones del panel de administracion. */
export default function AdminCouponsScreen() {
  const [tab, setTab] = useState('create');
  // Seleccion de productos compartida entre la tabla y el formulario: { [id]: { id, name } }.
  const [selected, setSelected] = useState({});
  const [reloadSignal, setReloadSignal] = useState(0);

  // Agrega o quita un producto de la seleccion.
  const toggleProduct = useCallback((product) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[product.id]) delete next[product.id];
      else next[product.id] = { id: product.id, name: product.name };
      return next;
    });
  }, []);

  // Vacia la seleccion (cupon global).
  const clearProducts = useCallback(() => setSelected({}), []);

  // Tras crear: limpia la seleccion y pide recargar el listado.
  const handleCreated = useCallback(() => {
    setSelected({});
    setReloadSignal((n) => n + 1);
  }, []);

  return (
    <AdminPage title="Cupones" subtitle="Crea cupones de descuento, elige los productos aplicables y desactiva cupones.">
      <TabBar tabs={TABS} value={tab} onChange={setTab} />
      <View style={styles.body}>
        {/* Las tres secciones quedan montadas (se ocultan) para conservar el formulario y los filtros. */}
        <View style={tab === 'create' ? null : styles.hidden}>
          <CouponForm
            selected={selected}
            onChooseProducts={() => setTab('products')}
            onClearProducts={clearProducts}
            onCreated={handleCreated}
          />
        </View>
        <View style={tab === 'products' ? null : styles.hidden}>
          <ApplicableProductsSection selected={selected} onToggle={toggleProduct} onClear={clearProducts} />
        </View>
        <View style={tab === 'list' ? null : styles.hidden}>
          <CouponList reloadSignal={reloadSignal} />
        </View>
      </View>
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  body: { marginTop: spacing.lg },
  hidden: { display: 'none' },
});
