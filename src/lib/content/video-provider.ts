import type { VideoProvider, WorkoutVideo } from "@/types/content";

export interface VideoProviderAdapter {
  readonly provider: VideoProvider;
  getEmbedSource(video: Pick<WorkoutVideo, "providerVideoId">): string;
}

export const youtubeProvider: VideoProviderAdapter = {
  provider: "youtube",
  getEmbedSource: ({ providerVideoId }) => /^[A-Za-z0-9_-]{11}$/.test(providerVideoId)
    ? `https://www.youtube-nocookie.com/embed/${providerVideoId}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`
    : "",
};

export const videoProviders: Readonly<Record<VideoProvider, VideoProviderAdapter | null>> = {
  youtube: youtubeProvider,
  vimeo: null,
  storage: null,
  other: null,
};
