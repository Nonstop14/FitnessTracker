import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

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

export function WorkoutsProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);

  const addWorkout = useCallback(
    (workout: Omit<WorkoutPlan, "id" | "createdAt">) => {
      const newWorkout: WorkoutPlan = {
        id: Math.random().toString(36).slice(2),
        createdAt: Date.now(),
        ...workout,
      };
      setWorkouts((prev) => [newWorkout, ...prev]);
      return newWorkout;
    },
    []
  );

  const updateWorkout = useCallback((id: string, updates: Partial<Omit<WorkoutPlan, "id" | "createdAt">>) => {
    setWorkouts((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } as WorkoutPlan : w))
    );
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const addCompletedWorkout = useCallback(
    (workout: Omit<CompletedWorkout, "id">) => {
      const newCompletedWorkout: CompletedWorkout = {
        id: Math.random().toString(36).slice(2),
        ...workout,
      };
      setCompletedWorkouts((prev) => [newCompletedWorkout, ...prev]);
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


