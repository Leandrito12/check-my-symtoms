/** Clave de sessionStorage para persistir returnTo durante OAuth redirect (solo web). */
export const AUTH_RETURN_TO_KEY = 'auth_returnTo';

/** Rutas permitidas para returnTo (evitar open redirect). */
export function isAllowedReturnTo(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith('/shared') || p.startsWith('/doctor');
}
