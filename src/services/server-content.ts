import { createContentRepository } from "@/repositories/content-repository";
import { createContentService } from "@/services/content-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getContentService() {
  const client = await createSupabaseServerClient();
  return client ? createContentService(createContentRepository(client)) : null;
}
