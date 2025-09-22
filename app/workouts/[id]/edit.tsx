import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useWorkouts } from "../../context/WorkoutsContext";

export default function EditWorkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { workouts, updateWorkout } = useWorkouts();
  const workout = useMemo(() => workouts.find((w) => w.id === id), [workouts, id]);

  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<Array<{ id: string; exerciseName: string; sets: string }>>([]);
  const scrollRef = useRef<ScrollView | null>(null);
  const positionsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (workout) {
      setName(workout.name);
      setExercises(workout.exercises.map((e) => ({ id: e.id, exerciseName: e.exerciseName, sets: String(e.sets) })));
    }
  }, [workout]);

  function updateExerciseName(exId: string, value: string) {
    setExercises((prev) => prev.map((e) => (e.id === exId ? { ...e, exerciseName: value } : e)));
  }

  function updateExerciseSets(exId: string, value: string) {
    const sanitized = value.replace(/[^0-9]/g, "");
    setExercises((prev) => prev.map((e) => (e.id === exId ? { ...e, sets: sanitized } : e)));
  }

  function removeExercise(exId: string) {
    setExercises((prev) => prev.filter((e) => e.id !== exId));
  }

  function addExercise() {
    setExercises((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), exerciseName: "", sets: "" },
    ]);
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a workout name.");
      return;
    }
    const allValid = exercises.length > 0 && exercises.every((e) => e.exerciseName.trim().length > 0 && Number(e.sets) > 0);
    if (!allValid) {
      Alert.alert("Invalid exercises", "Each exercise needs a name and number of sets.");
      return;
    }
    updateWorkout(id as string, {
      name: name.trim(),
      exercises: exercises.map((e) => ({ id: e.id, exerciseName: e.exerciseName.trim(), sets: Number(e.sets) })),
    });
    Alert.alert("Saved", "Workout updated.");
    router.back();
  }

  if (!workout) {
    return (
      <View style={styles.container}><Text style={styles.muted}>Workout not found.</Text></View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Workout name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

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
                const y = positionsRef.current[ex.id] ?? 0;
                scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
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
                  const y = positionsRef.current[ex.id] ?? 0;
                  scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
                }}
              />
              <Pressable onPress={() => removeExercise(ex.id)} style={styles.removeButton}>
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}

        <Pressable style={styles.addExerciseButton} onPress={addExercise}>
          <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
        </Pressable>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0f172a" },
  content: { paddingBottom: 32 },
  label: { fontSize: 14, fontWeight: "700", marginTop: 12, marginBottom: 6, color: "#cbd5e1" },
  input: {
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#111827",
    color: "#e5e7eb",
  },
  exerciseRow: { marginTop: 12 },
  exerciseIndex: { fontWeight: "700", marginBottom: 6, color: "#cbd5e1" },
  exerciseInputs: { flexDirection: "row", gap: 8 },
  exerciseNameInput: { flex: 1 },
  setsAndRemove: { flexDirection: "row", alignItems: "center", gap: 8 },
  setsInput: { width: 90, textAlign: "center" },
  removeButton: { paddingHorizontal: 10, paddingVertical: 10 },
  removeText: { color: "#ef4444", fontSize: 18, fontWeight: "700" },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#7c3aed",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  muted: { color: "#94a3b8" },
  addExerciseButton: {
    marginTop: 12,
    backgroundColor: "#7c3aed",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  addExerciseButtonText: { color: "#fff", fontWeight: "700" },
});


