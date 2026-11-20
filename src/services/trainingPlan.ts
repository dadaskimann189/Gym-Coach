import { EXERCISE_DATABASE } from '../data/exercises';
import { DayOfWeek, Workout, WorkoutExercisePlan } from '../types';
import { StorageService } from './storage';

export function getExerciseById(id: string) {
  return EXERCISE_DATABASE.find(e => e.id === id);
}

export function buildExercisePlan(exerciseId: string, sets = 3, reps = '8–12'): WorkoutExercisePlan {
  const ex = getExerciseById(exerciseId);
  let adjustedSets = sets;

  // Cardio (Laufband) is always 1 set warmup/finisher
  if (exerciseId === 'cardio-treadmill') {
    adjustedSets = 1;
  } else {
    try {
      const user = StorageService.getUser();
      const memory = user?.coachMemory?.[exerciseId];
      if (memory) {
        if (memory.rating === 'too_hard') {
          adjustedSets = Math.max(1, sets - 1);
        } else if (memory.rating === 'too_easy') {
          adjustedSets = sets + 1;
        }
      }
    } catch {
      // fallback
    }
  }

  let finalReps = ex?.defaultReps || reps;
  if (exerciseId === 'cardio-treadmill') {
    finalReps = '15 Min';
  } else if (exerciseId === 'plank') {
    finalReps = '45–60 Sek';
  }

  return {
    exerciseId,
    exerciseName: ex ? ex.name : exerciseId,
    targetSets: adjustedSets,
    targetReps: finalReps,
    completedSets: [],
  };
}

/**
 * Creates an optimized Home Workout based on split focus.
 * Uses bodyweight & household friendly exercises:
 * - Seilspringen (Jump Rope Cardio)
 * - Liegestütze (Push-ups)
 * - Air Squats (Kniebeugen)
 * - Ausfallschritte (Lunges)
 * - Stuhl- / Sofa-Dips
 * - Mountain Climbers
 * - Unterarmstütz (Plank) & Crunches
 */
export function createHomeWorkoutForType(
  day: DayOfWeek,
  workoutType: Workout['workoutType'],
  durationMinutes = 40,
  userId = 'default-user'
): Workout {
  let title = 'Home-Workout (Ganzkörper)';
  let exercises: WorkoutExercisePlan[] = [];

  switch (workoutType) {
    case 'push':
    case 'upper':
      title = 'Home-Workout (Oberkörper & Push)';
      exercises = [
        buildExercisePlan('jump-rope-home', 3, '60–90 Sek'),
        buildExercisePlan('pushups-home', 3, '12–20'),
        buildExercisePlan('chair-dips-home', 3, '10–15'),
        buildExercisePlan('mountain-climbers-home', 3, '45 Sek'),
        buildExercisePlan('plank', 3, '45–60 Sek'),
      ];
      break;

    case 'legs':
    case 'lower':
      title = 'Home-Workout (Beine & Po)';
      exercises = [
        buildExercisePlan('jump-rope-home', 3, '60–90 Sek'),
        buildExercisePlan('bodyweight-squats-home', 3, '20–25'),
        buildExercisePlan('walking-lunges-home', 3, '12–16 pro Bein'),
        buildExercisePlan('calf-raises', 3, '20'),
        buildExercisePlan('plank', 3, '45–60 Sek'),
      ];
      break;

    case 'pull':
      title = 'Home-Workout (Rumpf, Rücken & Core)';
      exercises = [
        buildExercisePlan('jump-rope-home', 3, '60–90 Sek'),
        buildExercisePlan('pull-ups', 3, '6–10'),
        buildExercisePlan('mountain-climbers-home', 3, '45 Sek'),
        buildExercisePlan('crunches', 3, '15–20'),
        buildExercisePlan('plank', 3, '60 Sek'),
      ];
      break;

    case 'cardio_core':
      title = 'Home-Workout (Cardio & Core Burner)';
      exercises = [
        buildExercisePlan('jump-rope-home', 4, '90 Sek'),
        buildExercisePlan('mountain-climbers-home', 3, '45–60 Sek'),
        buildExercisePlan('pushups-home', 3, '15–20'),
        buildExercisePlan('crunches', 3, '20'),
        buildExercisePlan('plank', 3, '60 Sek'),
      ];
      break;

    case 'fullbody':
    default:
      title = 'Home-Workout (Ganzkörper)';
      exercises = [
        buildExercisePlan('jump-rope-home', 3, '60–90 Sek'),
        buildExercisePlan('pushups-home', 3, '12–20'),
        buildExercisePlan('bodyweight-squats-home', 3, '15–25'),
        buildExercisePlan('walking-lunges-home', 3, '12–14 pro Bein'),
        buildExercisePlan('chair-dips-home', 3, '10–15'),
        buildExercisePlan('mountain-climbers-home', 3, '45 Sek'),
        buildExercisePlan('plank', 3, '45–60 Sek'),
      ];
      break;
  }

  return {
    id: `plan-day-${day}-home`,
    userId,
    date: getNextDateForDay(day),
    dayOfWeek: day,
    title,
    workoutType,
    location: 'home',
    targetDurationMinutes: durationMinutes,
    completed: false,
    exercises,
  };
}

