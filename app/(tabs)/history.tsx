import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import SimpleCalendar from "../../components/SimpleCalendar";
import { CompletedWorkout, useWorkouts } from "../../context/WorkoutsContext";

export default function HistoryScreen() {
  const { completedWorkouts } = useWorkouts();
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

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

  // Create marked dates for calendar
  const getMarkedDates = () => {
    const markedDates: { [key: string]: any } = {};
    
    completedWorkouts.forEach((workout) => {
      const date = new Date(workout.completedAt);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      markedDates[dateString] = {
        marked: true,
        dotColor: '#10b981',
        selectedColor: '#10b981',
        selected: false,
      };
    });
    
    return markedDates;
  };

  // Get workout count for a specific date
  const getWorkoutsForDate = (dateString: string) => {
    const date = new Date(dateString);
    return completedWorkouts.filter(workout => {
      const workoutDate = new Date(workout.completedAt);
      return workoutDate.toDateString() === date.toDateString();
    });
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
      <View style={styles.header}>
        <Text style={styles.title}>Workout History</Text>
        <Pressable 
          style={styles.calendarButton}
          onPress={() => setShowCalendar(true)}
        >
          <Ionicons name="calendar-outline" size={24} color="#6366f1" />
        </Pressable>
      </View>
      
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

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Workout Calendar</Text>
              <Pressable 
                style={styles.closeButton}
                onPress={() => setShowCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>
            
             <SimpleCalendar
               markedDates={getMarkedDates()}
               onDayPress={(dateString) => {
                 const workouts = getWorkoutsForDate(dateString);
                 if (workouts.length > 0) {
                   const workoutNames = workouts.map(workout => workout.workoutName).join(', ');
                   alert(`You worked out on ${new Date(dateString).toLocaleDateString()}!\n\nWorkouts: ${workoutNames}`);
                 }
               }}
             />
            
            <View style={styles.calendarFooter}>
              <Text style={styles.calendarFooterText}>
                Green dots indicate days you worked out
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#e2e8f0",
  },
  calendarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#1f2937",
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
  // Calendar Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarModal: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#e5e7eb",
  },
  closeButton: {
    padding: 4,
    borderRadius: 4,
  },
  calendarFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    alignItems: "center",
  },
  calendarFooterText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
});


