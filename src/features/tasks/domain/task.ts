import { z } from 'zod';

export const taskStatusSchema = z.enum(['assigned', 'in_progress', 'completed']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const inspectionTaskSchema = z.object({
  area: z.string().trim().min(1),
  dueAt: z.iso.datetime({ offset: true }),
  id: z.string().regex(/^INS-\d{5}$/),
  inspectionType: z.string().trim().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  priority: taskPrioritySchema,
  siteName: z.string().trim().min(1),
  status: taskStatusSchema,
  title: z.string().trim().min(1),
  updatedAt: z.iso.datetime({ offset: true }),
  verificationRadiusMeters: z.number().int().positive().max(1000),
});

export const checklistItemSchema = z.object({
  checked: z.boolean(),
  id: z.string().regex(/^INS-\d{5}-CHK-\d{2}$/),
  label: z.string().trim().min(1),
  position: z.number().int().nonnegative(),
  required: z.boolean(),
  taskId: z.string().regex(/^INS-\d{5}$/),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const seedFixtureSetSchema = z
  .object({
    checklistItems: z.array(checklistItemSchema).min(1),
    tasks: z.array(inspectionTaskSchema).min(1),
  })
  .superRefine(({ checklistItems, tasks }, context) => {
    const taskIds = new Set(tasks.map((task) => task.id));
    const checklistIds = new Set<string>();
    const positionsByTask = new Set<string>();

    if (taskIds.size !== tasks.length) {
      context.addIssue({ code: 'custom', message: 'Task fixture IDs must be unique.' });
    }

    for (const item of checklistItems) {
      if (!taskIds.has(item.taskId)) {
        context.addIssue({
          code: 'custom',
          message: `Checklist item ${item.id} references an unknown task.`,
        });
      }

      if (checklistIds.has(item.id)) {
        context.addIssue({ code: 'custom', message: `Checklist item ID ${item.id} is duplicated.` });
      }
      checklistIds.add(item.id);

      const positionKey = `${item.taskId}:${item.position}`;
      if (positionsByTask.has(positionKey)) {
        context.addIssue({
          code: 'custom',
          message: `Task ${item.taskId} has duplicate checklist position ${item.position}.`,
        });
      }
      positionsByTask.add(positionKey);
    }
  });

export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type InspectionTask = z.infer<typeof inspectionTaskSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export type TaskDetail = {
  checklist: ChecklistItem[];
  task: InspectionTask;
};

export interface TaskRepository {
  getChecklistForTask(taskId: string): Promise<ChecklistItem[]>;
  getTaskById(taskId: string): Promise<InspectionTask | null>;
  getTaskDetail(taskId: string): Promise<TaskDetail | null>;
  listAssignedTasks(): Promise<InspectionTask[]>;
  setChecklistItemChecked(itemId: string, checked: boolean): Promise<void>;
}
