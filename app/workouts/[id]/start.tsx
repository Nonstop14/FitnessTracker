import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, BackHandler, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AddExerciseModal from "../../../components/AddExerciseModal";
import WorkoutTimer from "../../../components/WorkoutTimer";
import { useWorkouts } from "../../../context/WorkoutsContext";

export default function StartWorkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { workouts, addCompletedWorkout, completedWorkouts } = useWorkouts();
  const workout = workouts.find((w) => w.id === id);
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [repCounts, setRepCounts] = useState<Record<string, string>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [exerciseSets, setExerciseSets] = useState<Record<string, number>>({});
  const [showExerciseMenu, setShowExerciseMenu] = useState<string | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseSets, setNewExerciseSets] = useState("");
  const [customExercises, setCustomExercises] = useState<Record<string, { name: string; sets: number }>>({});
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const positionsRef = useRef<Record<string, number>>({});

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Get previous workout data for this exercise
  const getPreviousWorkoutData = (exerciseName: string, setNumber: number) => {
    if (!workout) return null;
    
    // Find the most recent completed workout with this exercise
    const recentWorkouts = completedWorkouts
      .filter(completedWorkout => completedWorkout.workoutName === workout.name)
      .sort((a, b) => b.completedAt - a.completedAt);

    for (const completedWorkout of recentWorkouts) {
      const exercise = completedWorkout.exercises.find(ex => ex.exerciseName === exerciseName);
      if (exercise && exercise.sets && exercise.sets[setNumber - 1]) {
        const set = exercise.sets[setNumber - 1];
        // Only return data if there are actual reps and weight recorded
        if (set.reps > 0 || set.weight > 0) {
          return { weight: set.weight, reps: set.reps };
        }
      }
    }
    return null;
  };

  // Initialize rep counts and weights for all sets
  useEffect(() => {
    if (workout) {
      const initialReps: Record<string, string> = {};
      const initialWeights: Record<string, string> = {};
      const initialExerciseSets: Record<string, number> = {};
      
      workout.exercises.forEach(exercise => {
        initialExerciseSets[exercise.id] = exercise.sets;
        for (let set = 1; set <= exercise.sets; set++) {
          const setKey = `${exercise.id}-${set}`;
          initialReps[setKey] = "";
          initialWeights[setKey] = "";
        }
      });
      
      setRepCounts(initialReps);
      setWeights(initialWeights);
      setExerciseSets(initialExerciseSets);
    }
  }, [workout]);

  // Back button confirmation using navigation listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Don't show confirmation if we're finishing the workout
      if (isFinishingWorkout) {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Show confirmation dialog
      Alert.alert(
        "Exit Workout?",
        "Are you sure you want to go back to home screen? Your workout progress will be lost.",
        [
          { 
            text: "Stay", 
            style: "cancel",
            onPress: () => {
              // Do nothing, just stay on the screen
            }
          },
          { 
            text: "Home Screen", 
            style: "destructive",
            onPress: () => {
              // Allow navigation to proceed
              navigation.dispatch(e.data.action);
            }
          }
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isFinishingWorkout]);

  // Hardware back button for Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Exit Workout?",
          "Are you sure you want to go back to home screen? Your workout progress will be lost.",
          [
            { text: "Stay", style: "cancel" },
            { 
              text: "Home Screen", 
              style: "destructive",
              onPress: () => {
                router.dismissAll();
                router.replace("/(tabs)");
              }
            }
          ]
        );
        return true; // Prevent default back action
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription?.remove();
      };
    }, [router])
  );

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

  const toggleSetCompleted = (exerciseId: string, setNumber: number) => {
    const setKey = `${exerciseId}-${setNumber}`;
    setCompletedSets(prev => ({
      ...prev,
      [setKey]: !prev[setKey]
    }));
  };

  const addSet = (exerciseId: string) => {
    const currentSets = exerciseSets[exerciseId] || 0;
    const newSetNumber = currentSets + 1;
    const setKey = `${exerciseId}-${newSetNumber}`;
    
    setExerciseSets(prev => ({
      ...prev,
      [exerciseId]: newSetNumber
    }));
    
    setRepCounts(prev => ({
      ...prev,
      [setKey]: ""
    }));
    
    setWeights(prev => ({
      ...prev,
      [setKey]: ""
    }));
    
    setCompletedSets(prev => ({
      ...prev,
      [setKey]: false
    }));
  };

  const removeSet = (exerciseId: string) => {
    const currentSets = exerciseSets[exerciseId] || 0;
    if (currentSets <= 1) return;
    
    const setKey = `${exerciseId}-${currentSets}`;
    
    setExerciseSets(prev => ({
      ...prev,
      [exerciseId]: currentSets - 1
    }));
    
    setRepCounts(prev => {
      const newReps = { ...prev };
      delete newReps[setKey];
      return newReps;
    });
    
    setWeights(prev => {
      const newWeights = { ...prev };
      delete newWeights[setKey];
      return newWeights;
    });
    
    setCompletedSets(prev => {
      const newCompleted = { ...prev };
      delete newCompleted[setKey];
      return newCompleted;
    });
  };

  const removeExercise = (exerciseId: string) => {
    const exercise = workout?.exercises.find(ex => ex.id === exerciseId);
    const customExercise = customExercises[exerciseId];
    
    if (!exercise && !customExercise) return;
    
    const exerciseName = exercise?.exerciseName || customExercise?.name || "Unknown Exercise";
    
    Alert.alert(
      "Remove Exercise",
      `Are you sure you want to remove "${exerciseName}" from this workout?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const currentSets = exerciseSets[exerciseId] || 0;
            
            // Remove all sets for this exercise
            for (let set = 1; set <= currentSets; set++) {
              const setKey = `${exerciseId}-${set}`;
              setRepCounts(prev => {
                const newReps = { ...prev };
                delete newReps[setKey];
                return newReps;
              });
              
              setWeights(prev => {
                const newWeights = { ...prev };
                delete newWeights[setKey];
                return newWeights;
              });
              
              setCompletedSets(prev => {
                const newCompleted = { ...prev };
                delete newCompleted[setKey];
                return newCompleted;
              });
            }
            
            setExerciseSets(prev => {
              const newSets = { ...prev };
              delete newSets[exerciseId];
              return newSets;
            });

            // Remove from custom exercises if it was a custom one
            if (customExercise) {
              setCustomExercises(prev => {
                const newCustom = { ...prev };
                delete newCustom[exerciseId];
                return newCustom;
              });
            }
          }
        }
      ]
    );
  };

  const handleFinishWorkout = () => {
    // Set flag to prevent back button confirmation
    setIsFinishingWorkout(true);

    // Prepare completed workout data using dynamic sets
    const completedExercises = Object.entries(exerciseSets).map(([exerciseId, setCount]) => {
      const exercise = workout?.exercises.find(ex => ex.id === exerciseId);
      const customExercise = customExercises[exerciseId];
      
      if (!exercise && !customExercise) return null;
      
      const exerciseName = exercise?.exerciseName || customExercise?.name || "Unknown Exercise";
      
      const sets = [];
      for (let setNum = 1; setNum <= setCount; setNum++) {
        const setKey = `${exerciseId}-${setNum}`;
        const reps = parseInt(repCounts[setKey]) || 0;
        const weight = parseFloat(weights[setKey]) || 0;
        sets.push({ setNumber: setNum, reps, weight });
      }
      return { exerciseName, sets };
    }).filter(Boolean) as any[];

    // Calculate stats - only count sets with at least 1 rep
    const completedSetsCount = completedExercises.reduce((total: number, exercise: any) => 
      total + exercise.sets.filter((set: any) => set.reps > 0).length, 0
    );
    const totalReps = completedExercises.reduce((total: number, exercise: any) => 
      total + exercise.sets.reduce((sum: number, set: any) => sum + set.reps, 0), 0
    );

    // Save to history
    addCompletedWorkout({
      workoutName: workout.name,
      completedAt: Date.now(),
      duration: timeElapsed,
      exercises: completedExercises,
    });

    // Show completion popup with workout stats
    Alert.alert(
      "Workout Completed!", 
      `Great job! You completed ${workout.name} in ${formatTime(timeElapsed)}.\n\nTotal exercises: ${completedExercises.length}\nCompleted sets: ${completedSetsCount}\nTotal reps: ${totalReps}`,
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

  const handleCancelWorkout = () => {
    Alert.alert(
      "Cancel Workout",
      "Are you sure you want to cancel this workout? All progress will be lost.",
      [
        { text: "Continue Workout", style: "cancel" },
        {
          text: "Cancel Workout",
          style: "destructive",
          onPress: () => {
            router.back();
          }
        }
      ]
    );
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) {
      Alert.alert("Missing Name", "Please enter an exercise name.");
      return;
    }
    if (!newExerciseSets || Number(newExerciseSets) <= 0) {
      Alert.alert("Invalid Sets", "Please enter a valid number of sets.");
      return;
    }

    const newExerciseId = Math.random().toString(36).slice(2);
    const setsCount = Number(newExerciseSets);
    
    // Store the custom exercise info
    setCustomExercises(prev => ({
      ...prev,
      [newExerciseId]: {
        name: newExerciseName.trim(),
        sets: setsCount
      }
    }));
    
    // Add to exercise sets
    setExerciseSets(prev => ({
      ...prev,
      [newExerciseId]: setsCount
    }));

    // Initialize rep counts and weights for new sets
    const newReps: Record<string, string> = {};
    const newWeights: Record<string, string> = {};
    const newCompleted: Record<string, boolean> = {};
    
    for (let set = 1; set <= setsCount; set++) {
      const setKey = `${newExerciseId}-${set}`;
      newReps[setKey] = "";
      newWeights[setKey] = "";
      newCompleted[setKey] = false;
    }
    
    setRepCounts(prev => ({ ...prev, ...newReps }));
    setWeights(prev => ({ ...prev, ...newWeights }));
    setCompletedSets(prev => ({ ...prev, ...newCompleted }));

    // Reset form and close modal
    setNewExerciseName("");
    setNewExerciseSets("");
    setShowAddExerciseModal(false);
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
      <WorkoutTimer 
        timeElapsed={timeElapsed}
        isRunning={isRunning}
        onToggleTimer={toggleTimer}
      />

      {/* Workout Title and Add Exercise Button */}
      <View style={styles.workoutHeader}>
        <Text style={styles.workoutTitle}>{workout.name}</Text>
        <Pressable 
          style={styles.addExerciseToWorkoutButton}
          onPress={() => setShowAddExerciseModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#10b981" />
          <Text style={styles.addExerciseToWorkoutText}>Add Exercise</Text>
        </Pressable>
      </View>

      {/* Exercises */}
      {Object.entries(exerciseSets).map(([exerciseId, setCount]) => {
        const exercise = workout?.exercises.find(ex => ex.id === exerciseId);
        const customExercise = customExercises[exerciseId];
        
        // Skip if neither original nor custom exercise exists
        if (!exercise && !customExercise) return null;
        
        const exerciseName = exercise?.exerciseName || customExercise?.name || "Unknown Exercise";
        const exerciseIndex = workout?.exercises.findIndex(ex => ex.id === exerciseId) ?? -1;
        
        return (
          <View key={exerciseId} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>
                {exerciseName}
              </Text>
              <Pressable 
                style={styles.exerciseMenuButton}
                onPress={() => setShowExerciseMenu(showExerciseMenu === exerciseId ? null : exerciseId)}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
              </Pressable>
            </View>

            {/* Exercise Menu Modal */}
            <Modal
              visible={showExerciseMenu === exerciseId}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowExerciseMenu(null)}
            >
              <Pressable 
                style={styles.modalOverlay}
                onPress={() => setShowExerciseMenu(null)}
              >
                <View style={styles.exerciseMenu}>
                  <Pressable 
                    style={styles.menuItem}
                    onPress={() => {
                      addSet(exerciseId);
                      setShowExerciseMenu(null);
                    }}
                  >
                    <Ionicons name="add" size={20} color="#10b981" />
                    <Text style={styles.menuItemText}>Add Set</Text>
                  </Pressable>
                  <Pressable 
                    style={styles.menuItem}
                    onPress={() => {
                      removeSet(exerciseId);
                      setShowExerciseMenu(null);
                    }}
                    disabled={setCount <= 1}
                  >
                    <Ionicons name="remove" size={20} color="#ef4444" />
                    <Text style={[styles.menuItemText, setCount <= 1 && styles.disabledMenuItem]}>Remove Set</Text>
                  </Pressable>
                  <Pressable 
                    style={styles.menuItem}
                    onPress={() => {
                      removeExercise(exerciseId);
                      setShowExerciseMenu(null);
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#ef4444" />
                    <Text style={styles.menuItemText}>Delete Exercise</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Modal>
            
            {/* Sets */}
            {Array.from({ length: setCount }, (_, setIndex) => {
              const setNumber = setIndex + 1;
              const setKey = `${exerciseId}-${setNumber}`;
              const currentReps = repCounts[setKey] || "";
              const currentWeight = weights[setKey] || "";
              const isCompleted = completedSets[setKey] || false;
              const previousData = getPreviousWorkoutData(exerciseName, setNumber);
              
              return (
                <View 
                  key={`${exerciseId}-${setNumber}`} 
                  style={[styles.setRow, isCompleted && styles.completedSetRow]}
                  onLayout={(e) => {
                    const setKey = `${exerciseId}-${setNumber}`;
                    positionsRef.current[setKey] = e.nativeEvent.layout.y;
                  }}
                >
                  <View style={styles.setInfo}>
                    <Text style={styles.setLabel}>Set {setNumber}</Text>
                    {previousData && (
                      <Text style={styles.previousData}>
                        Last: {previousData.weight}kg × {previousData.reps}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.setInputs}>
                    <View style={styles.inputColumn}>
                      <Text style={styles.inputLabel}>Reps</Text>
                      <TextInput
                        style={[styles.setInput, isCompleted && styles.completedInput]}
                        value={currentReps.toString()}
                        onChangeText={(value) => updateRepCount(exerciseId, setNumber, value)}
                        keyboardType="number-pad"
                        placeholder="0"
                        maxLength={3}
                        editable={!isCompleted}
                        onFocus={() => {
                          setTimeout(() => {
                            const setKey = `${exerciseId}-${setNumber}`;
                            const y = positionsRef.current[setKey] ?? 0;
                            const scrollOffset = y - 20;
                            scrollRef.current?.scrollTo({ y: Math.max(scrollOffset, 0), animated: true });
                          }, 100);
                        }}
                      />
                    </View>
                    
                    <View style={styles.inputColumn}>
                      <Text style={styles.inputLabel}>Weight (kg)</Text>
                      <TextInput
                        style={[styles.setInput, isCompleted && styles.completedInput]}
                        value={currentWeight.toString()}
                        onChangeText={(value) => updateWeight(exerciseId, setNumber, value)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        maxLength={6}
                        editable={!isCompleted}
                        onFocus={() => {
                          setTimeout(() => {
                            const setKey = `${exerciseId}-${setNumber}`;
                            const y = positionsRef.current[setKey] ?? 0;
                            const scrollOffset = y - 20;
                            scrollRef.current?.scrollTo({ y: Math.max(scrollOffset, 0), animated: true });
                          }, 100);
                        }}
                      />
                    </View>
                    
                    <Pressable 
                      style={[styles.checkButton, isCompleted && styles.checkedButton]}
                      onPress={() => toggleSetCompleted(exerciseId, setNumber)}
                    >
                      <Ionicons 
                        name={isCompleted ? "checkmark" : "checkmark-outline"} 
                        size={24} 
                        color={isCompleted ? "#fff" : "#94a3b8"} 
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}

      {/* Add Exercise Modal */}
      <AddExerciseModal
        visible={showAddExerciseModal}
        exerciseName={newExerciseName}
        exerciseSets={newExerciseSets}
        onExerciseNameChange={setNewExerciseName}
        onExerciseSetsChange={setNewExerciseSets}
        onClose={() => {
          setNewExerciseName("");
          setNewExerciseSets("");
          setShowAddExerciseModal(false);
        }}
        onAdd={handleAddExercise}
      />

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable style={styles.finishButton} onPress={handleFinishWorkout}>
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </Pressable>
        
        <Pressable style={styles.cancelButton} onPress={handleCancelWorkout}>
          <Text style={styles.cancelButtonText}>Cancel Workout</Text>
        </Pressable>
      </View>
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
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#e2e8f0",
    flex: 1,
  },
  addExerciseToWorkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 6,
  },
  addExerciseToWorkoutText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "600",
  },
  exerciseCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5e7eb",
    flex: 1,
  },
  exerciseMenuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseMenu: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledMenuItem: {
    color: "#6b7280",
  },
  setRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    marginVertical: 4,
    borderRadius: 8,
  },
  completedSetRow: {
    backgroundColor: "#064e3b",
  },
  setInfo: {
    marginBottom: 12,
  },
  setLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 4,
  },
  previousData: {
    fontSize: 14,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  setInputs: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
  },
  inputColumn: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 4,
  },
  setInput: {
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    minHeight: 40,
  },
  completedInput: {
    backgroundColor: "#065f46",
    borderColor: "#047857",
    color: "#d1fae5",
  },
  checkButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#374151",
    borderWidth: 3,
    borderColor: "#6b7280",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  checkedButton: {
    backgroundColor: "#059669",
    borderColor: "#10b981",
    shadowColor: "#10b981",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  finishButton: {
    backgroundColor: "#059669",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#059669",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 2,
    borderColor: "#10b981",
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#dc2626",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  errorText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
});
