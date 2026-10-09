import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminPerformanceRecord, AdminProgressAssessment, AdminProgressData, AdminProgressMeasurement, AdminProgressPhoto } from "@/types/admin-progress";
type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : [];
const row = (value: unknown): Row | null => value && typeof value === "object" && !Array.isArray(value) ? value as Row : null;

export function createAdminProgressRepository(client: SupabaseClient) {
  const compensateUpload = async (clientId: string, assetId: string | null, path: string, originalError: unknown) => {
    if (assetId) {
      const removed = await client.from("media_assets").delete().eq("id", assetId).eq("client_id", clientId).eq("path", path);
      if (removed.error) throw new Error("Não foi possível salvar a foto. A limpeza dos metadados falhou; o arquivo foi preservado para revisão.", { cause: originalError });
    }
    const removed = await client.storage.from("images").remove([path]);
    if (removed.error) throw new Error("Não foi possível salvar a foto. A limpeza do novo arquivo está pendente no Storage.", { cause: originalError });
    throw originalError;
  };
  const clientExists = async (clientId: string) => {
    const { data, error } = await client.from("clients").select("id").eq("id", clientId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Cliente não encontrado.");
  };
  const assessmentBelongs = async (clientId: string, assessmentId: string | null) => {
    if (!assessmentId) return;
    const { data, error } = await client.from("progress_assessments").select("id").eq("id", assessmentId).eq("client_id", clientId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("A avaliação não pertence a este cliente.");
  };
  const signed = async (asset: Row | null) => {
    if (!asset || asset.bucket !== "images" || typeof asset.path !== "string") return { imageUrl: null, imageError: !!asset };
    const { data, error } = await client.storage.from("images").createSignedUrl(asset.path, 900);
    return { imageUrl: data?.signedUrl ?? null, imageError: !!error || !data?.signedUrl };
  };
  return {
    clientExists,
    assessmentBelongs,
    async list(clientId: string): Promise<AdminProgressData> {
      await clientExists(clientId);
      const [assessments, weights, measurements, performance, photos] = await Promise.all([
        client.from("progress_assessments").select("id,client_id,assessed_at,notes,assessed_by,created_at,updated_at").eq("client_id", clientId).order("assessed_at", { ascending: false }).order("created_at", { ascending: false }).limit(100),
        client.from("progress_weights").select("id,assessment_id,value,recorded_at").eq("client_id", clientId).order("recorded_at", { ascending: false }).limit(100),
        client.from("progress_measurements").select("id,client_id,assessment_id,measurements,recorded_at").eq("client_id", clientId).order("recorded_at", { ascending: false }).limit(100),
        client.from("performance_records").select("id,client_id,assessment_id,metric,value,unit,recorded_at").eq("client_id", clientId).order("recorded_at", { ascending: false }).limit(100),
        client.from("progress_photos").select("id,client_id,assessment_id,asset_id,category,recorded_at,asset:media_assets(bucket,path)").eq("client_id", clientId).order("recorded_at", { ascending: false }).limit(100),
      ]);
      for (const result of [assessments, weights, measurements, performance, photos]) if (result.error) throw result.error;
      return {
        assessments: rows(assessments.data).map(item => ({ id: String(item.id), clientId: String(item.client_id), assessedAt: String(item.assessed_at), notes: typeof item.notes === "string" ? item.notes : null, assessedBy: typeof item.assessed_by === "string" ? item.assessed_by : null, createdAt: String(item.created_at), updatedAt: String(item.updated_at) })) as AdminProgressAssessment[],
        weights: rows(weights.data).map(item => ({ id: String(item.id), assessmentId: typeof item.assessment_id === "string" ? item.assessment_id : null, value: Number(item.value), recordedAt: String(item.recorded_at) })),
        measurements: rows(measurements.data).map(item => ({ id: String(item.id), clientId: String(item.client_id), assessmentId: typeof item.assessment_id === "string" ? item.assessment_id : null, measurements: Object.fromEntries(Object.entries(row(item.measurements) ?? {}).filter(([, value]) => typeof value === "string" || typeof value === "number").map(([key, value]) => [key, String(value)])), recordedAt: String(item.recorded_at) })) as AdminProgressMeasurement[],
        performance: rows(performance.data).map(item => ({ id: String(item.id), clientId: String(item.client_id), assessmentId: typeof item.assessment_id === "string" ? item.assessment_id : null, metric: String(item.metric), value: item.value == null ? null : Number(item.value), unit: typeof item.unit === "string" ? item.unit : null, recordedAt: String(item.recorded_at) })) as AdminPerformanceRecord[],
        photos: await Promise.all(rows(photos.data).map(async item => ({ id: String(item.id), clientId: String(item.client_id), assessmentId: typeof item.assessment_id === "string" ? item.assessment_id : null, assetId: typeof item.asset_id === "string" ? item.asset_id : null, category: typeof item.category === "string" ? item.category : null, recordedAt: String(item.recorded_at), ...await signed(row(item.asset)) }))) as AdminProgressPhoto[],
      };
    },
    async saveAssessment(clientId: string, id: string | null, input: { assessedAt: string; notes: string | null }, assessedBy: string) {
      await clientExists(clientId);
      const payload = { assessed_at: input.assessedAt, notes: input.notes, ...(id ? {} : { client_id: clientId, assessed_by: assessedBy }) };
      const query = id ? client.from("progress_assessments").update(payload).eq("id", id).eq("client_id", clientId) : client.from("progress_assessments").insert(payload);
      const { data, error } = await query.select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("A avaliação não pertence a este cliente.");
      return String(data.id);
    },
    async deleteAssessment(clientId: string, id: string) {
      await clientExists(clientId);
      const { data, error } = await client.from("progress_assessments").delete().eq("id", id).eq("client_id", clientId).select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("A avaliação não pertence a este cliente.");
    },
    async saveMeasurement(clientId: string, id: string | null, input: { recordedAt: string; assessmentId: string | null; measurements: Record<string, string> }) {
      await clientExists(clientId); await assessmentBelongs(clientId, input.assessmentId);
      const payload = { recorded_at: input.recordedAt, assessment_id: input.assessmentId, measurements: input.measurements, ...(id ? {} : { client_id: clientId }) };
      const query = id ? client.from("progress_measurements").update(payload).eq("id", id).eq("client_id", clientId) : client.from("progress_measurements").insert(payload);
      const { data, error } = await query.select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("O registro de medidas não pertence a este cliente.");
      return String(data.id);
    },
    async deleteMeasurement(clientId: string, id: string) {
      await clientExists(clientId);
      const { data, error } = await client.from("progress_measurements").delete().eq("id", id).eq("client_id", clientId).select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("O registro de medidas não pertence a este cliente.");
    },
    async savePerformance(clientId: string, id: string | null, input: { metric: string; value: number | null; unit: string | null; recordedAt: string; assessmentId: string | null }) {
      await clientExists(clientId); await assessmentBelongs(clientId, input.assessmentId);
      const payload = { metric: input.metric, value: input.value, unit: input.unit, recorded_at: input.recordedAt, assessment_id: input.assessmentId, ...(id ? {} : { client_id: clientId }) };
      const query = id ? client.from("performance_records").update(payload).eq("id", id).eq("client_id", clientId) : client.from("performance_records").insert(payload);
      const { data, error } = await query.select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("O registro de desempenho não pertence a este cliente.");
      return String(data.id);
    },
    async deletePerformance(clientId: string, id: string) {
      await clientExists(clientId);
      const { data, error } = await client.from("performance_records").delete().eq("id", id).eq("client_id", clientId).select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("O registro de desempenho não pertence a este cliente.");
    },
    async uploadPhoto(clientId: string, input: { category: string | null; recordedAt: string; assessmentId: string | null; bytes: Uint8Array; contentType: string; extension: string }) {
      await clientExists(clientId); await assessmentBelongs(clientId, input.assessmentId);
      const path = `progress/${clientId}/${crypto.randomUUID()}.${input.extension}`;
      const uploaded = await client.storage.from("images").upload(path, input.bytes, { contentType: input.contentType, upsert: false });
      if (uploaded.error) throw uploaded.error;
      let assetId: string | null = null;
      try {
        const asset = await client.from("media_assets").insert({ bucket: "images", path, title: "Foto de evolução", alt_text: input.category ?? "Foto de evolução", scope: "CLIENT", client_id: clientId, asset_type: "progress", metadata: { kind: "progress_photo" } }).select("id").single();
        if (asset.error) throw asset.error;
        assetId = String(asset.data.id);
        const photo = await client.from("progress_photos").insert({ client_id: clientId, assessment_id: input.assessmentId, asset_id: assetId, category: input.category, recorded_at: input.recordedAt }).select("id").single();
        if (photo.error) throw photo.error;
        return String(photo.data.id);
      } catch (error) {
        await compensateUpload(clientId, assetId, path, error);
      }
    },
    async replacePhoto(clientId: string, id: string, input: { category: string | null; recordedAt: string; assessmentId: string | null; bytes: Uint8Array; contentType: string; extension: string }) {
      await clientExists(clientId); await assessmentBelongs(clientId, input.assessmentId);
      const existing = await client.from("progress_photos").select("id").eq("id", id).eq("client_id", clientId).maybeSingle();
      if (existing.error) throw existing.error;
      if (!existing.data) throw new Error("A foto não pertence a este cliente.");
      const path = `progress/${clientId}/${crypto.randomUUID()}.${input.extension}`;
      const uploaded = await client.storage.from("images").upload(path, input.bytes, { contentType: input.contentType, upsert: false });
      if (uploaded.error) throw uploaded.error;
      let assetId: string | null = null;
      try {
        const asset = await client.from("media_assets").insert({ bucket: "images", path, title: "Foto de evolução", alt_text: input.category ?? "Foto de evolução", scope: "CLIENT", client_id: clientId, asset_type: "progress", metadata: { kind: "progress_photo" } }).select("id").single();
        if (asset.error) throw asset.error;
        assetId = String(asset.data.id);
        const updated = await client.from("progress_photos").update({ asset_id: assetId, assessment_id: input.assessmentId, category: input.category, recorded_at: input.recordedAt }).eq("id", id).eq("client_id", clientId).select("id").maybeSingle();
        if (updated.error) throw updated.error;
        if (!updated.data) throw new Error("A foto não pertence a este cliente.");
      } catch (error) {
        await compensateUpload(clientId, assetId, path, error);
      }
    },
    async deletePhoto(clientId: string, id: string) {
      await clientExists(clientId);
      const { data, error } = await client.from("progress_photos").delete().eq("id", id).eq("client_id", clientId).select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("A foto não pertence a este cliente.");
      // Keep the private asset intact. The media library's reference-aware cleanup
      // can remove only verified orphans without risking a shared object.
    },
  };
}
