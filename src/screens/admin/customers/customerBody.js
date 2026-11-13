/**
 * Validacion y cuerpo de PATCH /admin/customers/:id segun updateCustomerSchema:
 * solo firstName, lastName, phone (null lo elimina) y userCode (null vuelve al
 * codigo por defecto); al menos un campo. Modulo puro (sin dependencias).
 */

/** Patrones del backend (common.rules.js y customer.validator.js). */
export const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]*$/u;
export const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;
export const USER_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,39}$/;

/** Campos editables. */
export const CUSTOMER_FIELDS = ['firstName', 'lastName', 'phone', 'userCode'];

/**
 * Formulario a partir del cliente. Si userCode es el _id (codigo por defecto) se deja vacio.
 * @param {object} customer CustomerDTO.
 */
export function customerToForm(customer) {
  const code = customer.userCode && customer.userCode !== customer.id ? customer.userCode : '';
  return {
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    phone: customer.phone || '',
    userCode: code,
  };
}

/**
 * Valida el formulario; devuelve { campo: mensaje }.
 * @param {ReturnType<typeof customerToForm>} form
 */
export function validateCustomerForm(form) {
  const errors = {};
  const first = form.firstName.trim();
  const last = form.lastName.trim();
  if (!first || first.length > 80 || !NAME_PATTERN.test(first)) errors.firstName = 'Solo letras, espacios, apostrofes y guiones.';
  if (!last || last.length > 80 || !NAME_PATTERN.test(last)) errors.lastName = 'Solo letras, espacios, apostrofes y guiones.';
  const phone = form.phone.trim();
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Telefono invalido.';
  const code = form.userCode.trim();
  if (code && !USER_CODE_PATTERN.test(code)) errors.userCode = 'De 3 a 40 letras, digitos, guion o guion bajo.';
  else if (code && /^[a-f\d]{24}$/i.test(code)) errors.userCode = 'No puede tener formato de identificador interno.';
  return errors;
}

/**
 * Cuerpo con solo los campos cambiados; phone y userCode vacios se envian como null.
 * @param {ReturnType<typeof customerToForm>} form
 * @param {ReturnType<typeof customerToForm>} original
 * @returns {object} Cuerpo (vacio si no hay cambios).
 */
export function buildUpdateCustomerBody(form, original) {
  const body = {};
  CUSTOMER_FIELDS.forEach((field) => {
    const next = form[field].trim();
    if (next === original[field].trim()) return;
    if ((field === 'phone' || field === 'userCode') && next === '') body[field] = null;
    else body[field] = next;
  });
  return body;
}
