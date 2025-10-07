import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AddCustomExerciseModal from '../../components/AddCustomExerciseModal';
import { useDatabase } from '../../context/DatabaseContext';
import { Exercise } from '../../database/schema';

export default function DatabaseExample() {
  const {
    isInitialized,
    exercises,
    workouts,
    categories,
    addWorkout,
    getLastRecordedStats,
    searchExercises,
    addCustomExercise,
  } = useDatabase();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [lastStats, setLastStats] = useState<{ reps: number; weight: number } | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');

  useEffect(() => {
    if (isInitialized) {
      setFilteredExercises(exercises);
    }
  }, [isInitialized, exercises]);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setFilteredExercises(exercises);
    }
  }, [searchQuery, exercises]);

  const handleSearch = async (query: string) => {
    try {
      const results = await searchExercises(query);
      setFilteredExercises(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleExerciseSelect = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    try {
      const stats = await getLastRecordedStats(exercise.id);
      setLastStats(stats);
    } catch (error) {
      console.error('Failed to get last stats:', error);
    }
  };

  const handleAddWorkout = async () => {
    if (!newWorkoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    try {
      const workoutId = await addWorkout(newWorkoutName.trim(), new Date().toISOString());
      Alert.alert('Success', `Workout "${newWorkoutName}" created with ID: ${workoutId}`);
      setNewWorkoutName('');
    } catch (error) {
      console.error('Failed to add workout:', error);
      Alert.alert('Error', 'Failed to create workout');
    }
  };

  const handleAddCustomExercise = async (exerciseId: string) => {
    Alert.alert('Success', 'Custom exercise added! Refreshing list...');
    // The exercises list will automatically refresh due to context updates
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={[
        styles.exerciseItem,
        selectedExercise?.id === item.id && styles.exerciseItemSelected,
      ]}
      onPress={() => handleExerciseSelect(item)}
    >
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseCategory}>{item.category}</Text>
        {item.is_custom && (
          <View style={styles.customBadge}>
            <Text style={styles.customBadgeText}>Custom</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </TouchableOpacity>
  );

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Exercises</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Add Workout Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Workout</Text>
          <View style={styles.addWorkoutContainer}>
            <TextInput
              style={styles.workoutInput}
              placeholder="Enter workout name"
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
              autoCapitalize="words"
            />
            <TouchableOpacity style={styles.addWorkoutButton} onPress={handleAddWorkout}>
              <Text style={styles.addWorkoutButtonText}>Add Workout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Exercise Stats */}
        {selectedExercise && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Recorded Stats</Text>
            <View style={styles.statsContainer}>
              <Text style={styles.exerciseName}>{selectedExercise.name}</Text>
              {lastStats ? (
                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>Last: {lastStats.reps} reps × {lastStats.weight}kg</Text>
                </View>
              ) : (
                <Text style={styles.noStatsText}>No previous records found</Text>
              )}
            </View>
          </View>
        )}

        {/* Exercises List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Exercises ({filteredExercises.length})
            </Text>
            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={() => setShowAddExerciseModal(true)}
            >
              <Ionicons name="add" size={20} color="#3b82f6" />
              <Text style={styles.addExerciseButtonText}>Add Custom</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredExercises}
            renderItem={renderExercise}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Database Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{exercises.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{workouts.length}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <AddCustomExerciseModal
        visible={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        onExerciseAdded={handleAddCustomExercise}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f8fafc',
  },
  addWorkoutContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  workoutInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f8fafc',
  },
  addWorkoutButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  addWorkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsRow: {
    marginTop: 8,
  },
  statsText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  noStatsText: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exerciseItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseCategory: {
    color: '#94a3b8',
    fontSize: 14,
  },
  customBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  customBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  addExerciseButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#3b82f6',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
});
