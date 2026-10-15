import type { SupabaseClient } from "@supabase/supabase-js";
import type { intakeDraft, intakeInput } from "@/domain/client-intake";

type IntakeValues = ReturnType<typeof intakeDraft>;

const columns = (input: IntakeValues) => ({
  birth_date: input.birthDate,
  height_cm: input.heightCm,
  current_weight_kg: input.currentWeightKg,
  target_weight_kg: input.targetWeightKg,
  primary_goal: input.primaryGoal,
  experience_level: input.experienceLevel,
  training_days_per_week: input.trainingDaysPerWeek,
  training_location: input.trainingLocation,
  session_minutes: input.sessionMinutes,
  has_limitations: input.hasLimitations,
  has_professional_guidance: input.hasProfessionalGuidance,
  restrictions: input.restrictions || null,
});

export function createClientIntakeRepository(client: SupabaseClient, owner: () => Promise<string>) {
  const save = async (input: IntakeValues, completed: boolean) => {
    const clientId = await owner();
    const { error } = await client.from("client_initial_intakes").upsert(
      {
        client_id: clientId,
        ...columns(input),
        status: completed ? "COMPLETED" : "DRAFT",
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "client_id" },
    );
    if (error) throw error;
  };

  return {
    async get() {
      const { data, error } = await client
        .from("client_initial_intakes")
        .select("*")
        .eq("client_id", await owner())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async saveDraft(input: IntakeValues) {
      await save(input, false);
    },
    async save(input: ReturnType<typeof intakeInput>) {
      await save(input, true);
    },
  };
}
