export interface AdminProgressAssessment {
  id: string;
  clientId: string;
  assessedAt: string;
  notes: string | null;
  assessedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProgressMeasurement {
  id: string;
  clientId: string;
  assessmentId: string | null;
  measurements: Record<string, string>;
  recordedAt: string;
}

export interface AdminPerformanceRecord {
  id: string;
  clientId: string;
  assessmentId: string | null;
  metric: string;
  value: number | null;
  unit: string | null;
  recordedAt: string;
}

export interface AdminProgressPhoto {
  id: string;
  clientId: string;
  assessmentId: string | null;
  assetId: string | null;
  category: string | null;
  recordedAt: string;
  imageUrl: string | null;
  imageError: boolean;
}

export interface AdminProgressData {
  assessments: AdminProgressAssessment[];
  weights: Array<{ id: string; assessmentId: string | null; value: number; recordedAt: string }>;
  measurements: AdminProgressMeasurement[];
  performance: AdminPerformanceRecord[];
  photos: AdminProgressPhoto[];
}
