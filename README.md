# 120 GRAMOS — App de pedidos

App móvil y web para ordenar café artesanal. Construida con Expo (React Native) + Firebase + Stripe.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v22+
- [Git](https://git-scm.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`

---

## Instalación

```bash
git clone https://github.com/Andy01hb/120-gramos.git
cd 120-gramos

# Instalar dependencias de la app
npm install

# Instalar dependencias de las Cloud Functions
cd functions && npm install && cd ..
```

---

## Variables de entorno

Copia el archivo de ejemplo y rellena los valores:

```bash
cp .env.example .env.local   # para desarrollo local
cp .env.example .env.production  # para producción
```

| Variable | Descripción |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | API key del proyecto Firebase |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain de Firebase |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto Firebase |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de Firebase Storage |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID de Firebase |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | App ID de Firebase |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` | Measurement ID de Analytics |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key de Stripe (`pk_test_...`) |
| `EXPO_PUBLIC_USE_EMULATOR` | `true` para desarrollo local, `false` para producción |

> Los valores los encuentras en la [Consola de Firebase](https://console.firebase.google.com) → Configuración del proyecto.

---

## Desarrollo local

El entorno local usa **Firebase Emulator Suite** — una base de datos, auth y storage que corren en tu máquina. No tocan datos de producción.

### 1. Iniciar el emulador

```bash
# Primera vez (base de datos vacía)
npm run emulator:clean

# Veces siguientes (conserva los datos de la sesión anterior)
npm run emulator
```

Abre [localhost:4000](http://localhost:4000) para ver el panel del emulador con Firestore, Auth y Storage visuales.

### 2. Iniciar la app conectada al emulador

En otra terminal:

```bash
npm run dev
```

Escanea el QR con Expo Go en tu teléfono o abre en el navegador.

> La app detecta `EXPO_PUBLIC_USE_EMULATOR=true` en `.env.local` y se conecta automáticamente al emulador.

---

## Flujo de trabajo con Git

```
main          →  producción (Firebase real, Vercel prod)
develop       →  integración (preview URL automática en Vercel)
feature/*     →  tu trabajo diario
```

### Crear una nueva feature

```bash
git checkout develop
git pull
git checkout -b feature/nombre-de-la-feature

# ... hacer cambios ...

git add -A
git commit -m "feat: descripción del cambio"
git push origin feature/nombre-de-la-feature

# Abre un Pull Request en GitHub: feature → develop
# Vercel despliega una preview URL automáticamente para revisar
# Cuando está aprobado: merge a develop, luego develop → main para producción
```

---

## Despliegue web

```bash
# Build + deploy a Vercel en un solo comando
npm run deploy:web
```

La URL de producción es la configurada en Vercel conectada a la rama `main`.

---

## Builds móviles con EAS

### APK de prueba (Android, distribución interna)

```bash
npm run build:preview
```

Genera un APK descargable desde [expo.dev](https://expo.dev). Instálalo directamente en el teléfono.

### Build de producción (Play Store / App Store)

```bash
npm run build:prod
```

---

## Cloud Functions

Las funciones viven en `functions/src/`:

| Función | Descripción |
|---|---|
| `createPaymentIntent` | Crea un PaymentIntent en Stripe validando precios contra Firestore |
| `stripeWebhook` | Recibe confirmaciones de pago de Stripe y crea la orden en Firestore |
| `notifyOrderReady` | Envía push notification cuando un pedido pasa a estado "listo" |

### Secretos requeridos (Firebase Secret Manager)

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

### Desplegar funciones

```bash
firebase deploy --only functions
```

---

## Reglas de seguridad Firebase

Las reglas de Firestore y Storage están en `firestore.rules` y `storage.rules`.

```bash
# Desplegar reglas
firebase deploy --only firestore:rules,storage:rules
```

---

## Arquitectura

```
app/
  (auth)/          Pantallas de login, registro, recuperar contraseña
  (admin)/         Panel de administración (dashboard, pedidos, menú, stand)
  (customer)/      App del cliente (menú, carrito, checkout, pedidos, perfil)

components/        Componentes reutilizables
contexts/          AuthContext, CartContext, StandContext
hooks/             useMenu, useOrders, useAdminOrders, useDashboardStats...
lib/               Configuración de Firebase y helpers de Firestore
functions/src/     Cloud Functions de Firebase
```

### Roles de usuario

- **customer** — acceso a la app del cliente
- **admin** — acceso al panel de administración. Se asigna manualmente en Firestore Console → `users/{uid}` → `role: "admin"`

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia la app conectada al emulador local |
| `npm run emulator` | Inicia el emulador (conserva datos) |
| `npm run emulator:clean` | Inicia el emulador (base de datos vacía) |
| `npm run web` | Inicia la app en el navegador (producción) |
| `npm run build:web` | Genera el build web en `dist/` |
| `npm run deploy:web` | Build + deploy a Vercel |
| `npm run build:preview` | Genera APK de prueba con EAS |
| `npm run build:prod` | Genera build de producción con EAS |
