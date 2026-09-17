import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Account, MembershipPlan } from "@/types/account";
import { ownAvatarPath } from "@/domain/client-account";

export function createAccountRepository(client: SupabaseClient, resolveOwner?: () => Promise<string>) {
  return {
    async account(user: User): Promise<Account> {
      const [profile, owner] = await Promise.all([
        client.from("profiles").select("full_name,avatar_url").eq("id", user.id).single(),
        resolveOwner ? resolveOwner().then(id => ({ data: { id }, error: null })) : client.from("clients").select("id").eq("user_id", user.id).single(),
      ]);
      if (profile.error) throw profile.error;
      if (owner.error) throw owner.error;
      const path: string | null = profile.data.avatar_url;
      const savedName = typeof profile.data.full_name === "string" ? profile.data.full_name.trim() : "";
      const metadataName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name.trim() : "";
      const signed = ownAvatarPath(path, user.id) ? await client.storage.from("images").createSignedUrl(path!, 900) : null;
      return { id: user.id, clientId: owner.data.id, name: savedName || metadataName || user.email?.split("@")[0] || "Meu perfil",
        email: user.email ?? "", role: user.app_metadata.role === "ADMIN" ? "ADMIN" : "CLIENT", avatarPath: path,
        avatarUrl: signed?.data?.signedUrl ?? null, avatarError: !!path && (!signed || !!signed.error) };
    },
    async updateProfile(userId: string, name: string, avatarPath?: string) {
      const { data, error } = await client.from("profiles").update({ full_name: name, ...(avatarPath ? { avatar_url: avatarPath } : {}) }).eq("id", userId).select("id").single();
      if (error || !data) throw error ?? new Error("Perfil não encontrado.");
    },
    async uploadAvatar(path: string, bytes: Uint8Array, contentType: string) {
      const { error } = await client.storage.from("images").upload(path, bytes, { contentType, upsert: false });
      if (error) throw error;
    },
    async removeFailedUpload(path: string) { return client.storage.from("images").remove([path]); },
    async achievements(clientId: string) {
      const { data, error } = await client.from("user_achievements").select("id,achieved_at,achievement:achievements(name,description)").eq("client_id", clientId).order("achieved_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; achieved_at: string; achievement: { name: string; description: string | null } | null }[];
    },
    async notifications(clientId: string) {
      const { data, error } = await client.from("notifications").select("id,title,body,read_at,created_at").eq("client_id", clientId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as { id: string; title: string; body: string | null; read_at: string | null; created_at: string }[];
    },
    async messages(clientId: string) {
      const { data, error } = await client.from("support_messages").select("id,message,sender_id,created_at").eq("client_id", clientId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as { id: string; message: string; sender_id: string; created_at: string }[];
    },
    async sendMessage(account: Account, message: string) {
      const { error } = await client.from("support_messages").insert({ client_id: account.clientId, sender_id: account.id, message, status: "open" });
      if (error) throw error;
    },
    async recordWeight(clientId: string, value: number, recordedAt: string) {
      const { error } = await client.from("progress_weights").insert({ client_id: clientId, value, recorded_at: recordedAt });
      if (error) throw error;
    },
    async plans(): Promise<MembershipPlan[]> {
      const { data, error } = await client.from("plans").select("id,name,description,price_cents,currency").eq("is_active", true).order("price_cents");
      if (error) throw error;
      return (data ?? []).map(row => ({ id: row.id, name: row.name, description: row.description, priceCents: row.price_cents, currency: row.currency }));
    },
  };
}
