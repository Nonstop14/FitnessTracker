import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useWorkouts } from "../../../context/WorkoutsContext";

export default function StartWorkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { workouts, addCompletedWorkout } = useWorkouts();
  const workout = workouts.find((w) => w.id === id);
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [repCounts, setRepCounts] = useState<Record<string, string>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const positionsRef = useRef<Record<string, number>>({});

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Initialize rep counts and weights for all sets
  useEffect(() => {
    if (workout) {
      const initialReps: Record<string, string> = {};
      const initialWeights: Record<string, string> = {};
      workout.exercises.forEach(exercise => {
        for (let set = 1; set <= exercise.sets; set++) {
          const setKey = `${exercise.id}-${set}`;
          initialReps[setKey] = "";
          initialWeights[setKey] = "";
        }
      });
      setRepCounts(initialReps);
      setWeights(initialWeights);
    }
  }, [workout]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Workout not found.</Text>
      </View>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateRepCount = (exerciseId: string, setNumber: number, value: string) => {
    const setKey = `${exerciseId}-${setNumber}`;
    setRepCounts(prev => ({
      ...prev,
      [setKey]: value
    }));
  };

  const updateWeight = (exerciseId: string, setNumber: number, value: string) => {
    const setKey = `${exerciseId}-${setNumber}`;
    setWeights(prev => ({
      ...prev,
      [setKey]: value
    }));
  };

  const handleFinishWorkout = () => {
    // Prepare completed workout data
    const completedExercises = workout.exercises.map(exercise => {
      const sets = [];
      for (let setNum = 1; setNum <= exercise.sets; setNum++) {
        const setKey = `${exercise.id}-${setNum}`;
        const reps = parseInt(repCounts[setKey]) || 0;
        const weight = parseFloat(weights[setKey]) || 0;
        sets.push({ setNumber: setNum, reps, weight });
      }
      return { exerciseName: exercise.exerciseName, sets };
    });

    // Calculate stats - only count sets with at least 1 rep
    const completedSets = completedExercises.reduce((total, exercise) => 
      total + exercise.sets.filter(set => set.reps > 0).length, 0
    );
    const totalReps = completedExercises.reduce((total, exercise) => 
      total + exercise.sets.reduce((sum, set) => sum + set.reps, 0), 0
    );

    // Save to history
    addCompletedWorkout({
      workoutName: workout.name,
      completedAt: Date.now(),
      duration: timeElapsed,
      exercises: completedExercises,
    });

    Alert.alert(
      "Workout Completed!", 
      `Great job! You completed ${workout.name} in ${formatTime(timeElapsed)}.\n\nTotal exercises: ${workout.exercises.length}\nCompleted sets: ${completedSets}\nTotal reps: ${totalReps}`,
      [
        { text: "OK", onPress: () => {
          // Reset the navigation stack to make Home the root
          router.dismissAll();
          router.replace("/(tabs)");
        }}
      ]
    );
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.select({ ios: "padding", android: "height" })}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
    >
      <ScrollView 
        ref={scrollRef}
        style={styles.container} 
        contentContainerStyle={[styles.content, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
      {/* Timer Section */}
      <View style={styles.timerSection}>
        <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
        <Pressable style={styles.timerButton} onPress={toggleTimer}>
          <Text style={styles.timerButtonText}>
            {isRunning ? "Pause" : "Resume"}
          </Text>
        </Pressable>
      </View>

      {/* Workout Title */}
      <Text style={styles.workoutTitle}>{workout.name}</Text>

      {/* Exercises */}
      {workout.exercises.map((exercise, exerciseIndex) => (
        <View key={exercise.id} style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>
            {exerciseIndex + 1}. {exercise.exerciseName}
          </Text>
          
          {/* Sets */}
          {Array.from({ length: exercise.sets }, (_, setIndex) => {
            const setNumber = setIndex + 1;
            const setKey = `${exercise.id}-${setNumber}`;
            const currentReps = repCounts[setKey] || "";
            const currentWeight = weights[setKey] || "";
            
            return (
              <View 
                key={`${exercise.id}-${setNumber}`} 
                style={styles.setRow}
                onLayout={(e) => {
                  const setKey = `${exercise.id}-${setNumber}`;
                  positionsRef.current[setKey] = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.setLabel}>Set {setNumber}</Text>
                <View style={styles.setInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reps:</Text>
                    <TextInput
                      style={styles.setInput}
                      value={currentReps.toString()}
                      onChangeText={(value) => updateRepCount(exercise.id, setNumber, value)}
                      keyboardType="number-pad"
                      placeholder="0"
                      maxLength={3}
                      onFocus={() => {
                        setTimeout(() => {
                          const setKey = `${exercise.id}-${setNumber}`;
                          const y = positionsRef.current[setKey] ?? 0;
                          const scrollOffset = y - 20;
                          scrollRef.current?.scrollTo({ y: Math.max(scrollOffset, 0), animated: true });
                        }, 100);
                      }}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Weight (kg):</Text>
                    <TextInput
                      style={styles.setInput}
                      value={currentWeight.toString()}
                      onChangeText={(value) => updateWeight(exercise.id, setNumber, value)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      maxLength={6}
                      onFocus={() => {
                        setTimeout(() => {
                          const setKey = `${exercise.id}-${setNumber}`;
                          const y = positionsRef.current[setKey] ?? 0;
                          const scrollOffset = y - 20;
                          scrollRef.current?.scrollTo({ y: Math.max(scrollOffset, 0), animated: true });
                        }, 100);
                      }}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {/* Finish Button */}
      <Pressable style={styles.finishButton} onPress={handleFinishWorkout}>
        <Text style={styles.finishButtonText}>Finish Workout</Text>
      </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  timerSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#10b981",
    marginBottom: 12,
    fontFamily: "monospace",
  },
  timerButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#e2e8f0",
    marginBottom: 20,
    textAlign: "center",
  },
  exerciseCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5e7eb",
    marginBottom: 12,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  setLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#cbd5e1",
    minWidth: 60,
  },
  setInputs: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  setInput: {
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    minWidth: 60,
  },
  finishButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#ef4444",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
});
