import { router, usePathname } from 'expo-router';

import { AssignedTasksScreen } from '@/features/tasks/components/AssignedTasksScreen';
import { useTaskRepository } from '@/features/tasks/hooks/useTaskRepository';

export default function AssignedTasksRoute() {
  const pathname = usePathname();
  const repository = useTaskRepository();

  return (
    <AssignedTasksScreen
      onSelectTask={(taskId) => router.push({ pathname: '/tasks/[taskId]', params: { taskId } })}
      refreshKey={pathname}
      repository={repository}
    />
  );
}
