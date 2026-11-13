# Contrato compartido - Frontend Parte B (Admin y Superusuario)

Proyecto: `ecommerce-frontend` (rama `feature/frontend-admin-superuser`). Continua la Parte A: lee
`docs/CONTRATO-PARTE-A.md`, que sigue vigente (reglas visuales, theme, apiClient, AuthContext, componentes base).
Backend (solo lectura): `../ecommerce-backend`. Rutas admin: `src/routes/admin*.routes.js`, `inventory`,
`purchase`, `supplier`, `customer`, `report`; superusuario: `src/routes/superuser*.routes.js`. Las formas
exactas de entrada/salida estan en `src/validators/*.validator.js` y `src/dtos/*.dto.js`. Base de la API del
frontend: `/api/v1` (equivale a `/api`), asi que las rutas de servicio son `/admin/...` y `/superuser/...`.

## Reglas (iguales a la Parte A)
Solo componentes nativos de `react-native` + `StyleSheet`; sin HTML JSX, sin librerias de UI ni de graficos,
sin emojis (tampoco en comentarios), sin transparencias (`rgba`, opacity de fondos), sin degradados ni blur,
colores solo desde `src/config/theme.js`, solo `fetch` via `apiClient`. Comentario breve al inicio de cada
archivo y en cada funcion/bloque. Textos en espanol. Tactiles >= 44 px, accessibilityRole/Label.
Los importes del backend llegan en decimales (Q): usa `formatMoney`. Fechas ISO: usa `formatDate`/`formatDateTime`.
Un archivo nuevo en `.jsx` solo donde se indica; el resto `.js`.

## Formato de respuesta del backend (admin/superuser)
Listados: `{ data: [...], meta: { total, page, limit, totalPages, ... } }`. Detalle y mutaciones: `{ data, meta? }`.
Borrado de proveedor/cliente: 204. Errores: `ApiError` del apiClient (`status`, `code`, `message`, `details`).

## 1. Componentes compartidos (DUENO: agente BASE)
En `src/components/` (exportados tambien desde `src/components/index.js`):
- `DataTable.jsx`: `DataTable({ columns, data, keyExtractor, onRowPress, loading, error, onRetry,
  emptyMessage, pagination, selectedKey, dense })`.
  - `columns: [{ key, title, width=140, flex=1, align='left'|'right'|'center', render?(row) -> node|string }]`.
  - Escritorio (isDesktop): columnas con `flex`, ocupa todo el ancho (vista expandida).
  - Movil: `ScrollView horizontal` controlado (anchos fijos `width`, cabecera y filas desplazan juntas,
    `showsHorizontalScrollIndicator`).
  - Cabecera con fondo `colors.muted`, filas alternas surface / background, fila seleccionada con borde primary.
  - `pagination = { page, totalPages, total, onPageChange }` -> barra "Anterior / Pagina X de Y / Siguiente".
  - Estados integrados: LoadingState, ErrorBanner + boton Reintentar, EmptyState.
- `FilterBar.jsx`: `FilterBar({ fields, values, onChange(key, value), onApply, onReset, applying })`.
  - `fields: [{ key, label, type:'text'|'number'|'date'|'select'|'boolean', options?:[{label,value}],
    placeholder? }]`. `select` y `boolean` usan chips (SegmentedControl o chips propios con opcion "Todos").
    `date` = TextInput `AAAA-MM-DD` validado. Escritorio: campos en fila con wrap; movil: columna plegable
    ("Mostrar filtros").
- `AdminPage({ title, subtitle, actions, children, scroll=true })`: contenedor de pagina (titulo + acciones a la
  derecha en escritorio, debajo en movil) sobre `ScreenContainer`.
- `KpiCard({ label, value, hint, tone='default'|'success'|'danger' })`.
- `StatusBadge({ status })`: mapea estados de pedido/factura/cupon/cuenta a etiqueta en espanol y color solido
  (success: paid, verified, active, approved, confirmed; danger: rejected, voided, inactive, cancelled,
  expired; neutro: pending_verification, pending_payment, etc.).
- `DetailRow({ label, value, children })`: par etiqueta/valor (fila en escritorio, apilado en movil).
- `ConfirmModal({ visible, title, message, confirmLabel='Confirmar', tone='primary'|'danger', requireText,
  requireTextLabel, onConfirm, onCancel, loading, children })`: si `requireText` existe, el boton solo se habilita
  cuando el usuario escribe exactamente ese texto (confirmacion explicita). Overlay solido `colors.overlay`.
