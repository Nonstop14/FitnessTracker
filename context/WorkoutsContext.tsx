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

type WorkoutsContextValue = {
  workouts: WorkoutPlan[];
  addWorkout: (workout: Omit<WorkoutPlan, "id" | "createdAt">) => WorkoutPlan;
  updateWorkout: (id: string, updates: Partial<Omit<WorkoutPlan, "id" | "createdAt">>) => void;
  deleteWorkout: (id: string) => void;
};

const WorkoutsContext = createContext<WorkoutsContextValue | undefined>(undefined);

export function WorkoutsProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);

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

  const value = useMemo(
    () => ({ workouts, addWorkout, updateWorkout, deleteWorkout }),
    [workouts, addWorkout, updateWorkout, deleteWorkout]
  );

  return <WorkoutsContext.Provider value={value}>{children}</WorkoutsContext.Provider>;
}

export function useWorkouts() {
  const ctx = useContext(WorkoutsContext);
  if (!ctx) throw new Error("useWorkouts must be used within WorkoutsProvider");
  return ctx;
}


