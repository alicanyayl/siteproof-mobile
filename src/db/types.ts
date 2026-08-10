export type ChecklistItemRow = {
  checked: number;
  id: string;
  label: string;
  position: number;
  required: number;
  taskId: string;
  updatedAt: string;
};

export type TaskRow = {
  area: string;
  dueAt: string;
  id: string;
  inspectionType: string;
  latitude: number;
  longitude: number;
  priority: string;
  siteName: string;
  status: string;
  title: string;
  updatedAt: string;
  verificationRadiusMeters: number;
};

export type TaskEvidenceRow = {
  createdAt: string;
  fileUri: string;
  id: string;
  taskId: string;
};

export type TaskLocationCheckRow = {
  accuracyMeters: number | null;
  createdAt: string;
  distanceMeters: number;
  id: string;
  latitude: number;
  longitude: number;
  taskId: string;
  verificationRadiusMeters: number;
  verified: number;
};

export type SyncQueueRow = {
  attemptCount: number;
  baseVersion: number | null;
  createdAt: string;
  entityId: string;
  id: string;
  lastError: string | null;
  mutationType: string;
  nextAttemptAt: string | null;
  payloadJson: string;
  status: string;
  taskId: string;
  updatedAt: string;
};

export type SimulatedRemoteChecklistRow = {
  checked: number;
  itemId: string;
  updatedAt: string;
  version: number;
};

export type SyncConflictRow = {
  createdAt: string;
  id: string;
  itemId: string;
  localChecked: number;
  queueId: string;
  remoteChecked: number;
  remoteVersion: number;
  resolution: string | null;
  resolvedAt: string | null;
  taskId: string;
};

export type SyncSimulationFlagRow = {
  flagName: string;
  flagValue: number;
};


