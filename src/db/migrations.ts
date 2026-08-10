import type { SQLiteDatabase } from 'expo-sqlite';

import { seedDatabase } from '@/db/seed';

export const DATABASE_NAME = 'siteproof.db';
export const DATABASE_VERSION = 2;

const migrationVersionOne = `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    site_name TEXT NOT NULL,
    area TEXT NOT NULL,
    inspection_type TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL CHECK (status IN ('assigned', 'in_progress', 'completed')),
    due_at TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    verification_radius_meters INTEGER NOT NULL CHECK (verification_radius_meters > 0),
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL,
    label TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    required INTEGER NOT NULL CHECK (required IN (0, 1)),
    checked INTEGER NOT NULL DEFAULT 0 CHECK (checked IN (0, 1)),
    updated_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE (task_id, position)
  );

  CREATE INDEX IF NOT EXISTS index_tasks_status_due_at ON tasks(status, due_at);
  CREATE INDEX IF NOT EXISTS index_checklist_items_task_position ON checklist_items(task_id, position);
`;

const migrationVersionTwo = `
  CREATE TABLE IF NOT EXISTS task_evidence (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL,
    file_uri TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS task_location_checks (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy_meters REAL,
    distance_meters REAL NOT NULL,
    verification_radius_meters REAL NOT NULL,
    verified INTEGER NOT NULL CHECK (verified IN (0, 1)),
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS index_task_evidence_task_id_created_at ON task_evidence(task_id, created_at);
  CREATE INDEX IF NOT EXISTS index_task_location_checks_task_id_created_at ON task_location_checks(task_id, created_at);
`;

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error(`Database version ${currentVersion} is newer than this app supports.`);
  }

  if (currentVersion < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migrationVersionOne);
      await db.execAsync('PRAGMA user_version = 1');
    });
  }

  if (currentVersion < 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migrationVersionTwo);
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
  }

  await seedDatabase(db);
}

