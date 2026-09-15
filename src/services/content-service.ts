import type { ContentRepository } from "@/repositories/content-repository";

export function createContentService(repository: ContentRepository) {
  return {
    listExercises: () => repository.listExercises(),
    listWorkouts: () => repository.listWorkouts(),
    getWorkout: (id: string) => repository.getWorkout(id),
    listWorkoutExercises: (id: string) => repository.listWorkoutExercises(id),
    listVideos: () => repository.listVideos(),
    getExercise: (id: string) => repository.getExercise(id),
    listNutritionPlans: () => repository.listNutritionPlans(),
    listNutritionMeals: (id: string) => repository.listNutritionMeals(id),
    listRecipes: () => repository.listRecipes(),
    listProgressWeights: () => repository.listProgressWeights(),
    listProgressMeasurements: () => repository.listProgressMeasurements(),
    listPerformanceRecords: () => repository.listPerformanceRecords(),
    listProgressPhotos: () => repository.listProgressPhotos(),
    listTips: () => repository.listTips(),
  };
}
