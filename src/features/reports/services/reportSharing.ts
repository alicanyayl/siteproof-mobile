import * as Sharing from 'expo-sharing';

export type ShareResult =
  | { outcome: 'shared' }
  | { reason: string; outcome: 'unavailable' }
  | { error: string; outcome: 'error' };

export async function shareInspectionReport(pdfFilePath: string): Promise<ShareResult> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        outcome: 'unavailable',
        reason: 'Native sharing is not supported on this device or platform build.',
      };
    }

    await Sharing.shareAsync(pdfFilePath, {
      dialogTitle: 'Share Inspection Report PDF',
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });

    return { outcome: 'shared' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to share inspection report.';
    return {
      error: message,
      outcome: 'error',
    };
  }
}
