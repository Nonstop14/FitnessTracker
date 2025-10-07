import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEYS = {
  WORKOUTS: '@fitness_tracker_workouts',
  COMPLETED_WORKOUTS: '@fitness_tracker_completed_workouts',
};

export type WorkoutExercise = {
  id: string;
  exerciseName: string;
  sets: number;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  createdAt: number;
  exercises: WorkoutExercise[];
  restTime?: number; // in seconds, default 90
};

export type CompletedSet = {
  setNumber: number;
  reps: number;
  weight: number; // in kg
};

export type CompletedExercise = {
  exerciseName: string;
  sets: CompletedSet[];
};

export type CompletedWorkout = {
  id: string;
  workoutName: string;
  completedAt: number;
  duration: number; // in seconds
  exercises: CompletedExercise[];
};

type WorkoutsContextValue = {
  workouts: WorkoutPlan[];
  completedWorkouts: CompletedWorkout[];
  addWorkout: (workout: Omit<WorkoutPlan, "id" | "createdAt">) => WorkoutPlan;
  updateWorkout: (id: string, updates: Partial<Omit<WorkoutPlan, "id" | "createdAt">>) => void;
  deleteWorkout: (id: string) => void;
  addCompletedWorkout: (workout: Omit<CompletedWorkout, "id">) => CompletedWorkout;
};

const WorkoutsContext = createContext<WorkoutsContextValue | undefined>(undefined);

// Helper functions for AsyncStorage
const saveWorkouts = async (workouts: WorkoutPlan[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
  } catch (error) {
    console.error('Error saving workouts:', error);
  }
};

const loadWorkouts = async (): Promise<WorkoutPlan[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading workouts:', error);
    return [];
  }
};

const saveCompletedWorkouts = async (completedWorkouts: CompletedWorkout[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_WORKOUTS, JSON.stringify(completedWorkouts));
  } catch (error) {
    console.error('Error saving completed workouts:', error);
  }
};

const loadCompletedWorkouts = async (): Promise<CompletedWorkout[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_WORKOUTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading completed workouts:', error);
    return [];
  }
};

export function WorkoutsProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);

  // Load data from AsyncStorage on app start
  useEffect(() => {
    const loadData = async () => {
      const [savedWorkouts, savedCompletedWorkouts] = await Promise.all([
        loadWorkouts(),
        loadCompletedWorkouts(),
      ]);
      setWorkouts(savedWorkouts);
      setCompletedWorkouts(savedCompletedWorkouts);
    };
    loadData();
  }, []);

  const addWorkout = useCallback(
    (workout: Omit<WorkoutPlan, "id" | "createdAt">) => {
      const newWorkout: WorkoutPlan = {
        id: Math.random().toString(36).slice(2),
        createdAt: Date.now(),
        ...workout,
      };
      setWorkouts((prev) => {
        const updated = [newWorkout, ...prev];
        saveWorkouts(updated);
        return updated;
      });
      return newWorkout;
    },
    []
  );

  const updateWorkout = useCallback((id: string, updates: Partial<Omit<WorkoutPlan, "id" | "createdAt">>) => {
    setWorkouts((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, ...updates } as WorkoutPlan : w));
      saveWorkouts(updated);
      return updated;
    });
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      saveWorkouts(updated);
      return updated;
    });
  }, []);

  const addCompletedWorkout = useCallback(
    (workout: Omit<CompletedWorkout, "id">) => {
      const newCompletedWorkout: CompletedWorkout = {
        id: Math.random().toString(36).slice(2),
        ...workout,
      };
      setCompletedWorkouts((prev) => {
        const updated = [newCompletedWorkout, ...prev];
        saveCompletedWorkouts(updated);
        return updated;
      });
      return newCompletedWorkout;
    },
    []
  );

  const value = useMemo(
    () => ({ workouts, completedWorkouts, addWorkout, updateWorkout, deleteWorkout, addCompletedWorkout }),
    [workouts, completedWorkouts, addWorkout, updateWorkout, deleteWorkout, addCompletedWorkout]
  );

  return <WorkoutsContext.Provider value={value}>{children}</WorkoutsContext.Provider>;
}

export function useWorkouts() {
  const ctx = useContext(WorkoutsContext);
  if (!ctx) throw new Error("useWorkouts must be used within WorkoutsProvider");
  return ctx;
}


