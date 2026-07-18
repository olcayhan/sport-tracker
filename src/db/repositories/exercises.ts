import { db } from '../client';
import type { Exercise } from '../types';

export function listExercises(): Exercise[] {
  return db.getAllSync<Exercise>('SELECT * FROM exercises ORDER BY muscle_group, name');
}

export function getExercise(id: number): Exercise | null {
  return db.getFirstSync<Exercise>('SELECT * FROM exercises WHERE id = ?', [id]);
}

export function addExercise(name: string, muscleGroup: string): number {
  const res = db.runSync(
    'INSERT INTO exercises (name, muscle_group, is_custom) VALUES (?, ?, 1)',
    [name.trim(), muscleGroup.trim()],
  );
  return res.lastInsertRowId;
}

export function deleteExercise(id: number): void {
  db.runSync('DELETE FROM exercises WHERE id = ?', [id]);
}

/** Bu harekette en son kullanılan (tekrar, ağırlık) değeri — hızlı giriş için ön-dolu. */
export function lastUsedForExercise(
  exerciseId: number,
): { reps: number; weight: number } | null {
  return db.getFirstSync<{ reps: number; weight: number }>(
    'SELECT reps, weight FROM sets WHERE exercise_id = ? ORDER BY id DESC LIMIT 1',
    [exerciseId],
  );
}
