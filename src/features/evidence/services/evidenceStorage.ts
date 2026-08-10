import { Directory, File, Paths } from 'expo-file-system';

export type PersistEvidenceParams = {
  sourceUri: string;
  taskId: string;
};

export type PersistEvidenceResult = {
  fileUri: string;
};

/**
 * Ensures that the app evidence directory exists under Paths.document.
 */
export function getEvidenceDirectory(): Directory {
  const evidenceDir = new Directory(Paths.document, 'SiteProof', 'evidence');
  if (!evidenceDir.exists) {
    evidenceDir.create({ idempotent: true, intermediates: true });
  }
  return evidenceDir;
}

/**
 * Generates a unique, deterministic filename for evidence files.
 */
export function generateEvidenceFileName(taskId: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${taskId}-${timestamp}-${randomSuffix}.jpg`;
}

/**
 * Copies a captured camera photo file from sourceUri to the persistent evidence directory.
 * Verifies that the destination file exists before returning its file URI.
 */
export async function persistEvidenceFile({
  sourceUri,
  taskId,
}: PersistEvidenceParams): Promise<PersistEvidenceResult> {
  const evidenceDir = getEvidenceDirectory();
  const fileName = generateEvidenceFileName(taskId);
  const destFile = new File(evidenceDir, fileName);
  const sourceFile = new File(sourceUri);

  sourceFile.copy(destFile);

  if (!destFile.exists) {
    throw new Error('Failed to persist photo evidence: Destination file does not exist after copy.');
  }

  return {
    fileUri: destFile.uri,
  };
}

/**
 * Safely removes an evidence file if SQLite metadata insert fails or during cleanup.
 */
export function deleteEvidenceFile(fileUri: string): void {
  try {
    const file = new File(fileUri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('Failed to delete orphan evidence file:', fileUri, error);
  }
}

/**
 * Checks whether an evidence file exists on the local file system.
 */
export function checkEvidenceFileExists(fileUri: string): boolean {
  try {
    const file = new File(fileUri);
    return file.exists;
  } catch {
    return false;
  }
}
