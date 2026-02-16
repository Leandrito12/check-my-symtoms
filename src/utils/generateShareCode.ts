/**
 * Genera un código de 8 caracteres (A-Z, 0-9) para compartir con el médico.
 * Se guarda en profiles.share_code. Plan Share Code (F1.1).
 */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateShareCode(): string {
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}
