import type { SQLiteDatabase } from 'expo-sqlite';

import type { ChecklistItemRow, SyncConflictRow, TaskEvidenceRow, TaskLocationCheckRow, TaskRow } from '@/db/types';
import {
  checklistItemSchema,
  inspectionTaskSchema,
  taskEvidenceSchema,
  taskLocationCheckSchema,
  type ChecklistItem,
  type InspectionTask,
  type SyncConflictItem,
  type SyncQueueItem,
  type SyncQueueSummary,
  type TaskDetail,
  type TaskEvidence,
  type TaskLocationCheck,
  type TaskRepository,
} from '@/features/tasks/domain/task';

const taskColumns = `
  id,
  title,
  site_name AS siteName,
  area,
  inspection_type AS inspectionType,
  priority,
  status,
  due_at AS dueAt,
  latitude,
  longitude,
  verification_radius_meters AS verificationRadiusMeters,
  updated_at AS updatedAt
`;

function mapTaskRow(row: TaskRow): InspectionTask {
  return inspectionTaskSchema.parse(row);
}

function mapChecklistItemRow(row: ChecklistItemRow): ChecklistItem {
  return checklistItemSchema.parse({
    ...row,
    checked: row.checked === 1,
    required: row.required === 1,
  });
}

function mapTaskEvidenceRow(row: TaskEvidenceRow): TaskEvidence {
  return taskEvidenceSchema.parse(row);
}

function mapTaskLocationCheckRow(row: TaskLocationCheckRow): TaskLocationCheck {
  return taskLocationCheckSchema.parse({
    ...row,
    verified: row.verified === 1,
  });
}

export class SQLiteTaskRepository implements TaskRepository {
  public constructor(private readonly db: SQLiteDatabase) {}

  public async listAssignedTasks(): Promise<InspectionTask[]> {
    const rows = await this.db.getAllAsync<TaskRow>(
      `SELECT ${taskColumns}
       FROM tasks
       WHERE status IN ('assigned', 'in_progress')
       ORDER BY
         CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
         due_at ASC,
         id ASC`,
    );

    return rows.map(mapTaskRow);
  }

  public async getTaskById(taskId: string): Promise<InspectionTask | null> {
    const row = await this.db.getFirstAsync<TaskRow>(
      `SELECT ${taskColumns}
       FROM tasks
       WHERE id = ?`,
      taskId,
    );

    return row == null ? null : mapTaskRow(row);
  }

  public async getChecklistForTask(taskId: string): Promise<ChecklistItem[]> {
    const rows = await this.db.getAllAsync<ChecklistItemRow>(
      `SELECT
         id,
         task_id AS taskId,
         label,
         position,
         required,
         checked,
         updated_at AS updatedAt
       FROM checklist_items
       WHERE task_id = ?
       ORDER BY position ASC, id ASC`,
      taskId,
    );

    return rows.map(mapChecklistItemRow);
  }

  public async getTaskDetail(taskId: string): Promise<TaskDetail | null> {
    const task = await this.getTaskById(taskId);
    if (task == null) {
      return null;
    }

    return {
      checklist: await this.getChecklistForTask(taskId),
      task,
    };
  }

  public async setChecklistItemChecked(itemId: string, checked: boolean): Promise<void> {
    const item = await this.db.getFirstAsync<{ taskId: string }>(
      'SELECT task_id AS taskId FROM checklist_items WHERE id = ?',
      itemId,
    );

    if (item == null) {
      throw new Error('Checklist item does not exist.');
    }

    const updatedAt = new Date().toISOString();

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        'UPDATE checklist_items SET checked = ?, updated_at = ? WHERE id = ?',
        checked ? 1 : 0,
        updatedAt,
        itemId,
      );
      await this.db.runAsync(
        `UPDATE tasks
         SET status = CASE WHEN status = 'assigned' THEN 'in_progress' ELSE status END,
             updated_at = ?
         WHERE id = ?`,
        updatedAt,
        item.taskId,
      );

