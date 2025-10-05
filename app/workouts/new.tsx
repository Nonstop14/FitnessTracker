import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useWorkouts } from "../../context/WorkoutsContext";

export default function NewWorkout() {
  const router = useRouter();
  const { addWorkout } = useWorkouts();
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<Array<{ id: string; exerciseName: string; sets: string }>>([]);
  const scrollRef = useRef<ScrollView | null>(null);
  const positionsRef = useRef<Record<string, number>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
    });
    Alert.alert("Saved", "Workout added to Home.");
    router.back();
  }

  function handleAddExercise() {
    setExercises((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), exerciseName: "", sets: "" },
    ]);
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
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.select({ ios: "padding", android: "height" })}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.label}>Workout name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Push Day"
          value={name}
          onChangeText={setName}
        />
        <Pressable style={styles.addExerciseButton} onPress={handleAddExercise}>
          <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
        </Pressable>

        {exercises.map((ex, idx) => (
          <View
            key={ex.id}
            style={styles.exerciseRow}
            onLayout={(e) => {
              positionsRef.current[ex.id] = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.exerciseIndex}>{idx + 1}.</Text>
            <View style={styles.exerciseInputs}>
              <TextInput
                style={[styles.input, styles.exerciseNameInput]}
                placeholder="Exercise name"
                value={ex.exerciseName}
                onChangeText={(t) => updateExerciseName(ex.id, t)}
                onFocus={() => {
                  setTimeout(() => {
                    const y = positionsRef.current[ex.id] ?? 0;
                    const screenHeight = 600; // Approximate screen height
                    const keyboardHeight = 300; // Approximate keyboard height
                    const visibleArea = screenHeight - keyboardHeight;
                    const isLastExercise = exercises.indexOf(ex) === exercises.length - 1;
                    
                    if (isLastExercise) {
                      // For last exercise, position it higher up so you can see what you're typing
                      const scrollOffset = y - 100; // Move much higher up
                      scrollRef.current?.scrollTo({ y: Math.max(scrollOffset, 0), animated: true });
                    } else {
                      // For other exercises, position in upper part but leave room to see exercises below
                      const scrollOffset = y - (visibleArea / 4);
                      scrollRef.current?.scrollTo({ y: Math.max(scrollOffset, 0), animated: true });
                    }
                  }, 300);
                }}
              />
              <View style={styles.setsAndRemove}>
                <TextInput
                  style={[styles.input, styles.setsInput]}
                  placeholder="# sets"
                  keyboardType="number-pad"
                  value={ex.sets}
                  onChangeText={(t) => updateExerciseSets(ex.id, t)}
                  maxLength={2}
                  onFocus={() => {
                    setTimeout(() => {
                      const y = positionsRef.current[ex.id] ?? 0;
                      const screenHeight = 600; // Approximate screen height
                      const keyboardHeight = 300; // Approximate keyboard height
                      const visibleArea = screenHeight - keyboardHeight;
                      const isLastExercise = exercises.indexOf(ex) === exercises.length - 1;
                      
                      if (isLastExercise) {
                        // For last exercise, position it higher up so you can see what you're typing
                        const scrollOffset = y - 100; // Move much higher up
                        scrollRef.current?.scrollTo({ y: Math.max(scrollOffset, 0), animated: true });
                      } else {
                        // For other exercises, position in upper part but leave room to see exercises below
                        const scrollOffset = y - (visibleArea / 4);
                        scrollRef.current?.scrollTo({ y: Math.max(scrollOffset, 0), animated: true });
                      }
                    }, 300);
                  }}
                />
                <Pressable onPress={() => removeExercise(ex.id)} style={styles.removeButton}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0f172a",
  },
  content: { 
    paddingBottom: 32,
    flexGrow: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
    color: "#cbd5e1",
  },
  input: {
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#111827",
    color: "#e5e7eb",
  },
  addExerciseButton: {
    marginTop: 12,
    backgroundColor: "#4b5563",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6b7280",
  },
  addExerciseButtonText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
  },
  exerciseRow: {
    marginTop: 12,
  },
  exerciseIndex: {
    fontWeight: "700",
    marginBottom: 6,
    color: "#cbd5e1",
  },
  exerciseInputs: {
    flexDirection: "row",
    gap: 8,
  },
  exerciseNameInput: {
    flex: 1,
  },
  setsAndRemove: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setsInput: {
    width: 90,
    textAlign: "center",
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  removeText: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "700",
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 20,
    backgroundColor: "#374151",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  saveButtonText: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
  },
});


