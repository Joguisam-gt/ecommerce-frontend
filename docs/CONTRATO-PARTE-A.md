# Contrato compartido - Frontend Parte A (ecommerce-frontend)

Proyecto: `/Users/joseguillermorodriguezsamcam/Desktop/IA - aplicada a la programacion/ecommerce-frontend`
Expo SDK 58 (blank, JavaScript, sin TypeScript), React Native + react-native-web. Punto de entrada `App.js`.
Backend de referencia (solo lectura): `../ecommerce-backend` (Express, base `/api/v1`, alias `/api`).

## Reglas obligatorias (todas las tareas)
- Solo componentes nativos de `react-native` (View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  Modal, Image, ActivityIndicator, Platform, useWindowDimensions) + `StyleSheet`. Nada de HTML JSX, nada de
  librerias de UI, nada de React Navigation (navegador propio en `src/navigation`). Sin Axios: solo `fetch`.
- Prohibido emojis en codigo, comentarios y textos. Prohibido glassmorphism, transparencias (rgba con alfa < 1,
  opacity para fondos), blur y degradados. Overlay de cualquier Modal = color solido `colors.overlay`
  (`#374151`) y tarjeta `#FFFFFF`.
- Paleta UNICA desde `src/config/theme.js` (nunca hex sueltos en pantallas).
- Cada archivo empieza con un comentario JSDoc breve de su funcion; cada funcion/bloque relevante lleva un
  comentario de una linea. Textos de UI en espanol, sin tildes no es requisito (puedes usar tildes).
- Importes del backend vienen en decimales (Q). Formatear con `formatMoney` de `src/utils/format.js`.
- Roles del backend: `user`, `admin`, `superuser`. Visitante = `guest` (solo frontend).

## src/config
- `env.js`: `export const API_BASE_URL` (por defecto `http://localhost:3000/api/v1`, sobreescribible con
  `process.env.EXPO_PUBLIC_API_BASE_URL`; en Android emulador usar 10.0.2.2), `RECEIPT_UPLOAD_URL`
  (`process.env.EXPO_PUBLIC_RECEIPT_UPLOAD_URL` o null), `CURRENCY = 'GTQ'`.
- `theme.js`: `export const colors = { background:'#F3F4F6', surface:'#FFFFFF', border:'#D1D5DB',
  textPrimary:'#111827', textSecondary:'#4B5563', primary:'#111827', onPrimary:'#FFFFFF', success:'#047857',
  danger:'#B91C1C', muted:'#E5E7EB', overlay:'#374151' }`, `spacing = { xs:4, sm:8, md:12, lg:16, xl:24, xxl:32 }`,
  `radius = { sm:4, md:8 }`, `typography = { title:22, subtitle:18, body:15, small:13 }`.
- `constants.js`: `ROLES = { GUEST:'guest', USER:'user', ADMIN:'admin', SUPERUSER:'superuser' }`,
  `ROLE_LABELS` (Visitante, Usuario, Administrador, Superusuario), `PAYMENT_METHODS = { CASH_ON_DELIVERY:
  'cash_on_delivery', CARD:'card', BANK_TRANSFER:'bank_transfer' }`, `PAYMENT_METHOD_LABELS`,
  `CARD_BRANDS = ['Visa','Mastercard','Amex']`, `BANKS = ['G&T','Banco Industrial','Banrural','BAC']`,
  `CATEGORIES = ['Todas','Tecnologia','Comida','Hogar','Ropa','Deportes']` (valor 'Todas' = sin filtro),
  `BREAKPOINT_DESKTOP = 768`.

## src/utils
- `format.js`: `formatMoney(amount)` -> "Q 1,234.50"; `formatPercent(n)` -> "15%".
- `validators.js`: `isValidEmail`, `isValidPhone` (/^\+?[0-9\s-]{7,20}$/), `isNonEmpty`, `luhnCheck`,
  `isValidExpiry('MM/AA')` (no vencida), `isValidCvv(cvv, brand)` (Amex 4, resto 3), `isHttpsUrl`.

## src/services (fetch nativo)
- `apiClient.js`:
  - `export class ApiError extends Error { status; code; details; body }`.
  - `export const apiClient = { get(path, opts), post(path, body, opts), patch(path, body, opts), del(path, opts) }`
    donde `opts = { query?: object, headers?: object, skipAuthRefresh?: boolean }`. Siempre
    `credentials: 'include'`, `Content-Type: application/json`, cuerpo JSON. Devuelve el JSON parseado
    (o null en 204).
  - Normaliza errores: cuerpo estandar `{ error: { code, message, details } }` y cuerpo de contrato
    `{ error: 'INSUFFICIENT_STOCK', availableStock, productId, message }` -> `ApiError` con `code`
    (string), `status`, `details` (para stock: `{ availableStock, productId }`), `body` crudo.
  - 401: intenta UNA vez `POST /auth/refresh` (credentials include) y reintenta la peticion; si falla,
    llama a `onUnauthorized` registrado con `setUnauthorizedHandler(fn)`. 403 -> ApiError code `FORBIDDEN`
    por defecto. 409 -> conserva code. Error de red -> ApiError status 0 code `NETWORK_ERROR`.
  - Token de acceso en memoria (`setAccessToken(token|null)`) enviado como `Authorization: Bearer` solo en
    plataformas nativas (Platform.OS !== 'web'); en web solo cookies HttpOnly. Nunca persistir tokens.
