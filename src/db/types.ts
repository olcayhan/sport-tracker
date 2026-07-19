export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  is_custom: number;
  created_at: string;
}

export interface Workout {
  id: number;
  date: string; // YYYY-MM-DD
  started_at: string;
  ended_at: string | null;
  note: string | null;
}

export type SetType = 'normal' | 'dropset';

export interface WorkoutSet {
  id: number;
  workout_id: number;
  exercise_id: number;
  set_number: number;
  reps: number;
  weight: number;
  rpe: number | null;
  set_type: SetType;
  created_at: string;
}

/** Bir sete, ait olduğu hareket bilgisi eklenmiş hali (oturum ekranında listeleme). */
export interface SetWithExercise extends WorkoutSet {
  exercise_name: string;
  muscle_group: string;
}
