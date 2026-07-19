import { db } from '../client';
import type { SetWithExercise } from '../types';

/** Oturuma yeni set ekler. set_number otomatik: aynı oturum+hareketteki sıradaki numara. */
export function addSet(
  workoutId: number,
  exerciseId: number,
  reps: number,
  weight: number,
  rpe?: number | null,
): number {
  const row = db.getFirstSync<{ n: number }>(
    'SELECT COALESCE(MAX(set_number), 0) AS n FROM sets WHERE workout_id = ? AND exercise_id = ?',
    [workoutId, exerciseId],
  );
  const setNumber = (row?.n ?? 0) + 1;
  const res = db.runSync(
    'INSERT INTO sets (workout_id, exercise_id, set_number, reps, weight, rpe) VALUES (?, ?, ?, ?, ?, ?)',
    [workoutId, exerciseId, setNumber, reps, weight, rpe ?? null],
  );
  return res.lastInsertRowId;
}

export function deleteSet(id: number): void {
  db.runSync('DELETE FROM sets WHERE id = ?', [id]);
}

export function updateSet(id: number, reps: number, weight: number): void {
  db.runSync('UPDATE sets SET reps = ?, weight = ? WHERE id = ?', [reps, weight, id]);
}

/** Verilen günün tüm setleri (o güne ait tüm oturumlar dahil, bitmiş olsalar da). */
export function setsForDay(day: string): SetWithExercise[] {
  return db.getAllSync<SetWithExercise>(
    `SELECT s.*, e.name AS exercise_name, e.muscle_group
     FROM sets s
     JOIN exercises e ON e.id = s.exercise_id
     JOIN workouts w ON w.id = s.workout_id
     WHERE w.date = ?
     ORDER BY s.id DESC`,
    [day],
  );
}
