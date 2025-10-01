import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CompletedWorkout, useWorkouts } from "../../context/WorkoutsContext";

export default function HistoryScreen() {
  const { completedWorkouts } = useWorkouts();
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalReps = (exercises: CompletedWorkout['exercises']) => {
    return exercises.reduce((total, exercise) => 
      total + exercise.sets.reduce((sum: number, set) => sum + set.reps, 0), 0
    );
  };

  const getTotalSets = (exercises: CompletedWorkout['exercises']) => {
    return exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  };

  const getTotalWeight = (exercises: CompletedWorkout['exercises']) => {
    return exercises.reduce((total, exercise) => 
      total + exercise.sets.reduce((sum: number, set) => sum + (set.weight * set.reps), 0), 0
    );
  };

  const toggleExpanded = (workoutId: string) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  if (completedWorkouts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No completed workouts yet</Text>
        <Text style={styles.emptySubtext}>Start a workout to see your history here</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Workout History</Text>
      
      {completedWorkouts.map((workout: CompletedWorkout) => (
        <View key={workout.id} style={styles.workoutCard}>
          <Pressable 
            style={styles.workoutHeader}
            onPress={() => toggleExpanded(workout.id)}
          >
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutName}>{workout.workoutName}</Text>
              <Text style={styles.workoutDate}>{formatDate(workout.completedAt)}</Text>
            </View>
            <View style={styles.workoutStats}>
              <Text style={styles.duration}>{formatDuration(workout.duration)}</Text>
              <Text style={styles.statsText}>
                {getTotalSets(workout.exercises)} sets • {getTotalReps(workout.exercises)} reps
              </Text>
              {getTotalWeight(workout.exercises) > 0 && (
                <Text style={styles.weightStats}>
                  {getTotalWeight(workout.exercises).toFixed(1)}kg total
                </Text>
              )}
            </View>
            <Text style={styles.expandIcon}>
              {expandedWorkout === workout.id ? '▼' : '▶'}
            </Text>
          </Pressable>

          {expandedWorkout === workout.id && (
            <View style={styles.expandedContent}>
              {workout.exercises.map((exercise, exerciseIndex: number) => (
                <View key={exerciseIndex} style={styles.exerciseSection}>
                  <Text style={styles.exerciseName}>
                    {exerciseIndex + 1}. {exercise.exerciseName}
                  </Text>
                  <View style={styles.setsContainer}>
                    {exercise.sets.map((set, setIndex: number) => (
                      <View key={setIndex} style={styles.setItem}>
                        <Text style={styles.setNumber}>Set {set.setNumber}</Text>
                        <Text style={styles.repCount}>{set.reps} reps</Text>
                        {set.weight > 0 && (
                          <Text style={styles.weightText}>{set.weight}kg</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#e2e8f0",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 50,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
  },
  workoutCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    overflow: "hidden",
  },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e5e7eb",
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  workoutStats: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  duration: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 2,
  },
  statsText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  weightStats: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "600",
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "700",
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  exerciseSection: {
    marginTop: 12,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 8,
  },
  setsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  setItem: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setNumber: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  repCount: {
    fontSize: 12,
    color: "#e5e7eb",
    fontWeight: "700",
  },
  weightText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "700",
  },
});


