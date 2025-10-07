import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useDatabase } from '../context/DatabaseContext';
import AddCustomExerciseModal from './AddCustomExerciseModal';

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onExerciseAdded?: (exerciseId: string, exerciseName: string, sets?: number, reps?: number) => void;
  showSetsRepsForm?: boolean; // If true, show form to enter sets/reps before adding
}

interface ExerciseFormData {
  sets: string;
  reps: string;
}

export default function AddExerciseModal({
  visible,
  onClose,
  onExerciseAdded,
  showSetsRepsForm = false,
}: AddExerciseModalProps) {
  const { exercises, categories, isInitialized } = useDatabase();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);

  // Filter exercises based on category and search query
  useEffect(() => {
    let filtered = Array.isArray(exercises) ? exercises : [];

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(exercise => 
        exercise && 
        typeof exercise === 'object' && 
        exercise.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(exercise =>
        exercise && 
        typeof exercise === 'object' && 
        exercise.name && 
        typeof exercise.name === 'string' &&
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort alphabetically
    filtered = filtered.sort((a, b) => {
      const nameA = (a && a.name && typeof a.name === 'string') ? a.name : '';
      const nameB = (b && b.name && typeof b.name === 'string') ? b.name : '';
      return nameA.localeCompare(nameB);
    });

    setFilteredExercises(filtered);
  }, [exercises, selectedCategory, searchQuery]);

  const handleCategorySelect = (category: string) => {
    console.log('Category selected:', category);
    setSelectedCategory(category);
  };

  const handleExerciseSelect = (exercise: any) => {
    console.log('=== EXERCISE SELECTION DEBUG ===');
    console.log('Exercise selected:', exercise);
    console.log('onExerciseAdded callback exists:', !!onExerciseAdded);
    
    if (!exercise) {
      console.log('No exercise provided');
      return;
    }
    
    console.log('Adding exercise directly...');
    handleAddExercise(exercise?.id, exercise?.name);
  };

  const handleAddExercise = (exerciseId: string, exerciseName: string, sets?: number, reps?: number) => {
    console.log('=== HANDLE ADD EXERCISE DEBUG ===');
    console.log('Adding exercise:', { exerciseId, exerciseName, sets, reps });
    console.log('onExerciseAdded callback exists:', !!onExerciseAdded);
    console.log('onExerciseAdded callback type:', typeof onExerciseAdded);
    
    if (onExerciseAdded) {
      console.log('Calling onExerciseAdded callback...');
      onExerciseAdded(exerciseId, exerciseName, sets, reps);
      console.log('onExerciseAdded callback called successfully');
    } else {
      console.log('ERROR: No onExerciseAdded callback provided');
    }
    console.log('Calling handleClose...');
    handleClose();
  };


  const handleClose = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    onClose();
  };

  const handleCustomExerciseAdded = (exerciseId: string) => {
    console.log('Custom exercise added:', exerciseId);
    setShowCustomExerciseModal(false);
    
    // Find the newly added exercise and add it to the workout
    const newExercise = exercises.find(ex => ex.id === exerciseId);
    if (newExercise && onExerciseAdded) {
      console.log('Adding custom exercise to workout:', newExercise);
      onExerciseAdded(exerciseId, newExercise.name);
    }
    
    // The exercises list will automatically refresh due to context updates
  };

  const handleCustomExercisePress = () => {
    console.log('Custom exercise button pressed');
    console.log('showCustomExerciseModal before:', showCustomExerciseModal);
    setShowCustomExerciseModal(true);
    console.log('setShowCustomExerciseModal(true) called');
  };

  const renderCategoryButton = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonSelected,
      ]}
      onPress={() => handleCategorySelect(category)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === category && styles.categoryButtonTextSelected,
        ]}
      >
        {category || 'Unknown'}
      </Text>
    </TouchableOpacity>
  );

  const renderExercise = ({ item }: { item: any }) => {
    // Ensure item is valid
    if (!item || typeof item !== 'object') {
      return null;
    }

    const exerciseName = (item.name && typeof item.name === 'string') ? item.name : 'Unknown Exercise';
    const exerciseCategory = (item.category && typeof item.category === 'string') ? item.category : 'Unknown Category';
    const isCustom = Boolean(item.is_custom);

    return (
      <TouchableOpacity
        style={styles.exerciseItem}
        onPress={() => {
          console.log('=== TOUCHABLEOPACITY PRESSED ===');
          console.log('Item:', item);
          console.log('Exercise name:', exerciseName);
          handleExerciseSelect(item);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <Text style={styles.exerciseCategory}>{exerciseCategory}</Text>
          {isCustom && (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>Custom</Text>
            </View>
          )}
        </View>
        <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
      </TouchableOpacity>
    );
  };

  if (!isInitialized) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading exercises...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Exercise</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Custom Exercise Button */}
          <View style={styles.customExerciseContainer}>
            <TouchableOpacity
              style={styles.customExerciseButton}
              onPress={handleCustomExercisePress}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#3b82f6" />
              <Text style={styles.customExerciseText}>Add Custom Exercise</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {renderCategoryButton('All')}
            {Array.isArray(categories) && categories.map(category => {
              const categoryName = (category && typeof category === 'object' && category.name) 
                ? category.name 
                : 'Unknown';
              return renderCategoryButton(categoryName);
            })}
          </ScrollView>

          {/* Exercise List */}
          <View style={styles.exerciseListContainer}>
            <Text style={styles.resultsText}>
              {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
            </Text>
            
            
            <FlatList
              data={filteredExercises}
              renderItem={renderExercise}
              keyExtractor={(item, index) => {
                if (item && typeof item === 'object' && item.id && typeof item.id === 'string') {
                  return item.id;
                }
                return `exercise-${index}`;
              }}
              showsVerticalScrollIndicator={true}
              style={styles.exerciseList}
              contentContainerStyle={styles.exerciseListContent}
            />
          </View>
        </View>
      </Modal>

      {/* Custom Exercise Modal */}
      {console.log('=== CUSTOM EXERCISE MODAL RENDER ===', { showCustomExerciseModal })}
      <AddCustomExerciseModal
        visible={showCustomExerciseModal}
        onClose={() => setShowCustomExerciseModal(false)}
        onExerciseAdded={handleCustomExerciseAdded}
      />

    </>
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
  },
  loadingText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  closeButton: {
    padding: 8,
  },
  customExerciseContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  customExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  customExerciseText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f8fafc',
  },
  clearButton: {
    padding: 4,
  },
  categoryScroll: {
    marginBottom: 0,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  categoryButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  exerciseListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    marginTop: -550,
  },
  resultsText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    paddingBottom: 20,
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
  formContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f8fafc',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});