/**
 * Creates an optimized Gym Workout based on split focus.
 */
export function createGymWorkoutForType(
  day: DayOfWeek,
  workoutType: Workout['workoutType'],
  durationMinutes = 45,
  userId = 'default-user'
): Workout {
  let title = 'Ganzkörper Fokus';
  let exercises: WorkoutExercisePlan[] = [];

  switch (workoutType) {
    case 'push':
      title = 'Push (Brust / Schulter / Trizeps)';
      exercises = [
        buildExercisePlan('bench-press', 3, '8–12'),
        buildExercisePlan('incline-bench-press', 3, '8–12'),
        buildExercisePlan('overhead-press', 3, '8–10'),
        buildExercisePlan('lateral-raises', 3, '12–15'),
        buildExercisePlan('triceps-pushdown', 3, '10–12'),
      ];
      break;

    case 'upper':
      title = 'Oberkörper Fokus';
      exercises = [
        buildExercisePlan('bench-press', 3, '8–12'),
        buildExercisePlan('lat-pulldown', 3, '8–12'),
        buildExercisePlan('overhead-press', 3, '8–10'),
        buildExercisePlan('seated-cable-row', 3, '10–12'),
        buildExercisePlan('triceps-pushdown', 3, '10–12'),
      ];
      break;

    case 'legs':
    case 'lower':
      title = 'Beine & Rumpf';
      exercises = [
        buildExercisePlan('squats', 3, '8–10'),
        buildExercisePlan('leg-press', 3, '10–12'),
        buildExercisePlan('leg-curl', 3, '10–12'),
        buildExercisePlan('calf-raises', 3, '12–15'),
        buildExercisePlan('crunches', 3, '15–20'),
      ];
      break;

    case 'pull':
      title = 'Rücken & Arme';
      exercises = [
        buildExercisePlan('lat-pulldown', 3, '8–12'),
        buildExercisePlan('seated-cable-row', 3, '8–12'),
        buildExercisePlan('reverse-fly', 3, '12–15'),
        buildExercisePlan('biceps-curls', 3, '10–12'),
        buildExercisePlan('plank', 3, '45–60s'),
      ];
      break;

    case 'cardio_core':
      title = 'Cardio & Core';
      exercises = [
        buildExercisePlan('cardio-treadmill', 1, '20 Min'),
        buildExercisePlan('crunches', 3, '20'),
        buildExercisePlan('plank', 3, '60s'),
        buildExercisePlan('leg-raises', 3, '15'),
      ];
      break;

    case 'fullbody':
    default:
      title = 'Ganzkörper Fokus';
      exercises = [
        buildExercisePlan('squats', 3, '8–10'),
        buildExercisePlan('bench-press', 3, '8–10'),
        buildExercisePlan('lat-pulldown', 3, '8–12'),
        buildExercisePlan('overhead-press', 3, '10–12'),
        buildExercisePlan('crunches', 3, '15–20'),
      ];
      break;
  }

  return {
    id: `plan-day-${day}-gym`,
    userId,
    date: getNextDateForDay(day),
    dayOfWeek: day,
    title,
    workoutType,
    location: 'gym',
    targetDurationMinutes: durationMinutes,
    completed: false,
    exercises,
  };
}

/**
 * Converts a workout between Gym and Home while preserving user progress & target duration.
 */
export function convertWorkoutLocation(workout: Workout, targetLocation: 'gym' | 'home'): Workout {
  if (workout.location === targetLocation) return workout;

  const duration = workout.targetDurationMinutes || (targetLocation === 'home' ? 40 : 45);

  if (targetLocation === 'home') {
    const homeWorkout = createHomeWorkoutForType(
      workout.dayOfWeek,
      workout.workoutType,
      duration,
      workout.userId
    );
    return {
      ...homeWorkout,
      id: workout.id,
      completed: workout.completed,
      completedAt: workout.completedAt,
    };
  } else {
    const gymWorkout = createGymWorkoutForType(
      workout.dayOfWeek,
      workout.workoutType,
      duration,
      workout.userId
    );
    return {
      ...gymWorkout,
      id: workout.id,
      completed: workout.completed,
      completedAt: workout.completedAt,
    };
  }
}

