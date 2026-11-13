/**
 * Constantes de dominio compartidas: roles, metodos de pago, marcas, bancos,
 * categorias y punto de quiebre responsivo.
 */

/** Roles del backend mas el visitante (solo frontend). */
export const ROLES = { GUEST: 'guest', USER: 'user', ADMIN: 'admin', SUPERUSER: 'superuser' };

/** Etiquetas legibles por rol. */
export const ROLE_LABELS = {
  guest: 'Visitante',
  user: 'Usuario',
  admin: 'Administrador',
  superuser: 'Superusuario',
};

/** Metodos de pago aceptados por POST /pos/checkout. */
export const PAYMENT_METHODS = {
  CASH_ON_DELIVERY: 'cash_on_delivery',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
};

/** Etiquetas legibles por metodo de pago. */
export const PAYMENT_METHOD_LABELS = {
  cash_on_delivery: 'Pago contra entrega',
  card: 'Tarjeta',
  bank_transfer: 'Transferencia bancaria',
};

/** Marcas de tarjeta admitidas por el backend. */
export const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex'];

/** Bancos admitidos para transferencias. */
export const BANKS = ['G&T', 'Banco Industrial', 'Banrural', 'BAC'];

/** Categorias del catalogo; 'Todas' significa sin filtro. */
export const CATEGORIES = ['Todas', 'Tecnologia', 'Comida', 'Hogar', 'Ropa', 'Deportes'];

/** Ancho a partir del cual el layout se considera de escritorio. */
export const BREAKPOINT_DESKTOP = 768;
