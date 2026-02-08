# API Backend – Check My Symptoms (para Frontend)

Base URL de las Edge Functions:  
`https://{PROJECT_REF}.supabase.co/functions/v1`  
(Sustituir `{PROJECT_REF}` por el Reference ID del proyecto en Supabase → Settings → General.)

En la app con `@supabase/supabase-js` se puede usar:  
`supabase.functions.invoke('nombre-funcion', { body: {...} })` — el cliente añade la base URL y, si hay sesión, el header `Authorization`.

---

## 1. process-health-log

**Validar signos vitales antes de guardar el síntoma.** Devuelve si hay urgencia (dolor ≥ 8 o saturación < 90). No escribe en base de datos.

| Dato | Valor |
|------|--------|
| **Método** | `POST` |
| **URL** | `/functions/v1/process-health-log` |
| **Authorization** | Opcional. Recomendado enviar Bearer JWT si el usuario está logueado (el SDK de Supabase lo envía al usar `supabase.functions.invoke`). |
| **Headers** | `Content-Type: application/json` |
| **Body** | JSON (todos los campos opcionales) |

### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| symptom_id | string (UUID) | No | ID del síntoma en `symptoms_master` |
| pain_level | number (0–10) | No | Nivel de dolor |
| context | string | No | Contexto del malestar |
| blood_pressure | string | No | Ej. "120/80" |
| heart_rate | number | No | Frecuencia cardíaca |
| oxygen_saturation | number (0–100) | No | Saturación de oxígeno |

### Respuesta esperada

**200 OK** – Siempre devuelve JSON con al menos `emergency`.

**Ejemplo 1 – Sin urgencia**
```json
{
  "emergency": false,
  "reason": null,
  "message": null
}
```

**Ejemplo 2 – Urgencia (dolor alto)**
```json
{
  "emergency": true,
  "reason": "pain_level_high",
  "message": "Los signos indican posible urgencia. Considera contactar emergencias."
}
```

**Ejemplo 3 – Urgencia (saturación baja)**
```json
{
  "emergency": true,
  "reason": "oxygen_low",
  "message": "Los signos indican posible urgencia. Considera contactar emergencias."
}
```

**Otros códigos:** 400 (body inválido), 405 (método no permitido). En error suele devolverse `{ "error": "...", "detail": "..." }`.

---

## 2. shared-log (GET)

**Obtener un síntoma (log) y sus comentarios.** Para la vista compartida que abre el médico con el link. No requiere login.

| Dato | Valor |
|------|--------|
| **Método** | `GET` |
| **URL** | `/functions/v1/shared-log?id={log_id}` o `?log_id={log_id}` |
| **Authorization** | No |
| **Headers** | Ninguno obligatorio |
| **Query** | `id` **o** `log_id` (UUID del `health_log`) |

### Respuesta esperada

**200 OK**

**Ejemplo 1 – Log con comentarios**
```json
{
  "log": {
    "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
    "patient_id": "b2c3d4e5-f6a7-8901-bcde-222222222222",
    "symptom_id": "c3d4e5f6-a7b8-9012-cdef-333333333333",
    "pain_level": 5,
    "context": "Dolor desde ayer por la tarde",
    "blood_pressure": "120/80",
    "heart_rate": 72,
    "oxygen_saturation": 98,
    "image_path": "patient-uuid/log-uuid/foto.jpg",
    "created_at": "2025-02-08T14:30:00.000Z",
    "symptom_name": "Dolor de cabeza"
  },
  "comments": [
    {
      "id": "d4e5f6a7-b8c9-0123-def0-444444444444",
      "author_name": "Dr. García",
      "content": "Tomar paracetamol 500mg cada 8 horas.",
      "attachment_path": "log-uuid/comment-uuid/receta.pdf",
      "created_at": "2025-02-08T16:00:00.000Z"
    }
  ]
}
```

