import { fireEvent, render, screen } from '@testing-library/react-native';

import { seedFixtures } from '@/db/seed';
import { AssignedTasksScreen } from '@/features/tasks/components/AssignedTasksScreen';

import { createFakeTaskRepository } from '../test-utils/createFakeTaskRepository';

describe('<AssignedTasksScreen />', () => {
  it('renders deterministic assigned task data and summary counts', async () => {
    const tasks = seedFixtures.tasks.slice(0, 3);
    const repository = createFakeTaskRepository({ listAssignedTasks: async () => tasks });

    await render(<AssignedTasksScreen onSelectTask={jest.fn()} repository={repository} />);

    expect(await screen.findByText(tasks[0]?.title ?? '')).toBeVisible();
    expect(screen.getByText(tasks[1]?.title ?? '')).toBeVisible();
    expect(screen.getByLabelText('3 active tasks, 1 in progress, 2 high priority')).toBeVisible();
  });

  it('passes only the selected task ID to navigation', async () => {
    const task = seedFixtures.tasks.at(0);
    if (task == null) {
      throw new Error('Expected a deterministic task fixture.');
    }

    const onSelectTask = jest.fn();
    const repository = createFakeTaskRepository({ listAssignedTasks: async () => [task] });
    await render(<AssignedTasksScreen onSelectTask={onSelectTask} repository={repository} />);

    await fireEvent.press(
      await screen.findByRole('button', { name: new RegExp(`Open ${task.id}`) }),
    );

    expect(onSelectTask).toHaveBeenCalledWith(task.id);
    expect(onSelectTask).toHaveBeenCalledTimes(1);
  });

  it('shows a safe local database error state', async () => {
    const repository = createFakeTaskRepository({
      listAssignedTasks: async () => Promise.reject(new Error('test database failure')),
    });

    await render(<AssignedTasksScreen onSelectTask={jest.fn()} repository={repository} />);

    expect(await screen.findByText('Tasks could not be loaded')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
