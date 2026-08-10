import type { SQLiteDatabase } from 'expo-sqlite';

import type { SyncDatabaseBoundary, SyncQueueRow } from '@/db/types';
import { getCurrentNetworkStatus } from '@/features/sync/services/connectivityService';
import { calculateNextAttemptAtIso } from '@/features/sync/services/retryPolicy';
import { processSimulatedServerMutation } from '@/features/sync/services/simulatedServer';
import type { SyncQueueItem } from '@/features/tasks/domain/task';

let isSyncProcessorRunning = false;

export function isProcessorRunning(): boolean {
  return isSyncProcessorRunning;
}

export type SyncProcessorResult = {
  conflictedCount: number;
  failedCount: number;
  processedCount: number;
  syncedCount: number;
};

export async function processSyncQueue(
  db: SQLiteDatabase | SyncDatabaseBoundary,
  options: { force?: boolean } = {},
): Promise<SyncProcessorResult> {
  if (isSyncProcessorRunning) {
    return { conflictedCount: 0, failedCount: 0, processedCount: 0, syncedCount: 0 };
  }

  isSyncProcessorRunning = true;
  const result: SyncProcessorResult = {
    conflictedCount: 0,
    failedCount: 0,
    processedCount: 0,
    syncedCount: 0,
  };

  try {
    const networkStatus = await getCurrentNetworkStatus();
    if (networkStatus !== 'online') {
      return result;
    }

    const nowIso = new Date().toISOString();
    const rows = await db.getAllAsync<SyncQueueRow>(
      `SELECT
         id,
         mutation_type AS mutationType,
         entity_id AS entityId,
         task_id AS taskId,
         payload_json AS payloadJson,
         base_version AS baseVersion,
         status,
         attempt_count AS attemptCount,
         next_attempt_at AS nextAttemptAt,
         last_error AS lastError,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM sync_queue
       WHERE status IN ('pending', 'failed')
         AND (next_attempt_at IS NULL OR next_attempt_at <= ? OR ? = 1)
       ORDER BY created_at ASC`,
      nowIso,
      options.force ? 1 : 0,
    );

    for (const item of rows) {
      const queueItem: SyncQueueItem = {
        attemptCount: item.attemptCount,
        baseVersion: item.baseVersion,
        createdAt: item.createdAt,
        entityId: item.entityId,
        id: item.id,
        lastError: item.lastError,
        mutationType: item.mutationType as SyncQueueItem['mutationType'],
        nextAttemptAt: item.nextAttemptAt,
        payloadJson: item.payloadJson,
        status: item.status as SyncQueueItem['status'],
        taskId: item.taskId,
        updatedAt: item.updatedAt,
      };

      result.processedCount++;
      const currentNowIso = new Date().toISOString();

      await db.runAsync(
        `UPDATE sync_queue SET status = 'syncing', updated_at = ? WHERE id = ?`,
        currentNowIso,
        queueItem.id,
      );

      try {
        const outcome = await processSimulatedServerMutation(db, queueItem);
        const completionIso = new Date().toISOString();

        if (outcome.outcome === 'synced') {
          await db.runAsync(
            `UPDATE sync_queue
             SET status = 'synced', last_error = NULL, updated_at = ?
             WHERE id = ?`,
            completionIso,
            queueItem.id,
          );
          result.syncedCount++;
        } else {
          await db.runAsync(
            `UPDATE sync_queue
             SET status = 'conflict', updated_at = ?
             WHERE id = ?`,
            completionIso,
            queueItem.id,
          );
          result.conflictedCount++;
        }
      } catch (err) {
        const failureIso = new Date().toISOString();
        const nextAttempts = queueItem.attemptCount + 1;
        const nextAttemptAt = calculateNextAttemptAtIso(nextAttempts);
        const errorMessage = err instanceof Error ? err.message : 'Sync processing failed.';

        await db.runAsync(
          `UPDATE sync_queue
           SET status = 'failed',
               attempt_count = ?,
               next_attempt_at = ?,
               last_error = ?,
               updated_at = ?
           WHERE id = ?`,
          nextAttempts,
          nextAttemptAt,
          errorMessage,
          failureIso,
          queueItem.id,
        );
        result.failedCount++;
      }
    }
  } finally {
    isSyncProcessorRunning = false;
  }

  return result;
}
