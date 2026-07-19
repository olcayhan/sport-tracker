import type { SetWithExercise } from '@/db/types';

/** Setleri hareket bazında grupla (girildikleri sırayı koruyarak). */
export function groupByExercise(sets: SetWithExercise[]) {
  const order: number[] = [];
  const map = new Map<number, { name: string; muscle: string; items: SetWithExercise[] }>();
  for (const s of sets) {
    if (!map.has(s.exercise_id)) {
      map.set(s.exercise_id, { name: s.exercise_name, muscle: s.muscle_group, items: [] });
      order.push(s.exercise_id);
    }
    map.get(s.exercise_id)!.items.push(s);
  }
  return order.map((id) => ({ id, ...map.get(id)! }));
}
