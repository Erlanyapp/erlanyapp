import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminClient, AdminClientDetail, AdminMetrics } from "@/types/admin";

type Row = Record<string, unknown>;

const toClient = (row: Row): AdminClient => {
  const profile = row.profile as Row | null | undefined;
  return {
    id: row.id as string, userId: row.user_id as string,
    fullName: (profile?.full_name as string | null) ?? null, avatarUrl: (profile?.avatar_url as string | null) ?? null,
    status: row.status as string, planId: (row.plan_id as string | null) ?? null,
    lastAccessAt: (row.last_access_at as string | null) ?? null, createdAt: row.created_at as string, updatedAt: row.updated_at as string,
  };
};

export function createAdminRepository(client: SupabaseClient) {
  const count = async (table: string, filter?: { column: string; value: unknown }) => {
    let query = client.from(table).select("id", { count: "exact", head: true });
    if (filter) query = query.eq(filter.column, filter.value);
    const result = await query;
    if (result.error) throw result.error;
    return result.count ?? 0;
  };

  return {
    async getMetrics(): Promise<AdminMetrics> {
      const [clients, activeClients, workouts, exercises, tips, nutritionPlans] = await Promise.all([
        count("clients"), count("clients", { column: "status", value: "active" }), count("workouts"), count("exercises"), count("tips"), count("nutrition_plans"),
      ]);
      return { clients, activeClients, workouts, exercises, tips, nutritionPlans };
    },
    async listClients({ search, status, page, pageSize }: { search?: string; status?: string; page: number; pageSize: number }) {
      let query = client.from("clients").select("id,user_id,status,plan_id,last_access_at,created_at,updated_at,profile:profiles(full_name,avatar_url)", { count: "exact" }).order("created_at", { ascending: false });
      if (status && status !== "all") query = query.eq("status", status);
      if (search) query = query.or(`status.ilike.%${search}%,user_id.ilike.%${search}%,profile.full_name.ilike.%${search}%`);
      const from = (page - 1) * pageSize;
      const { data, error, count: total } = await query.range(from, from + pageSize - 1);
      if (error) throw error;
      return { clients: ((data ?? []) as Row[]).map(toClient), total: total ?? 0, page, pageSize };
    },
    async getClient(id: string): Promise<AdminClientDetail | null> {
      const { data, error } = await client.from("clients").select("id,user_id,status,plan_id,last_access_at,created_at,updated_at,profile:profiles(full_name,avatar_url)").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [subscriptions, workoutCount, progressCount] = await Promise.all([
        client.from("subscriptions").select("id,status,started_at,expires_at").eq("client_id", id).order("created_at", { ascending: false }),
        client.from("workouts").select("id", { count: "exact", head: true }).eq("client_id", id),
        client.from("progress_weights").select("id", { count: "exact", head: true }).eq("client_id", id),
      ]);
      if (subscriptions.error) throw subscriptions.error;
      if (workoutCount.error) throw workoutCount.error;
      if (progressCount.error) throw progressCount.error;
      const base = toClient(data as Row);
      return { ...base, subscriptions: ((subscriptions.data ?? []) as Row[]).map((row) => ({ id: row.id as string, status: row.status as string, startedAt: (row.started_at as string | null) ?? null, expiresAt: (row.expires_at as string | null) ?? null })), workoutCount: workoutCount.count ?? 0, progressCount: progressCount.count ?? 0 };
    },
  };
}
