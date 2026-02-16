# Frontend: Arquitectura, diseño y sistema visual

Documento de referencia para **Check My Symptoms**: patrones de arquitectura, diseño, paletas de colores y convenciones del frontend (Expo / React Native).

---

## 1. Arquitectura del frontend

### 1.1 Enfoque: Clean Architecture (capas)

El frontend sigue una **Clean Architecture** adaptada a React Native, separando responsabilidades en capas:

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| **Domain** | `src/domain/` | Entidades, tipos y reglas de negocio puras (p. ej. `PainLevel`, `SymptomMaster`, `HealthLogEntry`). Sin dependencias de UI ni infraestructura. |
| **Use Cases** | `src/useCases/` | Casos de uso: crear síntoma, subir foto, obtener logs, compartir link, etc. Orquestan dominio e infraestructura. |
| **Infrastructure** | `src/infrastructure/` | Cliente Supabase, APIs externas, persistencia. |
| **Features** | `src/features/` | Módulos por funcionalidad: `auth`, `symptom-entry`, `health-dashboard`, `shared-view`. Agrupan UI + hooks + integración con use cases. |
| **Components** | `components/`, `src/components/` | Componentes reutilizables: `Themed`, `StyledText` (raíz) y `src/components/ui/` (Button, Card, Input, etc.). |
| **Contexts** | `src/contexts/` | Estado global de UI/UX (p. ej. `PrescriptionViewerProvider`). |
| **Hooks** | `src/hooks/` | Hooks personalizados para lógica reutilizable. |

La **navegación y pantallas** viven en `app/` (Expo Router): rutas, layouts y composición de pantallas, sin lógica de negocio pesada.

### 1.2 Estructura de carpetas relevante

```
app/                    # Rutas y layouts (Expo Router)
  (tabs)/               # Tabs: Inicio, Dashboard, etc.
  (auth)/               # Flujo de autenticación
  auth/                 # Login, callback OAuth
  log/                  # Detalle de log
  v/                    # Vista compartida (médico)
  _layout.tsx           # Root layout, QueryClient, providers

src/
  domain/               # Tipos y entidades
  useCases/             # Casos de uso
  infrastructure/       # Supabase, etc.
  features/             # Módulos por feature
  components/
    ui/                 # Button, Card, Input, PainSlider, etc.
  contexts/
  hooks/
  utils/

components/             # Themed, StyledText, useColorScheme (compat Expo)
constants/              # Colors.ts, SafeHarbor.ts
assets/                 # Fuentes, imágenes
```

### 1.3 Stack y librerías clave

- **Framework:** Expo (React Native) con **Expo Router** (file-based routing).
- **Estado servidor:** **TanStack Query (React Query)** con persistencia en AsyncStorage para soporte offline.
- **Navegación:** React Navigation (ThemeProvider con `DefaultTheme` / `DarkTheme`).
- **Gráficos:** Victory Native para el dashboard de signos vitales.
- **Animaciones:** React Native Reanimated.
- **Fuentes:** Expo Font (SpaceMono, FontAwesome).

---

## 2. Patrones de diseño

### 2.1 Strategy Pattern (dolor / emergencia)

La evaluación de **dolor extremo** (p. ej. nivel > 7) dispara una **estrategia de emergencia**:

- **Implementación:** componente `EmergencyAlert` (`src/components/ui/EmergencyAlert.tsx`).
- **Comportamiento:** mensaje claro “DOLOR EXTREMO”, recomendación de urgencias y botón “LLAMAR 911” con variante `alert`.
- La lógica de umbral debe residir en **backend** para no ser manipulable desde el cliente (ver `docs/stack-structure-design_pattern.md`).

### 2.2 Componentes temáticos (light/dark)