/**
 * Dynamically recalculates exercise count, sets, and cardio warmup/finishers
 * based on user's selected time budget (e.g. 30min, 45min, 60min, 90min).
 * Handles both Gym and Home workouts appropriately.
 */
export function adjustWorkoutForDuration(
  baseWorkout: Workout,
  targetMinutes: number
): Workout {
  const newWorkout: Workout = JSON.parse(JSON.stringify(baseWorkout));
  newWorkout.targetDurationMinutes = targetMinutes;
  const isHome = newWorkout.location === 'home';

  if (isHome) {
    // HOME WORKOUT DURATION SCALING
    const homeAdditions = ['mountain-climbers-home', 'walking-lunges-home', 'chair-dips-home', 'crunches', 'plank'];

    if (targetMinutes <= 30) {
      // 30 MIN EXPRESS HOME WORKOUT
      newWorkout.exercises = newWorkout.exercises.slice(0, 3).map((ex) => ({
        ...ex,
        targetSets: 2,
      }));
    } else if (targetMinutes <= 45) {
      // 45 MIN STANDARD HOME WORKOUT
      const existing = newWorkout.exercises.slice(0, 5).map((ex) => ({
        ...ex,
        targetSets: 3,
      }));
      newWorkout.exercises = existing;
    } else if (targetMinutes <= 60) {
      // 60 MIN EXTENDED HOME WORKOUT
      const existingIds = new Set(newWorkout.exercises.map((e) => e.exerciseId));
      const list = [...newWorkout.exercises];
      for (const addId of homeAdditions) {
        if (list.length >= 6) break;
        if (!existingIds.has(addId)) {
          list.push(buildExercisePlan(addId, 3));
          existingIds.add(addId);
        }
      }
      newWorkout.exercises = list.map((ex) => ({
        ...ex,
        targetSets: 3,
      }));
    } else {
      // 90 MIN POWER HOME WORKOUT
      const existingIds = new Set(newWorkout.exercises.map((e) => e.exerciseId));
      const list: WorkoutExercisePlan[] = [];

      // Warmup: Extra Jump Rope rounds
      if (!existingIds.has('jump-rope-home')) {
        list.push(buildExercisePlan('jump-rope-home', 4, '90 Sek'));
        existingIds.add('jump-rope-home');
      }

      for (const ex of newWorkout.exercises) {
        list.push({
          ...ex,
          targetSets: 4,
        });
      }

      for (const addId of homeAdditions) {
        if (list.length >= 7) break;
        if (!existingIds.has(addId)) {
          list.push(buildExercisePlan(addId, 3));
          existingIds.add(addId);
        }
      }
      newWorkout.exercises = list;
    }

    return newWorkout;
  }

  // GYM WORKOUT DURATION SCALING
  const isUpper = baseWorkout.workoutType === 'upper' || baseWorkout.workoutType === 'push' || baseWorkout.workoutType === 'pull';
  const isLower = baseWorkout.workoutType === 'legs' || baseWorkout.workoutType === 'lower';

  const potentialAdditions = isUpper
    ? ['butterfly', 'lateral-raises', 'biceps-curls', 'triceps-pushdown', 'reverse-fly']
    : isLower
    ? ['leg-extension', 'leg-curl', 'calf-raises', 'plank', 'crunches']
    : ['lateral-raises', 'biceps-curls', 'triceps-pushdown', 'plank'];

  if (targetMinutes <= 30) {
    newWorkout.exercises = newWorkout.exercises.slice(0, 3).map((ex) => ({
      ...ex,
      targetSets: ex.exerciseId === 'cardio-treadmill' ? 1 : 2,
    }));
  } else if (targetMinutes <= 45) {
    const existing = newWorkout.exercises.slice(0, 4).map((ex) => ({
      ...ex,
      targetSets: ex.exerciseId === 'cardio-treadmill' ? 1 : 3,
    }));
    newWorkout.exercises = existing;
  } else if (targetMinutes <= 60) {
    const existingIds = new Set(newWorkout.exercises.map((e) => e.exerciseId));
    const list = [...newWorkout.exercises];

    for (const addId of potentialAdditions) {
      if (list.length >= 5) break;
      if (!existingIds.has(addId)) {
        list.push(buildExercisePlan(addId, 3, '10–12'));
        existingIds.add(addId);
      }
    }
    newWorkout.exercises = list.map((ex) => ({
      ...ex,
      targetSets: ex.exerciseId === 'cardio-treadmill' ? 1 : 3,
    }));
  } else {
    // 75-90+ MIN LONG SESSION
    const existingIds = new Set(newWorkout.exercises.map((e) => e.exerciseId));
    const list: WorkoutExercisePlan[] = [];

    // Prepend 15 Min Cardio / Warmup if not already present
    if (!existingIds.has('cardio-treadmill')) {
      list.push({
        exerciseId: 'cardio-treadmill',
        exerciseName: 'Cardio-Warmup (Laufband/Stepper)',
        targetSets: 1,
        targetReps: '15–20 Min',
        completedSets: [],
      });
      existingIds.add('cardio-treadmill');
    }

    for (const ex of newWorkout.exercises) {
      list.push({
        ...ex,
        targetSets: ex.exerciseId === 'cardio-treadmill' ? 1 : 4,
      });
    }

    for (const addId of potentialAdditions) {
      if (list.length >= 7) break;
      if (!existingIds.has(addId)) {
        list.push(buildExercisePlan(addId, 3, '10–15'));
        existingIds.add(addId);
      }
    }

    if (!existingIds.has('plank') && list.length < 8) {
      list.push(buildExercisePlan('plank', 3, '45–60s'));
    }

    newWorkout.exercises = list;
  }

  return newWorkout;
}

