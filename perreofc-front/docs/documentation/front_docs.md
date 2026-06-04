<!--
Project documentation for the frontend area: front docs.
It records setup, architecture or feature notes for app development.
-->

# Solo en desarrollo — contraseña de las cuentas dev del RoleSwitcher
EXPO_DEV_PASSWORD=contraseña_dev_aqui
```

`EXPO_PUBLIC_*` se inyectan en el bundle en compilación y son accesibles en cliente.  
`EXPO_DEV_*` (sin `PUBLIC`) solo están disponibles en Metro durante desarrollo, **nunca** en el bundle de producción.

### Fichero `.env.example`

```bash
# Descomentar la URL que corresponda al entorno
#EXPO_PUBLIC_API_URL=http://192.168.1.x:3000/api/v1
```

> Las IPs concretas de los desarrolladores no deben figurar en el `.env.example`.

### `src/config.ts`

Constantes de configuración de la app que no son secretos pero tampoco pertenecen a ningún módulo concreto:

```typescript
export const PERREOFC_TEAM_ID     = '24141910'; // string — para llamadas a la API
export const PERREOFC_TEAM_ID_NUM = 24141910;   // number — para comparar con Match.homeTeamId
```

### Configuración de Expo (`app.json`)

| Campo | Valor |
|---|---|
| Bundle ID (iOS) | `com.perreofc.app` |
| Package (Android) | `com.perreofc.app` |
| Scheme de deep link | `perreofc` |
| EAS Project ID | `fb5b75a1-45a5-4c84-8675-e6762bb63c26` |
| New Architecture | Habilitada |
| Fuentes | BebasNeue-Regular, Inter (4 pesos) |

---

## 7. Seguridad móvil

### Almacenamiento de tokens

Los tokens JWT (`userToken`, `refreshToken`) se almacenan en **`expo-secure-store`**, que usa el **iOS Keychain** y el **Android Keystore** (cifrado a nivel de hardware). En web se usa AsyncStorage como fallback aceptable (sin Keychain en navegador).

La abstracción está en [src/utils/secureStorage.ts](../../src/utils/secureStorage.ts):

```typescript
// SecureStore en nativo, AsyncStorage en web
const useSecure = Platform.OS !== 'web';
```

El objeto `User` de sesión (`@perreofc:session`) se guarda en AsyncStorage porque:
1. Puede superar el límite de 2 KB de SecureStore.
2. No es un dato de acceso directo a la API (no es un token).

### Herramienta de desarrollo `RoleSwitcher`

Solo se renderiza en `__DEV__`. La contraseña de las cuentas dev se lee de la variable de entorno `EXPO_DEV_PASSWORD` (no `EXPO_PUBLIC_`, por lo que nunca se incluye en el bundle de producción). El archivo `.env` con esta variable no debe estar en git.

### Red

- La URL de la API en producción debe ser **HTTPS**.
- No hay certificate pinning implementado.
- No hay retries automáticos en `fetchClient`. Cada pantalla decide si reintenta.

### Autenticación y sesiones

- **JWT + Refresh Token**: access token de vida corta, refresh token para renovación automática transparente.
- **Logout limpio**: `useAuthStore.logout()` borra SecureStore + AsyncStorage + memoria antes de redirigir.
- **rememberMe**: si es `false`, los tokens solo viven en memoria y se pierden al cerrar la app.
- **Refresco con cola**: si varias peticiones fallan por token expirado simultáneamente, solo se hace una llamada al endpoint de refresco; el resto espera en cola.

### Logging

No se registran tokens ni PII en logs. Los errores de red se capturan silenciosamente en operaciones no críticas.

### Permisos de la app

| Permiso | Cuándo | Por qué |
|---|---|---|
| Notificaciones push | Al autenticarse | Notificaciones del club |
| Galería | Al pulsar "Seleccionar imagen" | Subir avatar o fotos |
| Cámara | Desde `ImagePickerSheet` | Tomar foto directa |

Los permisos se solicitan de forma contextual, no al instalar.

---

## 8. Rendimiento

### Carga inicial

1. `SplashScreen.preventAutoHideAsync()` se llama antes de renderizar ningún componente.
2. Fuentes y `rehydrate()` se cargan en paralelo.
3. El splash se oculta solo cuando `fontsLoaded && !isAuthLoading`, evitando flashes.

### Imágenes

- Pantallas de Equipo y Staff usan `expo-image` (caché memoria + disco, `cachePolicy="memory-disk"`, transiciones).
- Noticias y Calendario usan `<Image>` de React Native (sin caché automática).

### Listas y renders

- `useMemo` para `markedDates`, `visibleEvents`, `dayEvents`, `dayMatches` en `CalendarioScreen`.
- `useCallback` para handlers de eventos.
- Las listas de jugadores y noticias usan `ScrollView` con `flexWrap`. Para listas grandes (>100 ítems) puede haber lag al renderizar todos a la vez.

### Animaciones

- `moti` para animaciones de entrada (fade + translateY) con `useNativeDriver`.
- `Animated.loop` para el indicador de "typing" del chatbot.

---

## 9. Accesibilidad

La app no tiene implementación explícita de accesibilidad (`accessibilityLabel`, `accessibilityHint`, `accessibilityRole`). Los `TouchableOpacity` son detectables por VoiceOver/TalkBack pero sin etiquetas descriptivas.

Áreas prioritarias para una futura mejora:
1. Botones de acción crítica (logout, borrar cuenta, login).
2. Badges de notificaciones.
3. Cambio de tema.

---

## 10. Testing

El proyecto no tiene cobertura de tests sobre la lógica de negocio.

### Qué testear por prioridad

**P0:** `fetchClient` (refresh, cola, logout), `useAuthStore`, validaciones Zod.  
**P1:** `useChat`, `useEventsStore`, `useRole`.  
**P2:** Componentes UI críticos, pantallas de auth con RNTL.

### Configuración recomendada

```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
};
```

---

## 11. Build y ejecución

### Requisitos

- Node.js >= 18
- Para iOS: Xcode 15+ en macOS
- Para Android: Android Studio con SDK 34+

### Instalación

```bash
cd perreofc-front
npm install
cp .env.example .env
# Editar .env: ajustar EXPO_PUBLIC_API_URL con la IP/dominio del backend
```

### Desarrollo

```bash
npm start        # Servidor Metro + QR
npm run android  # Abre en emulador/dispositivo Android
npm run ios      # Abre en simulador/dispositivo iOS (solo macOS)
npm run web      # Abre en navegador
```

### Variables de entorno para el RoleSwitcher (DEV)

```bash
# En .env (no hacer commit)
EXPO_DEV_PASSWORD=contraseña_de_las_cuentas_dev
```

Reiniciar Metro con `npm start --clear` tras modificar `.env`.

### Build de producción (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
eas build --platform ios     --profile production
```