- **`Themed.tsx`:** componentes `Text` y `View` que usan `useThemeColor()` con `Colors.light` / `Colors.dark` según `useColorScheme()`.
- **Uso:** para pantallas que respetan el tema claro/oscuro del sistema (texto, fondo).
- **Navegación:** `ThemeProvider` de React Navigation usa `DefaultTheme` o `DarkTheme` según `colorScheme`.

### 2.3 Design tokens centralizados

- **Safe Harbor** (`constants/SafeHarbor.ts`): única fuente de verdad para colores semánticos, espaciado y radios. Todos los componentes UI importan `SafeHarbor` y evitan valores mágicos.
- **Colors** (`constants/Colors.ts`): tema global (text, background, tint, tab icons) para modo claro/oscuro.

---

## 3. Sistema de diseño: Safe Harbor

Sistema de diseño **“Clean & Clinical con calidez humana”**, orientado a salud y accesibilidad (WCAG AAA donde aplica).

### 3.1 Paleta de colores

| Token | Hex | Uso |
|-------|-----|-----|
| `primary` | `#0F52BA` | Sapphire Blue – acciones principales, confianza, autoridad |
| `secondary` | `#10B981` | Emerald Green – salud, éxito, confirmaciones |
| `alert` | `#E11D48` | Rose Red – urgencia, dolor, errores, emergencia |
| `background` | `#F8FAFC` | Ghost White – fondos de pantalla |
| `text` | `#1E293B` | Slate – texto principal |
| `border` | `#CBD5E1` | Gris suave – bordes, placeholders |
| `commentBg` | `#F1F5F9` | Fondo de comentarios del médico |
| `white` | `#FFFFFF` | Fondos de cards, inputs |

### 3.2 Colores por nivel de dolor

Para sliders y feedback visual del dolor:

| Rango | Token | Hex | Uso |
|-------|--------|-----|-----|
| 0–3 | `painLevelColors.calm` | `#10B981` | Sin alerta |
| 4–7 | `painLevelColors.attention` | `#EAB308` | Atención (ocre) |
| 8–10 | `painLevelColors.alert` | `#E11D48` | Alerta / emergencia (umbral urgencia ≥8, C03) |

### 3.3 Espaciado y tamaños mínimos

| Token | Valor | Uso |
|-------|--------|-----|
| `spacing.cardRadius` | `12` | Border radius de cards, botones, inputs |
| `spacing.minTapTarget` | `44` | Altura/ancho mínimo de áreas táctiles (accesibilidad) |

Los componentes `Button` e `Input` usan `minTapTarget` para cumplir con objetivos de toque accesibles.

---

## 4. Tema global (light/dark)

Definido en **`constants/Colors.ts`** y usado por `Themed.tsx` y por la navegación:

- **Light:** texto `#000`, fondo `#fff`, tint `#2f95dc`, iconos de tab en gris/azul.
- **Dark:** texto `#fff`, fondo `#000`, tint `#fff`, iconos de tab en gris/blanco.

Los componentes de **Safe Harbor** usan colores semánticos fijos (no cambian con el tema) para mantener consistencia clínica; el tema light/dark aplica sobre todo a fondos de pantalla, texto genérico e iconografía de navegación.

---

## 5. Tipografía

- **Cuerpo y UI:** por defecto se usa la fuente del sistema; tamaños recurrentes: 12, 14, 16, 18 px; pesos 500, 600, 700 para labels, botones y títulos.
- **Mono / código:** **SpaceMono** (cargada en `_layout.tsx` desde `assets/fonts/`), expuesta como `MonoText` en `StyledText.tsx`.
- **Iconos:** **FontAwesome** (Expo Vector Icons).

Conviene documentar en este mismo doc o en un anexo cualquier fuente adicional que se incorpore (p. ej. títulos o display).

---

## 6. Componentes UI (src/components/ui)

