import type { VideoProvider, WorkoutVideo } from "@/types/content";

export interface VideoProviderAdapter {
  readonly provider: VideoProvider;
  getEmbedSource(video: Pick<WorkoutVideo, "providerVideoId">): string;
}

export const youtubeProvider: VideoProviderAdapter = {
  provider: "youtube",
  getEmbedSource: ({ providerVideoId }) => `https://www.youtube-nocookie.com/embed/${providerVideoId}`,
};

export const videoProviders: Readonly<Record<VideoProvider, VideoProviderAdapter | null>> = {
  youtube: youtubeProvider,
  vimeo: null,
  storage: null,
  other: null,
};
