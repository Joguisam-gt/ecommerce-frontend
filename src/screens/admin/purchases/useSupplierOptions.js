/**
 * Hook que carga los proveedores (GET /admin/suppliers, maximo 100 por pagina)
 * para selectores y filtros: devuelve la lista, opciones { label, value } y un
 * mapa id -> proveedor para mostrar nombres en tablas.
 */
import { useEffect, useMemo, useState } from 'react';
import { listSuppliers } from '../../../services/admin/supplierService';
import { describeError } from '../inventory/adminHelpers';

/** Limite maximo admitido por paginationFields del backend. */
const MAX_LIMIT = 100;

/**
 * @param {{ onlyActive?: boolean }} [options]
 */
export default function useSupplierOptions({ onlyActive = false } = {}) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  // Carga la primera pagina de proveedores; ignora la respuesta si se desmonta.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const query = { page: 1, limit: MAX_LIMIT };
    if (onlyActive) query.isActive = true;
    listSuppliers(query)
      .then(({ items }) => {
        if (alive) {
          setSuppliers(items || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (alive) setError(describeError(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [onlyActive, version]);

  // Opciones para SegmentedControl / FilterBar y mapa por id.
  const options = useMemo(
    () => suppliers.map((supplier) => ({ value: supplier.id, label: `${supplier.supplierCode} ${supplier.name}` })),
    [suppliers],
  );
  const byId = useMemo(() => {
    const map = {};
    suppliers.forEach((supplier) => {
      map[supplier.id] = supplier;
    });
    return map;
  }, [suppliers]);

  return { suppliers, options, byId, loading, error, reload: () => setVersion((v) => v + 1) };
}