**Ejemplo 2 – Log sin comentarios**
```json
{
  "log": {
    "id": "a1b2c3d4-e5f6-7890-abcd-111111111111",
    "patient_id": "b2c3d4e5-f6a7-8901-bcde-222222222222",
    "symptom_id": "c3d4e5f6-a7b8-9012-cdef-333333333333",
    "pain_level": 3,
    "context": null,
    "blood_pressure": null,
    "heart_rate": null,
    "oxygen_saturation": null,
    "image_path": null,
    "created_at": "2025-02-08T12:00:00.000Z",
    "symptom_name": "Fiebre"
  },
  "comments": []
}
```

**400** – Falta `id` o `log_id`. **404** – Log no encontrado. Cuerpo típico: `{ "error": "...", "detail": "..." }`.

---

## 3. shared-log (POST)

**Crear un comentario sobre un síntoma.** Vista compartida (médico). No requiere login.

| Dato | Valor |
|------|--------|
| **Método** | `POST` |
| **URL** | `/functions/v1/shared-log` (opcionalmente `?id={log_id}` o `?log_id={log_id}`) |
| **Authorization** | No |
| **Headers** | `Content-Type: application/json` |
| **Body** | JSON. `log_id` puede ir en body o en query. |

### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| log_id | string (UUID) | Sí* | *Si no se envía en query. |
| author_name | string | No | Nombre del médico/autor |
| content | string | Sí | Texto del comentario |

### Respuesta esperada

**201 Created**

**Ejemplo 1 – Comentario sin adjunto**
```json
{
  "comment": {
    "id": "e5f6a7b8-c9d0-1234-ef01-555555555555",
    "author_name": "Dr. García",
    "content": "Reposo y líquidos. Controlar temperatura.",
    "attachment_path": null,
    "created_at": "2025-02-08T17:00:00.000Z"
  }
}
```

**Ejemplo 2 – Comentario (el adjunto se añade con upload-prescription)**
```json
{
  "comment": {
    "id": "e5f6a7b8-c9d0-1234-ef01-555555555555",
    "author_name": "Dr. López",
    "content": "Ver receta adjunta.",
    "attachment_path": null,
    "created_at": "2025-02-08T17:30:00.000Z"
  }
}
```

**400** – Falta `log_id` o `content`. **404** – Log no encontrado. **500** – Error al crear. Cuerpo: `{ "error": "...", "detail": "..." }`.

---

## 4. prescription-signed-url (GET o POST)

**Obtener una URL temporal (24 h) para ver/descargar un archivo de prescripción.** Solo para el paciente dueño del síntoma. Requiere JWT.

| Dato | Valor |
|------|--------|
| **Método** | `GET` o `POST` |
| **URL** | `/functions/v1/prescription-signed-url` |
| **Authorization** | **Requerido.** `Authorization: Bearer {access_token}` (JWT de Supabase Auth, p. ej. `session.session.access_token`). |
| **Headers** | Para POST: `Content-Type: application/json` |
| **GET** | Query: `log_id` (obligatorio), y `comment_id` **o** `attachment_path` para identificar el archivo. |
| **POST** | Body JSON: `log_id` (obligatorio), y `comment_id` o `attachment_path`. |

### GET – Query params

| Parámetro | Requerido | Descripción |
|-----------|-----------|-------------|
| log_id | Sí | UUID del `health_log` |
| comment_id | No* | *Requerido si no se envía attachment_path. UUID del comentario que tiene el adjunto. |
| attachment_path | No* | *Path del archivo en el bucket (ej. "log-uuid/comment-uuid/receta.pdf"). Alternativa a comment_id. |

### POST – Body (JSON)

```json
{
  "log_id": "uuid-del-health_log",
  "comment_id": "uuid-del-comment"
}
```

o

```json
{
  "log_id": "uuid-del-health_log",
  "attachment_path": "log-uuid/comment-uuid/receta.pdf"
}
```

### Respuesta esperada

**200 OK**

**Ejemplo 1**
```json
{
  "url": "https://xxx.supabase.co/storage/v1/object/sign/prescriptions/log-uuid/comment-uuid/receta.pdf?token=...",
  "expiresIn": 86400
}
```

