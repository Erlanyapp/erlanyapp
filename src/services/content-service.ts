import type { ContentRepository } from "@/repositories/content-repository";

export function createContentService(repository: ContentRepository) {
  return {
    listExercises: () => repository.listExercises(),
    listWorkouts: () => repository.listWorkouts(),
    listVideos: () => repository.listVideos(),
    listTips: () => repository.listTips(),
  };
}