- `Checkbox({ label, checked, onChange, disabled })`.
- `DateField({ label, value, onChange, error, minDate })`: TextInput `AAAA-MM-DD` con validacion.
- `BarChart({ data:[{ label, value }], formatValue, tone })`: barras horizontales hechas con `View` de ancho
  proporcional, color solido (`colors.primary` o `success`/`danger`). Sin librerias.
- `TabBar({ tabs:[{ key, label }], value, onChange })`: pestanas internas de una pantalla.

Hook `src/hooks/useQueryFilters.js`: `useQueryFilters(initial) -> { values, setValue(key, v), applied,
apply(), reset(), page, setPage, query }`. `query` = `applied` sin valores vacios (`''`, null, undefined,
'all') + `page` + `limit` (por defecto 20). `apply()` vuelve a la pagina 1.
Hook `src/hooks/usePaginatedResource.js`: `usePaginatedResource(fetcher, query) -> { items, meta, loading,
error, reload }`; `fetcher(query)` devuelve `{ items, meta }`; descarta respuestas obsoletas.
`src/utils/format.js` (anadir sin romper lo existente): `formatDate(iso)` -> `12/11/2026`,
`formatDateTime(iso)` -> `12/11/2026 14:05`, `formatNumber(n)`.

## 2. Servicios (DUENO: agente BASE) - `src/services/admin/` y `src/services/superuser/`
Convencion: `list*(query)` -> `{ items, meta }`; `get*(id)` -> `data`; mutaciones -> `data`;
`remove*/purge` -> `null` o `data`. Pasan `query` tal cual a `apiClient.get(path, { query })`.
- `admin/adminOrderService.js`: `listPendingVerification(query)` GET /admin/orders/pending-verification;
  `reconcileOrder(id, { action:'approve'|'reject', reason? })` PATCH /admin/orders/:id/reconcile.
- `admin/adminCouponService.js`: `listApplicableProducts(query)` GET /admin/coupons/applicable-products;
  `listCoupons(query)`; `getCoupon(id)`; `createCoupon(body)`; `updateCoupon(id, body)`;
  `deactivateCoupon(id)` PATCH /:id/deactivate.
- `admin/inventoryService.js`: `listInventory(query)`; `getInventoryProduct(id)`; `listLosses(query)`;
  `recordLoss(body)` POST /admin/inventory/losses.
- `admin/purchaseService.js`: `listPurchases(query)`; `getPurchase(id)`; `createPurchase(body)`.
- `admin/supplierService.js`: `listSuppliers(query)`; `getSupplier(id)`; `createSupplier(body)`;
  `updateSupplier(id, body)`; `deactivateSupplier(id)`; `deleteSupplier(id)` (204, solo superusuario).
- `admin/customerService.js`: `listCustomers(query)`; `getCustomer(id)`; `updateCustomer(id, body)`;
  `deactivateCustomer(id)`; `deleteCustomer(id)` (204, solo superusuario).
- `admin/adminInvoiceService.js`: `listInvoices(query)`; `getInvoice(id)`.
- `admin/reportService.js`: `getGeneralReport(query)` GET /admin/reports/general;
  `getSupplierPerformance(productId, query)` GET /admin/reports/products/:id/supplier-performance.
- `superuser/staffService.js`: `listStaff(query)`; `createStaff(body)`; `changeStaffRole(id, role)`
  PATCH /superuser/staff/:id/role `{ role }`; `changeStaffStatus(id, isActive)` PATCH /:id/status `{ isActive }`.
- `superuser/settingsService.js`: `getSettings()`; `updateSettings(body)` PATCH /superuser/settings
  (la lista `companyBankAccounts` REEMPLAZA la actual: enviar siempre la lista completa).
- `superuser/auditLogService.js`: `listAuditLogs(query)` GET /superuser/audit-logs.
- `superuser/purgeService.js`: `PURGEABLE_COLLECTIONS = ['users','products','suppliers','coupons']`;
  `purgeRecord(collection, id)` DELETE /superuser/purge/:collection/:id.
  (Verifica el body exacto de staff/role/status y settings en los validators del backend; si difiere de lo
  escrito aqui, manda el backend y documentalo.)

