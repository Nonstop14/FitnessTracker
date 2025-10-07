# SQLite Database System for Fitness Tracker

This database system provides a complete local storage solution for the Fitness Tracker app using SQLite with automatic migration from AsyncStorage.

## Features

- **Pre-populated Exercise Pool**: 100+ exercises across 8 categories
- **Custom Exercise Support**: Add your own exercises with categories
- **Workout Management**: Create, update, and delete workouts
- **Exercise History**: Track previous reps and weights for each exercise
- **Automatic Migration**: Migrates existing AsyncStorage data to SQLite
- **TypeScript Support**: Full type safety with interfaces
- **Context Integration**: Easy access throughout the app

## Database Schema

### Tables

1. **categories** - Exercise categories (Chest, Back, Shoulders, etc.)
2. **exercises** - Exercise library with pre-populated and custom exercises
3. **workouts** - Workout sessions with name and date
4. **workout_exercises** - Individual exercise sets with reps, weight, and history

### Key Features

- **Foreign Key Relationships**: Proper data integrity
- **Indexes**: Optimized queries for performance
- **Cascade Deletes**: Automatic cleanup when workouts are deleted
- **Previous Stats**: Track last recorded reps/weight for each exercise

## Usage

### 1. Database Context

The `DatabaseProvider` wraps your app and provides database access:

```tsx
import { useDatabase } from '../context/DatabaseContext';

function MyComponent() {
  const { 
    exercises, 
    workouts, 
    addCustomExercise, 
    getLastRecordedStats 
  } = useDatabase();
  
  // Use database functions...
}
```

### 2. Common Operations

#### Get All Exercises
```tsx
const { exercises } = useDatabase();
// exercises is automatically updated when data changes
```

#### Search Exercises
```tsx
const { searchExercises } = useDatabase();
const results = await searchExercises('bench');
```

#### Add Custom Exercise
```tsx
const { addCustomExercise } = useDatabase();
const exerciseId = await addCustomExercise('My Custom Exercise', 'Chest');
```

#### Get Last Recorded Stats
```tsx
const { getLastRecordedStats } = useDatabase();
const stats = await getLastRecordedStats('bench-press');
// Returns: { reps: 10, weight: 100 } or null
```

#### Add Workout
```tsx
const { addWorkout } = useDatabase();
const workoutId = await addWorkout('Push Day', '2024-01-15');
```

#### Add Workout Exercise
```tsx
const { addWorkoutExercise } = useDatabase();
await addWorkoutExercise(
  workoutId,
  exerciseId,
  10, // reps
  100, // weight
  1, // set number
  8, // previous reps (optional)
  95 // previous weight (optional)
);
```

### 3. Custom Exercise Modal

Use the `AddCustomExerciseModal` component for adding custom exercises:

```tsx
import AddCustomExerciseModal from '../components/AddCustomExerciseModal';

function MyScreen() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <Text>Add Custom Exercise</Text>
      </TouchableOpacity>
      
      <AddCustomExerciseModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onExerciseAdded={(exerciseId) => {
          console.log('Exercise added:', exerciseId);
        }}
      />
    </>
  );
}
```

## Migration

The system automatically migrates existing AsyncStorage data on first app load:

1. **Workouts**: Migrates workout plans from AsyncStorage
2. **Completed Workouts**: Migrates workout history
3. **Exercise Sets**: Migrates all exercise data with proper relationships

Migration only runs once and preserves all existing data.

## Pre-populated Data

### Categories
- Chest
- Back  
- Shoulders
- Arms
- Legs
- Core
- Cardio
- Full Body

### Exercise Examples
- **Chest**: Bench Press, Incline Press, Push-ups, Dips
- **Back**: Deadlift, Pull-ups, Rows, Lat Pulldown
- **Shoulders**: Overhead Press, Lateral Raises, Face Pulls
- **Arms**: Bicep Curls, Tricep Extensions, Hammer Curls
- **Legs**: Squats, Lunges, Leg Press, Calf Raises
- **Core**: Plank, Crunches, Russian Twists, Mountain Climbers
- **Cardio**: Running, Cycling, Swimming, Burpees
- **Full Body**: Thrusters, Kettlebell Swings, Turkish Get-ups

## Performance

- **Indexed Queries**: Fast lookups on workout_id and exercise_id
- **Efficient Relationships**: Proper foreign key constraints
- **Lazy Loading**: Data loaded only when needed
- **Context Updates**: Automatic UI updates when data changes

## Error Handling

All database operations include proper error handling:

```tsx
try {
  const exerciseId = await addCustomExercise(name, category);
  // Success
} catch (error) {
  console.error('Failed to add exercise:', error);
  // Handle error
}
```

## TypeScript Support

Full type safety with interfaces:

```tsx
interface Exercise {
  id: string;
  name: string;
  category: string;
  is_custom: boolean;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  created_at: string;
}

interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  reps: number;
  weight: number;
  previous_reps?: number;
  previous_weight?: number;
  set_number: number;
}
```

## Example Screen

See `app/examples/DatabaseExample.tsx` for a complete example showing:
- Exercise search and selection
- Last recorded stats display
- Custom exercise creation
- Workout management
- Database statistics

This provides a complete, production-ready database system for your Fitness Tracker app!
