import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import WorkoutTimer from "../../../components/WorkoutTimer";
import { useWorkouts } from "../../../context/WorkoutsContext";

export default function StartWorkout() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => null,
          gestureEnabled: false
        }} 
      />
      <StartWorkoutContent />
    </>
  );
}

function StartWorkoutContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
  const positionsRef = useRef<Record<string, number>>({});
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Prevent auto-reset by doing nothing - let the scroll position stay where it is
    });

    return () => {
      keyboardDidHideListener?.remove();
    };
  }, []);

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
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <KeyboardAwareScrollView 
        ref={scrollViewRef}
        style={styles.container} 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        extraScrollHeight={60}
        keyboardOpeningTime={250}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={80}
        scrollEventThrottle={16}
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
            
            {/* Sets Header */}
            <View style={styles.setsHeader}>
              <View style={styles.headerSetColumn}>
                <Text style={styles.headerText}>Set</Text>
              </View>
              <View style={styles.headerPreviousColumn}>
                <Text style={styles.headerText}>Previous</Text>
              </View>
              <View style={styles.headerWeightColumn}>
                <Text style={styles.headerText}>Weight (kg)</Text>
              </View>
              <View style={styles.headerRepsColumn}>
                <Text style={styles.headerText}>Reps</Text>
              </View>
              <View style={styles.headerCheckColumn}>
                <Text style={styles.headerText}>✓</Text>
              </View>
            </View>

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
                  {/* Set Number Column */}
                  <View style={styles.setNumberColumn}>
                    <Text style={[styles.setNumberText, isCompleted && styles.completedText]}>
                      {setNumber}
                    </Text>
                  </View>

                  {/* Previous Data Column */}
                  <View style={styles.previousColumn}>
                    {previousData ? (
                      <Text style={[styles.previousDataText, isCompleted && styles.completedText]}>
                        {previousData.weight}kg × {previousData.reps}
                      </Text>
                    ) : (
                      <Text style={[styles.noPreviousData, isCompleted && styles.completedText]}>
                        -
                      </Text>
                    )}
                  </View>

                  {/* Weight Input Column */}
                  <View style={styles.weightColumn}>
                    <TextInput
                      style={[styles.setInput, isCompleted && styles.completedInput]}
                      value={currentWeight.toString()}
                      onChangeText={(value) => updateWeight(exerciseId, setNumber, value)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      maxLength={6}
                      editable={!isCompleted}
                    />
                  </View>

                  {/* Reps Input Column */}
                  <View style={styles.repsColumn}>
                    <TextInput
                      style={[styles.setInput, isCompleted && styles.completedInput]}
                      value={currentReps.toString()}
                      onChangeText={(value) => updateRepCount(exerciseId, setNumber, value)}
                      keyboardType="number-pad"
                      placeholder="0"
                      maxLength={3}
                      editable={!isCompleted}
                    />
                  </View>

                  {/* Check Button Column */}
                  <View style={styles.checkColumn}>
                    <Pressable 
                      style={[styles.checkButton, isCompleted && styles.checkedButton]}
                      onPress={() => toggleSetCompleted(exerciseId, setNumber)}
                    >
                      <Ionicons 
                        name={isCompleted ? "checkmark" : "checkmark-outline"} 
                        size={18} 
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
      <Modal
        visible={showAddExerciseModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addExerciseModal}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Exercise Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Bench Press"
                value={newExerciseName}
                onChangeText={setNewExerciseName}
                placeholderTextColor="#6b7280"
                autoFocus={true}
              />
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Number of Sets</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 3"
                value={newExerciseSets}
                onChangeText={(text) => {
                  const sanitized = text.replace(/[^0-9]/g, '');
                  setNewExerciseSets(sanitized);
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <Pressable 
                style={styles.modalCancelButton} 
                onPress={() => {
                  setNewExerciseName("");
                  setNewExerciseSets("");
                  setShowAddExerciseModal(false);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable style={styles.modalAddButton} onPress={handleAddExercise}>
                <Text style={styles.modalAddButtonText}>Add Exercise</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable style={styles.finishButton} onPress={handleFinishWorkout}>
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </Pressable>
        
        <Pressable style={styles.cancelButton} onPress={handleCancelWorkout}>
          <Text style={styles.cancelButtonText}>Cancel Workout</Text>
        </Pressable>
      </View>
      </KeyboardAwareScrollView>
    </View>
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
  setsHeader: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#374151",
    marginBottom: 10,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    alignItems: "center",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9ca3af",
    textAlign: "center",
  },
  headerSetColumn: {
    width: 50,
    alignItems: "center",
  },
  headerPreviousColumn: {
    width: 100,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  headerWeightColumn: {
    width: 85,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  headerRepsColumn: {
    width: 70,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  headerCheckColumn: {
    width: 50,
    alignItems: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    marginVertical: 3,
    borderRadius: 6,
    minHeight: 55,
  },
  completedSetRow: {
    backgroundColor: "#064e3b",
  },
  setNumberColumn: {
    width: 50,
    alignItems: "center",
  },
  setNumberText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e5e7eb",
  },
  previousColumn: {
    width: 100,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  previousDataText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
    textAlign: "center",
  },
  noPreviousData: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
  },
  weightColumn: {
    width: 85,
    paddingHorizontal: 6,
  },
  repsColumn: {
    width: 70,
    paddingHorizontal: 6,
  },
  checkColumn: {
    width: 50,
    alignItems: "center",
  },
  completedText: {
    color: "#d1fae5",
  },
  setInput: {
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 9,
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    minHeight: 35,
    width: "100%",
  },
  completedInput: {
    backgroundColor: "#065f46",
    color: "#d1fae5",
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#374151",
    borderWidth: 2,
    borderColor: "#6b7280",
    justifyContent: "center",
    alignItems: "center",
  },
  checkedButton: {
    backgroundColor: "#059669",
  },
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  finishButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cancelButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  errorText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  addExerciseModal: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 100, // Move modal up to avoid keyboard
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f3f4f6',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#111827',
    color: '#f3f4f6',
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  modalCancelButtonText: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#059669',
  },
  modalAddButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