**Ejemplo 2** (mismo formato)
```json
{
  "url": "https://xxx.supabase.co/storage/v1/object/sign/prescriptions/abc/def/receta.pdf?token=xyz",
  "expiresIn": 86400
}
```

`expiresIn` está en segundos (86400 = 24 h). El frontend puede abrir `url` en WebBrowser o en un visor de PDF.

**400** – Falta `log_id` o no se puede resolver el path. **401** – Falta o JWT inválido. **403** – El usuario no es el paciente del log. **404** – Log/comentario no encontrado o sin adjunto. **500** – Error al generar la URL. Cuerpo de error: `{ "error": "...", "detail": "..." }`.

---

## 5. upload-prescription (POST)

**Crear comentario y opcionalmente adjuntar un archivo (PDF/imagen) de prescripción.** Vista compartida (médico). No requiere login.

| Dato | Valor |
|------|--------|
| **Método** | `POST` |
| **URL** | `/functions/v1/upload-prescription` |
| **Authorization** | No |
| **Headers** | No fijar `Content-Type`; el navegador lo pone con el boundary en `multipart/form-data`. |
| **Body** | `multipart/form-data` |

### Body (form-data)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| log_id | string | Sí | UUID del `health_log` |
| content | string | Sí | Texto del comentario |
| author_name | string | No | Nombre del médico/autor |
| file | file | No | Archivo (PDF o imagen) de la prescripción |

### Respuesta esperada

**201 Created**

**Ejemplo 1 – Solo texto (sin archivo)**
```json
{
  "comment": {
    "id": "f6a7b8c9-d0e1-2345-f012-666666666666",
    "author_name": "Dr. Martínez",
    "content": "Seguir tratamiento indicado.",
    "attachment_path": null,
    "created_at": "2025-02-08T18:00:00.000Z"
  }
}
```

**Ejemplo 2 – Con archivo subido**
```json
{
  "comment": {
    "id": "f6a7b8c9-d0e1-2345-f012-666666666666",
    "author_name": "Dr. Martínez",
    "content": "Receta adjunta.",
    "attachment_path": "a1b2c3d4-e5f6-7890-abcd-111111111111/f6a7b8c9-d0e1-2345-f012-666666666666/receta.pdf",
    "created_at": "2025-02-08T18:05:00.000Z"
  }
}
```

**400** – Falta `log_id` o `content`, o el body no es multipart. **404** – `log_id` no existe. **500** – Error al crear comentario o subir archivo. Cuerpo: `{ "error": "...", "detail": "..." }`.

---

## Supabase Table API (uso desde frontend)

No son Edge Functions. Se usa el cliente `@supabase/supabase-js` con JWT contra la API de tablas (PostgREST). RLS aplica. Documentación detallada en el repo backend (docs/swagger.md, secciones 6, 7 y 8).

**Backend Fase 1 (listo):** El bucket `symptoms-photos` existe (privado) con RLS: el usuario solo puede subir en su carpeta (path debe empezar por su `patient_id`). En `health_logs` el paciente puede hacer update de sus propios registros (`patient_id = auth.uid()`). Flujo foto: insert sin `image_path` → upload al bucket → update del registro con `image_path` (ver backend swagger sección 6).

| Recurso | Operación | Auth | Uso en la app |
|---------|-----------|------|----------------|
| **health_logs** | insert | **Bearer obligatorio** | Crear registro de síntoma tras process-health-log con `emergency: false`. Campos: `patient_id`, `symptom_id`, `pain_level`, `context`, `blood_pressure`, `heart_rate`, `oxygen_saturation`, `image_path`. Si se adjunta foto: crear log primero, subir a Storage, luego actualizar `image_path` vía update. |
| **health_logs** | update | **Bearer obligatorio** | Actualizar `image_path` tras subir la foto al bucket (mismo usuario). |
| **Storage bucket `symptoms-photos`** | upload | **Bearer obligatorio** | Ruta: `{patient_id}/{log_id}/symptom.jpg`. Compresión en cliente (expo-image-manipulator: max width 1024px, JPEG 0.8) antes de subir. |
| **symptoms_master** | select | **Bearer obligatorio** | Lista para dropdown: `.select('id, name').order('name')`. |
| **symptoms_master** | insert | **Bearer obligatorio** | Agregar nuevo síntoma (creatable): `.insert({ name, created_by: user.id }).select('id, name').single()`. |

