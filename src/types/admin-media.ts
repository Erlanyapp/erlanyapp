import type { ContentScope, MediaAssetType, VideoProvider } from "./content";

export type MediaKind = "image" | "video";
export type MediaClient = { id: string; name: string; email: string | null };
export type MediaReference = { label: string; href: string };
export type AdminMediaItem = {
  id: string; kind: MediaKind; title: string; scope: ContentScope; clientId: string | null; clientName: string | null;
  assetType?: MediaAssetType; metadata?: Record<string, unknown>; imageUrl?: string | null;
  provider?: VideoProvider; providerVideoId?: string; description?: string | null; type?: string | null; isActive?: boolean;
  createdAt: string; updatedAt: string; references: MediaReference[];
};