---

## 12. Deploy

### EAS Build

El proyecto está configurado con EAS. Project ID: `fb5b75a1-45a5-4c84-8675-e6762bb63c26`.

**Actualizaciones OTA** (sin pasar por las stores):

```bash
eas update --branch production --message "descripción del cambio"
```

### Publicación en stores

- **Android**: subir el AAB generado a Google Play Console (o `eas submit --platform android`).
- **iOS**: subir el IPA a App Store Connect (o `eas submit --platform ios`).

---

## 13. Decisiones de diseño y deuda técnica

### Decisiones de diseño

**Expo Router (file-based routing)**  
Elegido sobre React Navigation puro por el enrutamiento basado en ficheros, tipado de rutas y la integración nativa con Expo.

**Zustand sobre Redux/Context**  
Más ligero, sin Provider, y accesible fuera de componentes (`useAuthStore.getState()`) — necesario en `fetchClient` para el logout forzado.

**NativeWind + theme manual**  
NativeWind para utilidades rápidas; el sistema de temas (colores, tipografía) se gestiona con `ThemeContext` para control preciso sobre light/dark y los colores de marca.

**Dos capas de API**  
`src/services/api.ts` es una fachada de compatibilidad anterior a la modularización de `src/services/api/modules/`. Permite que pantallas antiguas sigan funcionando.

**Polling en lugar de WebSocket**  
Para un TFG, la complejidad de WebSockets no está justificada. Polling cada 30-60 segundos es suficiente.

