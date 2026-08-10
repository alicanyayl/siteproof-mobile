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

