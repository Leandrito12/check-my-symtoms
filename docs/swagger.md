# API Backend – Check My Symptoms (para Frontend)

Base URL de las Edge Functions:  
`https://{PROJECT_REF}.supabase.co/functions/v1`  
(Sustituir `{PROJECT_REF}` por el Reference ID del proyecto en Supabase → Settings → General.)

En la app con `@supabase/supabase-js` se puede usar:  
`supabase.functions.invoke('nombre-funcion', { body: {...} })` — el cliente añade la base URL y, si hay sesión, el header `Authorization`.

---

## 1. process-health-log

**Validar signos vitales antes de guardar el síntoma.** Devuelve si hay urgencia (dolor ≥ 8 o saturación < 90). No escribe en base de datos. La función valida que quien llama sea un usuario autenticado (JWT).

| Dato | Valor |
|------|--------|
| **Método** | `POST` |
| **URL** | `/functions/v1/process-health-log` |
| **Authorization** | **Requerido.** Bearer JWT del usuario autenticado. La función valida el token internamente (se despliega con `--no-verify-jwt`). Sin JWT válido responde 401. |
| **Headers** | `Content-Type: application/json` |
| **Body** | JSON. **symptom_id** obligatorio; el resto opcional. |

### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| symptom_id | string (UUID) | **Sí** | ID del síntoma principal en `symptoms_master`. El frontend debe enviarlo siempre. |
| pain_level | number (0–10) | No | Nivel de dolor |
| context | string | No | Contexto del malestar |
| blood_pressure | string | No | Ej. "120/80" |
| heart_rate | number | No | Frecuencia cardíaca |
| oxygen_saturation | number (0–100) | No | Saturación de oxígeno |

### Respuesta esperada

**200 OK** – Siempre devuelve JSON con al menos `emergency`. Opcionalmente el backend puede incluir `map` (presión arterial media en mmHg) cuando se envía `blood_pressure`, para mostrarlo en el frontend tras guardar.

**Ejemplo 1 – Sin urgencia (sin map)**
```json
{
  "emergency": false,
  "reason": null,
  "message": null
}
```

