import { Exercise, UserProfile } from '../types';

/**
 * Base starting weights (in kg) for an athletic reference male (~75-80kg, age 20-35).
 * Calibrated specifically so that exercises like Beinpresse start at 60kg,
 * Beinstrecker/Beinbeuger at 20-25kg, Seitheben at 6kg, Bizepscurls at 10-12kg, etc.
 */
const BASE_EXERCISE_WEIGHTS: Record<string, number> = {
  // Beine
  'leg-press': 60,
  'squats': 45,
  'leg-extension': 25,
  'leg-curl': 25,
  'calf-raises': 35,

  // Brust
  'bench-press': 42.5,
  'chest-press-machine': 35,
  'cable-crossover-flys': 12.5,

  // Rücken
  'lat-pulldown': 35,
  'seated-cable-row': 35,
  't-bar-row': 30,
  'pull-ups': 0,

  // Schultern
  'shoulder-press': 22.5,
  'cable-lateral-raise': 6,
  'lateral-raise': 6,

  // Arme
  'cable-triceps-pushdown': 17.5,
  'dips': 0,
  'dumbbell-biceps-curls': 10,
  'cable-biceps-curls': 15,
  'hammer-curls': 10,

  // Core & Rumpf
  'crunches': 0,
  'plank': 0,
  'leg-raises': 0,
  'ab-machine': 20,

  // Cardio
  'cardio-treadmill': 0,
};

export interface ExerciseStartingValues {
  weight: number;
  repetitions: number;
  isCardio: boolean;
  isBodyweight: boolean;
  isTimed: boolean;
  unitLabel: string;
}

/**
 * Checks if an exercise is timed in seconds (such as Plank / Unterarmstütz).
 */
export function isExerciseTimed(exerciseId: string): boolean {
  return (
    exerciseId === 'plank' ||
    exerciseId === 'mountain-climbers-home' ||
    exerciseId === 'jump-rope-home'
  );
}

/**
 * Calculates a sensible, realistic starting weight and reps for any exercise,
 * precisely tailored to the user's age, gender, and current body weight.
 */
export function getRecommendedWeightAndReps(
  exercise: Exercise,
  user?: UserProfile | null
): ExerciseStartingValues {
  const isCardio = exercise.machineType === 'cardio' || exercise.id === 'cardio-treadmill';
  const isTimed = isExerciseTimed(exercise.id);
  const isBodyweight = exercise.machineType === 'bodyweight';

  if (isCardio) {
    return {
      weight: 0,
      repetitions: 15, // 15 Minuten
      isCardio: true,
      isBodyweight: false,
      isTimed: true,
      unitLabel: 'Min',
    };
  }

  if (isTimed) {
    // E.g. Plank: 45 to 60 seconds
    let seconds = 45;
    if (exercise.id === 'plank') seconds = 45;
    else if (exercise.id === 'jump-rope-home') seconds = 60;
    else if (exercise.id === 'mountain-climbers-home') seconds = 45;

    return {
      weight: 0,
      repetitions: seconds,
      isCardio: false,
      isBodyweight: true,
      isTimed: true,
      unitLabel: 'Sek',
    };
  }

  if (isBodyweight) {
    return {
      weight: 0,
      repetitions: 12,
      isCardio: false,
      isBodyweight: true,
      isTimed: false,
      unitLabel: 'Wdh',
    };
  }

  // Base weight lookup
  const baseWeight = BASE_EXERCISE_WEIGHTS[exercise.id] ?? 25;

  // Profile-based calibration
  let genderFactor = 1.0;
  if (user?.gender === 'female') {
    genderFactor = 0.62;
  }

  // Age factor: youth (e.g. 16) or senior (e.g. > 60) slight protective scaling
  let ageFactor = 1.0;
  if (user?.age) {
    if (user.age < 18) {
      ageFactor = 0.90;
    } else if (user.age > 55) {
      ageFactor = 0.85;
    }
  }

  // Weight factor: scales gently based on user's current weight relative to 78kg
  let weightFactor = 1.0;
  if (user?.currentWeightKg && user.currentWeightKg > 0) {
    weightFactor = Math.sqrt(user.currentWeightKg / 78);
  }

  // Calculate tailored weight
  let calculated = baseWeight * genderFactor * ageFactor * weightFactor;

  // Rounding:
  // For small isolation exercises (< 15kg), round to nearest 0.5 or 1 kg
  // For larger machines/compounds (>= 15kg), round to nearest 2.5 kg
  if (calculated < 15) {
    calculated = Math.max(2, Math.round(calculated * 2) / 2);
  } else {
    calculated = Math.max(5, Math.round(calculated / 2.5) * 2.5);
  }

  // Repetitions default: extract from defaultReps (e.g. "10–12" -> 10)
  let reps = 10;
  if (exercise.defaultReps) {
    const match = exercise.defaultReps.match(/\d+/);
    if (match) {
      reps = parseInt(match[0], 10);
    }
  }

  return {
    weight: calculated,
    repetitions: reps,
    isCardio: false,
    isBodyweight: false,
    isTimed: false,
    unitLabel: 'kg',
  };
}
