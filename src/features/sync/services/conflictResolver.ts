import type { SQLiteDatabase } from 'expo-sqlite';

import type { ConflictResolution } from '@/features/tasks/domain/task';

export async function resolveSyncConflict(
  db: SQLiteDatabase,
  conflictId: string,
  resolution: ConflictResolution,
): Promise<void> {
  const nowIso = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    const conflict = await db.getFirstAsync<{
      itemId: string;
      localChecked: number;
      queueId: string;
      remoteChecked: number;
      remoteVersion: number;
      taskId: string;
    }>(
      `SELECT
         queue_id AS queueId,
         task_id AS taskId,
         item_id AS itemId,
         local_checked AS localChecked,
         remote_checked AS remoteChecked,
         remote_version AS remoteVersion
       FROM sync_conflicts
       WHERE id = ?`,
      conflictId,
    );

    if (conflict == null) {
      throw new Error(`Conflict ${conflictId} not found.`);
    }

    if (resolution === 'keep_local') {
      // Keep Local: update queue item base_version to current simulated remote version and mark pending
      const remoteRow = await db.getFirstAsync<{ version: number }>(
        'SELECT version FROM simulated_remote_checklist WHERE item_id = ?',
        conflict.itemId,
      );
      const currentRemoteVersion = remoteRow?.version ?? conflict.remoteVersion;

      await db.runAsync(
        `UPDATE sync_queue
         SET base_version = ?,
             status = 'pending',
             attempt_count = 0,
             next_attempt_at = NULL,
             last_error = NULL,
             updated_at = ?
         WHERE id = ?`,
        currentRemoteVersion,
        nowIso,
        conflict.queueId,
      );

      await db.runAsync(
        `UPDATE sync_conflicts
         SET resolved_at = ?, resolution = 'keep_local'
         WHERE id = ?`,
        nowIso,
        conflictId,
      );
    } else if (resolution === 'use_remote') {
      // Use Remote: update local checklist_items without enqueuing a new outbound mutation
      await db.runAsync(
        `UPDATE checklist_items
         SET checked = ?, updated_at = ?
         WHERE id = ?`,
        conflict.remoteChecked,
        nowIso,
        conflict.itemId,
      );

      await db.runAsync(
        `UPDATE sync_queue
         SET status = 'synced', updated_at = ?
         WHERE id = ?`,
        nowIso,
        conflict.queueId,
      );

      await db.runAsync(
        `UPDATE sync_conflicts
         SET resolved_at = ?, resolution = 'use_remote'
         WHERE id = ?`,
        nowIso,
        conflictId,
      );
    }
  });
}
