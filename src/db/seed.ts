import type { SQLiteDatabase } from 'expo-sqlite';

import {
  seedFixtureSetSchema,
  type InspectionTask,
  type TaskStatus,
} from '@/features/tasks/domain/task';

type ChecklistTemplateItem = {
  label: string;
  required: boolean;
};

const checklistTemplates = {
  electrical: [
    { label: 'Confirm the panel directory is present and legible', required: true },
    { label: 'Check that the enclosure closes securely', required: true },
    { label: 'Look for heat damage or discoloration', required: true },
    { label: 'Confirm access clearance is unobstructed', required: true },
    { label: 'Inspect warning labels and circuit identifiers', required: false },
    { label: 'Record the general panel condition', required: false },
  ],
  emergencyExit: [
    { label: 'Confirm the exit route is unobstructed', required: true },
    { label: 'Check that the exit door opens freely', required: true },
    { label: 'Inspect illuminated exit signage', required: true },
    { label: 'Confirm emergency lighting is undamaged', required: true },
    { label: 'Check the exterior assembly point sign', required: false },
  ],
  fireExtinguisher: [
    { label: 'Confirm the extinguisher is in its assigned location', required: true },
    { label: 'Check that access is clear and signage is visible', required: true },
    { label: 'Inspect the pressure gauge operating range', required: true },
    { label: 'Confirm the safety pin and tamper seal are intact', required: true },
    { label: 'Inspect the hose, cylinder, and mounting bracket', required: true },
    { label: 'Check that the service label is current', required: false },
  ],
  firstAid: [
    { label: 'Confirm the kit is present and clearly marked', required: true },
    { label: 'Check that the inventory seal is intact', required: false },
    { label: 'Inspect sterile supplies for expiry dates', required: true },
    { label: 'Confirm gloves and dressings meet minimum stock', required: true },
    { label: 'Check that the kit is accessible without a key', required: true },
  ],
  generator: [
    { label: 'Check the generator for visible leaks', required: true },
    { label: 'Confirm fuel and coolant levels are acceptable', required: true },
    { label: 'Inspect battery terminals and cable condition', required: true },
    { label: 'Confirm the control panel shows standby ready', required: true },
    { label: 'Check ventilation openings for obstruction', required: true },
    { label: 'Record the hour-meter reading area condition', required: false },
  ],
  loadingArea: [
    { label: 'Confirm pedestrian lanes remain visible', required: true },
    { label: 'Inspect dock-edge markings and barriers', required: true },
    { label: 'Check wheel chocks and restraint storage', required: true },
    { label: 'Confirm lighting covers the full loading zone', required: true },
    { label: 'Look for damaged floor surfaces or trip hazards', required: true },
    { label: 'Check that emergency contacts are posted', required: false },
  ],
  safetyWalkthrough: [
    { label: 'Check primary walkways for obstructions', required: true },
    { label: 'Inspect guardrails and protective barriers', required: true },
    { label: 'Confirm safety signs are visible and current', required: true },
    { label: 'Look for spills, loose materials, or trip hazards', required: true },
    { label: 'Check access to emergency equipment', required: true },
    { label: 'Record any housekeeping concerns', required: false },
  ],
} satisfies Record<string, readonly ChecklistTemplateItem[]>;

type ChecklistTemplateKey = keyof typeof checklistTemplates;

type TaskDefinition = InspectionTask & {
  checklistTemplate: ChecklistTemplateKey;
};

const FIXTURE_UPDATED_AT = '2026-08-07T06:00:00.000Z';

