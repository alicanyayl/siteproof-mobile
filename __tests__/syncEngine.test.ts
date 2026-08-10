import { processSimulatedServerMutation } from '@/features/sync/services/simulatedServer';
import type { SyncQueueItem } from '@/features/tasks/domain/task';

describe('syncEngine & simulatedServer', () => {
  it('processes checklist_update mutation successfully when base_version matches', async () => {
    const fakeDb: any = {
      getFirstAsync: jest.fn().mockResolvedValue({ checked: 0, version: 1 }),
      runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    };

    const queueItem: SyncQueueItem = {
      attemptCount: 0,
      baseVersion: 1,
      createdAt: new Date().toISOString(),
      entityId: 'INS-00001-CHK-01',
      id: 'SEQ-1',
      lastError: null,
      mutationType: 'checklist_update',
      nextAttemptAt: null,
      payloadJson: JSON.stringify({ checked: true, itemId: 'INS-00001-CHK-01' }),
      status: 'pending',
      taskId: 'INS-00001',
      updatedAt: new Date().toISOString(),
    };

    const res = await processSimulatedServerMutation(fakeDb, queueItem);
    expect(res.outcome).toBe('synced');
    expect(fakeDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE simulated_remote_checklist'),
      1,
      expect.any(String),
      'INS-00001-CHK-01',
    );
  });

  it('creates conflict when base_version differs from simulated remote version', async () => {
    const fakeDb: any = {
      getFirstAsync: jest
        .fn()
        .mockResolvedValueOnce(null) // fail_next_request
        .mockResolvedValueOnce({ checked: 0, version: 2 }) // simulated_remote_checklist
        .mockResolvedValueOnce({ checked: 1 }), // local checklist item
      runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    };

    const queueItem: SyncQueueItem = {
      attemptCount: 0,
      baseVersion: 1, // Mismatch! Local baseVersion 1 vs Remote version 2
      createdAt: new Date().toISOString(),
      entityId: 'INS-00001-CHK-01',
      id: 'SEQ-1',
      lastError: null,
      mutationType: 'checklist_update',
      nextAttemptAt: null,
      payloadJson: JSON.stringify({ checked: true, itemId: 'INS-00001-CHK-01' }),
      status: 'pending',
      taskId: 'INS-00001',
      updatedAt: new Date().toISOString(),
    };

    const res = await processSimulatedServerMutation(fakeDb, queueItem);
    expect(res.outcome).toBe('conflict');
    if (res.outcome === 'conflict') {
      expect(res.conflictId).toMatch(/^CNF-/);
    }

    expect(fakeDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sync_conflicts'),
      expect.any(String),
      'SEQ-1',
      'INS-00001',
      'INS-00001-CHK-01',
      1,
      0,
      2,
      expect.any(String),
    );
  });

  it('accepts evidence_added and location_check_added without pretending image file upload', async () => {
    const fakeDb: any = {
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };

    const evidenceItem: SyncQueueItem = {
      attemptCount: 0,
      baseVersion: null,
      createdAt: new Date().toISOString(),
      entityId: 'EVD-1',
      id: 'SEQ-2',
      lastError: null,
      mutationType: 'evidence_added',
      nextAttemptAt: null,
      payloadJson: JSON.stringify({ evidenceId: 'EVD-1', fileUri: 'file:///local/photo.jpg' }),
      status: 'pending',
      taskId: 'INS-00001',
      updatedAt: new Date().toISOString(),
    };

    const res = await processSimulatedServerMutation(fakeDb, evidenceItem);
    expect(res.outcome).toBe('synced');
  });
});
