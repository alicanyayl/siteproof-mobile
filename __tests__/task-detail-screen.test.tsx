import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { seedFixtures } from '@/db/seed';
import { TaskDetailScreen } from '@/features/tasks/components/TaskDetailScreen';
import type { TaskDetail } from '@/features/tasks/domain/task';

import { createFakeTaskRepository } from '../test-utils/createFakeTaskRepository';

function createTaskDetail(): TaskDetail {
  const task = seedFixtures.tasks.at(0);
  if (task == null) {
    throw new Error('Expected a deterministic task fixture.');
  }

  return {
    checklist: seedFixtures.checklistItems.filter((item) => item.taskId === task.id),
    task,
  };
}

describe('<TaskDetailScreen />', () => {
  it('exposes checked and unchecked checklist state accessibly', async () => {
    const detail = createTaskDetail();
    const repository = createFakeTaskRepository({ getTaskDetail: async () => detail });

    await render(
      <TaskDetailScreen onBack={jest.fn()} repository={repository} taskId={detail.task.id} />,
    );

    const checkedItem = detail.checklist.find((item) => item.checked);
    const uncheckedItem = detail.checklist.find((item) => !item.checked);
    if (checkedItem == null || uncheckedItem == null) {
      throw new Error('Expected checked and unchecked fixture items.');
    }

    expect(await screen.findByRole('checkbox', { name: new RegExp(checkedItem.label) })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: new RegExp(uncheckedItem.label) })).not.toBeChecked();
  });

  it('invokes persistence and reloads the saved checklist state', async () => {
    let detail = createTaskDetail();
    const uncheckedItem = detail.checklist.find((item) => !item.checked);
    if (uncheckedItem == null) {
      throw new Error('Expected an unchecked fixture item.');
    }

    const setChecklistItemChecked = jest.fn(async (itemId: string, checked: boolean) => {
      detail = {
        ...detail,
        checklist: detail.checklist.map((item) => (item.id === itemId ? { ...item, checked } : item)),
      };
    });
    const repository = createFakeTaskRepository({
      getTaskDetail: async () => detail,
      setChecklistItemChecked,
    });

    await render(
      <TaskDetailScreen onBack={jest.fn()} repository={repository} taskId={detail.task.id} />,
    );
    await fireEvent.press(
      await screen.findByRole('checkbox', { name: new RegExp(uncheckedItem.label) }),
    );

    await waitFor(() => {
      expect(setChecklistItemChecked).toHaveBeenCalledWith(uncheckedItem.id, true);
      expect(screen.getByRole('checkbox', { name: new RegExp(uncheckedItem.label) })).toBeChecked();
    });
    expect(screen.getByText('Draft saved on this device.')).toBeVisible();
  });

  it('handles an unknown task ID without crashing', async () => {
    const repository = createFakeTaskRepository({ getTaskDetail: async () => null });

    await render(
      <TaskDetailScreen onBack={jest.fn()} repository={repository} taskId="INS-99999" />,
    );

    expect(await screen.findByRole('header', { name: 'Task not found' })).toBeVisible();
    expect(screen.getByText('No local inspection matches INS-99999.')).toBeVisible();
  });
});
