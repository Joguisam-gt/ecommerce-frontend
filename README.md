# ecommerce-frontend

Frontend de la tienda en línea (Partes A y B): catálogo, carrito y pago para clientes, y panel de administración y gobernanza para el personal. Resuelve la operación completa de una tienda (venta, inventario, compras, facturación y auditoría) desde una sola aplicación que corre en web, iOS y Android, y consume la API del repositorio `ecommerce-backend`.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

---

## Tecnologías utilizadas

Este proyecto fue desarrollado utilizando las siguientes tecnologías:

- *Lenguaje principal:* JavaScript (sin TypeScript)
- *Framework:* Expo SDK 58, React Native 0.88 y React 19, con `react-native-web` para la versión web
- *Backend relacionado:* Node.js, Express y MongoDB (repositorio `ecommerce-backend`)
- *Base de datos:* el frontend no tiene base propia; usa la del backend (MongoDB)
- *Estilos:* `StyleSheet` nativo, sin librerías de UI ni etiquetas HTML
- *Navegación:* navegador propio sin dependencias (`src/navigation`)
- *Red:* `fetch` encapsulado en `apiClient`
- *Control de versiones:* Git y GitHub
- *Otras herramientas:* Docker y Nginx (alternativa de montaje), `expo-document-picker`

---

# Cómo montar el proyecto

## Requisitos previos

