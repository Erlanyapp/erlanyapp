import type { ContentRepository } from "@/repositories/content-repository";

export function createContentService(repository: ContentRepository) {
  return {
    listExercises: () => repository.listExercises(),
    listWorkouts: () => repository.listWorkouts(),
    listAssignedWorkouts: () => repository.listAssignedWorkouts(),
    listAssignedWorkoutSchedule: () => repository.listAssignedWorkoutSchedule(),
    getWorkout: (id: string) => repository.getWorkout(id),
    getWorkoutWithExercises: (id: string) => repository.getWorkoutWithExercises(id),
    listWorkoutExercises: (id: string) => repository.listWorkoutExercises(id),
    listVideos: () => repository.listVideos(),
    getVideo: (id: string) => repository.getVideo(id),
    getExercise: (id: string) => repository.getExercise(id),
    listNutritionPlans: () => repository.listNutritionPlans(),
    listNutritionMeals: (id: string) => repository.listNutritionMeals(id),
    listNutritionMealsForPlans: (ids: string[]) => repository.listNutritionMealsForPlans(ids),
    listRecipes: () => repository.listRecipes(),
    getRecipe: (id: string) => repository.getRecipe(id),
    listProgressWeights: () => repository.listProgressWeights(),
    listProgressAssessments: () => repository.listProgressAssessments(),
    listProgressMeasurements: () => repository.listProgressMeasurements(),
    listPerformanceRecords: () => repository.listPerformanceRecords(),
    listTodayWorkoutCheckins: () => repository.listTodayWorkoutCheckins(),
    getTodayWorkoutCheckin: (assignmentId: string) => repository.getTodayWorkoutCheckin(assignmentId),
    getWorkoutCheckinSummary: () => repository.getWorkoutCheckinSummary(),
    listProgressPhotos: () => repository.listProgressPhotos(),
    listTips: () => repository.listTips(),
  };
}
