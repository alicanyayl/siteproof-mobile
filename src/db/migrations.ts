import type { SQLiteDatabase } from 'expo-sqlite';

import { seedDatabase } from '@/db/seed';

export const DATABASE_NAME = 'siteproof.db';
export const DATABASE_VERSION = 3;

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

const migrationVersionThree = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    mutation_type TEXT NOT NULL CHECK (mutation_type IN ('checklist_update', 'evidence_added', 'location_check_added')),
    entity_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    base_version INTEGER,
    status TEXT NOT NULL CHECK (status IN ('pending', 'syncing', 'failed', 'conflict', 'synced')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TEXT,
    last_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS simulated_remote_checklist (
    item_id TEXT PRIMARY KEY NOT NULL,
    checked INTEGER NOT NULL CHECK (checked IN (0, 1)),
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES checklist_items(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sync_conflicts (
    id TEXT PRIMARY KEY NOT NULL,
    queue_id TEXT NOT NULL UNIQUE,
    task_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    local_checked INTEGER NOT NULL CHECK (local_checked IN (0, 1)),
    remote_checked INTEGER NOT NULL CHECK (remote_checked IN (0, 1)),
    remote_version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    resolution TEXT CHECK (resolution IN ('keep_local', 'use_remote')),
    FOREIGN KEY (queue_id) REFERENCES sync_queue(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sync_simulation_flags (
    flag_name TEXT PRIMARY KEY NOT NULL,
    flag_value INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS index_sync_queue_status_next_attempt ON sync_queue(status, next_attempt_at);
  CREATE INDEX IF NOT EXISTS index_sync_queue_task_created ON sync_queue(task_id, created_at);
  CREATE INDEX IF NOT EXISTS index_sync_conflicts_task_created ON sync_conflicts(task_id, created_at);

  INSERT OR IGNORE INTO simulated_remote_checklist (item_id, checked, version, updated_at)
  SELECT id, checked, 1, updated_at FROM checklist_items;
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
      await db.execAsync('PRAGMA user_version = 2');
    });
  }

  if (currentVersion < 3) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migrationVersionThree);
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
  }

  await seedDatabase(db);

  // Ensure any interrupted 'syncing' rows are safely recovered to 'pending'
  const nowIso = new Date().toISOString();
  await db.runAsync(
    `UPDATE sync_queue SET status = 'pending', updated_at = ? WHERE status = 'syncing';`,
    [nowIso],
  );
}


