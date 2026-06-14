# 120 GRAMOS — Guía de paso a producción

Proyecto Firebase: **gramos-app** · Región funciones: **us-central1**

URLs de webhooks (estables):
- Stripe: `https://us-central1-gramos-app.cloudfunctions.net/stripeWebhook`
- Clip:   `https://us-central1-gramos-app.cloudfunctions.net/clipWebhook`

---

## ✅ Ya hecho (endurecimiento)
- Reglas Firestore/Storage endurecidas y desplegadas: `isAdmin()` con guarda `exists()`; el **serial de la terminal Clip** se movió a `config/clip` (solo-admin) en vez de `settings/*` (que es de lectura pública).
- Verificado: **ningún secreto** viaja en el bundle del cliente (solo llaves `EXPO_PUBLIC_*` publishable).
- Consulta de pedidos activos (`useAdminOrders`) acotada por `status` → ya no lee todo el historial de pagadas.
- Funciones desplegadas: `createPaymentIntent`, `stripeWebhook`, `notifyOrderReady`, `createCounterOrder`, `clipWebhook`.

---

## 1) Stripe: pasar de PRUEBA a PRODUCCIÓN (live)

1. En el **Dashboard de Stripe**, cambia a modo **Live** y copia:
   - Publishable key `pk_live_...`
   - Secret key `sk_live_...`
2. **Cliente** — actualiza la llave publishable de producción:
   - En `.env` (y en el entorno de tus builds de producción / hosting web):
     `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
3. **Servidor** — actualiza el secreto:
   ```bash
   firebase functions:secrets:set STRIPE_SECRET_KEY   # pega sk_live_...
   ```
4. **Webhook de producción** — en Stripe Dashboard (modo Live) → Developers → Webhooks → *Add endpoint*:
   - URL: `https://us-central1-gramos-app.cloudfunctions.net/stripeWebhook`
   - Evento: `payment_intent.succeeded`
   - Copia el **Signing secret** del endpoint (`whsec_...`).
5. Guarda el signing secret de producción:
   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET   # pega whsec_...
   ```
6. Redespliega funciones para tomar los secretos nuevos:
   ```bash
   firebase deploy --only functions
   ```
7. Reconstruye/redeploya el cliente con la nueva `pk_live` (web build + EAS build).

> ⚠️ Verifica que el monto mínimo ($10 MXN) y la moneda `mxn` sigan correctos. Haz un cobro real chico de prueba y luego reembólsalo desde el dashboard.

## 2) Clip: pasar a PRODUCCIÓN (cuando llegue la Total 3 y Clip habilite PinPad)

1. Obtén en `dashboard.clip.mx` las credenciales de **producción** (API key + secret) — tras KYC y habilitación de PinPad.
2. Genera el token Basic y guárdalo:
   ```bash
   TOKEN=$(printf '%s' "API_KEY:SECRET_KEY" | base64 -w0)
   printf '%s' "$TOKEN" | firebase functions:secrets:set CLIP_AUTH_TOKEN --data-file -
   ```
3. Redespliega las funciones de Clip:
   ```bash
   firebase deploy --only functions:createCounterOrder,functions:clipWebhook
   ```
4. En la app (pestaña **Caja**) captura el **número de serie** de la Clip Total 3 (se guarda en `config/clip`).
5. Cobro de prueba real con tarjeta en la terminal → debe aparecer en Pedidos con badge 💳.

> El `CLIP_WEBHOOK_URL` ya está fijado en `functions/.env` (no hace falta tocar el portal de Clip).

## 3) App Check (recomendado para producción)

Evita que alguien llame tus Cloud Functions o lea Firestore fuera de tu app.
1. Firebase Console → **App Check** → registra:
   - Web: reCAPTCHA v3 (o Enterprise).
   - iOS: App Attest / DeviceCheck. Android: Play Integrity.
2. Inicializa App Check en el cliente (`firebase/app-check`) al arrancar la app.
3. Activa **enforcement** en: Cloud Functions (callable), Firestore y Storage.
4. Prueba que la app siga funcionando antes de poner enforcement en modo estricto.

## 4) Entornos / ramas (recomendación)
- `main` = producción. Ramas de feature cortas → merge a `main`.
- **QA local**: usa el emulador de Firebase + Stripe/Clip en modo prueba. No hace falta un segundo proyecto a esta escala.
- Mantén dos juegos de llaves: prueba (`pk_test`/`test_`) y producción (`pk_live`/prod). Nunca mezcles datos de prueba con la base real.

## 5) Builds y publicación
- Móvil: **EAS Build** (iOS/Android) con las variables `EXPO_PUBLIC_*` de producción.
- Web: build de Expo web + hosting (Firebase Hosting u otro).
- Sube la versión (`app.json` version/buildNumber) en cada release.

## 6) Monitoreo (mínimo viable)
- Revisa logs de funciones: `firebase functions:log` o en la consola de Cloud.
- Activa alertas de errores en Cloud Functions.
- Vigila el dashboard de Stripe (pagos, disputas) y el de Clip.
- (Opcional) Sentry/Crashlytics para errores del cliente.

---

## Checklist de pruebas manuales (QA antes de lanzar)

Hazlas en **modo prueba** (tarjeta `4242 4242 4242 4242`, fecha futura, CVC `123`).

### Pagos
| # | Caso | Esperado |
|---|------|----------|
| 1 | Stripe **web**: pedido → checkout → pagar | Va a confirmación; orden creada con badge 📱 App |
| 2 | Stripe **nativo** (iOS/Android): PaymentSheet | Igual que web; orden 📱 App |
| 3 | **Efectivo** en Caja → Registrar pago | Banner verde; orden inmediata con badge 💵 |
| 4 | **Clip** en Caja → cobrar (con terminal real) | Overlay "cobrando…" → aprueba → orden 💳 |
| 5 | Tarjeta **rechazada** (`4000 0000 0000 0002`) | Mensaje de error claro; NO se crea orden |
| 6 | Clip **cancelado** en la terminal | Banner rojo; orden no queda como pagada |
| 7 | Monto < $10 | Rechazado con mensaje de monto mínimo |
| 8 | Manipular precio en el cliente | Backend rechaza (validación server) |

### Ciclo de vida del pedido (admin)
| # | Caso | Esperado |
|---|------|----------|
| 9  | Pedido nuevo aparece en **Pedidos** | Visible en pestaña Activos |
| 10 | paid → preparing → ready → completed | Botones avanzan el estado |
| 11 | Cancelar pedido | Pasa a cancelado; sale de activos |
| 12 | Estado `ready` dispara push | Cliente recibe notificación |
| 13 | Pestaña "Completados" del día | Solo muestra los de hoy |

### Roles y seguridad
| # | Caso | Esperado |
|---|------|----------|
| 14 | Cliente intenta abrir pantallas admin | Bloqueado por RootGuard |
| 15 | Cliente intenta leer pedidos de otro | Denegado por reglas |
| 16 | Usuario nuevo no puede auto-asignarse `admin` | Denegado por reglas |
| 17 | Llamar `createCounterOrder` sin ser admin | `permission-denied` |
| 18 | Stand cerrado → cliente no puede ordenar | Botón deshabilitado |

### Multiplataforma
| # | Caso | Esperado |
|---|------|----------|
| 19 | Web: toggle Efectivo↔Clip y escribir serial | Funciona sin trabarse |
| 20 | Sidebar web / TabBar móvil muestran "Caja" | Navega correctamente |
| 21 | Cerrar sesión / volver a entrar | Estado correcto por rol |
