# stack, estructura, patron de diseño

**1. Arquitectura de Software: Clean Architecture**
Para un proyecto que maneja datos de salud, no quieres que tu lógica de negocio (como el trigger de "ir a la guardia") esté mezclada con el código de la UI o la base de datos.
• **Capas:** Separa en *Domain* (entidades de salud, reglas de dolor), *Use Cases* (registro de síntomas, compartir link) e *Infrastructure* (Firebase/Supabase, API).
• **Enfoque:** **Serverless + Event-Driven**. Esto te permitirá escalar sin gestionar servidores y pagar solo por lo que usas.
**2. Stack Tecnológico Recomendado**
Considerando que dominas React y TypeScript, este es el camino más corto al mercado (Time-to-Market):
**Frontend: Mobile & Web**
• **Framework:** **Expo (React Native)**. Es la elección lógica. Con un solo código generas la App nativa (iOS/Android) y la versión Web.
• **UI Library:** **Tamagui** o **NativeWind (Tailwind para React Native)**. Te permiten un diseño responsivo excelente para que el Dashboard médico se vea bien en desktop y la carga de síntomas sea fluida en mobile.
• **Gestión de Estado:** **TanStack Query (React Query)** para manejar la sincronización con el servidor y caché, vital en apps médicas.
**Backend & Database (BaaS)**
• **Opción A (Recomendada por velocidad):** **Supabase (PostgreSQL)**.
    ◦ Te da autenticación, base de datos relacional (mejor que NoSQL para reportes médicos) y almacenamiento de imágenes (prescripciones).
    ◦ **Edge Functions:** Para la lógica de envío de alertas o generación de URLs.
• **Opción B (Real-time puro):** **Firebase**. Ideal si necesitas que el médico vea el comentario del síntoma al instante sin refrescar, aunque la estructura NoSQL puede ser más desordenada a largo plazo.
**Seguridad y Compartición**
• **URLs únicas:** Usa **UUIDs v4** no secuenciales para las rutas de visualización (ej: `app.com/v/3e2...`).
• **Control de Acceso (RBAC):** Implementar políticas a nivel de fila (RLS) en la base de datos para que el "invitado" solo pueda ver el síntoma específico vinculado a ese ID único.
**3. Modelo de Datos y Patrones de Diseño
Base de Datos (Relacional)**
1. **Users:** (id, role, email).
2. **Symptoms_Master:** (id, name) - Para tu dropdown con inserción dinámica.
3. **Patient_Logs:** (id, patient_id, symptom_id, intensity, blood_pressure, heart_rate, notes, image_url).
4. **Comments:** (id, log_id, author_id, text, attachment_url).
**Patrones de Diseño Clave**
• **Strategy Pattern:** Para la lógica de evaluación del dolor. Si el valor es $>7$, se dispara una "Estrategia de Emergencia" que cambia la UI y recomienda la guardia.
• **Observer Pattern:** Para notificar al paciente cuando el médico comenta su síntoma o carga una orden médica.
**4. Consideraciones de Producto (UX/DX)**
• **Offline First:** Los pacientes pueden estar en una clínica con mala señal. Expo permite guardar el síntoma localmente (SQLite o AsyncStorage) y sincronizarlo cuando haya red.
• **Dropdown Dinámico:** Implementa un componente "Creatable Select". Si el usuario escribe algo que no existe, el sistema lo inserta en `Symptoms_Master` y lo asocia al log.
• **Validación Médica:** La lógica de "ir a la guardia" debe estar en el **Backend** para evitar que alguien la manipule o por si los criterios médicos cambian (ej. ahora la presión alta es otro valor).