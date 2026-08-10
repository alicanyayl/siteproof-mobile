import { render, screen } from '@testing-library/react-native';

import { CameraRouteContent } from '@/app/tasks/[taskId]/camera';
import { seedFixtures } from '@/db/seed';

import { createFakeTaskRepository } from '../test-utils/createFakeTaskRepository';

describe('<CameraRouteContent />', () => {
  it('displays "Task not found" for invalid task IDs without requesting camera permissions', async () => {
    const repository = createFakeTaskRepository({
      getTaskById: async () => null,
    });

    await render(<CameraRouteContent repository={repository} taskId="INS-99999" />);

    expect(await screen.findByText('Task not found')).toBeVisible();
    expect(screen.getByText('No local inspection matches INS-99999.')).toBeVisible();
  });

  it('verifies valid local task ID before proceeding to camera permissions flow', async () => {
    const task = seedFixtures.tasks[0];
    if (task == null) {
      throw new Error('Expected task fixture.');
    }

    const repository = createFakeTaskRepository({
      getTaskById: async () => task,
    });

    await render(<CameraRouteContent repository={repository} taskId={task.id} />);

    expect(await screen.findByText('Checking camera permissions...')).toBeVisible();
    expect(screen.queryByText('Task not found')).toBeNull();
  });
});
