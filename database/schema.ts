import * as SQLite from 'expo-sqlite';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  is_custom: boolean;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  reps: number;
  weight: number;
  previous_reps?: number;
  previous_weight?: number;
  set_number: number;
}

export interface Category {
  id: string;
  name: string;
}

export const DB_NAME = 'fitness_tracker.db';

export const createTables = (db: SQLite.SQLiteDatabase) => {
  // Categories table
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `);

  // Exercises table
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      is_custom BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category) REFERENCES categories(name)
    );
  `);

  // Workouts table
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // WorkoutExercises table
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL NOT NULL,
      previous_reps INTEGER,
      previous_weight REAL,
      set_number INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
  `);

  // Create indexes for better performance
  db.execAsync(`CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);`);
  db.execAsync(`CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);`);
  db.execAsync(`CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);`);
};
