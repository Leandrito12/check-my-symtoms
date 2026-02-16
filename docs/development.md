# Cómo probar el proyecto (Check My Symptoms)

Proyecto **Expo (React Native)** con Expo Router. Para probarlo en local necesitas Node.js, un proyecto Supabase configurado y (opcional) un dispositivo o emulador.

---

## 1. Requisitos

- **Node.js** 18+ (recomendado LTS)
- **npm** o **yarn**
- Cuenta y proyecto en [Supabase](https://supabase.com) (backend ya usado en la app)
- Para **Android:** Android Studio con emulador o dispositivo con USB depuración
- Para **iOS:** solo en macOS, con Xcode y simulador o dispositivo

---

## 2. Instalar dependencias

En la raíz del repo:

```bash
npm install
```

---

## 3. Variables de entorno

Copia el ejemplo y rellena con tu proyecto Supabase:

```bash
cp .env.example .env
```

Edita `.env` y pon:

- **EXPO_PUBLIC_SUPABASE_URL:** URL del proyecto (Supabase → Settings → API → Project URL)
- **EXPO_PUBLIC_SUPABASE_ANON_KEY:** la clave **anon/public** (publishable), no la secret key. En Supabase: Project API keys → **anon public**. Es la que puede ir en el cliente; la **service_role** (secret) no debe usarse nunca en la app.
- **EXPO_PUBLIC_APP_URL:** Base de la URL donde se abre la vista del médico (p. ej. al compartir un síntoma). En **local:** `http://localhost:8081` (mismo PC; usa el puerto que muestre `npm run web`). Si el médico abre el enlace desde otro dispositivo en la misma red: `http://TU_IP:8081` (ej. `http://192.168.1.5:8081`; la IP sale en la terminal al hacer `npm start`). En producción: tu dominio real (ej. `https://app.tudominio.com`).

**Enlaces clickeables en WhatsApp:** Para que el enlace compartido (ej. "Copiar y compartir") se renderice como hipervínculo en WhatsApp, `EXPO_PUBLIC_APP_URL` debe ser una **URL pública** (ej. despliegue en Vercel o túnel Ngrok). Con `http://localhost:8081` WhatsApp no reconoce el link como válido porque apunta a tu propia máquina. Usa `npx expo start --tunnel` para obtener una URL pública en desarrollo, o despliega en Vercel/otro host y pon esa URL en la variable.

Sin estas variables, login y datos no funcionarán.

---

## 4. Arrancar la app

```bash
npm start
```

Se abre el **Expo Dev Tools** en el navegador. Desde ahí puedes:

- **Probar en el navegador (web):** clic en “Run in web browser” o `npm run web`
- **Android:** `npm run android` o escanear el QR con la app **Expo Go** (mismo WiFi)
- **iOS (solo macOS):** `npm run ios` o escanear el QR con la cámara y abrir en Expo Go

### Modo túnel (cuando falla la conexión tras login con Google)

Si al volver del login con Google aparece **`java.io.IOException: Failed to download remote update`** o la app se queda cargando, suele deberse a que el dispositivo pierde la conexión con Metro durante la redirección OAuth (firewall, AP isolation del router, redes distintas).

**Solución:** arrancar Expo en modo túnel para exponer Metro mediante una URL pública:

```bash
npx expo start --tunnel
```

o, si tienes el script configurado:

```bash
npm run start:tunnel
```

Expo usa ngrok automáticamente. El QR que aparece permite conectar dispositivos en otra red o datos móviles, evitando la mayoría de problemas de LAN.

### Supabase: Site URL y Redirect (desarrollo vs producción)

La app usa **Site URL** y **Redirect URLs** de Supabase para el login con Google (OAuth).

| Fase | Site URL (Authentication → URL Configuration) | Redirect URLs |
|------|------------------------------------------------|---------------|
| **Desarrollo** | Recomendado: `checkmysintoms://auth/callback` (así el redirect por defecto abre la app). Alternativa: `exp://TU_IP:8081/--/auth/callback`. | **Obligatorio:** `checkmysintoms://auth/callback`. Opcional: `exp://TU_IP:8081/--/auth/callback` y/o `exp://**`. |
| **Producción** | `checkmysintoms://auth/callback` (o tu dominio web si la app es web). | **Obligatorio:** `checkmysintoms://auth/callback` (si usas la app nativa). |

En desarrollo, la app se sirve por una URL tipo `exp://192.168.x.x:8081`; esa base se usa para el callback de Google. Si Site URL en Supabase no coincide, el redirect puede ir a localhost y fallar en el móvil.

#### Login con Google: página en blanco o “Error logueando con Google”

Si al pulsar “Continuar con Google” eliges tu cuenta y luego ves **una página en blanco** (con una URL de Supabase en la barra) o al volver atrás sale “Error logueando con Google”, es porque **Supabase no tiene permitida la URL a la que debe redirigir** a la app.

**Qué hacer:**

1. En **Supabase Dashboard** → tu proyecto → **Authentication** → **URL Configuration**.
2. En **Redirect URLs** añade **exactamente** esta URL (una línea):  
   `checkmysintoms://auth/callback`
3. Guarda. Vuelve a probar “Continuar con Google” en la app.

La app envía esa URL como destino del redirect; si no está en la lista, Supabase no redirige a la app y se queda en una pantalla en blanco. Si ya tienes las Redirect URLs bien puestas y sigue fallando, cambia **Site URL** a `checkmysintoms://auth/callback` (así el redirect por defecto abre la app en lugar de una `exp://` que a veces no abre en el dispositivo).

#### Login con Google en celular: “no encuentra app con el esquema checkmysintoms”

Si en el **dispositivo físico** el navegador vuelve de Google pero aparece un error de tipo “no se puede abrir la URL” o “no hay ninguna app registrada con el esquema checkmysintoms”, es porque **esa instalación de la app no tiene registrado el scheme** `checkmysintoms`.

- **Expo Go** usa el scheme `exp://`, no `checkmysintoms`. Si abres la app con Expo Go, el redirect `checkmysintoms://auth/callback` no abrirá Expo Go.
- **Para un login con Google fiable en físico:** usa un **development build** (build nativo), no Expo Go. El scheme `checkmysintoms` solo se registra en un build nativo; en Expo Go el redirect no abre la app correctamente.
- **Solución:** `npx expo run:android` o un build de EAS. Ese build registra `checkmysintoms` en el sistema y el redirect vuelve a tu app.
- **Si usas development build:** verifica que el **SHA-1** de la firma esté en Google Cloud Console (Credentials → tu Android OAuth client). Ejecuta `npx expo fetch:android:hashes` o consulta el panel de credenciales de EAS.
- **Checklist:** (1) En `app.json` el campo `scheme` debe ser exactamente `checkmysintoms` (sin guiones, minúsculas). (2) En Supabase, Redirect URL = `checkmysintoms://auth/callback`. (3) El `redirectTo` en el código usa ese mismo valor (ya lo hace vía `Constants.expoConfig?.scheme`). (4) En el celular, tener instalada una build que incluya ese scheme (development build), no solo Expo Go.

---

## 5. Flujos que puedes probar

| Flujo | Dónde |
|-------|--------|
| Login / Registro (email) | Pantalla de login |
| Login con Google | Botón “Continuar con Google” (requiere Redirect URL en Supabase) |
| Registrar síntoma | Tab “Inicio” → “Nuevo síntoma” (o entrada de síntomas) |
| Ver historial y detalle | Inicio → lista de logs → tocar un ítem |
| Ver receta (PDF) | En detalle de un log con comentario con adjunto → “Ver receta” |
| Compartir con el médico | En un ítem de Inicio o en detalle del log → “Compartir” |
| Dashboard (gráficos) | Tab “Dashboard” |
| Vista médico (solo lectura) | Abrir en el navegador: `EXPO_PUBLIC_APP_URL/v/{log_id}` (o la URL que genera “Compartir”) |

---

## 6. Ver logs (depuración)

En desarrollo la app escribe logs con el prefijo **`[CheckMySymptoms]`** (auth, Supabase, etc.). Para verlos:

1. **Terminal de Expo:** la misma ventana donde ejecutaste `npx expo start` o `npm start`. Ahí aparecen los `console.log` / `console.warn` de la app. Al abrir la app o pulsar “Continuar con Google” deberías ver líneas como:
   - `[CheckMySymptoms] [Supabase] URL en uso: …` (si sale `placeholder.supabase.co (¡configura .env!)` es que no está cargando tu `.env`).
   - `[CheckMySymptoms] [Auth] Google: redirectTo = checkmysintoms://auth/callback`
   - `[CheckMySymptoms] [Auth] Google: resultado del navegador …`

2. **Dispositivo/emulador:** menú de desarrollo (agita el dispositivo o `Ctrl+M` / `Cmd+D` en emulador) → **“Debug Remote JS”** o **“Open React DevTools”** para abrir la consola del navegador y ver los mismos logs.

Si en los logs aparece **“URL en uso: placeholder.supabase.co (¡configura .env!)”**, la pantalla en blanco con `placeholder.supabase.co` se debe a que las variables de entorno no se cargan: copia `.env.example` a `.env`, rellena `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`, y reinicia con **`npx expo start --clear`**.

---

## 7. Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia Expo (QR + opciones) |
| `npm run start:tunnel` | Inicia Expo en modo túnel (evita problemas de LAN/firewall al volver de OAuth) |
| `npm run web` | Abre la app en el navegador |
| `npm run android` | Abre en emulador/dispositivo Android |
| `npm run ios` | Abre en simulador iOS (macOS) |
| `npx tsc --noEmit` | Comprueba TypeScript sin generar archivos |

---

## 8. Referencias de datos (frontend)

Para el equipo UI/UX y desarrollo, puntos de integración con el backend:

- **Profiles:** La gestión de accesos (compartir historial con el médico) usa `profiles.share_code`. Se lee y actualiza desde la pantalla de Gestión de accesos (`AccessManagementScreen`). El médico introduce el código en `/doctor/request?code=...`.
- **Analytics:** El dashboard médico consume un endpoint agregado que devuelve `patient_info`, `analytics` (historial, frecuencia de síntomas, anomalía) y la lista de `logs`. Ver **docs/swagger.md** para el contrato exacto.
- **Clinical Records:** El backend acepta un `log_id` opcional al crear/actualizar notas clínicas, para vincular la nota a un registro de síntoma concreto.

---

## 9. Si algo falla

- **“Unable to resolve module”:** ejecuta de nuevo `npm install` y reinicia `npm start`.
- **Login/API no funcionan:** revisa que `.env` tenga la URL y la anon key correctas y que no haya espacios extra.
- **Error 401 al llamar a process-health-log:** la Edge Function exige **Bearer JWT** del usuario y lo valida con `auth.getUser()`. El frontend usa el cliente con sesión (`supabase.functions.invoke(..., { body })`) para que el SDK envíe el JWT. Si recibes 401: (1) el usuario debe estar logueado; (2) token inválido o expirado — cerrar sesión y volver a entrar; (3) backend desplegado con `supabase functions deploy process-health-log --no-verify-jwt`. Ver **docs/swagger.md** sección 1.
- **Google: página en blanco o error al volver:** añade en Supabase → Authentication → URL Configuration → Redirect URLs la URL **`checkmysintoms://auth/callback`**. Ver la subsección “Login con Google: página en blanco” más arriba.
- **`java.io.IOException: Failed to download remote update`** (al volver de Google): el dispositivo no puede reconectar con Metro tras la redirección OAuth. Usa **modo túnel**: `npx expo start --tunnel` (o `npm run start:tunnel`). Si usas Windows, añade exclusiones en el Firewall para `node.exe`, el puerto TCP 8081 y (si aplica) ngrok; o marca la red como "Privada" en lugar de "Pública".
- **WebView o módulos nativos:** algunas cosas (p. ej. visor de receta completo) se ven mejor en dispositivo/emulador que en `npm run web`.
- **"Failed to resolve the Android SDK path" / "adb no se reconoce":** no tienes el SDK de Android instalado. Para probar sin instalar nada: usa **Web** (tecla `w` o `npm run web`) o escanea el **QR con tu móvil** (app Expo Go, mismo WiFi). Si quieres emulador: instala Android Studio, crea un AVD y define `ANDROID_HOME` (ej. `C:\Users\TU_USUARIO\AppData\Local\Android\Sdk`).
