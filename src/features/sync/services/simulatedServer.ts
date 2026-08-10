import type { SQLiteDatabase } from 'expo-sqlite';

import type { SyncDatabaseBoundary } from '@/db/types';
import type { SyncQueueItem } from '@/features/tasks/domain/task';

export type SimulationOutcome =
  | { conflictId: string; outcome: 'conflict' }
  | { outcome: 'synced' };

export async function setFailNextRequest(db: SQLiteDatabase | SyncDatabaseBoundary, fail: boolean): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_simulation_flags (flag_name, flag_value)
     VALUES ('fail_next_request', ?)
     ON CONFLICT(flag_name) DO UPDATE SET flag_value = excluded.flag_value`,
    fail ? 1 : 0,
  );
}

export async function getFailNextRequestStatus(db: SQLiteDatabase | SyncDatabaseBoundary): Promise<boolean> {
  const row = await db.getFirstAsync<{ flag_value: number }>(
    `SELECT flag_value FROM sync_simulation_flags WHERE flag_name = 'fail_next_request'`,
  );
  return row?.flag_value === 1;
}

export async function injectRemoteChecklistConflict(
  db: SQLiteDatabase | SyncDatabaseBoundary,
  itemId: string,
): Promise<{ newVersion: number; remoteChecked: boolean }> {
  const nowIso = new Date().toISOString();
  let result = { newVersion: 1, remoteChecked: true };

  const performTx = async () => {
    const existing = await db.getFirstAsync<{ checked: number; version: number }>(
      'SELECT checked, version FROM simulated_remote_checklist WHERE item_id = ?',
      itemId,
    );

    if (existing != null) {
      const nextChecked = existing.checked === 1 ? 0 : 1;
      const nextVersion = existing.version + 1;

      await db.runAsync(
        `UPDATE simulated_remote_checklist
         SET checked = ?, version = ?, updated_at = ?
         WHERE item_id = ?`,
        nextChecked,
        nextVersion,
        nowIso,
        itemId,
      );

      result = { newVersion: nextVersion, remoteChecked: nextChecked === 1 };
    } else {
      await db.runAsync(
        `INSERT INTO simulated_remote_checklist (item_id, checked, version, updated_at)
         VALUES (?, 1, 2, ?)`,
        itemId,
        nowIso,
      );
      result = { newVersion: 2, remoteChecked: true };
    }
  };

  if (typeof db.withTransactionAsync === 'function') {
    await db.withTransactionAsync(performTx);
  } else {
    await performTx();
  }

  return result;
}

export async function processSimulatedServerMutation(
  db: SQLiteDatabase | SyncDatabaseBoundary,
  queueItem: SyncQueueItem,
): Promise<SimulationOutcome> {
  const nowIso = new Date().toISOString();

  // Check fail_next_request simulation flag
  const failNext = await getFailNextRequestStatus(db);
  if (failNext) {
    await setFailNextRequest(db, false);
    throw new Error('Simulated server connection failure / timeout.');
  }

  if (queueItem.mutationType === 'checklist_update') {
    const payload = JSON.parse(queueItem.payloadJson) as { checked: boolean; itemId: string };

    const remoteRow = await db.getFirstAsync<{ checked: number; version: number }>(
      'SELECT checked, version FROM simulated_remote_checklist WHERE item_id = ?',
      payload.itemId,
    );

    const remoteVersion = remoteRow?.version ?? 1;
    const remoteChecked = remoteRow?.checked === 1;

    // Check version match
    if (queueItem.baseVersion === remoteVersion) {
      // Version matches! Apply update to simulated server and increment version
      await db.runAsync(
        `UPDATE simulated_remote_checklist
         SET checked = ?, version = version + 1, updated_at = ?
         WHERE item_id = ?`,
        payload.checked ? 1 : 0,
        nowIso,
        payload.itemId,
      );

      return { outcome: 'synced' };
    }

    // Version mismatch! Version conflict detected
    const conflictId = `CNF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const localRow = await db.getFirstAsync<{ checked: number }>(
      'SELECT checked FROM checklist_items WHERE id = ?',
      payload.itemId,
    );
    const localChecked = localRow?.checked === 1;

    await db.runAsync(
      `INSERT INTO sync_conflicts (
         id, queue_id, task_id, item_id, local_checked, remote_checked, remote_version, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      conflictId,
      queueItem.id,
      queueItem.taskId,
      payload.itemId,
      localChecked ? 1 : 0,
      remoteChecked ? 1 : 0,
      remoteVersion,
      nowIso,
    );

    return { conflictId, outcome: 'conflict' };
  }

  // evidence_added and location_check_added are deterministically accepted
  return { outcome: 'synced' };
}
