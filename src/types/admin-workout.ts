import type { ContentScope } from "./content";
export type WorkoutStatus="draft"|"published";
export type WorkoutInput={name:string;description:string|null;category:string|null;level:string|null;durationMinutes:number|null;scope:ContentScope;clientId:string|null;status:WorkoutStatus;isActive:boolean};
export type WorkoutExerciseInput={exerciseId:string;sets:number|null;repetitions:string|null;load:string|null;restSeconds:number|null;durationSeconds:number|null;notes:string|null};
export type AdminWorkout={id:string;name:string;description:string|null;category:string|null;level:string|null;durationMinutes:number|null;scope:ContentScope;clientId:string|null;status:WorkoutStatus;isActive:boolean;exerciseCount:number;scheduledWeekdays:number[];createdAt:string;updatedAt:string};
export type AssignmentInput={clientId:string;startsOn:string;endsOn:string|null;notes:string|null;days:{weekday:number;kind:"WORKOUT"|"REST"}[]};
