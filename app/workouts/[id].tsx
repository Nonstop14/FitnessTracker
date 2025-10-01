import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useWorkouts } from "../../context/WorkoutsContext";

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { workouts, deleteWorkout } = useWorkouts();
  const workout = workouts.find((w) => w.id === id);

  if (!workout) {
    return (
      <View style={styles.container}> 
        <Text>Workout not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{workout.name}</Text>
        <Link href={{ pathname: "/workouts/[id]/edit", params: { id: workout.id } }} asChild>
          <Pressable style={styles.editButton}><Text style={styles.editButtonText}>Edit</Text></Pressable>
        </Link>
        <Pressable
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert("Delete workout?", "This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  deleteWorkout(workout.id);
                  router.back(); // Navigate back to home screen
                },
              },
            ]);
          }}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>
      {workout.exercises.map((e, idx) => (
        <View key={e.id} style={styles.row}> 
          <Text style={styles.rowText}>{idx + 1}. {e.exerciseName}</Text>
          <Text style={styles.rowSets}>{e.sets} sets</Text>
        </View>
      ))}
      
      <Pressable 
        style={styles.startWorkoutButton}
        onPress={() => router.push(`/workouts/${workout.id}/start`)}
      >
        <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0f172a" },
  content: { paddingBottom: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#e2e8f0" },
  editButton: { backgroundColor: "#6366f1", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  editButtonText: { color: "#fff", fontWeight: "700" },
  deleteButton: { marginLeft: 8, backgroundColor: "#dc2626", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  deleteButtonText: { color: "#fff", fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  rowText: { fontSize: 16, fontWeight: "600", color: "#e5e7eb" },
  rowSets: { fontSize: 14, color: "#cbd5e1", fontWeight: "600" },
  startWorkoutButton: {
    marginTop: 24,
    backgroundColor: "#10b981",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  startWorkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});