**rememberMe con doble capa (memoria + SecureStore)**  
La memoria permite acceso rápido a tokens sin lecturas async en cada petición. SecureStore garantiza persistencia cifrada.

### Deuda técnica

| ID | Descripción | Prioridad |
|---|---|---|
| DT-01 | Dos capas de API coexistiendo: `api.ts` (fachada) + `api/index.ts` (módulos) | P1 |
| DT-02 | Tipos duplicados entre `src/types/index.ts` y `src/services/api/types.ts` | P1 |
| DT-03 | `NoticiasScreen` de ~880 líneas con subcomponentes definidos inline | P2 |
| DT-04 | Mezcla de `expo-image` y `<Image>` de RN según pantalla | P2 |
| DT-05 | `ScrollView` + `flexWrap` en lugar de `FlatList` para listas largas | P2 |
| DT-06 | Sin cobertura de tests | P2 |

---

## 14. Guía rápida para nuevos devs

### Arrancar el proyecto

```bash
git clone <repo>
cd perreofc-front
npm install
cp .env.example .env
# Editar .env con la IP del backend y EXPO_DEV_PASSWORD
npm start
```

### Estructura de navegación

Expo Router usa el sistema de ficheros. Todo en `app/` es una ruta:
- `app/(auth)/login.tsx` → pantalla de login (sin tab bar)
- `app/(main)/calendario/index.tsx` → Tab "Calendario"
- `app/profile/index.tsx` → Pantalla de perfil

Los `_layout.tsx` definen el layout del grupo. El más importante es `app/(main)/_layout.tsx` (tab bar + guards).

### Estado global

```typescript
// Cuatro stores:
useAuthStore         // usuario logado, login/logout/rehydrate
useEventsStore       // eventos del calendario
useNotificationsStore // contador de no leídas
useThemeStore        // tema light/dark
```

### Llamadas a la API

```typescript
// Forma 1 — fachada legacy (normaliza respuestas)
import { api } from '../../../src/services/api';
const players = await api.getPlayers(TEAM_ID);

// Forma 2 — módulos directos (funciones nuevas)
import { api } from '../../../src/services/api/index';
const profile = await api.me.getMe();
```

Usa la forma 1 cuando la función exista en la fachada. Para funciones nuevas no incluidas, usa la forma 2.

### Permisos por rol

```typescript
const { isAdmin, canEdit, hasPoints, isAficionado, hasSquadAccess } = useRole();

{canEdit && <FABButton onPress={crearEvento} />}
{hasPoints && <PuntosDisplay points={user.points} />}
```

### Añadir un nuevo módulo de API

1. Crear `src/services/api/modules/miModulo.ts`:
```typescript
import { fetchClient } from '../apiClient';
export const miModuloApi = {
  getItem: (id: string) => fetchClient<MyType>(`/mi-endpoint/${id}`),
};
```

2. Añadir en `src/services/api/index.ts`:
```typescript
import { miModuloApi } from './modules/miModulo';
export const api = { ...existingModules, miModulo: miModuloApi };
```

### Sistema de temas

```typescript
const { colors, isDark, toggle } = useTheme();
// colors.bg · colors.text · colors.accent · colors.border · colors.card
// El acento es siempre naranja (#FE6128) en light y dark.
```

### Subir imágenes

```typescript
const { upload, isLoading } = useImageUpload();
const url = await upload(image, { kind: 'player', id: playerId });
```

### RoleSwitcher (DEV)

Pulsa el botón "DEV" en la esquina inferior izquierda (solo en modo `__DEV__`) para cambiar entre los cuatro roles sin hacer logout. Requiere `EXPO_DEV_PASSWORD` definida en `.env`.

### Convenciones

- Archivos: `camelCase.tsx` para componentes, `camelCase.ts` para lógica.
- Componentes: `PascalCase`.
- Estilos: objetos inline con `colors.*` y `typography.*`. Sin hexadecimales hardcodeados salvo en los archivos de tema.
- Comentarios: en español (España), técnicos y concisos.
- Validación: siempre Zod + React Hook Form, nunca validación manual en `onChange`.

---

*Documentación del repositorio `perreofc-front` — Perreo FC v1.0.0*
