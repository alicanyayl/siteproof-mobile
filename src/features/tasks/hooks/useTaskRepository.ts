import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';

import { SQLiteTaskRepository } from '@/features/tasks/data/sqliteTaskRepository';
import type { TaskRepository } from '@/features/tasks/domain/task';

export function useTaskRepository(): TaskRepository {
  const database = useSQLiteContext();

  return useMemo(() => new SQLiteTaskRepository(database), [database]);
}
