import * as SQLite from 'expo-sqlite';
import { categories, exercisePool } from './exercisePool';
import { Category, Exercise, Workout, WorkoutExercise } from './schema';

export class DatabaseHelper {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  // Exercise operations
  async getAllExercises(): Promise<Exercise[]> {
    const result = await this.db.getAllAsync<Exercise>(
      'SELECT * FROM exercises ORDER BY name ASC'
    );
    return result;
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    const result = await this.db.getAllAsync<Exercise>(
      'SELECT * FROM exercises WHERE category = ? ORDER BY name ASC',
      [category]
    );
    return result;
  }

  async getExerciseById(id: string): Promise<Exercise | null> {
    const result = await this.db.getFirstAsync<Exercise>(
      'SELECT * FROM exercises WHERE id = ?',
      [id]
    );
    return result || null;
  }

  async addCustomExercise(name: string, category: string): Promise<string> {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.db.runAsync(
      'INSERT INTO exercises (id, name, category, is_custom) VALUES (?, ?, ?, ?)',
      [id, name, category, true]
    );
    return id;
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    const result = await this.db.getAllAsync<Exercise>(
      'SELECT * FROM exercises WHERE name LIKE ? ORDER BY name ASC',
      [`%${query}%`]
    );
    return result;
  }

  // Workout operations
  async getAllWorkouts(): Promise<Workout[]> {
    const result = await this.db.getAllAsync<Workout>(
      'SELECT * FROM workouts ORDER BY date DESC'
    );
    return result;
  }

  async getWorkoutById(id: string): Promise<Workout | null> {
    const result = await this.db.getFirstAsync<Workout>(
      'SELECT * FROM workouts WHERE id = ?',
      [id]
    );
    return result || null;
  }

  async addWorkout(name: string, date: string): Promise<string> {
    const id = `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.db.runAsync(
      'INSERT INTO workouts (id, name, date) VALUES (?, ?, ?)',
      [id, name, date]
    );
    return id;
  }

  async updateWorkout(id: string, name: string, date: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE workouts SET name = ?, date = ? WHERE id = ?',
      [name, date, id]
    );
  }

  async deleteWorkout(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
  }

  // WorkoutExercise operations
  async getWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
    const result = await this.db.getAllAsync<WorkoutExercise>(
      'SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY created_at ASC',
      [workoutId]
    );
    return result;
  }

  async addWorkoutExercise(
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number,
    setNumber: number,
    previousReps?: number,
    previousWeight?: number
  ): Promise<string> {
    const id = `we-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.db.runAsync(
      'INSERT INTO workout_exercises (id, workout_id, exercise_id, reps, weight, previous_reps, previous_weight, set_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, workoutId, exerciseId, reps, weight, previousReps || null, previousWeight || null, setNumber]
    );
    return id;
  }

  async updateWorkoutExercise(
    id: string,
    reps: number,
    weight: number,
    previousReps?: number,
    previousWeight?: number
  ): Promise<void> {
    await this.db.runAsync(
      'UPDATE workout_exercises SET reps = ?, weight = ?, previous_reps = ?, previous_weight = ? WHERE id = ?',
      [reps, weight, previousReps || null, previousWeight || null, id]
    );
  }

  async deleteWorkoutExercise(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM workout_exercises WHERE id = ?', [id]);
  }

  // Get last recorded reps and weight for an exercise
  async getLastRecordedStats(exerciseId: string): Promise<{ reps: number; weight: number } | null> {
    const result = await this.db.getFirstAsync<{ reps: number; weight: number }>(
      `SELECT reps, weight FROM workout_exercises 
       WHERE exercise_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [exerciseId]
    );
    return result || null;
  }

  // Get exercise history for a specific exercise
  async getExerciseHistory(exerciseId: string, limit: number = 10): Promise<WorkoutExercise[]> {
    const result = await this.db.getAllAsync<WorkoutExercise>(
      `SELECT we.*, w.name as workout_name, w.date as workout_date 
       FROM workout_exercises we 
       JOIN workouts w ON we.workout_id = w.id 
       WHERE we.exercise_id = ? 
       ORDER BY we.created_at DESC 
       LIMIT ?`,
      [exerciseId, limit]
    );
    return result;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    const result = await this.db.getAllAsync<Category>(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return result;
  }

  // Migration from AsyncStorage
  async migrateFromAsyncStorage(): Promise<void> {
    try {
      // Check if migration is needed
      const existingWorkouts = await this.db.getAllAsync('SELECT COUNT(*) as count FROM workouts');
      if (existingWorkouts[0]?.count > 0) {
        console.log('Database already has data, skipping migration');
        return;
      }

      // Import AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Migrate workouts
      const workoutsData = await AsyncStorage.getItem('workouts');
      if (workoutsData) {
        const workouts = JSON.parse(workoutsData);
        for (const workout of workouts) {
          await this.addWorkout(workout.name, workout.date || new Date().toISOString());
        }
      }

      // Migrate completed workouts
      const completedWorkoutsData = await AsyncStorage.getItem('completedWorkouts');
      if (completedWorkoutsData) {
        const completedWorkouts = JSON.parse(completedWorkoutsData);
        for (const workout of completedWorkouts) {
          const workoutId = await this.addWorkout(
            workout.workoutName, 
            workout.date || new Date().toISOString()
          );
          
          // Migrate exercises and sets
          for (const exercise of workout.exercises) {
            const exerciseId = await this.findOrCreateExercise(exercise.exerciseName);
            
            for (let i = 0; i < exercise.sets.length; i++) {
              const set = exercise.sets[i];
              await this.addWorkoutExercise(
                workoutId,
                exerciseId,
                set.reps,
                set.weight,
                i + 1
              );
            }
          }
        }
      }

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  private async findOrCreateExercise(exerciseName: string): Promise<string> {
    // First try to find existing exercise
    const existing = await this.db.getFirstAsync<Exercise>(
      'SELECT * FROM exercises WHERE name = ?',
      [exerciseName]
    );
    
    if (existing) {
      return existing.id;
    }

    // If not found, create as custom exercise
    return await this.addCustomExercise(exerciseName, 'Custom');
  }

  // Initialize database with pre-populated data
  async initializeDatabase(): Promise<void> {
    try {
      // Insert categories
      for (const category of categories) {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)',
          [category.id, category.name]
        );
      }

      // Insert exercises
      for (const exercise of exercisePool) {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO exercises (id, name, category, is_custom) VALUES (?, ?, ?, ?)',
          [exercise.id, exercise.name, exercise.category, exercise.is_custom]
        );
      }

      console.log('Database initialized with pre-populated data');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
}
