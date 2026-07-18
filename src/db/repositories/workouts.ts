import { db } from '../client';
import { localDay } from '@/lib/date';
import type { Workout } from '../types';

/** Bugün için açık (bitmemiş) antrenman varsa döndürür. */
export function getOpenWorkout(): Workout | null {
  return db.getFirstSync<Workout>(
    'SELECT * FROM workouts WHERE ended_at IS NULL AND date = ? ORDER BY id DESC LIMIT 1',
    [localDay()],
  );
}

/** Bugünkü antrenmanı başlatır, id döndürür. Bugün için açık oturum varsa onu döndürür. */
export function startWorkout(): number {
  const open = getOpenWorkout();
  if (open) return open.id;
  const now = new Date();
  const res = db.runSync('INSERT INTO workouts (date, started_at) VALUES (?, ?)', [
    localDay(now),
    now.toISOString(),
  ]);
  return res.lastInsertRowId;
}

export function getWorkout(id: number): Workout | null {
  return db.getFirstSync<Workout>('SELECT * FROM workouts WHERE id = ?', [id]);
}
