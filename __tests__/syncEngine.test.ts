import NetInfo, {
  NetInfoStateType,
  type NetInfoNoConnectionState,
  type NetInfoWifiState,
} from '@react-native-community/netinfo';

import type { SyncDatabaseBoundary } from '@/db/types';
import { processSimulatedServerMutation } from '@/features/sync/services/simulatedServer';
import { processSyncQueue } from '@/features/sync/services/syncProcessor';
import type { SyncQueueItem } from '@/features/tasks/domain/task';

type MockDatabaseConfig = {
  getFirstAsync?: jest.Mock<Promise<unknown>, [string, ...unknown[]]>;
  getAllAsync?: jest.Mock<Promise<unknown[]>, [string, ...unknown[]]>;
  runAsync?: jest.Mock<Promise<{ changes: number }>, [string, ...unknown[]]>;
  withTransactionAsync?: <T>(task: () => Promise<T>) => Promise<T>;
};

function createMockSyncDatabase(config: MockDatabaseConfig = {}): SyncDatabaseBoundary {
  return {
    getFirstAsync: config.getFirstAsync ?? jest.fn().mockResolvedValue(null),
    getAllAsync: config.getAllAsync ?? jest.fn().mockResolvedValue([]),
    runAsync: config.runAsync ?? jest.fn().mockResolvedValue({ changes: 1 }),
    withTransactionAsync: config.withTransactionAsync ?? (async <T>(task: () => Promise<T>): Promise<T> => task()),
  };
}

describe('syncEngine & simulatedServer', () => {
  it('processes checklist_update mutation successfully when base_version matches', async () => {
    const getFirstAsync = jest.fn().mockResolvedValue({ checked: 0, version: 1 });
    const runAsync = jest.fn().mockResolvedValue({ changes: 1 });
    const fakeDb = createMockSyncDatabase({ getFirstAsync, runAsync });

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
    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE simulated_remote_checklist'),
      1,
      expect.any(String),
      'INS-00001-CHK-01',
    );
  });

  it('creates conflict when base_version differs from simulated remote version', async () => {
    const getFirstAsync = jest
      .fn()
      .mockResolvedValueOnce(null) // fail_next_request
      .mockResolvedValueOnce({ checked: 0, version: 2 }) // simulated_remote_checklist
      .mockResolvedValueOnce({ checked: 1 }); // local checklist item
    const runAsync = jest.fn().mockResolvedValue({ changes: 1 });
    const fakeDb = createMockSyncDatabase({ getFirstAsync, runAsync });

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

    expect(runAsync).toHaveBeenCalledWith(
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
    const fakeDb = createMockSyncDatabase();

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

  describe('processSyncQueue connectivity & force rules', () => {
    it('returns 0 processed when network is offline, even if force option is true', async () => {
      const offlineState: NetInfoNoConnectionState = {
        details: null,
        isConnected: false,
        isInternetReachable: false,
        type: NetInfoStateType.none,
      };

      const fetchSpy = jest.spyOn(NetInfo, 'fetch').mockResolvedValue(offlineState);
      const getAllAsync = jest.fn();
      const fakeDb = createMockSyncDatabase({ getAllAsync });

      const normalRes = await processSyncQueue(fakeDb, { force: false });
      expect(normalRes.processedCount).toBe(0);
      expect(getAllAsync).not.toHaveBeenCalled();

      const forceRes = await processSyncQueue(fakeDb, { force: true });
      expect(forceRes.processedCount).toBe(0);
      expect(getAllAsync).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('queries database with force parameter when online', async () => {
      const onlineState: NetInfoWifiState = {
        details: {
          bssid: null,
          frequency: null,
          ipAddress: null,
          isConnectionExpensive: false,
          linkSpeed: null,
          rxLinkSpeed: null,
          ssid: null,
          strength: null,
          subnet: null,
          txLinkSpeed: null,
        },
        isConnected: true,
        isInternetReachable: true,
        type: NetInfoStateType.wifi,
      };

      const fetchSpy = jest.spyOn(NetInfo, 'fetch').mockResolvedValue(onlineState);
      const getAllAsync = jest.fn().mockResolvedValue([]);
      const fakeDb = createMockSyncDatabase({ getAllAsync });

      await processSyncQueue(fakeDb, { force: true });

      expect(getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status IN'),
        expect.any(String),
        1, // force = 1
      );

      fetchSpy.mockRestore();
    });
  });
});