const taskDefinitions: TaskDefinition[] = [
  { id: 'INS-10021', title: 'Inspect warehouse fire extinguishers', siteName: 'North Yard Logistics Hub', area: 'Warehouse A', inspectionType: 'Fire extinguisher inspection', priority: 'high', status: 'in_progress', dueAt: '2026-08-07T09:00:00.000Z', latitude: 41.0872, longitude: 28.9954, verificationRadiusMeters: 75, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'fireExtinguisher' },
  { id: 'INS-10022', title: 'Check main electrical distribution panel', siteName: 'Meridian Foods Plant', area: 'Packaging Hall', inspectionType: 'Electrical panel check', priority: 'high', status: 'assigned', dueAt: '2026-08-07T11:30:00.000Z', latitude: 41.0658, longitude: 29.0129, verificationRadiusMeters: 60, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'electrical' },
  { id: 'INS-10023', title: 'Complete production-floor safety walkthrough', siteName: 'Summit Manufacturing Annex', area: 'Assembly Line 2', inspectionType: 'Safety walkthrough', priority: 'medium', status: 'assigned', dueAt: '2026-08-07T14:00:00.000Z', latitude: 41.0414, longitude: 28.9341, verificationRadiusMeters: 90, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'safetyWalkthrough' },
  { id: 'INS-10024', title: 'Inspect standby generator enclosure', siteName: 'Riverside Cold Storage', area: 'Utility Yard', inspectionType: 'Generator inspection', priority: 'medium', status: 'assigned', dueAt: '2026-08-08T08:30:00.000Z', latitude: 41.1016, longitude: 28.8845, verificationRadiusMeters: 80, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'generator' },
  { id: 'INS-10025', title: 'Verify east-wing emergency exits', siteName: 'Cedar Office Campus', area: 'East Wing', inspectionType: 'Emergency exit inspection', priority: 'high', status: 'assigned', dueAt: '2026-08-08T10:00:00.000Z', latitude: 41.0783, longitude: 29.0267, verificationRadiusMeters: 55, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'emergencyExit' },
  { id: 'INS-10026', title: 'Review first aid kit inventory', siteName: 'Atlas Distribution Center', area: 'Dispatch Office', inspectionType: 'First aid kit check', priority: 'low', status: 'assigned', dueAt: '2026-08-08T13:00:00.000Z', latitude: 41.1145, longitude: 28.9762, verificationRadiusMeters: 50, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'firstAid' },
  { id: 'INS-10027', title: 'Inspect loading-bay safety controls', siteName: 'Harbor Maintenance Yard', area: 'Loading Bay 3', inspectionType: 'Loading-area inspection', priority: 'high', status: 'in_progress', dueAt: '2026-08-09T07:30:00.000Z', latitude: 40.9977, longitude: 28.9462, verificationRadiusMeters: 85, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'loadingArea' },
  { id: 'INS-10028', title: 'Inspect workshop fire extinguishers', siteName: 'Bosphorus Service Depot', area: 'Mechanical Workshop', inspectionType: 'Fire extinguisher inspection', priority: 'medium', status: 'assigned', dueAt: '2026-08-09T09:30:00.000Z', latitude: 41.1231, longitude: 29.0498, verificationRadiusMeters: 70, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'fireExtinguisher' },
  { id: 'INS-10029', title: 'Check refrigeration electrical panel', siteName: 'Riverside Cold Storage', area: 'Plant Room', inspectionType: 'Electrical panel check', priority: 'high', status: 'assigned', dueAt: '2026-08-09T12:00:00.000Z', latitude: 41.1021, longitude: 28.8852, verificationRadiusMeters: 65, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'electrical' },
  { id: 'INS-10030', title: 'Complete visitor-area safety walkthrough', siteName: 'Cedar Office Campus', area: 'Ground Floor', inspectionType: 'Safety walkthrough', priority: 'low', status: 'assigned', dueAt: '2026-08-10T08:00:00.000Z', latitude: 41.0778, longitude: 29.0271, verificationRadiusMeters: 55, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'safetyWalkthrough' },
  { id: 'INS-10031', title: 'Inspect backup generator controls', siteName: 'North Yard Logistics Hub', area: 'Power House', inspectionType: 'Generator inspection', priority: 'high', status: 'assigned', dueAt: '2026-08-10T10:30:00.000Z', latitude: 41.0881, longitude: 28.9961, verificationRadiusMeters: 75, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'generator' },
  { id: 'INS-10032', title: 'Verify mezzanine emergency exit route', siteName: 'Meridian Foods Plant', area: 'Mezzanine', inspectionType: 'Emergency exit inspection', priority: 'medium', status: 'assigned', dueAt: '2026-08-10T13:30:00.000Z', latitude: 41.0664, longitude: 29.0136, verificationRadiusMeters: 60, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'emergencyExit' },
  { id: 'INS-10033', title: 'Check production first aid station', siteName: 'Summit Manufacturing Annex', area: 'Assembly Line 1', inspectionType: 'First aid kit check', priority: 'medium', status: 'in_progress', dueAt: '2026-08-11T08:30:00.000Z', latitude: 41.0409, longitude: 28.9335, verificationRadiusMeters: 65, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'firstAid' },
  { id: 'INS-10034', title: 'Inspect dispatch loading zone', siteName: 'Atlas Distribution Center', area: 'Loading Bay 1', inspectionType: 'Loading-area inspection', priority: 'high', status: 'assigned', dueAt: '2026-08-11T11:00:00.000Z', latitude: 41.1152, longitude: 28.9755, verificationRadiusMeters: 80, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'loadingArea' },
  { id: 'INS-10035', title: 'Inspect office-floor fire extinguishers', siteName: 'Cedar Office Campus', area: 'West Wing', inspectionType: 'Fire extinguisher inspection', priority: 'low', status: 'assigned', dueAt: '2026-08-11T14:00:00.000Z', latitude: 41.0787, longitude: 29.0259, verificationRadiusMeters: 50, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'fireExtinguisher' },
  { id: 'INS-10036', title: 'Check dock-services electrical panel', siteName: 'Harbor Maintenance Yard', area: 'Dock Services', inspectionType: 'Electrical panel check', priority: 'medium', status: 'assigned', dueAt: '2026-08-12T08:00:00.000Z', latitude: 40.9982, longitude: 28.9457, verificationRadiusMeters: 85, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'electrical' },
  { id: 'INS-10037', title: 'Complete warehouse aisle walkthrough', siteName: 'North Yard Logistics Hub', area: 'Warehouse B', inspectionType: 'Safety walkthrough', priority: 'medium', status: 'assigned', dueAt: '2026-08-12T10:30:00.000Z', latitude: 41.0867, longitude: 28.9948, verificationRadiusMeters: 90, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'safetyWalkthrough' },
  { id: 'INS-10038', title: 'Inspect depot emergency generator', siteName: 'Bosphorus Service Depot', area: 'Rear Service Yard', inspectionType: 'Generator inspection', priority: 'high', status: 'assigned', dueAt: '2026-08-12T13:00:00.000Z', latitude: 41.1226, longitude: 29.0504, verificationRadiusMeters: 75, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'generator' },
  { id: 'INS-10039', title: 'Verify warehouse emergency exits', siteName: 'Atlas Distribution Center', area: 'Storage Hall', inspectionType: 'Emergency exit inspection', priority: 'high', status: 'in_progress', dueAt: '2026-08-13T08:30:00.000Z', latitude: 41.1148, longitude: 28.9768, verificationRadiusMeters: 80, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'emergencyExit' },
  { id: 'INS-10040', title: 'Review maintenance first aid kit', siteName: 'Harbor Maintenance Yard', area: 'Maintenance Office', inspectionType: 'First aid kit check', priority: 'low', status: 'assigned', dueAt: '2026-08-13T11:00:00.000Z', latitude: 40.9973, longitude: 28.9468, verificationRadiusMeters: 55, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'firstAid' },
  { id: 'INS-10041', title: 'Inspect chilled-goods loading area', siteName: 'Riverside Cold Storage', area: 'Loading Bay 2', inspectionType: 'Loading-area inspection', priority: 'medium', status: 'assigned', dueAt: '2026-08-14T07:30:00.000Z', latitude: 41.1012, longitude: 28.8839, verificationRadiusMeters: 85, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'loadingArea' },
  { id: 'INS-10042', title: 'Inspect cafeteria fire extinguishers', siteName: 'Meridian Foods Plant', area: 'Staff Cafeteria', inspectionType: 'Fire extinguisher inspection', priority: 'medium', status: 'assigned', dueAt: '2026-08-14T10:00:00.000Z', latitude: 41.0652, longitude: 29.0122, verificationRadiusMeters: 55, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'fireExtinguisher' },
  { id: 'INS-10043', title: 'Check workshop sub-distribution panel', siteName: 'Summit Manufacturing Annex', area: 'Fabrication Workshop', inspectionType: 'Electrical panel check', priority: 'high', status: 'assigned', dueAt: '2026-08-15T09:00:00.000Z', latitude: 41.0418, longitude: 28.9347, verificationRadiusMeters: 70, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'electrical' },
  { id: 'INS-10044', title: 'Complete service-bay safety walkthrough', siteName: 'Bosphorus Service Depot', area: 'Service Bay 2', inspectionType: 'Safety walkthrough', priority: 'low', status: 'assigned', dueAt: '2026-08-15T12:00:00.000Z', latitude: 41.1236, longitude: 29.0493, verificationRadiusMeters: 75, updatedAt: FIXTURE_UPDATED_AT, checklistTemplate: 'safetyWalkthrough' },
];

