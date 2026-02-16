/**
 * Sistema de diseño Safe Harbor – paleta y tokens.
 * Clean & Clinical con calidez humana. WCAG AAA donde aplica.
 */

export const SafeHarbor = {
  colors: {
    primary: '#0F52BA',       // Sapphire Blue – confianza, autoridad
    secondary: '#10B981',     // Emerald Green – salud, éxito
    alert: '#E11D48',         // Rose Red – urgencia/dolor
    background: '#F8FAFC',     // Ghost White – fondo
    text: '#1E293B',          // Slate Blue – texto principal
    textSecondary: '#64748B',  // Placeholders, texto secundario
    border: '#CBD5E1',        // Gris suave – bordes dropdown
    commentBg: '#F1F5F9',     // Fondo comentarios médico
    backgroundSecondary: '#F1F5F9', // Cards historia clínica (alias commentBg)
    white: '#FFFFFF',
  },
  spacing: {
    cardRadius: 12,
    minTapTarget: 44,
  },
  /** C03: 0-3 calm, 4-7 attention, 8-10 alert (umbral urgencia ≥8). */
  painLevelColors: {
    calm: '#10B981',    // 0-3
    attention: '#EAB308', // 4-7
    alert: '#E11D48',   // 8-10
  },
} as const;

export type SafeHarborColors = typeof SafeHarbor.colors;