## 3. Navegacion RBAC (DUENO: agente BASE)
`src/navigation/routes.js` (mantener todo lo existente y anadir):
```
ADMIN_PANEL: 'AdminPanel'                 -> AdminDashboardScreen (dashboard + conciliacion)
ADMIN_COUPONS: 'AdminCoupons'             -> AdminCouponsScreen
ADMIN_REPORTS: 'AdminReports'             -> AdminReportsScreen
ADMIN_REPORT_PRODUCT: 'AdminReportProduct'-> AdminReportProductScreen   params { productId }
ADMIN_INVENTORY: 'AdminInventory'         -> AdminInventoryScreen
ADMIN_INVENTORY_DETAIL: 'AdminInventoryDetail' -> AdminInventoryDetailScreen params { productId }
ADMIN_PURCHASES: 'AdminPurchases'         -> AdminPurchasesScreen (listado + formulario + detalle por params { purchaseId })
ADMIN_SUPPLIERS: 'AdminSuppliers'         -> AdminSuppliersScreen
ADMIN_SUPPLIER_DETAIL: 'AdminSupplierDetail' -> AdminSupplierDetailScreen params { supplierId }
ADMIN_CUSTOMERS: 'AdminCustomers'         -> AdminCustomersScreen
ADMIN_CUSTOMER_DETAIL: 'AdminCustomerDetail' -> AdminCustomerDetailScreen params { customerId }
ADMIN_INVOICES: 'AdminInvoices'           -> AdminInvoicesScreen
ADMIN_INVOICE_DETAIL: 'AdminInvoiceDetail'-> AdminInvoiceDetailScreen params { invoiceId }
SUPERUSER_PANEL: 'SuperuserPanel'         -> SuperuserGovernanceScreen
```
`ROUTE_ACCESS`: todas las `Admin*` -> `[admin, superuser]`; `SuperuserPanel` -> `[superuser]`.
`ADMIN_NAV_ITEMS` y `SUPERUSER_NAV_ITEMS` (`[{ route, label }]`) exportados para el menu.
`AppNavigator`: registra todas las pantallas y envuelve las rutas `Admin*` y `Superuser*` en
`src/navigation/AdminShell.js`: menu lateral fijo (ancho 240) en escritorio y barra horizontal desplazable
en movil; muestra la seccion "Superusuario" solo si `role === 'superuser'`; resalta la ruta activa.
`AppHeader`: enlaces "Panel Admin" (admin y superuser) y "Gobernanza" (solo superuser).
Elimina los marcadores `AdminPanelScreen.js` y `SuperuserPanelScreen.js` de la Parte A.

## 4. Pantallas y dueno
- AGENTE ADMIN-1: `src/screens/admin/AdminDashboardScreen.js`, `AdminCouponsScreen.js`,
  `AdminReportsScreen.js`, `AdminReportProductScreen.js`, y subcomponentes en `src/screens/admin/dashboard/`,
  `src/screens/admin/coupons/`, `src/screens/admin/reports/`.
- AGENTE ADMIN-2: `src/screens/admin/AdminInventoryScreen.js`, `AdminInventoryDetailScreen.js`,
  `AdminPurchasesScreen.js`, `AdminSuppliersScreen.js`, `AdminSupplierDetailScreen.js`,
  `AdminCustomersScreen.js`, `AdminCustomerDetailScreen.js`, `AdminInvoicesScreen.js`,
  `AdminInvoiceDetailScreen.js`, subcomponentes en `src/screens/admin/inventory/`, `purchases/`,
  `suppliers/`, `customers/`, `invoices/`.
- AGENTE SUPERUSER: `src/screens/superuser/SuperuserGovernanceScreen.js` y subcomponentes en
  `src/screens/superuser/governance/` (StaffPanel, SettingsPanel, AuditLogPanel, PurgePanel).
Todas son `export default`, sin props (leen `useNavigation().route.params`), usan `AdminPage` como raiz
(AdminShell ya pone el menu) y `DataTable` + `FilterBar` + `useQueryFilters` + `usePaginatedResource` para
listados. Imports: `'../../components'`, `'../../hooks/...'`, `'../../services/admin/...'`,
`'../../services/superuser/...'`, `'../../navigation/routes'`, `'../../navigation/NavigationContext'`,
`'../../context/AuthContext'`, `'../../config/theme'`, `'../../utils/format'`.
Acciones exclusivas de superusuario dentro de pantallas admin (borrado fisico de proveedor/cliente): solo
visibles con `useAuth().hasRole('superuser')`, siempre con `ConfirmModal` `tone="danger"`.