const seedInput = {
  checklistItems: taskDefinitions.flatMap(({ checklistTemplate, ...task }) =>
    checklistTemplates[checklistTemplate].map((item, index) => ({
      checked: task.status === 'in_progress' && index === 0,
      id: `${task.id}-CHK-${String(index + 1).padStart(2, '0')}`,
      label: item.label,
      position: index,
      required: item.required,
      taskId: task.id,
      updatedAt: task.updatedAt,
    })),
  ),
  tasks: taskDefinitions.map(({ checklistTemplate: _checklistTemplate, ...task }) => task),
};

export const seedFixtures = seedFixtureSetSchema.parse(seedInput);

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  const taskCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM tasks');
  if ((taskCount?.count ?? 0) > 0) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const task of seedFixtures.tasks) {
      await db.runAsync(
        `INSERT INTO tasks (
          id, title, site_name, area, inspection_type, priority, status, due_at,
          latitude, longitude, verification_radius_meters, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        task.id,
        task.title,
        task.siteName,
        task.area,
        task.inspectionType,
        task.priority,
        task.status,
        task.dueAt,
        task.latitude,
        task.longitude,
        task.verificationRadiusMeters,
        task.updatedAt,
      );
    }

    for (const item of seedFixtures.checklistItems) {
      await db.runAsync(
        `INSERT INTO checklist_items (
          id, task_id, label, position, required, checked, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        item.taskId,
        item.label,
        item.position,
        item.required ? 1 : 0,
        item.checked ? 1 : 0,
        item.updatedAt,
      );
    }
  });
}

export function countSeedTasksByStatus(status: TaskStatus): number {
  return seedFixtures.tasks.filter((task) => task.status === status).length;
}