Antes de instalar el proyecto, asegúrate de tener instaladas las siguientes herramientas:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) versión 22 o superior
- El backend (`ecommerce-backend`) levantado y accesible (por defecto en `http://localhost:3000`)
- [Docker](https://www.docker.com/) (opcional, para la alternativa con contenedores)
- Un editor de código, por ejemplo Visual Studio Code

Puedes comprobar las versiones instaladas con los siguientes comandos:

```bash
git --version
node --version
npm --version
```

## 1. Clonar el repositorio

```bash
git clone https://github.com/Joguisam-gt/ecommerce-frontend.git
```

## 2. Entrar a la carpeta del proyecto

```bash
cd ecommerce-frontend
```

## 3. Instalar las dependencias

```bash
npm install
```

## 4. Configurar las variables de entorno

El proyecto no incluye un archivo `.env.example`. Crea un archivo llamado `.env` en la raíz del proyecto o exporta las variables en tu terminal antes de arrancar.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | No | URL base de la API, incluyendo `/api/v1`. Por defecto `http://localhost:3000/api/v1` (en el emulador de Android el valor por defecto usa `10.0.2.2`). |
| `EXPO_PUBLIC_RECEIPT_UPLOAD_URL` | No | Endpoint para subir comprobantes de transferencia. Si no se define, la pantalla de pago pide la URL https del comprobante manualmente. |

Ejemplo de configuración en `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_RECEIPT_UPLOAD_URL=https://mi-servicio-de-archivos/upload
```

O bien exportándolas:

```bash
export EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
export EXPO_PUBLIC_RECEIPT_UPLOAD_URL=https://mi-servicio-de-archivos/upload
```

Las variables `EXPO_PUBLIC_*` se incrustan al compilar: tras cambiarlas, reinicia `expo start` (con `-c` para limpiar la caché si hace falta).

> No compartas contraseñas, tokens ni claves privadas en GitHub. El archivo `.env` está excluido de la imagen Docker (`.dockerignore`).

## 5. Configurar la base de datos

El frontend no tiene base de datos propia: toda la información vive en el backend (MongoDB). Para preparar la base de datos, el superusuario inicial y los datos de ejemplo, sigue el README del backend: <https://github.com/Joguisam-gt/ecommerce-backend>. El superusuario se crea en el backend con el comando `db:seed-superuser`.

### Backend: CORS y cookies

La sesión se basa en cookies HttpOnly, por lo que el backend debe aceptar credenciales desde el origen web de Expo. Agrega `http://localhost:8081` a `CORS_ORIGINS` en el `.env` del backend:

```env
CORS_ORIGINS=http://localhost:8081
```

Usa el mismo host en ambos lados (`localhost` con `localhost`, no mezclar con `127.0.0.1`), o el navegador no enviará las cookies.

## 6. Ejecutar el proyecto

Para iniciar el entorno de desarrollo:

```bash
npm run web       # navegador
npm run ios       # simulador iOS
npm run android   # emulador Android
```

La versión web estará disponible en:

```text
http://localhost:8081
```

Al iniciar sesión con el superusuario se llega a Gobernanza, y el menú lateral da acceso al resto del panel de administración.

### Alternativa: Docker

El `Dockerfile` del repositorio compila la versión web (`npx expo export --platform web`) con `node:22-slim` y la sirve con `nginx:1.27-alpine`, que hace fallback a `index.html` para cualquier ruta desconocida (`nginx.conf`). El contenedor publica el puerto 80 (mapeado a 8081 en el equipo).

El archivo `docker-compose.yml` que orquesta los tres servicios (MongoDB con replica set `rs0`, backend en el puerto 3000 con `CORS_ORIGINS=http://localhost:8081`, y este frontend en `8081->80`) está fuera de este repositorio, en la carpeta padre. Como `EXPO_PUBLIC_API_BASE_URL` se incrusta al compilar, se pasa como argumento de construcción (build arg), no como variable de ejecución.

Para construir y ejecutar solo este contenedor:

```bash
docker build \
  --build-arg EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1 \
  -t ecommerce-frontend .
docker run --rm -p 8081:80 ecommerce-frontend
```

Accede siempre por `http://localhost:8081` (no por `127.0.0.1`) para que las cookies funcionen.

---

# Estructura del proyecto

```text
ecommerce-frontend/
├── App.js                      # AuthProvider > CartProvider > NavigationProvider > AppNavigator
├── index.js                    # Punto de entrada de Expo
├── app.json                    # Configuración de Expo
├── Dockerfile                  # Build web (node:22-slim) + nginx:1.27-alpine
├── nginx.conf                  # Fallback a index.html y caché de /_expo/
├── .dockerignore
├── assets/                     # Iconos y favicon
├── docs/
│   ├── CONTRATO-PARTE-A.md     # Contrato de nombres, firmas y reglas (Parte A)
│   └── CONTRATO-PARTE-B.md     # Contrato del panel de administrador y superusuario (Parte B)
├── src/
│   ├── config/                 # env.js (API_BASE_URL, RECEIPT_UPLOAD_URL, CURRENCY), theme.js, constants.js
│   ├── utils/                  # format.js (formatMoney, formatPercent, formatNumber, formatDate, formatDateTime), validators.js
│   ├── services/               # apiClient, authService, storeService, cartService, configService, posService,
│   │   │                       # paymentTokenizer, receiptUploader, pagedResponse
│   │   ├── admin/              # pedidos, cupones, inventario, compras, proveedores, clientes, facturas, reportes
│   │   └── superuser/          # personal, configuración, bitácora de auditoría, purga
│   ├── context/                # AuthContext (sesión y rol), CartContext (carrito del rol user)
│   ├── hooks/                  # useResponsiveLayout, useAsync, useQueryFilters, usePaginatedResource
│   ├── components/             # Componentes reutilizables nativos (index.js los re-exporta)
│   ├── navigation/             # routes.js, NavigationContext, ProtectedRoute, AppNavigator, AdminShell
│   └── screens/
│       ├── auth/               # LoginScreen
│       ├── store/              # StoreScreen, ProductDetailScreen y components/
│       ├── user/               # UserDashboardScreen, CheckoutCartScreen, PosPaymentScreen y components/
│       ├── admin/              # Pantallas del panel de administración (Parte B) y subcarpetas por módulo
│       ├── superuser/          # SuperuserGovernanceScreen y governance/
│       └── ForbiddenScreen.js
├── package.json                # Dependencias y comandos
├── LICENSE
└── README.md                   # Documentación principal
```

## Descripción de carpetas importantes

| Carpeta | Descripción |
|---|---|
| `src/config/` | Variables de entorno, paleta única de colores y constantes de dominio (roles, métodos de pago, categorías). |
| `src/services/` | Capa de acceso a la API; solo usa `apiClient` (fetch). |
| `src/context/` | Estado global de sesión/rol y del carrito. |
| `src/hooks/` | Hooks de layout responsivo, carga asíncrona, filtros y recursos paginados. |
| `src/components/` | Componentes reutilizables (`DataTable`, `FilterBar`, `KpiCard`, `ConfirmModal`, etc.). |
| `src/navigation/` | Rutas, permisos por rol, pila de navegación propia y el `AdminShell`. |
| `src/screens/` | Pantallas agrupadas por área: auth, store, user, admin y superuser. |
| `docs/` | Contratos de las Partes A y B. Aquí también van las capturas (`docs/images/`). |

### Navegación propia

La navegación es un navegador propio sin dependencias (`src/navigation`): una pila en memoria con `navigate`, `goBack`, `reset` y `canGoBack`. Las pantallas leen sus parámetros de `useNavigation().route.params`.

---

# Documentación del proyecto

## Descripción general

`ecommerce-frontend` es la interfaz de una tienda en línea con venta de productos, carrito, pago (contra entrega, tarjeta y transferencia bancaria) y un panel interno para administradores y superusuarios. Está escrito en React Native con Expo, de modo que la misma base de código se ejecuta en navegador, iOS y Android. Toda la lógica de negocio y la autorización final residen en el backend; el frontend presenta la información y oculta las acciones según el rol.

## Objetivo general

Ofrecer una interfaz multiplataforma, responsiva y accesible para operar la tienda en línea, consumiendo la API REST del backend con autenticación basada en cookies y control de acceso por rol.

## Objetivos específicos

- Permitir a visitantes y clientes explorar el catálogo, ver el detalle de productos y completar compras con distintos métodos de pago.
- Proveer a administradores un panel para gestionar cupones, inventario, compras, proveedores, clientes, facturas y reportes, incluyendo la conciliación de transferencias.
- Proveer al superusuario un panel de gobernanza (personal, configuración, bitácora de auditoría y purga) con confirmaciones para acciones destructivas.
- Garantizar una sesión segura: cookies HttpOnly en web, token solo en memoria en móvil, y un único refresh ante 401.

## Funcionalidades

El sistema permite realizar las siguientes acciones:

- Consultar el catálogo con filtros, búsqueda y detalle de producto (visitantes incluidos).
- Gestionar el carrito (agregar, cambiar cantidad, quitar, aplicar o quitar cupón) y pagar con contra entrega, tarjeta tokenizada o transferencia con comprobante.
- Ver el panel del cliente (Mi panel).
- Resumen y conciliación de transferencias pendientes de verificación (admin).
- CRUD y desactivación de cupones, proveedores y clientes; registro de compras y de pérdidas de inventario.
- Consultar facturas, inventario y reportes generales y de desempeño de proveedor por producto.
- Gobernanza (superuser): alta y administración de personal, configuración de la tienda (cuentas bancarias, tasa de impuesto), bitácora de auditoría y purga de registros.

## Usuarios del sistema

Los permisos salen de `ROUTE_ACCESS` en `src/navigation/routes.js`; el backend vuelve a validarlos.

| Tipo de usuario | Permisos |
|---|---|
| Invitado (`guest`) | Ve el catálogo (`Store`), el detalle de producto (`ProductDetail`), el Login y la pantalla de acceso denegado. Al entrar a una ruta protegida se redirige al Login. |
| Usuario / cliente (`user`) | Todo lo del invitado, más Mi panel (`UserDashboard`), carrito y pedido (`CheckoutCart`) y pago (`PosPayment`). Su inicio es Mi panel. |
| Administrador (`admin`) | Todo el panel de administración (13 rutas `Admin*`): resumen y conciliación, cupones, reportes, inventario, compras, proveedores, clientes y facturas. No puede hacer borrado físico de proveedores ni clientes. Su inicio es Panel Admin. |
| Superusuario (`superuser`) | Todo lo del administrador, más Gobernanza (`SuperuserPanel`: personal, configuración, auditoría y purga) y el borrado físico de proveedores y clientes. Su inicio es Gobernanza; el menú lateral da acceso al panel admin. |

El encabezado global muestra "Panel Admin" (admin y superuser) y "Gobernanza" (solo superuser).

## Flujo principal

1. Al arrancar, `AuthContext` llama a `restoreSession()` (`POST /auth/refresh`) y muestra un indicador de carga.
2. Si hay sesión, navega al inicio del rol (user: Mi panel, admin: Panel Admin, superuser: Gobernanza); si no, el visitante queda en el catálogo y puede ir al Login.
3. En el Login, `POST /auth/login` valida las credenciales y fija las cookies HttpOnly de acceso y refresh.
4. Tras iniciar sesión se vuelve al destino pedido (`redirectTo`) si el rol tiene acceso; si no, se redirige al inicio del rol. Un rol sin permiso ve la pantalla de acceso denegado.
5. El usuario utiliza las funcionalidades de su rol. Si una petición responde 401, `apiClient` hace un solo `POST /auth/refresh` (compartido entre peticiones concurrentes) y reintenta una vez.
6. Si el refresh falla, se limpia la sesión y las rutas protegidas redirigen al Login. El cierre de sesión llama a `POST /auth/logout` y limpia el token local siempre.

### Autenticación en detalle

- En web el token nunca se toca desde JavaScript; en iOS y Android el token de acceso se guarda solo en memoria y se envía como `Authorization: Bearer`. Ningún token se persiste.
- Login y refresh nunca disparan refresh (sin bucles).
- La cookie de refresh solo viaja a `/api/v1/auth`, por eso `API_BASE_URL` debe terminar en `/api/v1`.
- Visitante (`guest`): puede ver el catálogo y el detalle; las rutas protegidas lo redirigen al Login con `redirectTo`.

### Comprobantes de transferencia

El backend no almacena archivos: solo acepta `payment.receiptUrl` con una URL `https`. Si `EXPO_PUBLIC_RECEIPT_UPLOAD_URL` está definida, `uploadReceipt(file)` sube el archivo elegido con `expo-document-picker` y devuelve su URL https. Si no está definida, lanza `UPLOAD_NOT_CONFIGURED` y la pantalla de pago pide la URL https del comprobante manualmente.

### Pagos con tarjeta

`paymentTokenizer.tokenizeCard` simula una pasarela: valida la tarjeta localmente y devuelve `{ paymentToken: 'tok_...', last4, cardHolderName, cardBrand }`. El número completo y el CVV nunca salen de esa función ni llegan al backend.

### Reglas visuales

- Solo componentes nativos de `react-native` y `StyleSheet`; sin librerías de UI ni etiquetas HTML.
- Paleta única en `src/config/theme.js`; ningún color hexadecimal fuera de ese archivo.
- Colores sólidos: sin transparencias, sin degradados, sin blur. El fondo de cualquier modal es `colors.overlay` sólido y la tarjeta es blanca.
- Sin emojis en código ni en textos.
- Responsivo: escritorio desde 768 px de ancho; grilla de 2, 3 o 4 columnas; contenido centrado con ancho máximo de 1200 px.
- Accesibilidad: `accessibilityRole` y `accessibilityLabel` en elementos interactivos y áreas táctiles de al menos 44 px.
- Importes en quetzales con `formatMoney` ("Q 1,234.50").

## Arquitectura

El proyecto utiliza una arquitectura cliente-servidor:

- El *frontend* (este repositorio) muestra la interfaz y recibe las acciones del usuario.
- El *backend* procesa las solicitudes, aplica reglas de negocio y autorización (JWT + RBAC).
- La *base de datos* (MongoDB, replica set `rs0`) vive en el backend.
- La comunicación se realiza mediante una API REST bajo `/api/v1`.

Los proveedores de contexto se anidan en `App.js` así: `AuthProvider > CartProvider > NavigationProvider > AppNavigator`.

Capas del frontend:

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| config | `src/config` | Entorno, tema y constantes. |
| services | `src/services` | Llamadas a la API con `apiClient`; normalizan respuestas. |
| context | `src/context` | Sesión y rol (`AuthContext`), carrito (`CartContext`). |
| hooks | `src/hooks` | Lógica reutilizable de UI y datos. |
| components | `src/components` | Piezas visuales reutilizables. |
| navigation | `src/navigation` | Rutas, RBAC, pila propia, `AdminShell`. |
| screens | `src/screens` | Pantallas por rol y módulo. |

### Parte B: panel de administrador y superusuario

Contrato completo en `docs/CONTRATO-PARTE-B.md`. Todas las rutas del panel se envuelven en `src/navigation/AdminShell.js`: menú lateral fijo de 240 px en escritorio y barra horizontal desplazable en móvil. La sección "Superusuario" del menú solo aparece con ese rol, y las rutas de detalle resaltan su módulo padre (por ejemplo, `AdminSupplierDetail` resalta "Proveedores").

#### Rutas y RBAC por pantalla

| Ruta | Pantalla | Parámetros | Roles |
|---|---|---|---|
| `AdminPanel` | AdminDashboardScreen (resumen y conciliación de transferencias) | - | admin, superuser |
| `AdminCoupons` | AdminCouponsScreen | - | admin, superuser |
| `AdminReports` | AdminReportsScreen | - | admin, superuser |
| `AdminReportProduct` | AdminReportProductScreen | `{ productId }` | admin, superuser |
| `AdminInventory` | AdminInventoryScreen | - | admin, superuser |
| `AdminInventoryDetail` | AdminInventoryDetailScreen | `{ productId }` | admin, superuser |
| `AdminPurchases` | AdminPurchasesScreen (listado, formulario y detalle) | `{ purchaseId? }` | admin, superuser |
| `AdminSuppliers` | AdminSuppliersScreen | - | admin, superuser |
| `AdminSupplierDetail` | AdminSupplierDetailScreen | `{ supplierId }` | admin, superuser (borrado físico: solo superuser) |
| `AdminCustomers` | AdminCustomersScreen | - | admin, superuser |
| `AdminCustomerDetail` | AdminCustomerDetailScreen | `{ customerId }` | admin, superuser (borrado físico: solo superuser) |
| `AdminInvoices` | AdminInvoicesScreen | - | admin, superuser |
| `AdminInvoiceDetail` | AdminInvoiceDetailScreen | `{ invoiceId }` | admin, superuser |
| `SuperuserPanel` | SuperuserGovernanceScreen (personal, configuración, auditoría, purga) | - | superuser |

`ROUTE_ACCESS` en `src/navigation/routes.js` aplica estos permisos en `ProtectedRoute`; el backend vuelve a validarlos (JWT + RBAC), así que ocultar un botón nunca sustituye a la autorización del servidor. Las acciones exclusivas de superusuario dentro de pantallas admin solo se muestran con `useAuth().hasRole('superuser')` y siempre piden confirmación con `ConfirmModal tone="danger"`.

#### Servicios

`src/services/admin/*` y `src/services/superuser/*` usan solo `apiClient` (fetch). Los listados devuelven `{ items, meta }` (`meta = { total, page, limit, totalPages }`), los detalles y mutaciones devuelven el `data` del backend y los borrados con 204 devuelven `null`. Notas:

- `settingsService.updateSettings`: `companyBankAccounts` reemplaza la lista completa; envía siempre todas las cuentas. `defaultTaxRate` es una fracción entre 0 y 1 (0.12 = 12 %).
- `staffService.changeStaffRole(id, role)` envía `{ role }` y `changeStaffStatus(id, isActive)` envía `{ isActive }`.
- `reportService` retira `page` y `limit` del query: los reportes no paginan y el backend rechaza parámetros desconocidos. El rango de fechas usa `startDate` y `endDate` (AAAA-MM-DD).
- `purgeService.PURGEABLE_COLLECTIONS = ['users', 'products', 'suppliers', 'coupons']`.

#### Componentes de datos

- `DataTable` (`.jsx`): columnas `{ key, title, width, flex, align, render }`. En escritorio las columnas usan `flex` y ocupan todo el ancho; en móvil un único `ScrollView` horizontal contiene la cabecera y las filas con anchos fijos para que se desplacen juntas. Incluye carga, error con "Reintentar", estado vacío, fila seleccionada y paginación "Anterior / Página X de Y / Siguiente".
- `FilterBar` (`.jsx`): campos `text`, `number`, `date` (AAAA-MM-DD validado), `select` y `boolean` (chips con opción "Todos"). Plegable en móvil ("Mostrar filtros").
- `useQueryFilters(initial)`: separa valores en edición de los aplicados; `query` omite vacíos (`''`, `null`, `undefined`, `'all'`) y agrega `page` y `limit` (20). `apply()` vuelve a la página 1.
- `usePaginatedResource(fetcher, query)`: recarga cuando cambia el contenido de `query` y descarta respuestas obsoletas con un contador de peticiones.
- Otros: `AdminPage`, `KpiCard`, `StatusBadge`, `DetailRow`, `ConfirmModal` (con `requireText` para confirmación escrita), `Checkbox`, `DateField`, `BarChart` (barras con `View`, sin librerías) y `TabBar`.

## Modelo de datos

El frontend no tiene tablas ni modelos persistentes. Consume las siguientes formas de datos de la API; el esquema completo de colecciones está en el README del backend: <https://github.com/Joguisam-gt/ecommerce-backend>.

| Forma | Descripción |
|---|---|
| Envoltorio `{ data, meta }` | Toda respuesta exitosa trae `data`; los listados añaden `meta`. |
| Listado `{ items, meta }` | Resultado de `toPage` en los servicios admin y superuser. |
| `meta` | `{ total, page, limit, totalPages }`; si el backend no la envía completa se rellenan valores por defecto. |
| Detalle o mutación | El `data` del backend; los borrados con 204 devuelven `null`. |
| Sesión | `{ user, accessToken }` en login; `{ user }` al restaurar la sesión. |
| Checkout | `{ order, invoice }` devuelto por `POST /pos/checkout`. |
| Token de tarjeta | `{ paymentToken, last4, cardHolderName, cardBrand }` generado localmente por `paymentTokenizer`. |

## Documentación de la API

El frontend consume la API bajo `API_BASE_URL` (`http://localhost:3000/api/v1` por defecto). Endpoints usados por cada servicio:

| Método | Ruta | Servicio | Pantalla o contexto |
|---|---|---|---|
| POST | `/auth/login` | `authService.login` | LoginScreen / AuthContext |
| POST | `/auth/refresh` | `apiClient.refreshSession`, `authService.restoreSession` | AuthContext (arranque y reintento tras 401) |
| POST | `/auth/logout` | `authService.logout` | AuthContext |
| GET | `/store/products` | `storeService.listProducts` | StoreScreen |
| GET | `/store/products/:id` | `storeService.getProduct` | ProductDetailScreen |
| GET | `/store/config/public` | `configService.getPublicConfig` | PosPaymentScreen |
| GET | `/cart` | `cartService` | CartContext |
| POST | `/cart/items` | `cartService` | CartContext (tienda y detalle de producto) |
| PATCH / DELETE | `/cart/items/:productId` | `cartService` | CartContext / CheckoutCartScreen |
| POST / DELETE | `/cart/coupon` | `cartService` | CartContext / CouponPanel |
| POST | `/pos/checkout` (cabecera `Idempotency-Key`) | `posService.checkout` | PosPaymentScreen |
| GET | `/admin/orders/pending-verification` | `adminOrderService.listPendingVerification` | AdminDashboardScreen |
| PATCH | `/admin/orders/:id/reconcile` | `adminOrderService.reconcileOrder` | ReconciliationPanel |
| GET | `/admin/reports/general` | `reportService.getGeneralReport` | AdminDashboardScreen, AdminReportsScreen |
| GET | `/admin/reports/products/:id/supplier-performance` | `reportService.getSupplierPerformance` | AdminReportProductScreen |
| GET | `/admin/coupons`, `/admin/coupons/applicable-products`, `/admin/coupons/:id` | `adminCouponService` | CouponList, ApplicableProductsSection |
| POST / PATCH | `/admin/coupons`, `/admin/coupons/:id`, `/admin/coupons/:id/deactivate` | `adminCouponService` | CouponForm, CouponList |
| GET | `/admin/inventory`, `/admin/inventory/:id` | `inventoryService` | AdminInventoryScreen, AdminInventoryDetailScreen |
| GET / POST | `/admin/inventory/losses` | `inventoryService` | LossesPanel, RecordLossForm |
| GET / POST | `/admin/purchases`, `/admin/purchases/:id` | `purchaseService` | AdminPurchasesScreen, PurchaseForm, PurchaseDetail |
| GET | `/admin/suppliers`, `/admin/suppliers/:id` | `supplierService` | AdminSuppliersScreen, AdminSupplierDetailScreen |
| POST / PATCH | `/admin/suppliers`, `/admin/suppliers/:id`, `/admin/suppliers/:id/deactivate` | `supplierService` | SupplierForm, AdminSuppliersScreen |
| DELETE | `/admin/suppliers/:id` | `supplierService.deleteSupplier` | AdminSuppliersScreen (solo superuser) |
| GET | `/admin/customers`, `/admin/customers/:id` | `customerService` | AdminCustomersScreen, AdminCustomerDetailScreen |
| PATCH | `/admin/customers/:id`, `/admin/customers/:id/deactivate` | `customerService` | CustomerEditForm, AdminCustomerDetailScreen |
| DELETE | `/admin/customers/:id` | `customerService.deleteCustomer` | AdminCustomerDetailScreen (solo superuser) |
| GET | `/admin/invoices`, `/admin/invoices/:id` | `adminInvoiceService` | AdminInvoicesScreen, AdminInvoiceDetailScreen, AdminCustomerDetailScreen |
| GET | `/superuser/settings` | `settingsService.getSettings` | SettingsPanel |
| PATCH | `/superuser/settings` | `settingsService.updateSettings` | SettingsPanel |
| GET / POST | `/superuser/staff` | `staffService` | StaffPanel, StaffCreateForm |
| PATCH | `/superuser/staff/:id/role`, `/superuser/staff/:id/status` | `staffService` | StaffPanel |
| GET | `/superuser/audit-logs` | `auditLogService.listAuditLogs` | AuditLogPanel |
| DELETE | `/superuser/purge/:collection/:id` | `purgeService.purgeRecord` | PurgePanel |

El contrato detallado de cuerpos y respuestas está en `docs/CONTRATO-PARTE-A.md` y `docs/CONTRATO-PARTE-B.md`.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm install` | Instala las dependencias. |
| `npm start` | Inicia el servidor de desarrollo de Expo (`expo start`). |
| `npm run web` | Inicia en el navegador (http://localhost:8081). |
| `npm run ios` | Inicia en el simulador de iOS. |
| `npm run android` | Inicia en el emulador de Android. |
| `npx expo export --platform web` | Genera la versión web de producción en `dist/`. |
| `npx expo-doctor` | Diagnostica problemas de dependencias y configuración. |

## Pruebas

Todavía no hay pruebas automatizadas ni un script `test` en `package.json`. La verificación realizada hasta ahora fue:

- La exportación web (`npx expo export --platform web`) compila correctamente (366 módulos).
- El contrato con el backend fue verificado sin discrepancias (nombres, rutas, parámetros y formas de respuesta).

Se recomienda añadir pruebas que cubran los servicios (`apiClient` y el refresh ante 401), las validaciones (`validators.js`), el RBAC de `routes.js` y los flujos de checkout y gobernanza.

## Convenciones de código

Para mantener el proyecto organizado:

- Utiliza nombres de variables descriptivos.
- Escribe los nombres de variables y funciones en `camelCase`.
- Escribe los nombres de componentes y pantallas en `PascalCase`.
- No se usan colores hexadecimales fuera de `src/config/theme.js`.
- Los servicios usan solo `apiClient`; las pantallas no llaman a `fetch` directamente.
- Documenta únicamente la lógica que no sea evidente y mantén las funciones pequeñas.

## Convención de commits

Los mensajes siguen el formato `tipo(<pantalla>): explicación`:

```text
feat(<pantalla>): agregar una funcionalidad nueva
fix(<pantalla>): corregir un error
merge(dev): integra feature/<nombre>
release: integra <cambios> en main
```

Ejemplos reales del historial: `feat(docker): contenedor del frontend para docker compose`, `merge(dev): integra feature/docker`, `release: integra docker en main`.

Ramas: `main`, `dev`, `feature/frontend-store-pos`, `feature/frontend-admin-superuser` y `feature/docker`. El flujo es `feature/*` -> `dev` -> `main`, siempre con `--no-ff`.

## Capturas de pantalla

Todavía no hay capturas en el repositorio. Guárdalas dentro de `docs/images/` y enlázalas aquí con su ruta relativa. Capturas sugeridas:

- Tienda: catálogo con filtros y grilla de productos.
- Login: pantalla de inicio de sesión.
- Panel admin: resumen y conciliación de transferencias.
- Gobernanza: panel del superusuario (personal, configuración, auditoría y purga).

## Despliegue

No hay despliegue público. El proyecto se ejecuta en local:

- *Repositorio:* https://github.com/Joguisam-gt/ecommerce-frontend
- *Aplicación (local):* http://localhost:8081
- *API (local):* http://localhost:3000/api/v1
- *Backend:* https://github.com/Joguisam-gt/ecommerce-backend

## Problemas conocidos

- No hay ESLint configurado ni pruebas automatizadas.
- El historial de compras del cliente (`AdminCustomerDetailScreen`) filtra por email parcial en el backend y luego por `userId` en el cliente, por lo que la paginación puede mostrar menos filas y los totales pueden verse inflados. Requiere un filtro `userId` en el backend.
- El backend no almacena archivos: los comprobantes de transferencia se envían como URL https.
- La pasarela de tarjeta es simulada (`paymentTokenizer`); no hay cobro real.

## Mejoras futuras

- Agregar pruebas automatizadas (servicios, RBAC y flujos de checkout) y un script `test`.
- Configurar ESLint y ejecutarlo en cada commit.
- Añadir un filtro `userId` en el backend para el historial de compras del cliente y quitar el filtrado en cliente.
- Integrar una pasarela de pago real y un servicio de almacenamiento de comprobantes.

## Cómo contribuir

1. Crea un fork del repositorio.
2. Crea una nueva rama a partir de `dev`:

```bash
git checkout -b feature/nombre-funcionalidad
```

3. Realiza los cambios.
4. Guarda los cambios con el formato de commits del proyecto:

```bash
git add .
git commit -m "feat(<pantalla>): agregar nueva funcionalidad"
```

5. Envía la rama a GitHub:

```bash
git push origin feature/nombre-funcionalidad
```

6. Crea un Pull Request hacia `dev`.

## Autor

- *Nombre:* [Nombre completo]
- *Carné:* [Carné]
- *Curso:* [Curso]
- *Sección:* [Sección]
- *Correo:* [Correo]
- *GitHub:* [Joguisam-gt](https://github.com/Joguisam-gt)

## Licencia

Este proyecto fue desarrollado con fines educativos.

El repositorio incluye un archivo `LICENSE` con la licencia MIT (The MIT License), con aviso de copyright de 650 Industries, Inc. (Expo), proveniente de la plantilla de Expo con la que se inició el proyecto.

---

## Lista de verificación antes de entregar

- [x] El nombre y la descripción del proyecto están completos.
- [x] Las tecnologías utilizadas están actualizadas.
- [x] Las instrucciones de instalación funcionan.
- [x] Las variables de entorno están documentadas.
- [x] La estructura corresponde al proyecto real.
- [x] Las funcionalidades están descritas.
- [x] La base de datos está documentada (remite al backend; el frontend no tiene base propia).
- [x] Los endpoints de la API están documentados.
- [ ] Las pruebas se pueden ejecutar (aún no hay pruebas automatizadas).
- [ ] Las capturas de pantalla se visualizan (pendiente: guardarlas en `docs/images/`).
- [x] Los enlaces funcionan.
- [x] No se incluyeron contraseñas, tokens ni datos privados.
- [ ] Los datos del autor están completos (pendiente: nombre, carné, curso, sección y correo).
