import * as Sharing from 'expo-sharing';

import { shareInspectionReport } from '@/features/reports/services/reportSharing';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

describe('reportSharing', () => {
  const samplePdfPath = 'file:///cache/report.pdf';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handles unavailable sharing gracefully', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);

    const result = await shareInspectionReport(samplePdfPath);

    expect(result.outcome).toBe('unavailable');
    if (result.outcome === 'unavailable') {
      expect(result.reason).toContain('Native sharing is not supported');
    }
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('invokes Sharing.shareAsync with pdf parameters when available', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await shareInspectionReport(samplePdfPath);

    expect(result.outcome).toBe('shared');
    expect(Sharing.shareAsync).toHaveBeenCalledWith(samplePdfPath, {
      dialogTitle: 'Share Inspection Report PDF',
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
  });

  it('handles sharing error gracefully', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);
    (Sharing.shareAsync as jest.Mock).mockRejectedValueOnce(new Error('User cancelled share'));

    const result = await shareInspectionReport(samplePdfPath);

    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') {
      expect(result.error).toBe('User cancelled share');
    }
  });
});
