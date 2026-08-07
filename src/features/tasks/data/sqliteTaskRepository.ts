import type { SQLiteDatabase } from 'expo-sqlite';

import type { ChecklistItemRow, TaskRow } from '@/db/types';
import {
  checklistItemSchema,
  inspectionTaskSchema,
  type ChecklistItem,
  type InspectionTask,
  type TaskDetail,
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
    });
  }
}
