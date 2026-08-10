import * as Print from 'expo-print';

import { escapeHtml } from '@/features/reports/utils/htmlEscape';
import type { TaskDetail, TaskEvidence } from '@/features/tasks/domain/task';

export type GeneratedReport = {
  filePath: string;
  generatedAtIso: string;
};

export function generateInspectionReportHtml(
  detail: TaskDetail,
  generatedAtIso: string = new Date().toISOString(),
): string {
  const { task, checklist, evidenceList, initialLocationCheck } = detail;
  const completedCount = checklist.filter((item) => item.checked).length;
  const totalCount = checklist.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const checklistRowsHtml = checklist
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; width: 60px;">
        ${item.checked ? '<span style="color: #059669; font-weight: bold;">[&#10003;]</span>' : '<span style="color: #94A3B8;">[ ]</span>'}
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0;">
        ${escapeHtml(item.label)}
        ${item.required ? ' <span style="color: #DC2626; font-size: 11px; font-weight: 600;">(Required)</span>' : ''}
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #64748B; font-size: 12px;">
        ${item.checked ? 'Completed' : 'Pending'}
      </td>
    </tr>
  `,
    )
    .join('');

  let locationHtml = `
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
      <p style="margin: 0; color: #64748B; font-size: 13px;">No location verification record acquired for this task.</p>
    </div>
  `;

  if (initialLocationCheck != null) {
    const isVerified = initialLocationCheck.verified;
    const badgeColor = isVerified ? '#059669' : '#D97706';
    const badgeBg = isVerified ? '#ECFDF5' : '#FFFBEB';
    const statusText = isVerified ? 'Verified On-Site' : 'Outside Verification Area';

    locationHtml = `
      <div style="background-color: ${badgeBg}; border: 1px solid ${badgeColor}; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: ${badgeColor}; font-size: 14px;">${statusText}</strong>
          <span style="color: #64748B; font-size: 12px;">Recorded: ${escapeHtml(new Date(initialLocationCheck.createdAt).toLocaleString())}</span>
        </div>
        <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #64748B;">Target Site Coords:</td>
            <td style="padding: 4px 0; font-family: monospace;">${task.latitude.toFixed(5)}, ${task.longitude.toFixed(5)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748B;">Measured Device Coords:</td>
            <td style="padding: 4px 0; font-family: monospace;">${initialLocationCheck.latitude.toFixed(5)}, ${initialLocationCheck.longitude.toFixed(5)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748B;">Calculated Distance:</td>
            <td style="padding: 4px 0; font-weight: 600;">${initialLocationCheck.distanceMeters.toFixed(1)} m</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748B;">Required Radius / Device Accuracy:</td>
            <td style="padding: 4px 0;">${initialLocationCheck.verificationRadiusMeters} m radius / &plusmn;${initialLocationCheck.accuracyMeters != null ? Math.round(initialLocationCheck.accuracyMeters) : '?'} m accuracy</td>
          </tr>
        </table>
      </div>
    `;
  }

  const evidence = evidenceList ?? [];
  const evidenceCount = evidence.length;
  const evidenceSummaryHtml = `
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #1E293B; font-size: 14px;">Photo Evidence Records</strong>
        <span style="background-color: #E2E8F0; color: #334155; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">${evidenceCount} ${evidenceCount === 1 ? 'photo' : 'photos'} captured</span>
      </div>
      ${
        evidenceCount > 0
          ? `
        <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 12px; color: #475569;">
          ${evidence
            .map(
              (e: TaskEvidence) => `
            <li style="margin-bottom: 4px;">
              ID: <code style="font-family: monospace;">${escapeHtml(e.id)}</code> &bull; Captured: ${escapeHtml(new Date(e.createdAt).toLocaleString())}
            </li>
          `,
            )
            .join('')}
        </ul>
      `
          : '<p style="margin: 8px 0 0 0; color: #64748B; font-size: 12px;">No photo evidence captured for this task.</p>'
      }
    </div>
  `;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>SiteProof Inspection Report - ${escapeHtml(task.id)}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0F172A;
        line-height: 1.5;
        padding: 32px;
        background-color: #FFFFFF;
      }
      .header {
        border-bottom: 2px solid #0284C7;
        padding-bottom: 16px;
        margin-bottom: 24px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .brand {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: 1px;
        color: #0284C7;
        margin: 0;
      }
      .report-title {
        font-size: 14px;
        color: #64748B;
        margin: 4px 0 0 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .task-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        font-size: 13px;
      }
      .meta-item {
        color: #475569;
      }
      .meta-item strong {
        color: #0F172A;
      }
      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: #0F172A;
        margin: 24px 0 12px 0;
        padding-bottom: 6px;
        border-bottom: 1px solid #E2E8F0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 24px;
        font-size: 13px;
      }
      th {
        background-color: #F1F5F9;
        color: #475569;
        text-align: left;
        padding: 10px 12px;
        font-weight: 600;
      }
      .footer {
        margin-top: 40px;
        padding-top: 16px;
        border-top: 1px solid #E2E8F0;
        font-size: 11px;
        color: #94A3B8;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="brand">SITEPROOF</h1>
        <p class="report-title">Field Inspection Report</p>
      </div>
      <div style="text-align: right; font-size: 12px; color: #64748B;">
        Generated: ${escapeHtml(new Date(generatedAtIso).toLocaleString())}
      </div>
    </div>

    <div class="task-card">
      <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #0F172A;">${escapeHtml(task.title)}</h2>
      <div class="meta-grid">
        <div class="meta-item"><strong>Task ID:</strong> ${escapeHtml(task.id)}</div>
        <div class="meta-item"><strong>Status:</strong> ${escapeHtml(task.status.replace('_', ' '))}</div>
        <div class="meta-item"><strong>Site Name:</strong> ${escapeHtml(task.siteName)}</div>
        <div class="meta-item"><strong>Priority:</strong> ${escapeHtml(task.priority)}</div>
        <div class="meta-item"><strong>Area:</strong> ${escapeHtml(task.area)}</div>
        <div class="meta-item"><strong>Inspection Type:</strong> ${escapeHtml(task.inspectionType)}</div>
      </div>
    </div>

    <h3 class="section-title">Checklist Completion (${completedCount}/${totalCount} - ${completionPercentage}%)</h3>
    <table>
      <thead>
        <tr>
          <th style="text-align: center; width: 60px;">State</th>
          <th>Checklist Requirement</th>
          <th style="text-align: right;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${checklistRowsHtml}
      </tbody>
    </table>

    <h3 class="section-title">Location Verification</h3>
    ${locationHtml}

    <h3 class="section-title">Inspection Evidence</h3>
    ${evidenceSummaryHtml}

    <div class="footer">
      Generated locally by SiteProof. No remote backend is used. &bull; ${escapeHtml(task.id)}
    </div>
  </body>
</html>`;
}

export async function createInspectionPdfReport(
  detail: TaskDetail,
  generatedAtIso?: string,
): Promise<GeneratedReport> {
  const html = generateInspectionReportHtml(detail, generatedAtIso);
  const result = await Print.printToFileAsync({ html });
  return {
    filePath: result.uri,
    generatedAtIso: generatedAtIso ?? new Date().toISOString(),
  };
}
