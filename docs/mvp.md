**MVP Fase 1: Core de Registro y Seguridad (Fundamentos)**
El objetivo es que el paciente pueda loguearse y guardar su primer síntoma de forma segura.
**Frontend (Mobile First - Expo/React Native)**
• **Setup de Arquitectura:** Estructura de carpetas por capas (`src/features`, `src/components`, `src/hooks`). Configuración de **TypeScript** estricto.
• **Auth Flow:** Pantallas de Login/Registro integrando Supabase Auth (o Firebase).
• **Symptom Entry Form:**
    ◦ Implementación de un **Custom Dropdown** con búsqueda y opción de "agregar nuevo" (Creatable).
    ◦ Input de texto para contexto y sliders para rango de dolor ($0-7$).
    ◦ Lógica de validación: Si valor $>7$, disparar un `Modal` de alerta persistente con redirección a llamada de emergencia.
• **Global State:** Configuración de **TanStack Query** para manejar las mutaciones de creación de síntomas.
**Backend (Serverless / Edge Functions)**
• **Logic Layer:** Función de servidor para procesar el ingreso del síntoma y validar los rangos de signos vitales (presión, saturación).
• **Media Handling:** Configuración de buckets (Storage) para recibir fotos de los síntomas iniciales con compresión en el cliente.
**Database (Relacional - PostgreSQL)**
• **Esquema Inicial:** Tablas de `perfiles`, `sintomas_maestro` y `registros_paciente`.
• **RLS (Row Level Security):** Configurar políticas para que un usuario solo pueda leer sus propios registros.
**MVP Fase 2: Interoperabilidad y Compartición (El "Link")**
El objetivo es generar la URL única y permitir que el tercero (médico) visualice y comente.
**Frontend (Web/Responsive)**
• **Shared View Page:** Vista optimizada para desktop donde el médico ve el detalle del síntoma. Debe ser "Read-Only".
• **Comment Component:** Capacidad de escribir texto y adjuntar archivos (PDF/Imagen) para prescripciones.
• **UI/UX:** Uso de **Skeleton Screens** para la carga de datos médicos, dando sensación de profesionalismo y rapidez.
**Backend**
• **Dynamic Link Generator:** Servicio que genera un `slug` o `UUID` único por síntoma.
• **Notification Engine:** Trigger para avisar al paciente (vía Push o In-App) cuando se ha cargado una prescripción médica en su síntoma.
**Database**
• **Table `comentarios`:** Relación 1:N con `registros_paciente`.
• **Permissions:** Política de acceso que permita "Lectura Pública vía Link" o "Lectura para usuarios con el Link específico" sin necesidad de que el médico se registre (opcional según tu UX).
**MVP Fase 3: Signos Vitales y Refinamiento (Data-Driven)**
El objetivo es completar la ficha clínica y asegurar que la app sea robusta ante fallos de red.
**Frontend**
• **Health Dashboard:** Gráficos simples (puedes usar `victory-native`) para ver la evolución de la presión arterial y frecuencia cardíaca en el tiempo.
• **Offline Persistence:** Implementar **persistQueryClient** para que si el paciente carga un síntoma en el ascensor o clínica sin señal, se sincronice automáticamente al recuperar conexión.
**Backend**
• **PDF Parser/Viewer:** Integración de un visor de PDFs dentro de la app para que el paciente no tenga que salir de la aplicación para leer la receta.
**Database**
• **Indexing:** Optimización de queries por fecha y `user_id` para asegurar que el historial cargue en milisegundos.
**Resumen de Mejores Prácticas AplicadasAreaPráctica / PrincipioBeneficioFrontendAtomic Design**Componentes reutilizables (Botones, Inputs) en Web y Mobile.**BackendDRY (Don't Repeat Yourself)**Validaciones de salud centralizadas en una sola función.**DBNormalización**Evita duplicidad de nombres de síntomas y permite análisis de datos futuro.**SeguridadLeast Privilege**El link compartido solo da acceso al síntoma específico, no a todo el historial.