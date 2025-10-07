import * as SQLite from 'expo-sqlite';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { DatabaseHelper } from '../database/helpers';
import { Category, Exercise, Workout, WorkoutExercise } from '../database/schema';

interface DatabaseContextType {
  dbHelper: DatabaseHelper | null;
  isInitialized: boolean;
  exercises: Exercise[];
  workouts: Workout[];
  categories: Category[];
  refreshExercises: () => Promise<void>;
  refreshWorkouts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  addCustomExercise: (name: string, category: string) => Promise<string>;
  addWorkout: (name: string, date: string) => Promise<string>;
  updateWorkout: (id: string, name: string, date: string) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  addWorkoutExercise: (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number,
    setNumber: number,
    previousReps?: number,
    previousWeight?: number
  ) => Promise<string>;
  getLastRecordedStats: (exerciseId: string) => Promise<{ reps: number; weight: number } | null>;
  getExerciseHistory: (exerciseId: string, limit?: number) => Promise<WorkoutExercise[]>;
  searchExercises: (query: string) => Promise<Exercise[]>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [dbHelper, setDbHelper] = useState<DatabaseHelper | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      // Open database
      const db = SQLite.openDatabaseSync('fitness_tracker.db');
      
      // Create tables
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        );
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exercises (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          is_custom BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category) REFERENCES categories(name)
        );
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS workouts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.execAsync(`
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

      // Create indexes
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);`);

      // Create helper instance
      const helper = new DatabaseHelper(db);
      setDbHelper(helper);

      // Initialize with pre-populated data
      await helper.initializeDatabase();

      // Migrate from AsyncStorage if needed
      await helper.migrateFromAsyncStorage();

      // Load initial data
      await refreshAllData(helper);

      setIsInitialized(true);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  };

  const refreshAllData = async (helper: DatabaseHelper) => {
    try {
      const [exercisesData, workoutsData, categoriesData] = await Promise.all([
        helper.getAllExercises(),
        helper.getAllWorkouts(),
        helper.getAllCategories()
      ]);

      setExercises(exercisesData);
      setWorkouts(workoutsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const refreshExercises = async () => {
    if (dbHelper) {
      const data = await dbHelper.getAllExercises();
      setExercises(data);
    }
  };

  const refreshWorkouts = async () => {
    if (dbHelper) {
      const data = await dbHelper.getAllWorkouts();
      setWorkouts(data);
    }
  };

  const refreshCategories = async () => {
    if (dbHelper) {
      const data = await dbHelper.getAllCategories();
      setCategories(data);
    }
  };

  const addCustomExercise = async (name: string, category: string): Promise<string> => {
    if (!dbHelper) throw new Error('Database not initialized');
    const id = await dbHelper.addCustomExercise(name, category);
    await refreshExercises();
    return id;
  };

  const addWorkout = async (name: string, date: string): Promise<string> => {
    if (!dbHelper) throw new Error('Database not initialized');
    const id = await dbHelper.addWorkout(name, date);
    await refreshWorkouts();
    return id;
  };

  const updateWorkout = async (id: string, name: string, date: string): Promise<void> => {
    if (!dbHelper) throw new Error('Database not initialized');
    await dbHelper.updateWorkout(id, name, date);
    await refreshWorkouts();
  };

  const deleteWorkout = async (id: string): Promise<void> => {
    if (!dbHelper) throw new Error('Database not initialized');
    await dbHelper.deleteWorkout(id);
    await refreshWorkouts();
  };

  const addWorkoutExercise = async (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number,
    setNumber: number,
    previousReps?: number,
    previousWeight?: number
  ): Promise<string> => {
    if (!dbHelper) throw new Error('Database not initialized');
    return await dbHelper.addWorkoutExercise(
      workoutId,
      exerciseId,
      reps,
      weight,
      setNumber,
      previousReps,
      previousWeight
    );
  };

  const getLastRecordedStats = async (exerciseId: string): Promise<{ reps: number; weight: number } | null> => {
    if (!dbHelper) throw new Error('Database not initialized');
    return await dbHelper.getLastRecordedStats(exerciseId);
  };

  const getExerciseHistory = async (exerciseId: string, limit: number = 10): Promise<WorkoutExercise[]> => {
    if (!dbHelper) throw new Error('Database not initialized');
    return await dbHelper.getExerciseHistory(exerciseId, limit);
  };

  const searchExercises = async (query: string): Promise<Exercise[]> => {
    if (!dbHelper) throw new Error('Database not initialized');
    return await dbHelper.searchExercises(query);
  };

  const value: DatabaseContextType = {
    dbHelper,
    isInitialized,
    exercises,
    workouts,
    categories,
    refreshExercises,
    refreshWorkouts,
    refreshCategories,
    addCustomExercise,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    addWorkoutExercise,
    getLastRecordedStats,
    getExerciseHistory,
    searchExercises,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