      // Outbox Pattern: Coalesce or Insert sync_queue mutation
      const existingQueue = await this.db.getFirstAsync<{ id: string; baseVersion: number | null }>(
        `SELECT id, base_version AS baseVersion
         FROM sync_queue
         WHERE entity_id = ? AND mutation_type = 'checklist_update' AND status IN ('pending', 'failed')
         ORDER BY created_at DESC
         LIMIT 1`,
        itemId,
      );

      const payloadJson = JSON.stringify({ checked, itemId });

      if (existingQueue != null) {
        // Coalesce into existing unsent mutation, keeping original base_version
        await this.db.runAsync(
          `UPDATE sync_queue
           SET payload_json = ?,
               status = 'pending',
               attempt_count = 0,
               next_attempt_at = NULL,
               last_error = NULL,
               updated_at = ?
           WHERE id = ?`,
          payloadJson,
          updatedAt,
          existingQueue.id,
        );
      } else {
        // Fetch current remote version from simulated_remote_checklist
        const remoteRow = await this.db.getFirstAsync<{ version: number }>(
          'SELECT version FROM simulated_remote_checklist WHERE item_id = ?',
          itemId,
        );
        const baseVersion = remoteRow?.version ?? 1;

        const queueId = `SEQ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await this.db.runAsync(
          `INSERT INTO sync_queue (
             id, mutation_type, entity_id, task_id, payload_json, base_version, status, attempt_count, created_at, updated_at
           ) VALUES (?, 'checklist_update', ?, ?, ?, ?, 'pending', 0, ?, ?)`,
          queueId,
          itemId,
          item.taskId,
          payloadJson,
          baseVersion,
          updatedAt,
          updatedAt,
        );
      }
    });
  }

  public async listEvidenceForTask(taskId: string): Promise<TaskEvidence[]> {
    const rows = await this.db.getAllAsync<TaskEvidenceRow>(
      `SELECT
         id,
         task_id AS taskId,
         file_uri AS fileUri,
         created_at AS createdAt
       FROM task_evidence
       WHERE task_id = ?
       ORDER BY created_at DESC, id DESC`,
      taskId,
    );

    return rows.map(mapTaskEvidenceRow);
  }

  public async addEvidence(evidence: {
    fileUri: string;
    id?: string;
    taskId: string;
  }): Promise<TaskEvidence> {
    const id = evidence.id ?? `${evidence.taskId}-EVD-${Date.now()}`;
    const createdAt = new Date().toISOString();

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO task_evidence (id, task_id, file_uri, created_at)
         VALUES (?, ?, ?, ?)`,
        id,
        evidence.taskId,
        evidence.fileUri,
        createdAt,
      );