- `authService.js`: `login({email,password}) -> { user, accessToken }` (POST /auth/login, `data`),
  `logout()` (POST /auth/logout), `restoreSession() -> user | null` (POST /auth/refresh, sin lanzar si 401).
- `storeService.js`: `listProducts(params) -> { items, meta }` (GET /store/products; params: page, limit,
  category, featured, onSale, newArrivals, topRated, search, sort), `getProduct(id) -> product`.
  Producto: `{ id, sku, name, description, category, imageUrl, stock, pickupAvailable,
  acceptedPaymentMethods[], originalPrice, discountPercent, finalPrice, hasDiscount, taxRatePercent,
  isFeatured, rating:{average,count} }`.
- `cartService.js`: `getCart()`, `addItem(productId, quantity)` (POST /cart/items, 201),
  `updateItem(productId, quantity)` (PATCH), `removeItem(productId)` (DELETE), `applyCoupon(code)`
  (POST /cart/coupon; 422 con code de motivo si invalido/expirado, el carrito no cambia),
  `removeCoupon()`. Todas devuelven el `data` del carrito:
  `{ currency, items:[{ productId, sku, name, imageUrl, quantity, availableStock, unitPrice,
  discountPercent, unitFinalPrice, taxRatePercent, subtotal, discountTotal, taxTotal, grandTotal }],
  coupon: null | { code, applied:true, discount } | { code, applied:false, reason, message },
  issues:[{ productId, code, requested, availableStock }], summary:{ subtotal, productDiscountTotal,
  couponDiscountTotal, discountTotal, taxTotal, grandTotal, totalItemsCount } }`.
- `configService.js`: `getPublicConfig() -> { defaultTaxRate, companyBankAccounts:[{ bankName,
  accountNumber, accountHolder, accountType }] }` (GET /store/config/public).
- `posService.js`: `checkout(payload, idempotencyKey) -> { order, invoice }` (POST /pos/checkout con
  cabecera `Idempotency-Key`). `generateIdempotencyKey()` (24+ chars [A-Za-z0-9_-]).
- `paymentTokenizer.js`: `tokenizeCard({ number, holderName, brand, expiry, cvv }) -> { paymentToken,
  last4, cardHolderName, cardBrand }`. Simulacion en memoria: token `tok_` + aleatorio 32 chars
  alfanumericos (nunca digitos puros); el numero completo y el CVV no salen de la funcion ni se guardan.
- `receiptUploader.js`: `uploadReceipt(file) -> https url`. Si `RECEIPT_UPLOAD_URL` es null lanza
  ApiError code `UPLOAD_NOT_CONFIGURED` (la pantalla pide entonces la URL https manual del comprobante,
  porque el backend solo acepta `receiptUrl` https).

## src/context
- `AuthContext.js`: `AuthProvider`, `useAuth()` -> `{ user, role, isAuthenticated, isGuest, isBootstrapping,
  login(email,password) -> user, logout(), continueAsGuest(), hasRole(...roles) -> bool }`.
  `role` = user.role o 'guest'. Al montar llama `restoreSession`. Registra `setUnauthorizedHandler` para
  limpiar sesion.
- `CartContext.js`: `CartProvider` (dentro de AuthProvider), `useCart()` -> `{ cart, totalItemsCount,
  isLoading, error, refreshCart(), addItem(productId, qty), updateItem(productId, qty), removeItem(productId),
  applyCoupon(code), removeCoupon() }`. Solo sincroniza con /cart si `role === 'user'`; para otros roles cart
  null y contador 0. Los metodos lanzan ApiError hacia la pantalla (no tragan errores) y actualizan `cart`
  con la respuesta.

## src/hooks
- `useResponsiveLayout.js`: `useResponsiveLayout() -> { width, height, isMobile, isDesktop, columns,
  contentMaxWidth, gutter }`. isDesktop = width >= 768. columns: <768 -> 2, <1100 -> 3, resto 4.
  contentMaxWidth 1200, gutter 16 movil / 24 escritorio.
- `useAsync.js` (opcional, para cargas): `useAsync(fn, deps) -> { data, error, isLoading, reload }`.

## src/components (reutilizables, todos nativos)
- `AppButton({ title, onPress, variant='primary'|'secondary'|'danger', disabled, loading, style })`
- `AppTextInput({ label, value, onChangeText, error, secureTextEntry, keyboardType, placeholder,
  autoCapitalize, maxLength, multiline })`
