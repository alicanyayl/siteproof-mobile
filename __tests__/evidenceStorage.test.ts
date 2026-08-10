import {
  deleteEvidenceFile,
  generateEvidenceFileName,
} from '@/features/evidence/services/evidenceStorage';

describe('evidenceStorage service', () => {
  it('generates a unique evidence filename containing task ID and .jpg extension', () => {
    const filename = generateEvidenceFileName('INS-00001');
    expect(filename).toMatch(/^INS-00001-\d+-[a-z0-9]+\.jpg$/);
  });

  it('safely handles orphan file deletion without throwing', () => {
    expect(() => deleteEvidenceFile('file:///nonexistent/orphan.jpg')).not.toThrow();
  });
});