| Componente | Descripción | Variantes / props relevantes |
|------------|-------------|-----------------------------|
| **Button** | Botón accesible (min tap 44). | `variant`: `primary`, `secondary`, `alert`, `outline`; `fullWidth`, `disabled` |
| **Card** | Contenedor con fondo blanco y `cardRadius`. | Children + `style` |
| **Input** | Campo de texto con label y mensaje de error. | `label`, `error`; estilos con `SafeHarbor` |
| **PainSlider** | Slider para nivel de dolor (0–10). | C03: 8–10 = alert; `painLevelColors` |
| **SymptomDropdown** | Select con búsqueda y opción “creatable”. | Síntomas desde maestro |
| **EmergencyAlert** | Bloque de emergencia (Strategy). | Botón “LLAMAR 911”, estilo `alert` |
| **SkeletonLog** | Placeholder de carga para listado de logs. | UX de carga (MVP Fase 2) |
| **StyledText** | Texto con variantes tipográficas. | `variant`: h2, h3, h4, body, caption |
| **Badge** | Etiqueta por tipo (ej. record_type). | `label`, `color` |
| **Tag** | Chip para etiquetas (ej. #Medicacion). | `label` |

**Button** admite además variante `ghost`. Todos consumen **Safe Harbor** para colores y espaciado; los que representan acciones usan las variantes de `Button` cuando aplica.

---

## 7. Navegación y layout

- **Expo Router:** rutas en `app/`; Stack principal en `_layout.tsx` con `headerShown: false` y pantallas: index, (auth), auth, (tabs), v, log, prescription-viewer, modal.
- **Tabs:** Inicio, Dashboard y demás definidos en `app/(tabs)/_layout.tsx`.
- **Modales:** `prescription-viewer` y `modal` con `presentation: 'modal'`.
- **Tema de navegación:** `ThemeProvider` con `DefaultTheme` o `DarkTheme` según `useColorScheme()`.

---

## 8. Estado y datos

- **Servidor y caché:** TanStack Query con `QueryClient` en root; persistencia con `createAsyncStoragePersister` (clave `CHECK_MY_SINTOMS_QUERY_CACHE`) para experiencia offline-first.
- **Contextos:** p. ej. `PrescriptionViewerProvider` para estado del visor de recetas.
- Las pantallas y features llaman a **use cases** (y/o hooks que encapsulan use cases); la infraestructura (Supabase) se usa desde `src/infrastructure/`.

---

## 9. Accesibilidad y UX

- **Áreas táctiles:** mínimo 44 px (Safe Harbor `minTapTarget`) en botones e inputs.
- **Contraste:** paleta Safe Harbor pensada para buen contraste (WCAG AAA donde se aplica).
- **Offline:** persistencia de React Query para seguir mostrando datos sin red y sincronizar al recuperar conexión.
- **Carga:** Skeleton screens en listados de logs para percibida rapidez y profesionalidad.
- **Errores y urgencia:** color `alert` y componente `EmergencyAlert` para dolor extremo y acciones críticas.

---

## 10. Resumen de referencias rápidas

- **Colores y espaciado del producto:** `@/constants/SafeHarbor`
- **Tema light/dark (global):** `@/constants/Colors` + `useThemeColor` en `@/components/Themed`
- **Componentes base:** `@/src/components/ui/*` y `@/components/Themed`, `StyledText`
- **Arquitectura:** dominio y tipos en `src/domain`, casos de uso en `src/useCases`, features en `src/features`, infra en `src/infrastructure`
- **Evolución clínica:** `SymptomTrendChart` (dashboard), `ClinicalRecordItem` y feed en vista compartida, `AddClinicalRecordModal` (modal nueva nota con tags predefinidos S01 y optimistic updates S02). Vista médico: `app/v/[log_id]?access_token=...`; hooks `usePatientAnalytics`, `useClinicalHistory`, `useCorrelatedData` (C02: token para médico sin sesión).

Al añadir nuevas pantallas o componentes, reutilizar Safe Harbor y los componentes de `src/components/ui` para mantener coherencia visual y de arquitectura en todo el frontend.
