import * as SQLite from 'expo-sqlite';

/**
 * Yerel SQLite veritabanı. Tek bağlantı üzerinden senkron API kullanılır
 * (repository katmanı bunun üstüne tipli fonksiyonlar sarar).
 */
export const db = SQLite.openDatabaseSync('sporttracker.db');

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS exercises (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  is_custom    INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workouts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,               -- 'YYYY-MM-DD' (yerel gün)
  started_at TEXT NOT NULL,               -- ISO
  ended_at   TEXT,                        -- ISO, açık oturumda NULL
  note       TEXT
);

CREATE TABLE IF NOT EXISTS sets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id  INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  set_number  INTEGER NOT NULL,
  reps        INTEGER NOT NULL,
  weight      REAL NOT NULL DEFAULT 0,
  rpe         REAL,
  set_type    TEXT NOT NULL DEFAULT 'normal',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sets_workout  ON sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise ON sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
`;

/** Başlangıç hareket kütüphanesi (kullanıcı ekleyip çıkarabilir). */
const SEED_EXERCISES: { name: string; muscle_group: string }[] = [
  { name: 'Bench Press', muscle_group: 'Göğüs' },
  { name: 'Incline Dumbbell Press', muscle_group: 'Göğüs' },
  { name: 'Squat', muscle_group: 'Bacak' },
  { name: 'Leg Press', muscle_group: 'Bacak' },
  { name: 'Deadlift', muscle_group: 'Sırt' },
  { name: 'Barbell Row', muscle_group: 'Sırt' },
  { name: 'Lat Pulldown', muscle_group: 'Sırt' },
  { name: 'Pull-up', muscle_group: 'Sırt' },
  { name: 'Overhead Press', muscle_group: 'Omuz' },
  { name: 'Lateral Raise', muscle_group: 'Omuz' },
  { name: 'Biceps Curl', muscle_group: 'Kol' },
  { name: 'Triceps Pushdown', muscle_group: 'Kol' },
];

let initialized = false;

/** Var olan kurulumlarda 'sets' tablosuna set_type sütununu ekler (yeni kurulumlarda no-op). */
function ensureSetTypeColumn(): void {
  const cols = db.getAllSync<{ name: string }>('PRAGMA table_info(sets)');
  if (!cols.some((c) => c.name === 'set_type')) {
    db.execSync("ALTER TABLE sets ADD COLUMN set_type TEXT NOT NULL DEFAULT 'normal'");
  }
}

/** Uygulama açılışında bir kez çağrılır: şema + tohumlama. */
export function initDatabase(): void {
  if (initialized) return;
  db.execSync(SCHEMA);
  ensureSetTypeColumn();

  const row = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM exercises');
  if (!row || row.c === 0) {
    db.withTransactionSync(() => {
      for (const e of SEED_EXERCISES) {
        db.runSync('INSERT INTO exercises (name, muscle_group, is_custom) VALUES (?, ?, 0)', [
          e.name,
          e.muscle_group,
        ]);
      }
    });
  }
  initialized = true;
}
