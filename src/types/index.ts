export type MuscleId =
  | 'chest'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'glutes'
  | 'lats'
  | 'traps'
  | 'lower_back';

export type MuscleCategory =
  | 'Brust'
  | 'Rücken'
  | 'Schultern'
  | 'Arme'
  | 'Beine'
  | 'Core';

export type FitnessGoal =
  | 'muscle_gain'
  | 'fat_loss'
  | 'strength'
  | 'general_fitness';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sonntag, 1 = Montag, etc.

export type ThemeMode = 'dark' | 'light';
export type AccentColor =
  | 'blue'
  | 'green'
  | 'purple'
  | 'red'
  | 'cyan'
  | 'yellow'
  | 'orange';

export interface AccentColorDefinition {
  id: AccentColor;
  label: string;
  hex: string;
  lightHex: string;
  contrastText: string;
}

export type ExerciseFeedbackRating = 'too_easy' | 'just_right' | 'too_hard';

export interface ExerciseCoachMemory {
  exerciseId: string;
  rating: ExerciseFeedbackRating;
  updatedAt: string;
  adjustmentSets: number; // e.g. -1 if too hard, 0 if just right, +1 if too easy
  recommendedWeightMultiplier: number; // e.g. 0.9 if too hard, 1.05 if too easy
  note?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg?: number;
  fitnessGoal: FitnessGoal;
  trainingDays: DayOfWeek[]; // e.g., [2, 4, 6] for Di, Do, Sa
  homeTrainingDays?: DayOfWeek[]; // Days specifically configured as Home Workouts
  preferredGymDurationMinutes?: number; // Default gym workout duration (e.g. 30, 45, 60, 75, 90 min)
  profileImage?: string;
  unit: 'kg' | 'lbs';
  notificationsEnabled: boolean;
  isOnboarded: boolean;
  isDemo: boolean;
  coachMemory?: Record<string, ExerciseCoachMemory>;
  themeMode?: ThemeMode;
  accentColor?: AccentColor;
}

export interface MuscleContribution {
  muscle: MuscleId;
  weightPercent: number; // e.g. 60 for 60%
}

export interface Exercise {
  id: string;
  name: string;
  category: MuscleCategory;
  primaryMuscles: MuscleContribution[];
  secondaryMuscles: MuscleContribution[];
  defaultSets: number;
  defaultReps: string; // e.g. "8–12"
  description?: string;
  machineName?: string;
  machineType?: 'machine' | 'barbell' | 'cable' | 'bodyweight' | 'cardio';
  imageUrl?: string;
  alternativeExerciseIds?: string[];
  equipmentTip?: string;
}

export interface SetEntry {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  repetitions: number;
  completed: boolean;
  timestamp: number;
  rpe?: number;
}

export interface WorkoutExercisePlan {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  completedSets: SetEntry[];
  feedback?: ExerciseFeedbackRating;
}

export interface Workout {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  title: string; // e.g. "Oberkörper", "Beine", "Ganzkörper A"
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullbody' | 'cardio_core';
  location?: 'gym' | 'home';
  targetDurationMinutes: number;
  actualDurationMinutes?: number;
  exercises: WorkoutExercisePlan[];
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
}

export interface MuscleLoadStatus {
  muscleId: MuscleId;
  nameDe: string;
  category: MuscleCategory;
  load: number; // 0 - 100
  totalSetsThisWeek: number;
  lastTrainedDate?: string;
  lastTrainedDaysAgo?: number;
  recentExercises: string[];
  recommendation: string;
  statusLevel: 'recovered' | 'light' | 'moderate' | 'heavy' | 'very_heavy';
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}
