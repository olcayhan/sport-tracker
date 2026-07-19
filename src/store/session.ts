import { create } from 'zustand';

import { lastUsedForExercise } from '@/db/repositories/exercises';
import { addSet, deleteSet, setSetType, setsForDay, updateSet } from '@/db/repositories/sets';
import { getOpenWorkout, startWorkout } from '@/db/repositories/workouts';
import type { SetType, SetWithExercise } from '@/db/types';
import { localDay } from '@/lib/date';

interface SessionState {
  workoutId: number | null;
  sets: SetWithExercise[];
  /** Aktif hareket (hızlı giriş bunun için) */
  selectedExerciseId: number | null;
  selectedExerciseName: string | null;
  /** Giriş alanları — art arda set girişini hızlandırmak için store'da tutulur. */
  reps: string;
  weight: string;
  /** Girilecek setin tipi — her commit sonrası 'normal'a döner (yapışkan bir mod değil). */
  setType: SetType;

  /** Açık oturum varsa yükler (uygulama açılışında). */
  hydrate: () => void;
  /** Yeni oturum başlatır (yoksa). */
  begin: () => void;
  selectExercise: (id: number, name: string) => void;
  /** Hareket seçimini iptal edip aktif kartı kapatır (henüz set girilmediyse). */
  deselectExercise: () => void;
  setReps: (v: string) => void;
  setWeight: (v: string) => void;
  toggleSetType: () => void;
  /** Aktif harekete bir set kaydeder. Başarılıysa true. */
  commitSet: () => boolean;
  removeSet: (id: number) => void;
  /** Bir setin tipini Normal ↔ Drop Set arasında döngüsel değiştirir. */
  cycleSetType: (id: number) => void;

  /** Düzenlenmekte olan set (varsa) ve onun geçici tekrar/ağırlık/tip alanları. */
  editingSet: SetWithExercise | null;
  editReps: string;
  editWeight: string;
  editSetType: SetType;
  startEditSet: (s: SetWithExercise) => void;
  setEditReps: (v: string) => void;
  setEditWeight: (v: string) => void;
  toggleEditSetType: () => void;
  /** Düzenlenen seti kaydeder. Başarılıysa true. */
  saveEditSet: () => boolean;
  cancelEditSet: () => void;
}

export const useSession = create<SessionState>((set, get) => ({
  workoutId: null,
  sets: [],
  selectedExerciseId: null,
  selectedExerciseName: null,
  reps: '',
  weight: '',
  setType: 'normal',

  hydrate: () => {
    const open = getOpenWorkout();
    set({ workoutId: open ? open.id : null, sets: setsForDay(localDay()) });
  },

  begin: () => {
    if (get().workoutId) return;
    const id = startWorkout();
    set({ workoutId: id, sets: setsForDay(localDay()) });
  },

  selectExercise: (id, name) => {
    const last = lastUsedForExercise(id);
    set({
      selectedExerciseId: id,
      selectedExerciseName: name,
      // Hareket değişince eski değerler taşınmasın; bu harekette en son kullanılanla ön-doldur.
      reps: last ? String(last.reps) : '',
      weight: last ? String(last.weight) : '',
      // Set tipi geçmişten ön-doldurulmaz, her zaman Normal ile başlar.
      setType: 'normal',
    });
  },

  setReps: (v) => set({ reps: v }),
  setWeight: (v) => set({ weight: v }),
  toggleSetType: () =>
    set((s) => ({ setType: s.setType === 'dropset' ? 'normal' : 'dropset' })),

  deselectExercise: () => set({ selectedExerciseId: null, selectedExerciseName: null }),

  commitSet: () => {
    const { workoutId, selectedExerciseId, reps, weight, setType } = get();
    if (!selectedExerciseId) return false;
    const repsN = parseInt(reps, 10);
    if (!Number.isFinite(repsN) || repsN <= 0) return false;
    const weightN = parseFloat(weight.replace(',', '.')) || 0;

    // Oturum yoksa bu ilk sette otomatik başlat.
    let wid = workoutId;
    if (!wid) {
      wid = startWorkout();
    }
    addSet(wid, selectedExerciseId, repsN, weightN, null, setType);
    set({ workoutId: wid, sets: setsForDay(localDay()), setType: 'normal' });
    return true;
  },

  removeSet: (id) => {
    deleteSet(id);
    set({ sets: setsForDay(localDay()) });
  },

  cycleSetType: (id) => {
    const current = get().sets.find((s) => s.id === id);
    if (!current) return;
    const next: SetType = current.set_type === 'dropset' ? 'normal' : 'dropset';
    setSetType(id, next);
    set({ sets: setsForDay(localDay()) });
  },

  editingSet: null,
  editReps: '',
  editWeight: '',
  editSetType: 'normal',

  startEditSet: (s) => {
    set({
      editingSet: s,
      editReps: String(s.reps),
      editWeight: String(s.weight),
      editSetType: s.set_type,
    });
  },

  setEditReps: (v) => set({ editReps: v }),
  setEditWeight: (v) => set({ editWeight: v }),
  toggleEditSetType: () =>
    set((s) => ({ editSetType: s.editSetType === 'dropset' ? 'normal' : 'dropset' })),

  saveEditSet: () => {
    const { editingSet, editReps, editWeight, editSetType } = get();
    if (!editingSet) return false;
    const repsN = parseInt(editReps, 10);
    if (!Number.isFinite(repsN) || repsN <= 0) return false;
    const weightN = parseFloat(editWeight.replace(',', '.')) || 0;

    updateSet(editingSet.id, repsN, weightN, editSetType);
    set({ sets: setsForDay(localDay()), editingSet: null });
    return true;
  },

  cancelEditSet: () => set({ editingSet: null }),
}));
