// Example: How to integrate the database system into existing screens

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AddCustomExerciseModal from '../components/AddCustomExerciseModal';
import { useDatabase } from '../context/DatabaseContext';

// Example: Using database in a workout screen
export default function WorkoutScreenExample() {
  const {
    exercises,
    workouts,
    addWorkout,
    getLastRecordedStats,
    addWorkoutExercise,
    isInitialized
  } = useDatabase();

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [lastStats, setLastStats] = useState(null);
  const [showAddExercise, setShowAddExercise] = useState(false);

  // Get last recorded stats when exercise is selected
  useEffect(() => {
    if (selectedExercise) {
      getLastRecordedStats(selectedExercise.id).then(setLastStats);
    }
  }, [selectedExercise]);

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleAddSet = async (reps, weight) => {
    if (!selectedExercise) return;

    try {
      // Add workout exercise with previous stats
      await addWorkoutExercise(
        'current-workout-id', // You would get this from your workout state
        selectedExercise.id,
        reps,
        weight,
        1, // set number
        lastStats?.reps, // previous reps
        lastStats?.weight // previous weight
      );
      
      // Refresh last stats
      const newStats = await getLastRecordedStats(selectedExercise.id);
      setLastStats(newStats);
    } catch (error) {
      console.error('Failed to add set:', error);
    }
  };

  if (!isInitialized) {
    return <Text>Loading database...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Screen</Text>
      
      {/* Exercise Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Exercise</Text>
        {exercises.slice(0, 5).map(exercise => (
          <TouchableOpacity
            key={exercise.id}
            style={[
              styles.exerciseButton,
              selectedExercise?.id === exercise.id && styles.exerciseButtonSelected
            ]}
            onPress={() => handleExerciseSelect(exercise)}
          >
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseCategory}>{exercise.category}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setShowAddExercise(true)}
        >
          <Text style={styles.addExerciseText}>+ Add Custom Exercise</Text>
        </TouchableOpacity>
      </View>

      {/* Last Stats Display */}
      {selectedExercise && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Recorded</Text>
          {lastStats ? (
            <Text style={styles.statsText}>
              {lastStats.reps} reps × {lastStats.weight}kg
            </Text>
          ) : (
            <Text style={styles.noStatsText}>No previous records</Text>
          )}
        </View>
      )}

      {/* Add Set Button */}
      {selectedExercise && (
        <TouchableOpacity
          style={styles.addSetButton}
          onPress={() => handleAddSet(10, 100)} // Example values
        >
          <Text style={styles.addSetText}>Add Set (10 reps × 100kg)</Text>
        </TouchableOpacity>
      )}

      {/* Custom Exercise Modal */}
      <AddCustomExerciseModal
        visible={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onExerciseAdded={(exerciseId) => {
          console.log('New exercise added:', exerciseId);
          setShowAddExercise(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  exerciseButton: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exerciseButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  exerciseName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseCategory: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  addExerciseButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addExerciseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  noStatsText: {
    color: '#64748b',
    fontSize: 16,
    fontStyle: 'italic',
  },
  addSetButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addSetText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Example: Using database in a history screen
export function HistoryScreenExample() {
  const { workouts, exercises } = useDatabase();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout History</Text>
      
      {workouts.map(workout => (
        <View key={workout.id} style={styles.workoutItem}>
          <Text style={styles.workoutName}>{workout.name}</Text>
          <Text style={styles.workoutDate}>{workout.date}</Text>
        </View>
      ))}
    </View>
  );
}

// Example: Using database in a new workout screen
export function NewWorkoutScreenExample() {
  const { addWorkout, exercises } = useDatabase();
  const [workoutName, setWorkoutName] = useState('');

  const handleCreateWorkout = async () => {
    try {
      const workoutId = await addWorkout(workoutName, new Date().toISOString());
      console.log('Workout created:', workoutId);
      // Navigate to workout screen or show success
    } catch (error) {
      console.error('Failed to create workout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Workout</Text>
      {/* Your form UI here */}
    </View>
  );
}
