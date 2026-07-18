import { db } from '../client';
import { addDays, localDay } from '@/lib/date';

export interface DayActivity {
  date: string; // YYYY-MM-DD
  sets: number;
  volume: number; // Σ reps*weight
}

/** [fromDay, toDay] aralığındaki, en az bir seti olan günlerin özet aktivitesi. */
export function activityByDay(fromDay: string, toDay: string): DayActivity[] {
  return db.getAllSync<DayActivity>(
    `SELECT w.date AS date,
            COUNT(s.id) AS sets,
            COALESCE(SUM(s.reps * s.weight), 0) AS volume
     FROM workouts w JOIN sets s ON s.workout_id = w.id
     WHERE w.date BETWEEN ? AND ?
     GROUP BY w.date
     ORDER BY w.date ASC`,
    [fromDay, toDay],
  );
}

/** Antrenman yapılmış (setli) benzersiz günlerin listesi, en yeni önce. */
function trainedDaysDesc(): string[] {
  const rows = db.getAllSync<{ date: string }>(
    `SELECT DISTINCT w.date AS date
     FROM workouts w JOIN sets s ON s.workout_id = w.id
     ORDER BY w.date DESC`,
  );
  return rows.map((r) => r.date);
}

/** Güncel seri (streak): bugün veya dünden başlayarak kesintisiz antrenman günü sayısı. */
export function currentStreak(): number {
  const days = new Set(trainedDaysDesc());
  if (days.size === 0) return 0;
  const today = localDay();
  // Seri bugünden ya da (bugün boşsa) dünden başlayabilir.
  let cursor = days.has(today) ? today : addDays(today, -1);
  if (!days.has(cursor)) return 0;
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface Summary {
  workoutsThisMonth: number;
  volumeThisMonth: number;
  topMuscle: string | null;
  totalWorkouts: number;
}

/** Dashboard özet kutucukları için toplu istatistikler. */
export function summary(): Summary {
  const monthStart = localDay().slice(0, 7) + '-01';

  const w = db.getFirstSync<{ c: number }>(
    `SELECT COUNT(DISTINCT w.date) AS c
     FROM workouts w JOIN sets s ON s.workout_id = w.id
     WHERE w.date >= ?`,
    [monthStart],
  );
  const vol = db.getFirstSync<{ v: number }>(
    `SELECT COALESCE(SUM(s.reps * s.weight), 0) AS v
     FROM workouts w JOIN sets s ON s.workout_id = w.id
     WHERE w.date >= ?`,
    [monthStart],
  );
  const muscle = db.getFirstSync<{ muscle_group: string }>(
    `SELECT e.muscle_group, COUNT(s.id) AS c
     FROM sets s JOIN exercises e ON e.id = s.exercise_id
     WHERE s.created_at >= datetime('now', '-30 days')
     GROUP BY e.muscle_group ORDER BY c DESC LIMIT 1`,
  );
  const total = db.getFirstSync<{ c: number }>(
    `SELECT COUNT(DISTINCT w.date) AS c
     FROM workouts w JOIN sets s ON s.workout_id = w.id`,
  );

  return {
    workoutsThisMonth: w?.c ?? 0,
    volumeThisMonth: Math.round(vol?.v ?? 0),
    topMuscle: muscle?.muscle_group ?? null,
    totalWorkouts: total?.c ?? 0,
  };
}

export interface ExerciseProgressPoint {
  date: string;
  topWeight: number; // o günkü en ağır set ağırlığı
  estOneRm: number; // Epley: weight * (1 + reps/30), günün en yükseği
  volume: number; // o günkü toplam hacim
}

/** Bir hareket için son N antrenman gününün ilerleme noktaları (eskiden yeniye). */
export function exerciseProgress(exerciseId: number, limit = 10): ExerciseProgressPoint[] {
  const rows = db.getAllSync<ExerciseProgressPoint>(
    `SELECT w.date AS date,
            MAX(s.weight) AS topWeight,
            MAX(s.weight * (1 + s.reps / 30.0)) AS estOneRm,
            SUM(s.reps * s.weight) AS volume
     FROM sets s JOIN workouts w ON w.id = s.workout_id
     WHERE s.exercise_id = ?
     GROUP BY w.date
     ORDER BY w.date DESC
     LIMIT ?`,
    [exerciseId, limit],
  );
  return rows.reverse(); // grafikte soldan sağa: eski → yeni
}

/** Bir hareketteki kişisel rekor (en ağır set). */
export function personalRecord(exerciseId: number): { weight: number; reps: number } | null {
  return db.getFirstSync<{ weight: number; reps: number }>(
    `SELECT weight, reps FROM sets WHERE exercise_id = ? ORDER BY weight DESC, reps DESC LIMIT 1`,
    [exerciseId],
  );
}

/** İlerleme ekranı seçici için: en az bir kez çalışılmış hareketler (en çok çalışılan önce). */
export function exercisesWithData(): { id: number; name: string; muscle_group: string }[] {
  return db.getAllSync<{ id: number; name: string; muscle_group: string }>(
    `SELECT e.id, e.name, e.muscle_group
     FROM exercises e JOIN sets s ON s.exercise_id = e.id
     GROUP BY e.id ORDER BY COUNT(s.id) DESC`,
  );
}
