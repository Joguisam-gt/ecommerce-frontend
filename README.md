# ecommerce-frontend

Frontend de la tienda en linea (Partes A y B) construido con Expo SDK 58, React Native 0.88 y
react-native-web. JavaScript, sin TypeScript. Consume la API de `../ecommerce-backend`.

## Arranque

```bash
npm install

# URL base de la API (incluye /api/v1). Por defecto: http://localhost:3000/api/v1
# (en el emulador de Android el valor por defecto usa 10.0.2.2).
export EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# Opcional: endpoint para subir comprobantes de transferencia.
export EXPO_PUBLIC_RECEIPT_UPLOAD_URL=https://mi-servicio-de-archivos/upload

npm run web       # navegador (http://localhost:8081)
npm run ios       # simulador iOS
npm run android   # emulador Android
```

Las variables `EXPO_PUBLIC_*` se incrustan al compilar: tras cambiarlas, reinicia `expo start`
(con `-c` para limpiar la cache si hace falta). Tambien puedes definirlas en un archivo `.env`.

### Backend: CORS y cookies

La sesion se basa en cookies HttpOnly, por lo que el backend debe aceptar credenciales desde el
origen web de Expo. Agrega `http://localhost:8081` a `CORS_ORIGINS` en el `.env` del backend:

```
CORS_ORIGINS=http://localhost:8081
```

Usa el mismo host en ambos lados (`localhost` con `localhost`, no mezclar con `127.0.0.1`), o el
navegador no enviara las cookies.

## Estructura

```
App.js                      AuthProvider > CartProvider > NavigationProvider > AppNavigator
src/
  config/                   env.js (API_BASE_URL, RECEIPT_UPLOAD_URL, CURRENCY), theme.js, constants.js
  utils/                    format.js (formatMoney, formatPercent, formatNumber, formatDate, formatDateTime), validators.js
  services/                 apiClient (fetch), auth, store, cart, config, pos, paymentTokenizer, receiptUploader
    admin/                  pedidos, cupones, inventario, compras, proveedores, clientes, facturas, reportes
    superuser/              personal, configuracion, bitacora de auditoria, purga
  context/                  AuthContext (sesion y rol), CartContext (carrito del rol user)
  hooks/                    useResponsiveLayout, useAsync, useQueryFilters, usePaginatedResource
  components/               componentes reutilizables nativos (index.js los re-exporta)
  navigation/               routes.js, NavigationContext (pila propia), ProtectedRoute, AppNavigator, AdminShell
  screens/
    auth/LoginScreen.js
    ForbiddenScreen.js
    store/                  StoreScreen, ProductDetailScreen
    user/                   UserDashboardScreen, CheckoutCartScreen, PosPaymentScreen
    admin/                  pantallas del panel de administracion (Parte B)
    superuser/              SuperuserGovernanceScreen y paneles de gobernanza (Parte B)
docs/CONTRATO-PARTE-A.md    contrato de nombres, firmas y reglas (Parte A)
docs/CONTRATO-PARTE-B.md    contrato del panel de administrador y superusuario (Parte B)
```

La navegacion es un navegador propio sin dependencias (`src/navigation`): una pila en memoria con
`navigate`, `goBack`, `reset` y `canGoBack`. Las pantallas leen sus parametros de
`useNavigation().route.params`.

## Autenticacion

1. Al arrancar, `AuthContext` llama a `restoreSession()` (`POST /auth/refresh`). Mientras tanto se
   muestra un indicador de carga. Si hay sesion, se navega al inicio del rol
   (user: Mi panel, admin: Panel Admin, superuser: Gobernanza); si no, queda el Login.
2. `POST /auth/login` fija las cookies HttpOnly de acceso y refresh. En web el token nunca se toca
   desde JavaScript; en iOS y Android el token de acceso se guarda solo en memoria y se envia como
   `Authorization: Bearer`. Ningun token se persiste.
3. Si una peticion responde 401, `apiClient` hace UN `POST /auth/refresh` (compartido entre
   peticiones concurrentes) y reintenta una vez. Login y refresh nunca disparan refresh (sin bucles).
   Si el refresh falla, se limpia la sesion y las rutas protegidas redirigen al Login.
4. La cookie de refresh solo viaja a `/api/v1/auth`, por eso `API_BASE_URL` debe terminar en `/api/v1`.
5. Visitante (`guest`): puede ver el catalogo y el detalle. Al entrar a una ruta protegida se
   redirige al Login con `redirectTo`, y tras iniciar sesion se vuelve al destino si el rol tiene
   acceso. Un rol sin permiso ve la pantalla de acceso denegado.

## Comprobantes de transferencia

El backend no almacena archivos: solo acepta `payment.receiptUrl` con una URL `https`.
Si `EXPO_PUBLIC_RECEIPT_UPLOAD_URL` esta definida, `uploadReceipt(file)` sube el archivo elegido con
`expo-document-picker` y devuelve su URL https. Si no esta definida, lanza `UPLOAD_NOT_CONFIGURED` y
la pantalla de pago pide la URL https del comprobante manualmente.

## Pagos con tarjeta

`paymentTokenizer.tokenizeCard` simula una pasarela: valida la tarjeta localmente y devuelve
`{ paymentToken: 'tok_...', last4, cardHolderName, cardBrand }`. El numero completo y el CVV nunca
salen de esa funcion ni llegan al backend.

## Reglas visuales

