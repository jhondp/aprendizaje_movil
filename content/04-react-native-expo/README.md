# Etapa 4 — React Native + Expo

Da el salto de React en el navegador a apps móviles reales: cómo funciona React Native por dentro, cómo crear y ejecutar un proyecto con Expo, los componentes core, los estilos con Flexbox y la navegación con Expo Router. Cierra con una app de notas local que la etapa 5 conectará a persistencia.

Todos los `Snack` de la etapa fijan `sdkVersion="55.0.0"`, un SDK estable que Expo Snack soporta, para que los ejemplos no cambien de comportamiento con cada versión nueva. Los proyectos locales se crean con `npx create-expo-app@latest`, que usa el SDK estable más reciente (SDK 57 al momento de escribir esta etapa); los conceptos de la etapa son los mismos en ambas versiones.

## Módulos

### Cómo funciona React Native

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `00-como-funciona-react-native.mdx` | Cómo funciona React Native | 15 | `Snack`: app mínima que detecta Hermes; `Quiz` sobre JSI, Fabric, Hermes y la New Architecture |
| `01-crear-proyecto-con-expo.mdx` | Crear un proyecto con Expo | 15 | `Terminal`: `npx create-expo-app@latest`, `npx expo start`; `Checklist` de Expo Go en el teléfono |
| `02-expo-go-y-dev-client.mdx` | Expo Go y development builds | 12 | `Terminal`: `npx expo install expo-dev-client`, `npx expo run:ios`; `Checklist` de cuándo usar cada uno |

### Componentes core

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `03-view-text-image.mdx` | View, Text e Image | 12 | `Snack`: tarjeta de perfil |
| `04-scrollview-y-flatlist.mdx` | ScrollView y FlatList | 15 | `Snack`: lista de 50 notas con `keyExtractor` y `renderItem` |
| `05-pressable-y-textinput.mdx` | Pressable y TextInput | 12 | `Snack`: campo para agregar notas con botón |

### Estilos

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `06-stylesheet-y-flexbox.mdx` | StyleSheet y Flexbox | 15 | `Snack`: playground de `flexDirection`, `justifyContent` y `alignItems` |
| `07-dimensiones-y-safearea.mdx` | Dimensiones y SafeArea | 12 | `Snack`: `useWindowDimensions` y `SafeAreaView` de `react-native-safe-area-context` |
| `08-imagenes-fuentes-iconos.mdx` | Imágenes, fuentes e íconos | 12 | `Snack` con `expo-image`, `@expo/vector-icons` y `expo-font` |

### Navegación

| Archivo | Título | Minutos | Práctica |
| --- | --- | --- | --- |
| `09-expo-router-basico.mdx` | Expo Router: rutas por archivos | 15 | `Terminal` que crea `src/app/index.tsx` y `src/app/note/[id].tsx`; `Snack` con dos pantallas |
| `10-tabs-stack-y-plataformas.mdx` | Tabs, Stack y diferencias iOS/Android | 15 | `Snack`: barra de tabs y `Platform.select` para estilos por plataforma |
| `11-proyecto-app-de-notas.mdx` | Proyecto: app de notas local | 30 | `Snack` con lista, detalle, crear y editar; `Checklist` de requisitos |

## Proyecto de cierre

App de notas con Expo Router: pantalla de lista, pantalla de detalle con ruta dinámica, crear y editar notas, estado en un provider de nivel superior, estilos con `StyleSheet` y áreas seguras resueltas. Sin persistencia todavía: eso llega en la etapa 5.
