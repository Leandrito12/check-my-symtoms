/**
 * Plantilla HTML para reporte PDF (expo-print).
 * Resaltado clínico: urgencia, PA alta, O2 < 90. Plan P6-6.
 */
import type { SharedHistoryLog } from '@/src/useCases/fetchSharedHistory';
import { getPressureFromLog } from '../adapters/sharedHistoryTable';

export interface PdfPatientInfo {
  name: string;
  age?: number;
  id?: string;
}

export function generatePdfTemplate(
  patientInfo: PdfPatientInfo,
  doctorName: string,
  logs: SharedHistoryLog[],
  rangeLabel: string
): string {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const rows = logs
    .map((log) => {
      const pressure = getPressureFromLog(log);
      const isEmergency = Boolean(log.emergency) || (log.pain_level != null && log.pain_level >= 8);
      const isHighBP =
        pressure != null &&
        (pressure.systolic > 140 || pressure.diastolic > 90);
      const isLowO2 =
        log.oxygen_saturation != null && log.oxygen_saturation < 90;

      const paCell =
        pressure != null
          ? `${pressure.systolic}/${pressure.diastolic} <span class="map-val">(${pressure.map})</span>`
          : '—';
      const vitalsCell = `${log.heart_rate ?? '--'} lpm / ${log.oxygen_saturation ?? '--'}%`;
      const symptomPrimary = log.primary_symptom_name ?? log.symptom_name ?? '—';
      const secondary = (log.secondary_symptoms ?? []).join(', ') || '';

      return `
      <tr class="${isEmergency ? 'emergency-row' : ''}">
        <td>${new Date(log.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</td>
        <td class="status-cell">${isEmergency ? '⚠️ URGENCIA' : 'Normal'}</td>
        <td>
          <strong>${escapeHtml(symptomPrimary)}</strong><br/>
          <small>${escapeHtml(secondary)}</small>
        </td>
        <td class="center ${log.pain_level != null && log.pain_level >= 8 ? 'text-red' : ''}">${log.pain_level ?? '—'}/10</td>
        <td class="center ${isHighBP ? 'text-red' : ''}">${paCell}</td>
        <td class="center ${isLowO2 ? 'bg-alert' : ''}">${vitalsCell}</td>
      </tr>
    `;
    })
    .join('');

  const patientLine = patientInfo.age != null
    ? `${escapeHtml(patientInfo.name)} (${patientInfo.age} años)`
    : escapeHtml(patientInfo.name);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; padding: 20px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1a5fb4; padding-bottom: 10px; margin-bottom: 20px; }
    .logo-area { color: #1a5fb4; font-weight: bold; font-size: 24px; }
    .patient-info { font-size: 14px; line-height: 1.6; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
    th { background-color: #f8f9fa; color: #1a5fb4; text-align: left; padding: 10px; border-bottom: 2px solid #dee2e6; }
    td { padding: 10px; border-bottom: 1px solid #dee2e6; vertical-align: top; }
    
    .emergency-row { background-color: #fff5f5; }
    .status-cell { font-weight: bold; }
    .text-red { color: #d32f2f; font-weight: bold; }
    .bg-alert { background-color: #ffebee; border-radius: 4px; }
    .map-val { color: #666; font-style: italic; font-size: 10px; }
    .center { text-align: center; }
    
    .footer { margin-top: 30px; font-size: 10px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">Check My Symptoms</div>
    <div style="text-align: right;">
      <div style="font-weight: bold; font-size: 16px;">Reporte de Historial Clínico</div>
      <div>Fecha de emisión: ${dateStr}</div>
    </div>
  </div>

  <div class="patient-info">
    <strong>Paciente:</strong> ${patientLine} <br/>
    <strong>Médico Solicitante:</strong> ${escapeHtml(doctorName || '—')} <br/>
    <strong>Rango del Reporte:</strong> ${escapeHtml(rangeLabel)} <br/>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha/Hora</th>
        <th>Estado</th>
        <th>Síntomas</th>
        <th class="center">Dolor</th>
        <th class="center">P.A. (MAP)</th>
        <th class="center">FC / SatO2</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    Este documento es un reporte informativo generado automáticamente. No sustituye el criterio médico oficial.
    <br/> ${patientInfo.id ? `ID de Paciente: ${escapeHtml(String(patientInfo.id))} | ` : ''}Generado por el Sistema de Monitoreo de Síntomas.
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const div: { textContent: string; innerHTML: string } = { textContent: text, innerHTML: '' };
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}
