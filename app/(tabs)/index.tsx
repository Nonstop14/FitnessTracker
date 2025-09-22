import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useWorkouts } from "../context/WorkoutsContext";

export default function HomeScreen() {
  const { workouts } = useWorkouts();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create</Text>
      <Link href="/workouts/new" asChild>
        <Pressable style={styles.addButton}>
          <Ionicons name="add-circle" size={20} color="#fff" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add Workout</Text>
        </Pressable>
      </Link>

      <Text style={styles.sectionTitle}>My workouts</Text>
      <FlatList
        key="grid-2"
        data={workouts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={workouts.length > 0 ? styles.columnWrapper : undefined}
        contentContainerStyle={workouts.length === 0 ? styles.emptyListContainer : styles.gridContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No workouts yet</Text>}
        renderItem={({ item }) => (
          <Link href={{ pathname: "/workouts/[id]", params: { id: item.id } }} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.previewList}>
                {item.exercises.slice(0, 3).map((e) => (
                  <Text key={e.id} style={styles.cardPreviewItem} numberOfLines={1}>
                    {e.exerciseName}
                  </Text>
                ))}
              </View>
              <Text style={styles.cardMeta}>
                {item.exercises.length} exercise{item.exercises.length === 1 ? "" : "s"}
              </Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    color: "#e2e8f0",
  },
  addButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#7c3aed",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  addIcon: { marginRight: 8 },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "#cbd5e1",
  },
  gridContent: {
    paddingTop: 8,
  },
  columnWrapper: {
    gap: 12,
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
    color: "#e5e7eb",
  },
  cardPreview: {
    fontSize: 12,
    color: "#93c5fd",
    marginBottom: 8,
  },
  previewList: { marginBottom: 8 },
  cardPreviewItem: { fontSize: 12, color: "#93c5fd" },
  cardMeta: {
    fontSize: 12,
    color: "#94a3b8",
  },
  emptyListContainer: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#94a3b8",
  },
});


