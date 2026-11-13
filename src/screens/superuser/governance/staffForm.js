/**
 * Reglas puras del alta de personal (POST /superuser/staff, createStaffSchema del backend):
 * campos exactos email, password, firstName, lastName, phone?, role (admin | superuser).
 * Validacion local equivalente a common.rules.js; el backend sigue siendo la autoridad.
 */

/** Roles de personal admitidos por createStaffSchema (STAFF_ROLES). */
export const STAFF_ROLES = ['admin', 'superuser'];

/** Formulario vacio del alta. */
export const EMPTY_STAFF_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: 'admin',
};

/** Patrones identicos a common.rules.js. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;

/** Patron de nombres con propiedades Unicode; si el motor no lo soporta se usa una version latina. */
const NAME_PATTERN = (() => {
  try {
    return new RegExp("^[\\p{L}][\\p{L}\\s'.-]*$", 'u');
  } catch (unsupported) {
    return /^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F\s'.-]*$/;
  }
})();

/** Bytes UTF-8 de un texto sin depender de Buffer ni TextEncoder. */
function utf8Length(text) {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    // 1 byte ASCII, 2 hasta U+07FF, 3 hasta U+FFFF, 4 para el resto (pares sustitutos).
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

/**
 * Politica de contrasena del backend (passwordPolicy): 8 a 72 bytes, minuscula, mayuscula y digito.
 * @param {string} value
 * @returns {string | null}
 */
export function passwordProblem(value) {
  if (value.length < 8) return 'Debe tener al menos 8 caracteres';
  if (utf8Length(value) > 72) return 'No puede superar 72 bytes';
  if (!/[a-z]/.test(value)) return 'Debe incluir al menos una letra minuscula';
  if (!/[A-Z]/.test(value)) return 'Debe incluir al menos una letra mayuscula';
  if (!/\d/.test(value)) return 'Debe incluir al menos un numero';
  return null;
}

/** Valida un nombre o apellido (1 a 80 caracteres, solo letras y separadores). */
function nameProblem(value) {
  const text = value.trim();
  if (!text) return 'Campo obligatorio';
  if (text.length > 80) return 'Maximo 80 caracteres';
  if (!NAME_PATTERN.test(text)) return 'Solo se permiten letras, espacios, apostrofes y guiones';
  return null;
}

/**
 * Valida el formulario completo.
 * @param {typeof EMPTY_STAFF_FORM} form
 * @returns {Record<string, string>} Errores por campo con los nombres del backend.
 */
export function validateStaffForm(form) {
  const errors = {};
  const firstName = nameProblem(form.firstName);
  const lastName = nameProblem(form.lastName);
  if (firstName) errors.firstName = firstName;
  if (lastName) errors.lastName = lastName;
  // Correo obligatorio con el mismo patron del backend.
  const email = form.email.trim();
  if (!email) errors.email = 'Campo obligatorio';
  else if (email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = 'Correo electronico invalido';
  // Telefono opcional.
  const phone = form.phone.trim();
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Telefono invalido';
  // Contrasena sin recortar (el backend usa trim: false).
  const password = passwordProblem(form.password);
  if (password) errors.password = password;
  if (!STAFF_ROLES.includes(form.role)) errors.role = 'Elige Administrador o Superusuario';
  return errors;
}

/**
 * Construye el cuerpo exacto de POST /superuser/staff (sin campos extra; phone solo si se escribio).
 * @param {typeof EMPTY_STAFF_FORM} form
 * @returns {{ email: string, password: string, firstName: string, lastName: string, phone?: string, role: string }}
 */
export function buildCreateStaffBody(form) {
  const body = {
    email: form.email.trim(),
    password: form.password,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    role: form.role,
  };
  const phone = form.phone.trim();
  if (phone) body.phone = phone;
  return body;
}

/** Rol destino del cambio de rol admin <-> superuser. */
export function nextStaffRole(role) {
  return role === 'superuser' ? 'admin' : 'superuser';
}
