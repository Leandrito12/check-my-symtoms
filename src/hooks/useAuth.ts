/**
 * Estado de autenticación de la app.
 *
 * La lógica real (getSession + onAuthStateChange) vive UNA sola vez en
 * <AuthProvider> (src/contexts/AuthContext). Antes cada pantalla que usaba este hook
 * ejecutaba su propio getSession() y se suscribía por separado; con muchas pantallas
 * montadas a la vez, esas llamadas concurrentes peleaban por el lock de gotrue y
 * producían los warnings "Lock acquisition timed out after 10000ms". Ahora useAuth()
 * solo lee del context — una única suscripción para toda la app.
 */
import { useAuthContext } from '@/src/contexts/AuthContext';

export function useAuth() {
  return useAuthContext();
}
