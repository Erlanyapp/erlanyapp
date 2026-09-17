import { createContentRepository } from "@/repositories/content-repository";
import { createContentService } from "@/services/content-service";
import { getClientIdentity, getOwnClientId } from "@/services/server-client-context";

export const getContentService = cache(async () => {
  const identity = await getClientIdentity();
  return identity ? createContentService(createContentRepository(identity.client, getOwnClientId)) : null;
});
import "server-only";
import { cache } from "react";
