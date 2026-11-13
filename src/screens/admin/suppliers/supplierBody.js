/**
 * Validacion y cuerpos de POST /admin/suppliers (createSupplierSchema) y
 * PATCH /admin/suppliers/:id (updateSupplierSchema). supplierCode lo asigna el
 * sistema y nunca se envia. El catalogo es [{ productId, cost }] sin repetidos.
 * Modulo puro (sin dependencias) para poder verificarlo contra el backend.
 */

/** Patrones del backend (supplier.validator.js y common.rules.js). */
export const SUPPLIER_NIT_PATTERN = /^\d{2,12}-?[\dK]$/i;
export const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MAX_CATALOG_ITEMS = 1000;
export const MAX_UNIT_COST = 10000000;

/** Costo con hasta 2 decimales (acepta coma). */
const MONEY_RE = /^\d+([.,]\d{1,2})?$/;

/** Campos de texto del formulario. */
export const SUPPLIER_TEXT_FIELDS = ['name', 'nit', 'address', 'phone', 'email', 'contactName', 'distributionDescription'];

/** Linea vacia del catalogo; product guarda los datos mostrados del producto. */
export function emptyCatalogLine() {
  return { key: `c${Date.now()}${Math.floor(Math.random() * 100000)}`, productId: '', product: null, cost: '' };
}

/** Formulario vacio (alta). */
export function emptySupplierForm() {
  return {
    name: '',
    nit: '',
    address: '',
    phone: '',
    email: '',
    contactName: '',
    distributionDescription: '',
    catalog: [],
  };
}

/**
 * Formulario a partir de un proveedor existente (SupplierDTO o SupplierDetailDTO).
 * @param {object} supplier
 */
export function supplierToForm(supplier) {
  return {
    name: supplier.name || '',
    nit: supplier.nit || '',
    address: supplier.address || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    contactName: supplier.contactName || '',
    distributionDescription: supplier.distributionDescription || '',
    catalog: (supplier.catalog || []).map((entry, index) => ({
      key: `c${index}-${entry.productId}`,
      productId: entry.productId,
      product: entry.name ? { id: entry.productId, name: entry.name, sku: entry.sku, stock: entry.stock } : { id: entry.productId },
      cost: entry.cost === null || entry.cost === undefined ? '' : String(entry.cost),
    })),
  };
}

/** Costo del catalogo a numero (NaN si invalido). */
function toCost(text) {
  const raw = String(text === undefined || text === null ? '' : text).trim();
  return MONEY_RE.test(raw) ? Number(raw.replace(',', '.')) : NaN;
}

/**
 * Valida el formulario. Devuelve { errors, catalogErrors, valid }.
 * @param {ReturnType<typeof emptySupplierForm>} form
 */
export function validateSupplierForm(form) {
  const errors = {};
  const name = form.name.trim();
  if (!name || name.length > 160) errors.name = 'Nombre obligatorio (maximo 160).';
  if (!SUPPLIER_NIT_PATTERN.test(form.nit.trim())) errors.nit = 'NIT invalido (p. ej. 1234567-8).';
  const address = form.address.trim();
  if (!address || address.length > 300) errors.address = 'Direccion obligatoria (maximo 300).';
  if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'Telefono invalido.';
  const email = form.email.trim();
  if (email && (!EMAIL_PATTERN.test(email) || email.length > 254)) errors.email = 'Correo invalido.';
  if (form.contactName.trim().length > 120) errors.contactName = 'Maximo 120 caracteres.';
  const description = form.distributionDescription.trim();
  if (!description || description.length > 2000) errors.distributionDescription = 'Descripcion obligatoria (maximo 2000).';
  if (form.catalog.length > MAX_CATALOG_ITEMS) errors.catalog = `Maximo ${MAX_CATALOG_ITEMS} productos.`;

  // Validacion por linea del catalogo, sin productos repetidos.
  const seen = new Set();
  const catalogErrors = form.catalog.map((line) => {
    const lineError = {};
    if (!/^[a-f\d]{24}$/i.test(line.productId || '')) lineError.productId = 'Selecciona un producto.';
    else if (seen.has(line.productId.toLowerCase())) lineError.productId = 'Producto repetido.';
    if (line.productId) seen.add(line.productId.toLowerCase());
    const cost = toCost(line.cost);
    if (!Number.isFinite(cost) || cost > MAX_UNIT_COST) lineError.cost = 'Costo con hasta 2 decimales.';
    return lineError;
  });
  const valid = Object.keys(errors).length === 0 && catalogErrors.every((item) => Object.keys(item).length === 0);
  return { errors, catalogErrors, valid };
}

/** Catalogo exacto para el backend. */
function catalogBody(catalog) {
  return catalog.map((line) => ({ productId: line.productId, cost: toCost(line.cost) }));
}

/**
 * Cuerpo exacto del alta (email y contactName opcionales; catalogo solo si hay lineas).
 * @param {ReturnType<typeof emptySupplierForm>} form
 */
export function buildCreateSupplierBody(form) {
  const body = {
    name: form.name.trim(),
    nit: form.nit.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    distributionDescription: form.distributionDescription.trim(),
  };
  if (form.email.trim()) body.email = form.email.trim();
  if (form.contactName.trim()) body.contactName = form.contactName.trim();
  if (form.catalog.length > 0) body.catalog = catalogBody(form.catalog);
  return body;
}

/**
 * Cuerpo del PATCH con solo los campos modificados. email y contactName vacios
 * se envian como null (los borra); el catalogo se envia completo si cambio.
 * @param {ReturnType<typeof emptySupplierForm>} form
 * @param {ReturnType<typeof emptySupplierForm>} original
 * @returns {object} Cuerpo (vacio si no hay cambios).
 */
export function buildUpdateSupplierBody(form, original) {
  const body = {};
  SUPPLIER_TEXT_FIELDS.forEach((field) => {
    const next = form[field].trim();
    if (next === original[field].trim()) return;
    if ((field === 'email' || field === 'contactName') && next === '') body[field] = null;
    else body[field] = next;
  });
  const nextCatalog = JSON.stringify(catalogBody(form.catalog));
  const prevCatalog = JSON.stringify(catalogBody(original.catalog));
  if (nextCatalog !== prevCatalog) body.catalog = catalogBody(form.catalog);
  return body;
}