**Ejemplo 1b – Sin urgencia (con map cuando hay presión)**
```json
{
  "emergency": false,
  "reason": null,
  "message": null,
  "map": 93
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

**Otros códigos:** 400 (falta `symptom_id` o body no es JSON), **401** (falta Authorization o token inválido/expirado; la función valida el JWT manualmente), 502 (función no desplegada o caída), etc. En el frontend se loguea **status** y **body** (`error.context?.status`, `error.context?.body`) para depurar.

#### 401 – Autorización

La Edge Function devuelve **401** cuando falta el header `Authorization` o el token es inválido/expirado. Valida el JWT manualmente con `auth.getUser()`. El frontend debe llamar con el cliente de Supabase con sesión iniciada para que el SDK envíe el JWT del usuario; no sobrescribir el header. Despliegue del backend: `supabase functions deploy process-health-log --no-verify-jwt` (el gateway no verifica JWT; la función sí).

### Cómo la envía el frontend (ejemplo real)

El frontend usa `supabase.functions.invoke('process-health-log', { body })`. El SDK añade `Authorization: Bearer <JWT del usuario>` si hay sesión. No pasar headers custom para no reemplazar el JWT.

| Dato | Valor |
|------|--------|
| **Método** | `POST` |
| **URL** | `{EXPO_PUBLIC_SUPABASE_URL}/functions/v1/process-health-log` |
| **Headers** | `Content-Type: application/json`, `Authorization: Bearer <JWT>` (añadido por el SDK con sesión) |
| **Body** | Objeto JSON. El front **siempre** envía al menos `symptom_id` (botón Guardar deshabilitado si no hay síntoma principal). |

**Forma del body:** El front arma siempre el mismo objeto (mismas claves). Los opcionales de **texto** se envían como `""` cuando estén vacíos; los **numéricos** opcionales como `null` cuando no haya valor. Así no hay `undefined`, el JSON serializa bien y el backend acepta `""` como “sin valor” en esos campos.

**Ejemplo con valores:**

```json
{
  "symptom_id": "550e8400-e29b-41d4-a716-446655440000",
  "pain_level": 2,
  "context": "me pasó luego de comer un choripán",
  "blood_pressure": "120/80",
  "heart_rate": 72,
  "oxygen_saturation": 98
}
```

**Ejemplo con campos vacíos** (strings en `""`, numéricos en `null`):

```json
{
  "symptom_id": "550e8400-e29b-41d4-a716-446655440000",
  "pain_level": 0,
  "context": "",
  "blood_pressure": "",
  "heart_rate": null,
  "oxygen_saturation": null
}
```

En código: `context: context?.trim() ?? ""`, `blood_pressure: bloodPressure?.trim() ?? ""`, `heart_rate: heartRate ? parseInt(heartRate, 10) : null`, `oxygen_saturation: oxygenSat ? parseInt(oxygenSat, 10) : null`. El backend exige `symptom_id` y responde **200** con `{ "emergency": boolean, "reason": string | null, "message": string | null, "map"?: number | null }`. Si envía presión (`blood_pressure`), el backend puede devolver `map` (MAP en mmHg) para mostrarlo en el modal de éxito. Síntoma secundario, presión, FC, saturación y foto no se envían a esta función (solo validación de urgencia); son opcionales en el **insert** a `health_logs` (sección 6).

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

El backend lee **solo** desde la query string (`url.searchParams.get('id')` / `'log_id'`), no desde el body. En el frontend se llama con `fetch(..., ?id=...)` y, si hay sesión, con `Authorization: Bearer <JWT>` para que `auth.getUser()` en backend reciba un token válido.

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
| **health_logs** | insert | **Bearer obligatorio** | Crear registro de síntoma tras process-health-log con `emergency: false`. Campos: `patient_id`, `symptom_id` (principal), `secondary_symptom_ids` (opcional, array de UUID de sub-síntomas; omitir o `[]` si no hay), `pain_level`, `context`, `blood_pressure`, `heart_rate`, `oxygen_saturation`, `image_path`. Si hay sub-síntomas (input "Otro síntoma" + badges), enviar `secondary_symptom_ids` con los UUID. Ejemplo body: `{ ..., symptom_id, secondary_symptom_ids: form.subSymptomIds ?? [] }`. Si se adjunta foto: crear log primero, subir a Storage, luego actualizar `image_path` vía update. |
| **health_logs** | update | **Bearer obligatorio** | Actualizar `image_path` tras subir la foto al bucket (mismo usuario). |
| **Storage bucket `symptoms-photos`** | upload | **Bearer obligatorio** | Ruta: `{patient_id}/{log_id}/symptom.jpg`. Compresión en cliente (expo-image-manipulator: max width 1024px, JPEG 0.8) antes de subir. |
| **symptoms_master** | select | **Bearer obligatorio** | Lista para dropdown: `.select('id, name').order('name')`. |
| **symptoms_master** | insert | **Bearer obligatorio** | Agregar nuevo síntoma (creatable): `.insert({ name, created_by: user.id }).select('id, name').single()`. |

Implementación en frontend: `src/useCases/fetchSymptoms.ts`, `src/useCases/createSymptom.ts`, `src/useCases/createHealthLog.ts`. **Fase 2:** `sharedLogGet`, `sharedLogPost`, `uploadPrescription` en vista compartida (`SharedViewScreen` + `CommentForm`); `prescriptionSignedUrl` para visor de receta en app paciente. **Fase 3:** `fetchHealthLogsForPatient` incluye `blood_pressure`, `heart_rate`, `oxygen_saturation` para **Health Dashboard** (gráficos con victory-native: evolución FC y presión sistólica); **Offline:** `PersistQueryClientProvider` + `createAsyncStoragePersister` (AsyncStorage, clave `CHECK_MY_SINTOMS_QUERY_CACHE`, gcTime 24 h) para que la caché de TanStack Query persista y se recupere sin red. **Fase 4:** En Inicio, indicador "Receta" (badge) en los logs que tienen al menos un comentario con adjunto; se usa `useQueries` + `shared-log` GET (hasta 20 logs) para detectar prescripciones. **Fase 5:** Compartir link vista médico: `getSharedViewUrl(logId)` (base `EXPO_PUBLIC_APP_URL`), botón "Compartir" en cada ítem de Inicio y "Compartir con el médico" en detalle del log; `Share.share()` con la URL.

**Estado backend (Fase 3 – ya cubierto):**  
- **Visor de PDF in-app:** El backend está cubierto. La Edge Function **prescription-signed-url** (GET o POST con JWT) devuelve una `url` temporal (24 h). El frontend llama a ese endpoint y muestra la receta **dentro de la app** en un modal con **WebView** (`react-native-webview`), sin abrir el navegador externo. Flujo: "Ver receta" → `prescriptionSignedUrl` → `PrescriptionViewerContext.setPrescriptionUrl(url)` → navegación a `/prescription-viewer` (modal) → WebView con la URL firmada.  
- **Índices para historial:** Ya existen en base de datos: `idx_health_logs_patient_created` en `(patient_id, created_at desc)` y `idx_health_logs_patient_symptom_created` en `(patient_id, symptom_id, created_at desc)`. Las consultas de historial por paciente y rango de fechas están cubiertas.
- **Sub-síntomas (secondary_symptom_ids):** En insert, campo opcional `secondary_symptom_ids` (array de UUID, valores en `symptoms_master`). Al leer (select de `health_logs`), PostgREST devuelve `secondary_symptom_ids` como array de strings; el frontend puede resolver IDs a nombres con `symptoms_master` para detalle o listados.

---

## get-patient-analytics

**Obtener datos de evolución por síntoma para gráficos.** Usado en Dashboard (por síntoma) y en vista médico. Puede aceptar **Bearer JWT** (paciente logueado) o **access_token** en body (médico sin sesión, C02).

| Dato | Valor |
|------|--------|
| **Método** | `POST` (o GET con query params según implementación backend) |
| **URL** | `/functions/v1/get-patient-analytics` |
| **Body** | `{ "symptomId": string (UUID), "range": "week" \| "month" }` (opcionalmente `range` también `"7d"` \| `"30d"` \| `"90d"` si el backend lo soporta) |
| **Authorization** | Opcional: Bearer JWT (paciente) o el backend puede aceptar `access_token` en body/headers para médico. |

### Respuesta esperada

**200 OK** – Array de puntos para gráfico:

```json
[
  { "date": "2025-02-01", "value": 120, "secondary": 80 },
  { "date": "2025-02-08", "value": 118, "secondary": 78 }
]
```

**Nota dashboard de salud:** El dashboard de signos vitales (presión, MAP, frecuencia de síntomas, FC) obtiene los datos mediante **health_logs** (select por `patient_id`) y aplica el **range** (7D / 30D / 90D) en el cliente. La query key incluye el range para invalidar caché al cambiar de periodo.

---

## manage-clinical-record

**Crear nota en historia clínica.** Solo para contexto médico; el médico no tiene sesión en la app del paciente, por lo que se envía **access_token** en el body (C02).

**Contrato backend (FRONTEND_HANDS_ON_ENDPOINTS.md):** Body con `note_content`, `record_type` (`nota` \| `estudio` \| `diagnóstico` \| `medicamento`). El frontend mapea internamente: `content` → `note_content`, `evolucion` → `nota`, `diagnostico` → `diagnóstico`, `medicacion` → `medicamento`.

| Dato | Valor |
|------|--------|
| **Método** | `POST` |
| **URL** | `/functions/v1/manage-clinical-record` |
| **Body** | JSON con `access_token`, `patient_id`, `note_content`, `record_type` (`nota` \| `estudio` \| `diagnóstico` \| `medicamento`), `tags` (array), `metadata` (object). Opcional: **`log_id`** (UUID del log al que se asocia la nota; el backend marca ese log como `is_reviewed: true`). |

### Respuesta esperada

**201 Created** – `{ "record": { "id": string (UUID), "created_at": string (ISO), ... } }`.

---

## Historial compartido con el médico

Flujo de autorización en 3 pasos: código → solicitud → concesión. Ver plan Historial Compartido.

### request-access

**Solicitar acceso al historial (médico).** El médico envía el share_code y su nombre. El paciente verá la solicitud en la app y podrá conceder o no.

| Dato | Valor |
|------|--------|
| **Método** | `POST` |
| **URL** | `/functions/v1/request-access` |
| **Body** | `{ "share_code": string, "doctor_name": string }` |
| **Authorization** | No (médico sin sesión). |

**200 OK** – `{ "status": "pending", "request_id": string (UUID) }`.

### grant-access

**Conceder acceso (paciente).** El paciente autoriza una solicitud pendiente. Requiere JWT del paciente.

| Dato | Valor |
|------|--------|
| **Método** | `POST` |
| **URL** | `/functions/v1/grant-access` |
| **Body** | `{ "request_id": string (UUID) }` |
| **Authorization** | **Bearer JWT** (paciente). |

**200 OK** – `{ "success": true, "access_token": string }`. El token tiene expiración (ej. 24 h o 7 días). El frontend construye la URL compartible con `buildSharedHistoryUrl(access_token)`.

### revoke-access

**Revocar acceso (paciente).** El paciente quita el acceso a un médico.

| Dato | Valor |
|------|--------|
| **Método** | `POST` |
| **URL** | `/functions/v1/revoke-access` |
| **Body** | `{ "doctor_id": string (UUID) }` |
| **Authorization** | **Bearer JWT** (paciente). |

### shared-history

**Obtener historial compartido (médico).** Vista read-only del historial del paciente. El token va en query.

| Dato | Valor |
|------|--------|
| **Método** | `GET` |
| **URL** | `/functions/v1/shared-history?access_token=...&range=7d|30d|90d` |
| **Authorization** | No; el access_token en query identifica la sesión. |

**200 OK** – JSON con `patient_info` (name, age), `analytics` (history, symptom_frequency, anomaly), `logs` (array de registros). Recomendado: `expires_at` (ISO) y `expires_in_seconds` para banner preventivo y redirección al expirar.

**401/403** – Token inválido o expirado; el frontend redirige a `/shared/expired`.

### access-requests (opcional)

**Listar share_code, solicitudes pendientes y médicos autorizados (paciente).**

| Dato | Valor |
|------|--------|
| **Método** | `POST` (o GET según backend) |
| **URL** | `/functions/v1/access-requests` |
| **Body** | `{}` |
| **Authorization** | **Bearer JWT** (paciente). |

**200 OK** – `{ "share_code": string | null, "pending_requests": [...], "authorized_doctors": [...] }`.

---

## Resumen rápido

| Recurso | Tipo | Auth | Uso |
|---------|------|------|-----|
| process-health-log | Edge Function POST | **Bearer JWT obligatorio** | Validar urgencia antes de guardar; la función valida el JWT manualmente |
| get-patient-analytics | Edge Function POST | JWT o access_token | Datos para gráficos de evolución por síntoma |
| manage-clinical-record | Edge Function POST | access_token en body | Crear nota clínica (vista médico) |
| **health_logs** (insert) | Tabla Supabase | **Bearer obligatorio** | Crear registro de síntoma tras validar |
| **health_logs** (update) | Tabla Supabase | **Bearer obligatorio** | Actualizar image_path tras subir foto |
| **symptoms-photos** (upload) | Storage Supabase | **Bearer obligatorio** | Subir foto del síntoma (comprimida en cliente) |
| **symptoms_master** (select) | Tabla Supabase | **Bearer obligatorio** | Lista para dropdown |
| **symptoms_master** (insert) | Tabla Supabase | **Bearer obligatorio** | Agregar nuevo síntoma en dropdown |
| shared-log | Edge Function GET | No | Cargar log + comentarios (vista compartida) |
| shared-log | Edge Function POST | No | Crear comentario (vista compartida) |
| prescription-signed-url | Edge Function GET / POST | **Bearer obligatorio** | Obtener URL para ver prescripción (app paciente) |
| upload-prescription | Edge Function POST | No | Crear comentario + adjuntar PDF/imagen (vista compartida) |
| request-access | Edge Function POST | No | Médico solicita acceso con share_code |
| grant-access | Edge Function POST | **Bearer JWT (paciente)** | Paciente concede acceso; devuelve access_token |
| revoke-access | Edge Function POST | **Bearer JWT (paciente)** | Paciente revoca acceso de un médico |
| shared-history | Edge Function GET | access_token en query | Médico obtiene historial read-only |
| access-requests | Edge Function POST | **Bearer JWT (paciente)** | Listar share_code, pendientes y autorizados |

Spec completo en OpenAPI 3.0 (solo Edge Functions): [docs/openapi.yaml](openapi.yaml).
