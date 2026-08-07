import type { TaskRepository } from '@/features/tasks/domain/task';

export function createFakeTaskRepository(overrides: Partial<TaskRepository> = {}): TaskRepository {
  return {
    getChecklistForTask: async () => [],
    getTaskById: async () => null,
    getTaskDetail: async () => null,
    listAssignedTasks: async () => [],
    setChecklistItemChecked: async () => undefined,
    ...overrides,
  };
}
