import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useWorkouts } from "../../context/WorkoutsContext";

export default function HomeScreen() {
  const { workouts, deleteWorkout } = useWorkouts();
  const router = useRouter();
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const handleWorkoutPress = (workout: any) => {
    setSelectedWorkout(workout);
  };

  const handleEdit = (workoutId: string) => {
    setShowMenu(null);
    setSelectedWorkout(null);
    router.push(`/workouts/${workoutId}/edit`);
  };

  const handleDelete = (workoutId: string, workoutName: string) => {
    setShowMenu(null);
    setSelectedWorkout(null);
    Alert.alert("Delete workout?", `Are you sure you want to delete "${workoutName}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteWorkout(workoutId),
      },
    ]);
  };

  const handleStartWorkout = (workoutId: string) => {
    setSelectedWorkout(null);
    router.push(`/workouts/${workoutId}/start`);
  };

  return (
    <Pressable 
      style={styles.container}
      onPress={() => setShowMenu(null)}
    >
      <Text style={styles.title}>My workouts:</Text>
      <FlatList
        key="grid-2"
        data={workouts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={workouts.length > 0 ? styles.columnWrapper : undefined}
        contentContainerStyle={workouts.length === 0 ? styles.emptyListContainer : styles.gridContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No workouts yet</Text>}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.card} 
            onPress={(e) => {
              e.stopPropagation();
              if (showMenu !== item.id) {
                handleWorkoutPress(item);
              }
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Pressable 
                style={styles.menuButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowMenu(showMenu === item.id ? null : item.id);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#94a3b8" />
              </Pressable>
            </View>
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
            {showMenu === item.id && (
              <View style={styles.menu}>
                <Pressable 
                  style={styles.menuItem} 
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(item.id);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#6366f1" />
                  <Text style={styles.menuText}>Edit</Text>
                </Pressable>
                <Pressable 
                  style={styles.menuItem} 
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id, item.name);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={[styles.menuText, { color: "#ef4444" }]}>Delete</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        )}
      />

      {/* Workout Detail Modal */}
      <Modal
        visible={selectedWorkout !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedWorkout(null)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setSelectedWorkout(null)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedWorkout && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedWorkout.name}</Text>
                  <Pressable 
                    style={styles.closeButton}
                    onPress={() => setSelectedWorkout(null)}
                  >
                    <Ionicons name="close" size={24} color="#94a3b8" />
                  </Pressable>
                </View>
                
                <View style={styles.exercisesList}>
                  {selectedWorkout.exercises.map((exercise: any, index: number) => (
                    <View key={exercise.id} style={styles.exerciseItem}>
                      <Text style={styles.exerciseName}>
                        {index + 1}. {exercise.exerciseName}
                      </Text>
                      <Text style={styles.exerciseSets}>{exercise.sets} sets</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <Pressable 
                    style={styles.startButton}
                    onPress={() => handleStartWorkout(selectedWorkout.id)}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text style={styles.startButtonText}>Start Workout</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Floating Add Workout Button */}
      <Link href="/workouts/new" asChild>
        <Pressable style={styles.floatingAddButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </Link>
    </Pressable>
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
  floatingAddButton: {
    position: "absolute",
    bottom: 25,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4f46e5",
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
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  menuButton: {
    padding: 4,
    borderRadius: 4,
  },
  menu: {
    position: "absolute",
    top: 40,
    right: 8,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 4,
    zIndex: 10,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  menuText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#e5e7eb",
    flex: 1,
  },
  closeButton: {
    padding: 4,
    borderRadius: 4,
  },
  exercisesList: {
    marginBottom: 20,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e7eb",
    flex: 1,
  },
  exerciseSets: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  modalActions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  startButton: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#059669",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});