- Solo componentes nativos de `react-native` y `StyleSheet`; sin librerias de UI ni etiquetas HTML.
- Paleta unica en `src/config/theme.js`; ningun color hexadecimal fuera de ese archivo.
- Colores solidos: sin transparencias, sin degradados, sin blur. El fondo de cualquier modal es
  `colors.overlay` solido y la tarjeta es blanca.
- Sin emojis en codigo ni en textos.
- Responsivo: escritorio desde 768 px de ancho; grilla de 2, 3 o 4 columnas; contenido centrado
  con ancho maximo de 1200 px.
- Accesibilidad: `accessibilityRole` y `accessibilityLabel` en elementos interactivos y areas
  tactiles de al menos 44 px.
- Importes en quetzales con `formatMoney` ("Q 1,234.50").

## Parte B: panel de administrador y superusuario

Contrato completo en `docs/CONTRATO-PARTE-B.md`. Todas las rutas del panel se envuelven en
`src/navigation/AdminShell.js`: menu lateral fijo de 240 px en escritorio y barra horizontal
desplazable en movil. La seccion "Superusuario" del menu solo aparece con ese rol, y las rutas de
detalle resaltan su modulo padre (por ejemplo, `AdminSupplierDetail` resalta "Proveedores").
El encabezado global muestra "Panel Admin" (admin y superuser) y "Gobernanza" (solo superuser).

### Rutas y RBAC por pantalla

| Ruta | Pantalla | Parametros | Roles |
|---|---|---|---|
| `AdminPanel` | AdminDashboardScreen (resumen y conciliacion de transferencias) | - | admin, superuser |
| `AdminCoupons` | AdminCouponsScreen | - | admin, superuser |
| `AdminReports` | AdminReportsScreen | - | admin, superuser |
| `AdminReportProduct` | AdminReportProductScreen | `{ productId }` | admin, superuser |
| `AdminInventory` | AdminInventoryScreen | - | admin, superuser |
| `AdminInventoryDetail` | AdminInventoryDetailScreen | `{ productId }` | admin, superuser |
| `AdminPurchases` | AdminPurchasesScreen (listado, formulario y detalle) | `{ purchaseId? }` | admin, superuser |
| `AdminSuppliers` | AdminSuppliersScreen | - | admin, superuser |
| `AdminSupplierDetail` | AdminSupplierDetailScreen | `{ supplierId }` | admin, superuser (borrado fisico: solo superuser) |
| `AdminCustomers` | AdminCustomersScreen | - | admin, superuser |
| `AdminCustomerDetail` | AdminCustomerDetailScreen | `{ customerId }` | admin, superuser (borrado fisico: solo superuser) |
| `AdminInvoices` | AdminInvoicesScreen | - | admin, superuser |
| `AdminInvoiceDetail` | AdminInvoiceDetailScreen | `{ invoiceId }` | admin, superuser |
| `SuperuserPanel` | SuperuserGovernanceScreen (personal, configuracion, auditoria, purga) | - | superuser |

`ROUTE_ACCESS` en `src/navigation/routes.js` aplica estos permisos en `ProtectedRoute`; el backend
vuelve a validarlos (JWT + RBAC), asi que ocultar un boton nunca sustituye a la autorizacion del
servidor. Las acciones exclusivas de superusuario dentro de pantallas admin solo se muestran con
`useAuth().hasRole('superuser')` y siempre piden confirmacion con `ConfirmModal tone="danger"`.

### Servicios

`src/services/admin/*` y `src/services/superuser/*` usan solo `apiClient` (fetch). Los listados
devuelven `{ items, meta }` (`meta = { total, page, limit, totalPages }`), los detalles y mutaciones
devuelven el `data` del backend y los borrados con 204 devuelven `null`. Notas:

- `settingsService.updateSettings`: `companyBankAccounts` reemplaza la lista completa; envia siempre
  todas las cuentas. `defaultTaxRate` es una fraccion entre 0 y 1 (0.12 = 12 %).
- `staffService.changeStaffRole(id, role)` envia `{ role }` y `changeStaffStatus(id, isActive)`
  envia `{ isActive }`.
- `reportService` retira `page` y `limit` del query: los reportes no paginan y el backend rechaza
  parametros desconocidos. El rango de fechas usa `startDate` y `endDate` (AAAA-MM-DD).
- `purgeService.PURGEABLE_COLLECTIONS = ['users', 'products', 'suppliers', 'coupons']`.

### Componentes de datos

- `DataTable` (`.jsx`): columnas `{ key, title, width, flex, align, render }`. En escritorio las
  columnas usan `flex` y ocupan todo el ancho; en movil un unico `ScrollView` horizontal contiene la
  cabecera y las filas con anchos fijos para que se desplacen juntas. Incluye carga, error con
  "Reintentar", estado vacio, fila seleccionada y paginacion "Anterior / Pagina X de Y / Siguiente".
- `FilterBar` (`.jsx`): campos `text`, `number`, `date` (AAAA-MM-DD validado), `select` y `boolean`
  (chips con opcion "Todos"). Plegable en movil ("Mostrar filtros").
- `useQueryFilters(initial)`: separa valores en edicion de los aplicados; `query` omite vacios
  (`''`, `null`, `undefined`, `'all'`) y agrega `page` y `limit` (20). `apply()` vuelve a la pagina 1.
- `usePaginatedResource(fetcher, query)`: recarga cuando cambia el contenido de `query` y descarta
  respuestas obsoletas con un contador de peticiones.
- Otros: `AdminPage`, `KpiCard`, `StatusBadge`, `DetailRow`, `ConfirmModal` (con `requireText` para
  confirmacion escrita), `Checkbox`, `DateField`, `BarChart` (barras con `View`, sin librerias) y
  `TabBar`.