export function generateWorkoutsForTrainingDays(
  userId: string,
  trainingDays: DayOfWeek[],
  homeTrainingDays: DayOfWeek[] = [],
  existingWorkouts: Workout[] = [],
  preferredGymDurationMinutes = 45
): Workout[] {
  if (!trainingDays || trainingDays.length === 0) {
    trainingDays = [2, 4, 6]; // Default: Di, Do, Sa
  }

  const sortedDays = [...trainingDays].sort((a, b) => a - b);
  const count = sortedDays.length;

  const workouts: Workout[] = [];

  const createOrPreserveWorkout = (day: DayOfWeek, type: Workout['workoutType']) => {
    const targetLoc = homeTrainingDays.includes(day) ? 'home' : 'gym';
    const existing = existingWorkouts.find(
      (w) => w.dayOfWeek === day && !w.id.startsWith('archive-') && !w.id.startsWith('workout-archive-')
    );

    if (existing) {
      if (existing.completed) {
        return existing;
      }
      if (existing.location === targetLoc) {
        // If it's a gym workout and user updated preferred gym duration, adjust exercises accordingly
        if (targetLoc === 'gym' && existing.targetDurationMinutes !== preferredGymDurationMinutes) {
          return adjustWorkoutForDuration(existing, preferredGymDurationMinutes);
        }
        return existing;
      }
      const converted = convertWorkoutLocation(existing, targetLoc);
      if (targetLoc === 'gym' && converted.targetDurationMinutes !== preferredGymDurationMinutes) {
        return adjustWorkoutForDuration(converted, preferredGymDurationMinutes);
      }
      return converted;
    }

    if (targetLoc === 'home') {
      return createHomeWorkoutForType(day, type, 40, userId);
    } else {
      return createGymWorkoutForType(day, type, preferredGymDurationMinutes, userId);
    }
  };

  if (count === 1) {
    const day = sortedDays[0];
    workouts.push(createOrPreserveWorkout(day, 'fullbody'));
  } else if (count === 2) {
    const day1 = sortedDays[0];
    const day2 = sortedDays[1];
    workouts.push(createOrPreserveWorkout(day1, 'upper'));
    workouts.push(createOrPreserveWorkout(day2, 'legs'));
  } else if (count === 3) {
    const day1 = sortedDays[0];
    const day2 = sortedDays[1];
    const day3 = sortedDays[2];
    workouts.push(createOrPreserveWorkout(day1, 'legs'));
    workouts.push(createOrPreserveWorkout(day2, 'upper'));
    workouts.push(createOrPreserveWorkout(day3, 'pull'));
  } else {
    // 4+ Days
    const splitTypes: Workout['workoutType'][] = ['push', 'pull', 'legs', 'upper', 'cardio_core'];

    sortedDays.forEach((day, index) => {
      const type = splitTypes[index % splitTypes.length];
      workouts.push(createOrPreserveWorkout(day, type));
    });
  }

  return workouts;
}

export function getNextDateForDay(dayOfWeek: DayOfWeek): string {
  const now = new Date();
  const currentDay = now.getDay();
  let diff = dayOfWeek - currentDay;
  if (diff < 0) {
    diff += 7;
  }
  const targetDate = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);
  return targetDate.toISOString().split('T')[0];
}

export function getDayNameDe(dayOfWeek: DayOfWeek): string {
  const names = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return names[dayOfWeek] || '';
}

export function getShortDayNameDe(dayOfWeek: DayOfWeek): string {
  const shortNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return shortNames[dayOfWeek] || '';
}
