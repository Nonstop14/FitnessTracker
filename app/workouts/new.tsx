import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AddExerciseModal from "../../components/AddExerciseModal";
import { useWorkouts } from "../../context/WorkoutsContext";

export default function NewWorkout() {
  const router = useRouter();
  const { addWorkout } = useWorkouts();
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<Array<{ id: string; exerciseName: string; sets: string }>>([]);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [restTime, setRestTime] = useState("90");
  
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const scrollPos = useRef(0);


  function handleSave() {
    const hasValidName = name.trim().length > 0;
    const hasExercises = exercises.length > 0;
    const allValid = exercises.every((e) => e.exerciseName.trim().length > 0 && Number(e.sets) > 0);
    if (!hasValidName) {
      Alert.alert("Missing name", "Please enter a workout name.");
      return;
    }
    if (!hasExercises) {
      Alert.alert("No exercises", "Add at least one exercise.");
      return;
    }
    if (!allValid) {
      Alert.alert("Invalid exercises", "Each exercise needs a name and number of sets.");
      return;
    }
    addWorkout({
      name: name.trim(),
      exercises: exercises.map((e) => ({ id: e.id, exerciseName: e.exerciseName.trim(), sets: Number(e.sets) })),
      restTime: Number(restTime) || 90,
    });
    Alert.alert("Saved", "Workout added to Home.");
    router.back();
  }


  function updateExerciseName(id: string, value: string) {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, exerciseName: value } : e)));
  }

  function updateExerciseSets(id: string, value: string) {
    // Only allow digits
    const sanitized = value.replace(/[^0-9]/g, "");
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, sets: sanitized } : e)));
  }

  function removeExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        onScroll={(e) => (scrollPos.current = e.nativeEvent.contentOffset.y)}
        enableAutomaticScroll={true}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        extraScrollHeight={30}
        showsVerticalScrollIndicator={true}
        enableResetScrollToCoords={false}
        onKeyboardWillHide={() => {
          scrollViewRef.current?.scrollToPosition(0, scrollPos.current, false);
        }}
      >
        <Text style={styles.label}>Workout name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Push Day"
          value={name}
          onChangeText={setName}
        />
        
        <Text style={styles.label}>Rest time between sets (seconds)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 90"
          value={restTime}
          onChangeText={(text) => {
            const sanitized = text.replace(/[^0-9]/g, "");
            setRestTime(sanitized);
          }}
          keyboardType="number-pad"
          maxLength={3}
        />
        
        {exercises.map((ex, idx) => (
          <View
            key={ex.id}
            style={styles.exerciseRow}
          >
            <Text style={styles.exerciseIndex}>{idx + 1}.</Text>
            <View style={styles.exerciseInputs}>
              <TextInput
                style={[styles.input, styles.exerciseNameInput]}
                value={ex.exerciseName}
                editable={false}
              />
              <View style={styles.setsAndRemove}>
                <TextInput
                  style={[styles.input, styles.setsInput]}
                  placeholder="# sets"
                  keyboardType="number-pad"
                  value={ex.sets}
                  onChangeText={(t) => updateExerciseSets(ex.id, t)}
                  maxLength={2}
                />
                <Pressable onPress={() => removeExercise(ex.id)} style={styles.removeButton}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
        
        <Pressable 
          style={styles.addExerciseButton} 
          onPress={() => setShowAddExerciseModal(true)}
        >
          <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
        </Pressable>
        
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </KeyboardAwareScrollView>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        visible={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        showSetsRepsForm={true}
        onExerciseAdded={(exerciseId, exerciseName, sets, reps) => {
          console.log('=== NEW.TSX CALLBACK CALLED ===');
          console.log('Adding exercise to workout:', { exerciseId, exerciseName, sets, reps });
          
          // Add the exercise to the workout
          setExercises((prev) => [
            ...prev,
            { 
              id: exerciseId, 
              exerciseName, 
              sets: "" 
            },
          ]);
          
          console.log('Exercise added to workout, closing modal');
          setShowAddExerciseModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  content: { 
    paddingBottom: 32,
    flexGrow: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: "#cbd5e1",
  },
  input: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    fontSize: 16,
  },
  addExerciseButton: {
    marginTop: 16,
    backgroundColor: "#1e293b",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  addExerciseButtonText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseRow: {
    marginTop: 8,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  exerciseIndex: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#3b82f6",
    fontSize: 14,
  },
  exerciseInputs: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  exerciseNameInput: {
    flex: 1,
    backgroundColor: "#111827",
    borderColor: "#374151",
    color: "#94a3b8",
  },
  setsAndRemove: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setsInput: {
    width: 80,
    textAlign: "center",
    backgroundColor: "#111827",
    borderColor: "#374151",
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#dc2626",
    borderRadius: 6,
  },
  removeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 20,
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});


