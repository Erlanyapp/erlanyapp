export interface AdminMetrics {
  clients: number;
  activeClients: number;
  workouts: number;
  exercises: number;
  tips: number;
  nutritionPlans: number;
}

export interface AdminClient {
  id: string;
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  status: string;
  planId: string | null;
  lastAccessAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminClientDetail extends AdminClient {
  subscriptions: Array<{ id: string; status: string; startedAt: string | null; expiresAt: string | null }>;
  workoutCount: number;
  progressCount: number;
}
