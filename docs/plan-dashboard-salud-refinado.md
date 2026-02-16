# Plan Dashboard de Salud – Refinado con criterio del analista

Este documento incorpora las sugerencias del analista que se consideran **válidas, implementables y que mejoran la experiencia**. Las que requieren cuidado se indican con criterio de implementación. Ninguna sugerencia se ha considerado estrictamente contraproducente.

---

## Fase 1: Adaptador de datos y hook con range

### Tarea 1.1: Hook useHealthAnalytics con soporte de range

- **Query keys (incorporado):** Incluir siempre el `range` en las query keys de TanStack Query, por ejemplo: `['health-analytics', range]`. Así, al cambiar de "7d" a "30d" no se muestran datos cacheados del rango anterior mientras carga la nueva petición.
- **Estado "Sin datos" (incorporado con criterio):** No limitarse a un mensaje de texto. Mantener la estructura visual del dashboard:
  - Mostrar el mismo **ChartCard** (título + contenedor) para que el layout no salte.
  - **Criterio de implementación:** No pasar nunca un array vacío a Victory (evita errores de cálculo de dominio). Opciones:
    - Si la librería lo permite sin errores: usar un dataset mínimo (ej. dos puntos con valor 0) para dibujar ejes y una línea a 0 o transparente, manteniendo ejes visibles.
    - Si Victory Native falla con datos mínimos o no hay forma segura: mostrar dentro del ChartCard solo el mensaje "Sin datos en este periodo" y no instanciar el gráfico. La estructura visual se mantiene por el Card + título.

---

## Fase 2: Componentes de alerta y feedback

### Tarea 2.1: AnomalyAlert

- **Dismissible (incorporado):** El componente debe ser cerrable por el usuario (botón X o gesto) una vez leído, para no ocupar espacio de forma permanente. Guardar estado de "cerrado" en estado local del componente o en el padre (no es necesario persistir en backend).

### Tarea 2.2: Feedback de MAP en la carga de signos

- Mantener como está: mostrar el MAP devuelto por process-health-log en **SymptomEntryScreen** como feedback pedagógico (el paciente entiende que no son solo dos números aislados sino un indicador cardiovascular global).

---

## Fase 3: Gráficos (Safe-Zone)

### Tarea 3.1: Gráfico de Presión + MAP

- **Leyenda (incorporado):** Añadir leyenda que identifique las tres líneas: Sistólica, Diastólica, MAP. Obligatorio para lectura clara.
- **MAP con trazo discontinuo (incorporado):** En victory-native usar `strokeDasharray: [4, 4]` (o el equivalente en la API de Line) para la línea de MAP, diferenciándola de las líneas sólidas de Sistólica y Diastólica sin abusar del color.

### Tarea 3.2: Gráfico de frecuencia de síntomas (unflattened)

- **Nombres largos (incorporado):** Truncar nombres de síntomas en el eje (ej. "Dificultad para..." → "Dificultad...") con ellipsis. Definir longitud máxima (ej. 18–22 caracteres) según espacio disponible.
- **Padding del eje Y:** Si hay muchos nombres largos, considerar padding izquierdo mayor a 80–100 px (o usar truncado más agresivo) para evitar que el texto se salga.
- **Caché de nombres (incorporado):** Cargar el mapeo **symptoms_master** (id → nombre) de forma previa y usarlo al formatear los ticks del eje. Nunca mostrar "ID: 123" en el gráfico; siempre el nombre del síntoma (o el truncado del nombre).

---

## Fase 4: Layout y selector de rango

### Tarea 4.1: Responsive grid

- **60/40 en desktop (incorporado):** Dejar explícito el criterio: el gráfico de **Presión** (tendencia temporal) ocupa ~60% del ancho para que los puntos se vean con claridad; el de **Frecuencia de síntomas** (barras horizontales) funciona bien en ~40%.

### Tarea 4.2: Selector de rango

- **Ubicación (incorporado):** Colocar el selector **[ 7D ] [ 30D ] [ 90D ]** en la **parte superior derecha del header del outlet**, como lugar estándar para filtros temporales.

---

## Mejoras opcionales / fase posterior

- **Tooltips sincronizados:** Si el usuario toca un punto en el gráfico de Presión, resaltar el mismo día en el gráfico de Pulso/O2 (estado compartido de "día seleccionado" o equivalente en victory-native). Añadir cuando la base del dashboard esté estable y la librería lo permita; no bloquear el MVP por esto.

---

## Resumen: qué se actualizó y por qué

| Sugerencia | Decisión | Motivo |
|------------|----------|--------|
| Query keys con `range` | Incorporada | Evita datos viejos al cambiar de rango; buena práctica TanStack Query. |
| Estado vacío con ejes visibles | Incorporada con criterio | Mejora estructura visual; se implementa solo si no se pasa array vacío a Victory (ver Fase 1). |
| AnomalyAlert dismissible | Incorporada | Mejora UX y no ocupa espacio de forma permanente. |
| Leyenda Presión + MAP | Incorporada | Necesaria con tres líneas para lectura clara. |
| MAP con strokeDasharray [4,4] | Incorporada | Diferenciación visual sin saturar de color. |
| Truncar nombres + padding/caché síntomas | Incorporadas | Evita desbordes y "ID" en ejes; caché evita parpadeos y peticiones extra. |
| 60/40 y selector arriba-derecha | Incorporadas | Mejoran prioridad visual y descubribilidad del filtro. |
| Tooltips sincronizados | Fase posterior | Mejora UX pero añade complejidad; no bloqueante para MVP. |

Ninguna sugerencia se ha considerado **contraproducente**. La única que requiere cuidado explícito es el estado vacío (no pasar array vacío a Victory); el resto son mejoras directas de implementación y UX.
