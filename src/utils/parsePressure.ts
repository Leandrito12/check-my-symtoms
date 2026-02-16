/**
 * Parsea presión arterial desde un único campo en formatos:
 * - "120/80" (barra)
 * - "120-80" (guión)
 * Devuelve { systolic, diastolic } o null si no es válido.
 */
export function parsePressureInput(text: string): { systolic: number; diastolic: number } | null {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^\s*(\d{2,3})\s*[\/\-]\s*(\d{2,3})\s*$/);
  if (!match) return null;
  const s = parseInt(match[1], 10);
  const d = parseInt(match[2], 10);
  if (Number.isNaN(s) || Number.isNaN(d) || s < 50 || s > 250 || d < 30 || d > 150) return null;
  return { systolic: s, diastolic: d };
}
