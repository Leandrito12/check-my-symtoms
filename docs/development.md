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

### Supabase: Site URL y Redirect (desarrollo vs producción)

La app usa **Site URL** y **Redirect URLs** de Supabase para el login con Google (OAuth).

| Fase | Site URL (Authentication → URL Configuration) | Redirect URLs |
|------|------------------------------------------------|---------------|
| **Desarrollo** | `exp://192.168.0.147:8081/--/auth/callback` (o la IP que muestre Expo en tu red; puede cambiar) | Añade esa misma URL y/o `exp://**` (wildcard). Opcional: `checkmysintoms://auth/callback` para builds con scheme. |
| **Producción** | **Debe cambiarse** a la URL de la app en producción (p. ej. tu dominio web o el scheme del build: `checkmysintoms://auth/callback`). | Añadir la(s) URL(s) de producción que use la app (scheme del build, dominio web, etc.). |

En desarrollo, la app se sirve por una URL tipo `exp://192.168.x.x:8081`; esa base se usa para el callback de Google. Si Site URL en Supabase no coincide, el redirect puede ir a localhost y fallar en el móvil.

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

## 6. Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia Expo (QR + opciones) |
| `npm run web` | Abre la app en el navegador |
| `npm run android` | Abre en emulador/dispositivo Android |
| `npm run ios` | Abre en simulador iOS (macOS) |
| `npx tsc --noEmit` | Comprueba TypeScript sin generar archivos |

---

## 7. Si algo falla

- **“Unable to resolve module”:** ejecuta de nuevo `npm install` y reinicia `npm start`.
- **Login/API no funcionan:** revisa que `.env` tenga la URL y la anon key correctas y que no haya espacios extra.
- **Error 401 al llamar a process-health-log:** la Edge Function exige **Bearer JWT** del usuario y lo valida con `auth.getUser()`. El frontend usa el cliente con sesión (`supabase.functions.invoke(..., { body })`) para que el SDK envíe el JWT. Si recibes 401: (1) el usuario debe estar logueado; (2) token inválido o expirado — cerrar sesión y volver a entrar; (3) backend desplegado con `supabase functions deploy process-health-log --no-verify-jwt`. Ver **docs/swagger.md** sección 1.
- **Google redirect no vuelve a la app / redirect a localhost:** la app usa `Linking.createURL('auth/callback')` para la URL de redirect. En Supabase → Authentication → URL Configuration: **Redirect URLs** debe incluir la URL que usa la app (en desarrollo p. ej. `exp://192.168.0.147:8081/--/auth/callback` o wildcard `exp://**`). **Site URL** en desarrollo puede ponerse a esa misma URL (ej. `exp://192.168.0.147:8081/--/auth/callback`); en **producción hay que cambiarla** a la URL de la app en producción. Ver tabla “Supabase: Site URL y Redirect” más arriba y [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
- **WebView o módulos nativos:** algunas cosas (p. ej. visor de receta completo) se ven mejor en dispositivo/emulador que en `npm run web`.
- **"Failed to resolve the Android SDK path" / "adb no se reconoce":** no tienes el SDK de Android instalado. Para probar sin instalar nada: usa **Web** (tecla `w` o `npm run web`) o escanea el **QR con tu móvil** (app Expo Go, mismo WiFi). Si quieres emulador: instala Android Studio, crea un AVD y define `ANDROID_HOME` (ej. `C:\Users\TU_USUARIO\AppData\Local\Android\Sdk`).