- `Card({ children, style })` fondo surface, borde 1px border, radius md.
- `ScreenContainer({ children, scroll=true })` fondo background, centra con contentMaxWidth y gutter.
- `AppHeader()` encabezado global: nombre de tienda (navega a Store), boton Carrito con contador
  `totalItemsCount` (visible solo para role user), etiqueta del rol, Login o Cerrar sesion. Responsivo.
- `PriceTag({ originalPrice, finalPrice, hasDiscount, size })` precio original tachado
  (`textDecorationLine:'line-through'`) + finalPrice en negrita (color success si hay descuento).
- `DiscountBadge({ percent })` etiqueta solida (fondo success, texto blanco) "-15%".
- `ProductCard({ product, onPress, width })` imagen con DiscountBadge superpuesto (posicion absoluta),
  nombre, categoria, PriceTag, rating.
- `InfoModal({ visible, title, message, onClose, variant='info'|'error'|'success', actionLabel })`
  Modal nativo `transparent` con overlay solido `colors.overlay` (sin alfa), tarjeta blanca.
- `ErrorBanner({ message })` borde y texto danger. `LoadingState({ label })`, `EmptyState({ title, message })`.
- `SectionTitle({ title, subtitle })`. `QuantitySelector({ value, min=1, max, onChange })`.
- `SegmentedControl({ options:[{label,value}], value, onChange })` (selector de metodo de pago, marca, banco).

## src/navigation (navegador propio sin dependencias)
- `routes.js`: `ROUTES = { LOGIN:'Login', STORE:'Store', PRODUCT_DETAIL:'ProductDetail',
  USER_DASHBOARD:'UserDashboard', CHECKOUT_CART:'CheckoutCart', POS_PAYMENT:'PosPayment',
  ADMIN_PANEL:'AdminPanel', SUPERUSER_PANEL:'SuperuserPanel', FORBIDDEN:'Forbidden' }` y
  `ROUTE_ACCESS` (roles permitidos por ruta: Login y Store y ProductDetail publicos; UserDashboard,
  CheckoutCart, PosPayment solo 'user'; AdminPanel 'admin' y 'superuser'; SuperuserPanel 'superuser').
  `homeRouteForRole(role)`: user -> UserDashboard, admin -> AdminPanel, superuser -> SuperuserPanel,
  guest -> Store. (El login redirige a `params.redirectTo` si existe y el rol tiene acceso; si no, al home del rol.)
- `NavigationContext.js`: `NavigationProvider`, `useNavigation()` -> `{ route:{name, params},
  navigate(name, params), goBack(), reset(name, params), canGoBack }` (pila en memoria; en web sincroniza
  `window.history` de forma basica opcional).
- `ProtectedRoute.js`: verifica `ROUTE_ACCESS` con el rol; si es guest y la ruta exige sesion -> Login con
  `params.redirectTo`; si el rol no coincide -> pantalla Forbidden.
- `AppNavigator.js`: muestra `AppHeader` (excepto en Login) + la pantalla actual envuelta en ProtectedRoute.
  Mapa de pantallas importa de `src/screens/...`.
- Pantallas de la Parte B como marcador: `src/screens/admin/AdminPanelScreen.js` y
  `src/screens/superuser/SuperuserPanelScreen.js` (tarjeta "Disponible en la Parte B" + modulos previstos).

## src/screens (Parte A)
Props de pantalla: ninguna; leen `useNavigation().route.params`.
- `auth/LoginScreen.js`, `ForbiddenScreen.js`
- `store/StoreScreen.js`, `store/ProductDetailScreen.js` (params `{ productId }`)
- `user/UserDashboardScreen.js`, `user/CheckoutCartScreen.js`, `user/PosPaymentScreen.js`

## Contrato de checkout (POST /pos/checkout) - campos EXACTOS (el backend rechaza campos extra)
Comunes: `paymentMethod`, `customerName`, `email`, `phone`, `shippingAddress { line1, line2?, city, state?,
postalCode?, country (ISO2, p. ej. 'GT') }`, `nit?` (/^(\d{1,12}-?[\dKk]|CF)$/), `entityName?`, `notes?`.
- cash_on_delivery: customerName, email, phone y shippingAddress OBLIGATORIOS; SIN `payment`.
- card: `payment: { paymentToken, last4, cardHolderName, cardBrand }` EXACTAMENTE.
- bank_transfer: `payment: { bankName, senderAccountNumber (/^[0-9-]{4,34}$/), transferAmount (>0, 2 dec),
  authorizationNumber (/^[A-Za-z0-9-]{3,64}$/), receiptUrl (https) }`. Respuesta: order.status
  `pending_verification`.
Respuesta 201: `{ data: { order: { id, orderNumber, status, totals:{...grandTotal}, payment:{method,status} },
invoice } }`. Errores posibles: 409 INSUFFICIENT_STOCK, 409 COUPON_NO_LONGER_VALID, 402 PAYMENT_DECLINED,
503 MAINTENANCE_MODE, 422 CART_EMPTY, 400 VALIDATION_ERROR.