Implementación en frontend: `src/useCases/fetchSymptoms.ts`, `src/useCases/createSymptom.ts`, `src/useCases/createHealthLog.ts`. **Fase 2:** `sharedLogGet`, `sharedLogPost`, `uploadPrescription` en vista compartida (`SharedViewScreen` + `CommentForm`); `prescriptionSignedUrl` para visor de receta en app paciente. **Fase 3:** `fetchHealthLogsForPatient` incluye `blood_pressure`, `heart_rate`, `oxygen_saturation` para **Health Dashboard** (gráficos con victory-native: evolución FC y presión sistólica); **Offline:** `PersistQueryClientProvider` + `createAsyncStoragePersister` (AsyncStorage, clave `CHECK_MY_SINTOMS_QUERY_CACHE`, gcTime 24 h) para que la caché de TanStack Query persista y se recupere sin red. **Fase 4:** En Inicio, indicador "Receta" (badge) en los logs que tienen al menos un comentario con adjunto; se usa `useQueries` + `shared-log` GET (hasta 20 logs) para detectar prescripciones. **Fase 5:** Compartir link vista médico: `getSharedViewUrl(logId)` (base `EXPO_PUBLIC_APP_URL`), botón "Compartir" en cada ítem de Inicio y "Compartir con el médico" en detalle del log; `Share.share()` con la URL.

**Estado backend (Fase 3 – ya cubierto):**  
- **Visor de PDF in-app:** El backend está cubierto. La Edge Function **prescription-signed-url** (GET o POST con JWT) devuelve una `url` temporal (24 h). El frontend llama a ese endpoint y muestra la receta **dentro de la app** en un modal con **WebView** (`react-native-webview`), sin abrir el navegador externo. Flujo: "Ver receta" → `prescriptionSignedUrl` → `PrescriptionViewerContext.setPrescriptionUrl(url)` → navegación a `/prescription-viewer` (modal) → WebView con la URL firmada.  
- **Índices para historial:** Ya existen en base de datos: `idx_health_logs_patient_created` en `(patient_id, created_at desc)` y `idx_health_logs_patient_symptom_created` en `(patient_id, symptom_id, created_at desc)`. Las consultas de historial por paciente y rango de fechas están cubiertas.

---

## Resumen rápido

| Recurso | Tipo | Auth | Uso |
|---------|------|------|-----|
| process-health-log | Edge Function POST | Opcional (Bearer) | Validar urgencia antes de guardar síntoma |
| **health_logs** (insert) | Tabla Supabase | **Bearer obligatorio** | Crear registro de síntoma tras validar |
| **health_logs** (update) | Tabla Supabase | **Bearer obligatorio** | Actualizar image_path tras subir foto |
| **symptoms-photos** (upload) | Storage Supabase | **Bearer obligatorio** | Subir foto del síntoma (comprimida en cliente) |
| **symptoms_master** (select) | Tabla Supabase | **Bearer obligatorio** | Lista para dropdown |
| **symptoms_master** (insert) | Tabla Supabase | **Bearer obligatorio** | Agregar nuevo síntoma en dropdown |
| shared-log | Edge Function GET | No | Cargar log + comentarios (vista compartida) |
| shared-log | Edge Function POST | No | Crear comentario (vista compartida) |
| prescription-signed-url | Edge Function GET / POST | **Bearer obligatorio** | Obtener URL para ver prescripción (app paciente) |
| upload-prescription | Edge Function POST | No | Crear comentario + adjuntar PDF/imagen (vista compartida) |

Spec completo en OpenAPI 3.0 (solo Edge Functions): [docs/openapi.yaml](openapi.yaml).
