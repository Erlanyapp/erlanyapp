"use client";

import { useActionState, useEffect, useState } from "react";
import { markWorkoutPaid } from "@/app/(client)/app/actions";

const initialState = { ok: false, message: "" };

export function DailyWorkoutCheckin({ assignmentId, workoutId, checkedIn }: { assignmentId: string; workoutId: string; checkedIn: boolean }) {
  const [state, action, pending] = useActionState(markWorkoutPaid, initialState);
  const [confirmed, setConfirmed] = useState(checkedIn);
  useEffect(() => {
    if (state.ok) setConfirmed(true);
  }, [state.ok]);
  return <form className="home-checkin-form" action={action}>
    <input type="hidden" name="assignmentId" value={assignmentId} />
    <input type="hidden" name="workoutId" value={workoutId} />
    <button className="button button-outline" type="submit" disabled={pending || confirmed} aria-describedby="daily-checkin-feedback">
      {pending ? "Registrando…" : confirmed ? "✓ TÁ PAGO!" : "TÁ PAGO!"}
    </button>
    <span id="daily-checkin-feedback" className="home-checkin-feedback" role="status" aria-live="polite">
      {state.message}
    </span>
  </form>;
}
