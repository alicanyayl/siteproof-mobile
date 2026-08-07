import { router, useLocalSearchParams } from 'expo-router';

import { TaskDetailScreen } from '@/features/tasks/components/TaskDetailScreen';
import { useTaskRepository } from '@/features/tasks/hooks/useTaskRepository';

export default function TaskDetailRoute() {
  const params = useLocalSearchParams<{ taskId?: string | string[] }>();
  const repository = useTaskRepository();
  const taskId = Array.isArray(params.taskId) ? (params.taskId[0] ?? '') : (params.taskId ?? '');

  return <TaskDetailScreen key={taskId} onBack={() => router.back()} repository={repository} taskId={taskId} />;
}
