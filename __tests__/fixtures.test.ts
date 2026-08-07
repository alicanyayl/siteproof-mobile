import { countSeedTasksByStatus, seedFixtures } from '@/db/seed';
import { seedFixtureSetSchema } from '@/features/tasks/domain/task';

describe('inspection fixture validation', () => {
  it('provides a deterministic, relationally valid Phase 1 data set', () => {
    expect(seedFixtures.tasks).toHaveLength(24);
    expect(seedFixtures.checklistItems).toHaveLength(138);
    expect(countSeedTasksByStatus('assigned')).toBe(20);
    expect(countSeedTasksByStatus('in_progress')).toBe(4);
    expect(countSeedTasksByStatus('completed')).toBe(0);

    const checklistCounts = new Map<string, number>();
    for (const item of seedFixtures.checklistItems) {
      checklistCounts.set(item.taskId, (checklistCounts.get(item.taskId) ?? 0) + 1);
    }

    for (const task of seedFixtures.tasks) {
      expect(checklistCounts.get(task.id)).toBeGreaterThanOrEqual(5);
      expect(checklistCounts.get(task.id)).toBeLessThanOrEqual(6);
    }
  });

  it('rejects malformed task identities before database insertion', () => {
    const firstTask = seedFixtures.tasks.at(0);
    if (firstTask == null) {
      throw new Error('Expected at least one deterministic task fixture.');
    }

    const result = seedFixtureSetSchema.safeParse({
      checklistItems: seedFixtures.checklistItems,
      tasks: [{ ...firstTask, id: 'invalid-task-id' }, ...seedFixtures.tasks.slice(1)],
    });

    expect(result.success).toBe(false);
  });
});
