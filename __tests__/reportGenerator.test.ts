import * as Print from 'expo-print';

import {
  createInspectionPdfReport,
  generateInspectionReportHtml,
} from '@/features/reports/services/reportGenerator';
import { escapeHtml } from '@/features/reports/utils/htmlEscape';
import type { TaskDetail } from '@/features/tasks/domain/task';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///app/cache/report.pdf' }),
}));

describe('reportGenerator', () => {
  const sampleTaskDetail: TaskDetail = {
    checklist: [
      {
        checked: true,
        id: 'INS-10044-CHK-01',
        label: 'Safety barrier verified',
        position: 1,
        required: true,
        taskId: 'INS-10044',
        updatedAt: '2026-08-10T08:00:00.000Z',
      },
      {
        checked: false,
        id: 'INS-10044-CHK-02',
        label: 'Housekeeping clear',
        position: 2,
        required: false,
        taskId: 'INS-10044',
        updatedAt: '2026-08-10T08:00:00.000Z',
      },
    ],
    evidenceList: [
      {
        createdAt: '2026-08-10T08:00:00.000Z',
        fileUri: 'file:///photos/photo-1.jpg',
        id: 'EVD-1',
        taskId: 'INS-10044',
      },
    ],
    initialLocationCheck: {
      accuracyMeters: 4.5,
      createdAt: '2026-08-10T08:05:00.000Z',
      distanceMeters: 18.2,
      id: 'LOC-1',
      latitude: 41.0082,
      longitude: 28.9784,
      taskId: 'INS-10044',
      verificationRadiusMeters: 100,
      verified: true,
    },
    task: {
      area: 'Zone A',
      dueAt: '2026-08-15T00:00:00.000Z',
      id: 'INS-10044',
      inspectionType: 'structural',
      latitude: 41.0082,
      longitude: 28.9784,
      priority: 'high',
      siteName: 'Metro Hub Construction',
      status: 'in_progress',
      title: 'Structural Steel Pre-Pour Inspection',
      updatedAt: '2026-08-10T08:00:00.000Z',
      verificationRadiusMeters: 100,
    },
  };

  describe('escapeHtml', () => {
    it('escapes special HTML characters properly', () => {
      expect(escapeHtml('A & B < C > D "quote" \'single\'')).toBe(
        'A &amp; B &lt; C &gt; D &quot;quote&quot; &#039;single&#039;',
      );
    });

    it('handles empty text gracefully', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('generateInspectionReportHtml', () => {
    it('generates HTML containing task metadata, checklist, location and evidence summary', () => {
      const html = generateInspectionReportHtml(sampleTaskDetail, '2026-08-10T10:00:00.000Z');

      expect(html).toContain('Structural Steel Pre-Pour Inspection');
      expect(html).toContain('INS-10044');
      expect(html).toContain('Metro Hub Construction');
      expect(html).toContain('Zone A');
      expect(html).toContain('structural');
      expect(html).toContain('Safety barrier verified');
      expect(html).toContain('Housekeeping clear');
      expect(html).toContain('1 of 2 checked');
      expect(html).toContain('50%');
      expect(html).toContain('Verified On-Site');
      expect(html).toContain('18.2 m');
      expect(html).toContain('1 photo');
      expect(html).toContain('EVD-1');
      expect(html).toContain('Generated locally by SiteProof. No remote backend is used.');
    });
  });

  describe('createInspectionPdfReport', () => {
    it('invokes Print.printToFileAsync with generated HTML', async () => {
      const report = await createInspectionPdfReport(sampleTaskDetail, '2026-08-10T10:00:00.000Z');

      expect(Print.printToFileAsync).toHaveBeenCalledWith({
        html: expect.stringContaining('SITEPROOF'),
      });
      expect(report.filePath).toBe('file:///app/cache/report.pdf');
    });
  });
});