      // Outbox Pattern: metadata payload without raw photo bytes
      const queueId = `SEQ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const payloadJson = JSON.stringify({ createdAt, evidenceId: id, fileUri: evidence.fileUri });

      await this.db.runAsync(
        `INSERT INTO sync_queue (
           id, mutation_type, entity_id, task_id, payload_json, base_version, status, attempt_count, created_at, updated_at
         ) VALUES (?, 'evidence_added', ?, ?, ?, NULL, 'pending', 0, ?, ?)`,
        queueId,
        id,
        evidence.taskId,
        payloadJson,
        createdAt,
        createdAt,
      );
    });

    return mapTaskEvidenceRow({
      createdAt,
      fileUri: evidence.fileUri,
      id,
      taskId: evidence.taskId,
    });
  }

  public async getLatestLocationCheck(taskId: string): Promise<TaskLocationCheck | null> {
    const row = await this.db.getFirstAsync<TaskLocationCheckRow>(
      `SELECT
         id,
         task_id AS taskId,
         latitude,
         longitude,
         accuracy_meters AS accuracyMeters,
         distance_meters AS distanceMeters,
         verification_radius_meters AS verificationRadiusMeters,
         verified,
         created_at AS createdAt
       FROM task_location_checks
       WHERE task_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      taskId,
    );

    return row == null ? null : mapTaskLocationCheckRow(row);
  }

  public async addLocationCheck(check: {
    accuracyMeters: number | null;
    distanceMeters: number;
    id?: string;
    latitude: number;
    longitude: number;
    taskId: string;
    verificationRadiusMeters: number;
    verified: boolean;
  }): Promise<TaskLocationCheck> {
    const id = check.id ?? `${check.taskId}-LOC-${Date.now()}`;
    const createdAt = new Date().toISOString();

    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO task_location_checks (
           id,
           task_id,
           latitude,
           longitude,
           accuracy_meters,
           distance_meters,
           verification_radius_meters,
           verified,
           created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        check.taskId,
        check.latitude,
        check.longitude,
        check.accuracyMeters,
        check.distanceMeters,
        check.verificationRadiusMeters,
        check.verified ? 1 : 0,
        createdAt,
      );

      // Outbox Pattern: location check metadata
      const queueId = `SEQ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const payloadJson = JSON.stringify({
        checkId: id,
        createdAt,
        distanceMeters: check.distanceMeters,
        verified: check.verified,
      });

      await this.db.runAsync(
        `INSERT INTO sync_queue (
           id, mutation_type, entity_id, task_id, payload_json, base_version, status, attempt_count, created_at, updated_at
         ) VALUES (?, 'location_check_added', ?, ?, ?, NULL, 'pending', 0, ?, ?)`,
        queueId,
        id,
        check.taskId,
        payloadJson,
        createdAt,
        createdAt,
      );
    });

    return mapTaskLocationCheckRow({
      accuracyMeters: check.accuracyMeters,
      createdAt,
      distanceMeters: check.distanceMeters,
      id,
      latitude: check.latitude,
      longitude: check.longitude,
      taskId: check.taskId,
      verificationRadiusMeters: check.verificationRadiusMeters,
      verified: check.verified ? 1 : 0,
    });
  }

  public async getSyncQueueSummary(): Promise<SyncQueueSummary> {
    const row = await this.db.getFirstAsync<{
      conflictCount: number;
      failedCount: number;
      pendingCount: number;
      syncedCount: number;
      totalCount: number;
    }>(
      `SELECT
         COUNT(*) AS totalCount,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingCount,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failedCount,
         SUM(CASE WHEN status = 'conflict' THEN 1 ELSE 0 END) AS conflictCount,
         SUM(CASE WHEN status = 'synced' THEN 1 ELSE 0 END) AS syncedCount
       FROM sync_queue`,
    );

    return {
      conflictCount: row?.conflictCount ?? 0,
      failedCount: row?.failedCount ?? 0,
      pendingCount: row?.pendingCount ?? 0,
      syncedCount: row?.syncedCount ?? 0,
      totalCount: row?.totalCount ?? 0,
    };
  }

  public async listSyncQueue(): Promise<SyncQueueItem[]> {
    const rows = await this.db.getAllAsync<SyncQueueItem>(
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
       ORDER BY created_at DESC`,
    );

    return rows;
  }

  public async listSyncConflicts(): Promise<SyncConflictItem[]> {
    const rows = await this.db.getAllAsync<SyncConflictRow>(
      `SELECT
         id,
         queue_id AS queueId,
         task_id AS taskId,
         item_id AS itemId,
         local_checked AS localChecked,
         remote_checked AS remoteChecked,
         remote_version AS remoteVersion,
         created_at AS createdAt,
         resolved_at AS resolvedAt,
         resolution
       FROM sync_conflicts
       ORDER BY created_at DESC`,
    );

    return rows.map((r) => ({
      ...r,
      localChecked: r.localChecked === 1,
      remoteChecked: r.remoteChecked === 1,
    }));
  }

  public async getSyncConflictById(conflictId: string): Promise<SyncConflictItem | null> {
    const r = await this.db.getFirstAsync<SyncConflictRow>(
      `SELECT
         id,
         queue_id AS queueId,
         task_id AS taskId,
         item_id AS itemId,
         local_checked AS localChecked,
         remote_checked AS remoteChecked,
         remote_version AS remoteVersion,
         created_at AS createdAt,
         resolved_at AS resolvedAt,
         resolution
       FROM sync_conflicts
       WHERE id = ?`,
      conflictId,
    );

    if (r == null) {
      return null;
    }

    return {
      ...r,
      localChecked: r.localChecked === 1,
      remoteChecked: r.remoteChecked === 1,
    };
  }

}

