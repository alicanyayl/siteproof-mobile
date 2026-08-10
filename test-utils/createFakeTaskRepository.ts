import type { TaskRepository } from '@/features/tasks/domain/task';

export function createFakeTaskRepository(overrides: Partial<TaskRepository> = {}): TaskRepository {
  return {
    addEvidence: async (ev) => ({
      createdAt: new Date().toISOString(),
      fileUri: ev.fileUri,
      id: ev.id ?? 'EVD-1',
      taskId: ev.taskId,
    }),
    addLocationCheck: async (loc) => ({
      accuracyMeters: loc.accuracyMeters,
      createdAt: new Date().toISOString(),
      distanceMeters: loc.distanceMeters,
      id: loc.id ?? 'LOC-1',
      latitude: loc.latitude,
      longitude: loc.longitude,
      taskId: loc.taskId,
      verificationRadiusMeters: loc.verificationRadiusMeters,
      verified: loc.verified,
    }),
    getChecklistForTask: async () => [],
    getLatestLocationCheck: async () => null,
    getTaskById: async () => null,
    getTaskDetail: async () => null,
    listAssignedTasks: async () => [],
    listEvidenceForTask: async () => [],
    setChecklistItemChecked: async () => undefined,
    ...overrides,
  };
}

