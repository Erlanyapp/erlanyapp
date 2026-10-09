import type { SupabaseClient } from "@supabase/supabase-js";
import { assessmentInput, measurementInput, performanceInput, progressId, progressPhotoInput } from "@/domain/admin-progress";
import { editorialCover } from "@/domain/admin-editorial";
import { createAdminProgressRepository } from "@/repositories/admin-progress-repository";

export function createAdminProgressService(client: SupabaseClient, administratorId: string) {
  const repository = createAdminProgressRepository(client);
  return {
    list: (clientId: string) => repository.list(progressId(clientId, "Cliente")),
    saveAssessment: (clientId: string, id: string | null, form: FormData) => repository.saveAssessment(progressId(clientId, "Cliente"), id ? progressId(id, "Avaliação") : null, assessmentInput(form), administratorId),
    deleteAssessment: (clientId: string, id: string) => repository.deleteAssessment(progressId(clientId, "Cliente"), progressId(id, "Avaliação")),
    saveMeasurement: (clientId: string, id: string | null, form: FormData) => repository.saveMeasurement(progressId(clientId, "Cliente"), id ? progressId(id, "Medidas") : null, measurementInput(form)),
    deleteMeasurement: (clientId: string, id: string) => repository.deleteMeasurement(progressId(clientId, "Cliente"), progressId(id, "Medidas")),
    savePerformance: (clientId: string, id: string | null, form: FormData) => repository.savePerformance(progressId(clientId, "Cliente"), id ? progressId(id, "Desempenho") : null, performanceInput(form)),
    deletePerformance: (clientId: string, id: string) => repository.deletePerformance(progressId(clientId, "Cliente"), progressId(id, "Desempenho")),
    async uploadPhoto(clientId: string, form: FormData) {
      const file = await editorialCover(form.get("photo"));
      if (!file) throw new Error("Selecione uma foto PNG, JPG ou WebP.");
      return repository.uploadPhoto(progressId(clientId, "Cliente"), { ...progressPhotoInput(form), ...file });
    },
    async replacePhoto(clientId: string, id: string, form: FormData) {
      const file = await editorialCover(form.get("photo"));
      if (!file) throw new Error("Selecione uma foto PNG, JPG ou WebP.");
      return repository.replacePhoto(progressId(clientId, "Cliente"), progressId(id, "Foto"), { ...progressPhotoInput(form), ...file });
    },
    deletePhoto: (clientId: string, id: string) => repository.deletePhoto(progressId(clientId, "Cliente"), progressId(id, "Foto")),
  };
}
