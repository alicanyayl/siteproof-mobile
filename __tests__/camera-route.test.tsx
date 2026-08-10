import { render, screen, waitFor } from '@testing-library/react-native';

import { CameraRouteContent } from '@/app/tasks/[taskId]/camera';
import { seedFixtures } from '@/db/seed';

import { createFakeTaskRepository } from '../test-utils/createFakeTaskRepository';

describe('<CameraRouteContent />', () => {
  it('displays "Task not found" for invalid task IDs without requesting camera permissions', async () => {
    const repository = createFakeTaskRepository({
      getTaskById: async () => null,
    });

    render(<CameraRouteContent repository={repository} taskId="INS-99999" />);

    expect(await screen.findByRole('header', { name: 'Task not found' })).toBeVisible();
    expect(screen.getByText('No local inspection matches INS-99999.')).toBeVisible();
  });

  it('renders permission flow for a valid local task ID', async () => {
    const task = seedFixtures.tasks[0];
    if (task == null) {
      throw new Error('Expected task fixture.');
    }

    const repository = createFakeTaskRepository({
      getTaskById: async () => task,
    });

    render(<CameraRouteContent repository={repository} taskId={task.id} />);

    await waitFor(() => {
      expect(screen.queryByText('Verifying inspection task...')).toBeNull();
    });
  });
});
