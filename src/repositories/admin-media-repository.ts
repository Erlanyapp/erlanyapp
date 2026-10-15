import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminMediaItem, MediaClient, MediaReference } from "@/types/admin-media";
import type { mediaFilters } from "@/domain/admin-media";

type Row = Record<string, unknown>;
type MediaKind = "image" | "video";
type ReferenceMap = Map<string, MediaReference[]>;

const row = (value: unknown): Row | null => Array.isArray(value) ? (value[0] as Row ?? null) : (value as Row | null);
const clientName = (value: Row | null) => {
  const profile = row(value?.profile);
  return typeof profile?.full_name === "string" && profile.full_name ? String(profile.full_name) : "Cliente sem nome";
};

export function createAdminMediaRepository(client: SupabaseClient) {
  const addReference = (references: ReferenceMap, id: unknown, label: string, href: string) => {
    if (typeof id !== "string") return;
    const entries = references.get(id) ?? [];
    entries.push({ label, href });
    references.set(id, entries);
  };

  const referenceMap = async (kind: MediaKind, ids: string[]): Promise<ReferenceMap> => {
    const references: ReferenceMap = new Map(ids.map((id) => [id, []]));
    if (!ids.length) return references;

    if (kind === "image") {
      const [exerciseResult, workoutResult, tipResult, recipeResult, photoResult] = await Promise.all([
        client.from("exercises").select("thumbnail_asset_id,id,name").in("thumbnail_asset_id", ids),
        client.from("workouts").select("cover_asset_id,id,name").in("cover_asset_id", ids),
        client.from("tips").select("image_asset_id,id,title").in("image_asset_id", ids),
        client.from("recipes").select("image_asset_id,id,name").in("image_asset_id", ids),
        client.from("progress_photos").select("asset_id,client:clients(id,profile:profiles(full_name))").in("asset_id", ids),
      ]);
      for (const result of [exerciseResult, workoutResult, tipResult, recipeResult, photoResult]) if (result.error) throw result.error;
      for (const value of (exerciseResult.data ?? []) as Row[]) addReference(references, value.thumbnail_asset_id, `Exercício: ${String(value.name)}`, `/admin/exercicios/${String(value.id)}`);
      for (const value of (workoutResult.data ?? []) as Row[]) addReference(references, value.cover_asset_id, `Treino: ${String(value.name)}`, `/admin/treinos/${String(value.id)}`);
      for (const value of (tipResult.data ?? []) as Row[]) addReference(references, value.image_asset_id, `Dica: ${String(value.title)}`, `/admin/dicas/${String(value.id)}`);
      for (const value of (recipeResult.data ?? []) as Row[]) addReference(references, value.image_asset_id, `Receita: ${String(value.name)}`, `/admin/alimentacao/receitas/${String(value.id)}`);
      for (const value of (photoResult.data ?? []) as Row[]) {
        const owner = row(value.client);
        addReference(references, value.asset_id, `Evolução: ${String(row(owner?.profile)?.full_name ?? "Cliente")}`, `/admin/clientes/${String(owner?.id ?? "")}?aba=evolucao`);
      }
      return references;
    }

    const [exerciseResult, workoutResult] = await Promise.all([
      client.from("exercises").select("video_id,id,name").in("video_id", ids),
      client.from("workout_exercises").select("video_id,workout:workouts(id,name)").in("video_id", ids),
    ]);
    for (const result of [exerciseResult, workoutResult]) if (result.error) throw result.error;
    for (const value of (exerciseResult.data ?? []) as Row[]) addReference(references, value.video_id, `Exercício: ${String(value.name)}`, `/admin/exercicios/${String(value.id)}`);
    for (const value of (workoutResult.data ?? []) as Row[]) {
      const workout = row(value.workout);
      addReference(references, value.video_id, `Treino: ${String(workout?.name ?? "Treino")}`, `/admin/treinos/${String(workout?.id ?? "")}`);
    }
    return references;
  };

  const imageUrls = async (rows: Row[]) => {
    const grouped = new Map<string, Set<string>>();
    for (const value of rows) {
      if (typeof value.bucket !== "string" || typeof value.path !== "string") continue;
      const paths = grouped.get(value.bucket) ?? new Set<string>();
      paths.add(value.path);
      grouped.set(value.bucket, paths);
    }
    const urls = new Map<string, string | null>();
    await Promise.all([...grouped.entries()].map(async ([bucket, paths]) => {
      const { data, error } = await client.storage.from(bucket).createSignedUrls([...paths], 900);
      if (error) return;
      for (const signed of data ?? []) urls.set(JSON.stringify([bucket, signed.path]), signed.signedUrl ?? null);
    }));
    return urls;
  };

  const mapImages = async (rows: Row[], references: ReferenceMap): Promise<AdminMediaItem[]> => {
    const urls = await imageUrls(rows);
    return rows.map((value) => {
      const owner = row(value.client);
      const urlKey = typeof value.bucket === "string" && typeof value.path === "string" ? JSON.stringify([value.bucket, value.path]) : "";
      return {
        id: String(value.id), kind: "image", title: String(value.title ?? value.alt_text ?? "Imagem sem título"),
        scope: value.scope === "CLIENT" ? "CLIENT" : "GLOBAL", clientId: value.client_id as string ?? null,
        clientName: owner ? clientName(owner) : null, assetType: value.asset_type as AdminMediaItem["assetType"],
        metadata: (value.metadata as Record<string, unknown>) ?? {}, imageUrl: urls.get(urlKey) ?? null,
        createdAt: String(value.created_at), updatedAt: String(value.updated_at ?? value.created_at), references: references.get(String(value.id)) ?? [],
      };
    });
  };

  const mapVideos = (rows: Row[], references: ReferenceMap): AdminMediaItem[] => rows.map((value) => {
    const owner = row(value.client);
    return {
      id: String(value.id), kind: "video", title: String(value.title), scope: value.scope === "CLIENT" ? "CLIENT" : "GLOBAL",
      clientId: value.client_id as string ?? null, clientName: owner ? clientName(owner) : null, provider: "youtube",
      providerVideoId: String(value.provider_video_id), description: value.description as string ?? null, type: value.type as string ?? null,
      isActive: value.is_active !== false, createdAt: String(value.created_at), updatedAt: String(value.updated_at), references: references.get(String(value.id)) ?? [],
    };
  });

  const clients = async (): Promise<MediaClient[]> => {
    const { data, error } = await client.from("clients").select("id,profile:profiles(full_name,email)").order("created_at").limit(300);
    if (error) throw error;
    return (data ?? []).map((item) => {
      const value = row(item) ?? {};
      const profile = row(value.profile);
      return { id: String(value.id), name: String(profile?.full_name ?? "Cliente sem nome"), email: profile?.email as string ?? null };
    });
  };

  return {
    clients,
    async references(kind: MediaKind, id: string) { return referenceMap(kind, [id]).then((all) => all.get(id) ?? []); },
    async list(filters: ReturnType<typeof mediaFilters>) {
      const fetch = async (kind: MediaKind) => {
        const table = kind === "image" ? "media_assets" : "videos";
        let query = client.from(table).select("*,client:clients(id,profile:profiles(full_name,email))").order("created_at", { ascending: false }).order("id", { ascending: false });
        if (filters.q) query = query.ilike("title", `%${filters.q}%`);
        if (filters.scope !== "all") query = query.eq("scope", filters.scope);
        if (filters.clientId) query = query.eq("client_id", filters.clientId);
        if (kind === "video" && filters.status !== "all") query = query.eq("is_active", filters.status === "active");
        if (filters.type !== "all") query = query.eq(kind === "image" ? "asset_type" : "type", filters.type);
        const { data, error } = await query;
        if (error) throw error;
        const rows = (data ?? []) as Row[];
        const references = await referenceMap(kind, rows.map((value) => String(value.id)));
        const filtered = filters.reference === "all" ? rows : rows.filter((value) => {
          const used = (references.get(String(value.id)) ?? []).length > 0;
          return filters.reference === "used" ? used : !used;
        });
        return { rows: filtered, references };
      };

      const selectedKind: MediaKind = filters.kind === "image" ? "image" : "video";
      const fetched = filters.kind === "all" ? await Promise.all([fetch("image"), fetch("video")]) : [await fetch(selectedKind)];
      const available = fetched.flatMap(({ rows, references }, index) => rows.map((value) => ({ value, references, kind: filters.kind === "all" ? (index === 0 ? "image" : "video") : selectedKind })))
        .sort((left, right) => String(right.value.created_at).localeCompare(String(left.value.created_at)) || String(right.value.id).localeCompare(String(left.value.id)));
      const start = (filters.page - 1) * 20;
      const page = available.slice(start, start + 20);
      const images = page.filter((item) => item.kind === "image");
      const videos = page.filter((item) => item.kind === "video");
      const [imageItems, videoItems] = await Promise.all([
        mapImages(images.map((item) => item.value), new Map(images.map((item) => [String(item.value.id), item.references.get(String(item.value.id)) ?? []]))),
        mapVideos(videos.map((item) => item.value), new Map(videos.map((item) => [String(item.value.id), item.references.get(String(item.value.id)) ?? []]))),
      ]);
      const items = [...imageItems, ...videoItems].sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id));
      return { items, total: available.length, page: filters.page, pageSize: 20 };
    },
    async get(id: string) {
      const [imageResult, videoResult] = await Promise.all([
        client.from("media_assets").select("*,client:clients(id,profile:profiles(full_name,email))").eq("id", id).maybeSingle(),
        client.from("videos").select("*,client:clients(id,profile:profiles(full_name,email))").eq("id", id).maybeSingle(),
      ]);
      if (imageResult.error) throw imageResult.error;
      if (videoResult.error) throw videoResult.error;
      if (imageResult.data) return (await mapImages([imageResult.data as Row], await referenceMap("image", [id])))[0];
      if (videoResult.data) return mapVideos([videoResult.data as Row], await referenceMap("video", [id]))[0];
      return null;
    },
    async upload(path: string, bytes: Uint8Array, contentType: string) {
      const { error } = await client.storage.from("images").upload(path, bytes, { contentType, upsert: false });
      if (error) throw error;
    },
    async saveImage(id: string | null, input: ReturnType<typeof import("@/domain/admin-media").imageInput>, path?: string) {
      const payload = { title: input.title, alt_text: input.altText, asset_type: input.assetType, scope: input.scope, client_id: input.clientId, ...(path ? { bucket: "images", path, metadata: { kind: "library_upload" } } : {}) };
      const query = id ? client.from("media_assets").update(payload).eq("id", id) : client.from("media_assets").insert(payload);
      const { data, error } = await query.select("id").single();
      if (error) throw error;
      return String(data.id);
    },
    async saveVideo(id: string | null, input: ReturnType<typeof import("@/domain/admin-media").videoInput>) {
      const payload = { title: input.title, provider: input.provider, provider_video_id: input.providerVideoId, description: input.description, type: input.type, scope: input.scope, client_id: input.clientId, is_active: input.isActive };
      const query = id ? client.from("videos").update(payload).eq("id", id) : client.from("videos").insert(payload);
      const { data, error } = await query.select("id").single();
      if (error) throw error;
      return String(data.id);
    },
    async toggleVideo(id: string, active: boolean) {
      const { error } = await client.from("videos").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    async deleteImage(id: string, path: string) {
      if ((await referenceMap("image", [id]).then((all) => all.get(id) ?? [])).length) throw new Error("Esta imagem possui referências e não pode ser excluída.");
      const { error } = await client.storage.from("images").remove([path]);
      if (error) throw error;
      const deleted = await client.from("media_assets").delete().eq("id", id);
      if (deleted.error) throw deleted.error;
    },
    async deleteVideo(id: string) {
      if ((await referenceMap("video", [id]).then((all) => all.get(id) ?? [])).length) throw new Error("Este vídeo possui referências e não pode ser excluído.");
      const { error } = await client.from("videos").delete().eq("id", id);
      if (error) throw error;
    },
  };
}
