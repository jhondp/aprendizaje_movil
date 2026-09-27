# Etapa 7 — Nativo y UX avanzada

Proyecto de cierre: la app de notas gana fotos adjuntas con la cámara, una animación con resorte al agregar una nota, FlashList para la lista, etiquetas de accesibilidad en todos los elementos interactivos y textos en español e inglés.

Todos los `Snack` de esta etapa fijan `sdkVersion="55.0.0"` (Expo SDK 55, React Native 0.83, New Architecture). Las dependencias usan las versiones que Expo SDK 55 declara en `bundledNativeModules.json`.

| Módulo | Archivo | Título | Min | Práctica |
| --- | --- | --- | --- | --- |
| Nativo | `00-permisos.mdx` | Permisos | 12 | `Snack` que pide ubicación con `expo-location`; `Checklist` de textos de permiso en `app.json` |
| Nativo | `01-camara.mdx` | Cámara | 15 | `Snack` con `CameraView` y `useCameraPermissions` de `expo-camera` |
| Nativo | `02-notificaciones.mdx` | Notificaciones | 15 | `Snack` que programa una notificación local con `expo-notifications`; flujo push en bloques de código |
| Movimiento | `03-reanimated.mdx` | Animaciones con Reanimated | 15 | `Snack` con `useSharedValue` y `withSpring` |
| Movimiento | `04-gestos.mdx` | Gestos | 15 | `Snack` con `Gesture.Pan` que arrastra una tarjeta |
| Movimiento | `05-flashlist.mdx` | Listas de alto rendimiento con FlashList | 12 | `Snack` con `@shopify/flash-list` v2 y `getItemType` |
| Inclusión | `06-accesibilidad.mdx` | Accesibilidad | 12 | `Snack` con `accessibilityLabel`, `accessibilityRole` y tamaños de fuente dinámicos; `Checklist` |
| Inclusión | `07-i18n.mdx` | Internacionalización | 12 | `Snack` con `expo-localization` e `i18n-js` que alterna es/en |
| Robustez | `08-deep-links.mdx` | Deep links y universal links | 12 | `Terminal` con `npx uri-scheme open`; `scheme` en `app.json`; `Snack` que interpreta URLs con `expo-linking` |
| Robustez | `09-offline-first.mdx` | Offline-first | 15 | `Snack` con `@react-native-community/netinfo` y una cola de mutaciones pendientes |
| Robustez | `10-performance.mdx` | Performance | 15 | `Snack` con una lista lenta corregida con `memo` y `useCallback`; `Checklist` de perfilado con React DevTools |
| Robustez | `11-proyecto-modulo-nativo.mdx` | Proyecto: módulo nativo en la app | 30 | `Checklist`: foto adjunta a una nota, lista animada, accesible, es/en |

Total: 180 minutos de lectura y práctica guiada, más el tiempo del proyecto.
