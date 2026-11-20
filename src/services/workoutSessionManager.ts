import { SetEntry, Workout, WorkoutExercisePlan } from '../types';

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getStartOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isSetFromToday(set: SetEntry, todayStr = getTodayDateString()): boolean {
  if (!set || !set.timestamp) return false;
  try {
    const setDate = new Date(set.timestamp).toISOString().split('T')[0];
    return setDate === todayStr;
  } catch {
    return false;
  }
}

export function isWorkoutSessionFromPast(
  workout: Workout,
  todayStr = getTodayDateString()
): boolean {
  if (!workout) return false;
  if (workout.id.startsWith('archive-') || workout.id.startsWith('workout-archive-')) {
    return false; // Already an archive
  }

  // Check if workout was completed in the past
  if (workout.completed && workout.completedAt) {
    const compDate = workout.completedAt.split('T')[0];
    if (compDate < todayStr) return true;
  }

  // Check if workout has sets from previous days
  const allSets = workout.exercises.flatMap((e) => e.completedSets || []);
  if (allSets.length > 0) {
    const hasPastSets = allSets.some((s) => !isSetFromToday(s, todayStr));
    const hasTodaySets = allSets.some((s) => isSetFromToday(s, todayStr));
    // If it has past sets and no today sets, it's definitely a past session
    if (hasPastSets && !hasTodaySets) return true;
    // If it has workout.date set to a past date
    if (workout.date && workout.date < todayStr) return true;
  }

  return false;
}

/**
 * Inspects all workouts. Ensures that past training sessions are preserved as
 * archived completed workouts, and that today's active workout templates start
 * clean (0 sets) on new days.
 */
export function normalizeAndArchiveWorkouts(
  workouts: Workout[],
  todayStr = getTodayDateString()
): { workouts: Workout[]; archivedCount: number } {
  if (!workouts || workouts.length === 0) {
    return { workouts: [], archivedCount: 0 };
  }

  const result: Workout[] = [];
  let archivedCount = 0;
  const existingArchiveIds = new Set<string>();

  // Collect existing archive IDs
  for (const w of workouts) {
    if (w.id.startsWith('archive-') || w.id.startsWith('workout-archive-')) {
      existingArchiveIds.add(w.id);
      result.push(w);
    }
  }

  // Process scheduled/active workouts
  for (const w of workouts) {
    if (w.id.startsWith('archive-') || w.id.startsWith('workout-archive-')) {
      continue;
    }

    const allSets = w.exercises.flatMap((e) => e.completedSets || []);
    const completedSetsCount = allSets.filter((s) => s.completed).length;

    // Determine if this workout has sets from a previous calendar day
    const pastSets = allSets.filter((s) => !isSetFromToday(s, todayStr));
    const todaySets = allSets.filter((s) => isSetFromToday(s, todayStr));

    const isPastCompleted = Boolean(
      w.completed && w.completedAt && w.completedAt.split('T')[0] < todayStr
    );
    const hasPastSetsWithoutToday = pastSets.length > 0 && todaySets.length === 0;
    const isPastSession = isPastCompleted || hasPastSetsWithoutToday || (w.date && w.date < todayStr && completedSetsCount > 0);

    if (isPastSession && completedSetsCount > 0) {
      // 1. Archive the past session so muscle load and history are preserved
      const latestSetTime = pastSets.reduce(
        (max, s) => Math.max(max, s.timestamp || 0),
        0
      );
      const sessionDate =
        (w.completedAt ? w.completedAt.split('T')[0] : '') ||
        (latestSetTime > 0 ? new Date(latestSetTime).toISOString().split('T')[0] : '') ||
        (w.date && w.date < todayStr ? w.date : 'past');

      const archiveId = `archive-${w.id}-${sessionDate}`;

      if (!existingArchiveIds.has(archiveId)) {
        const archivedWorkout: Workout = {
          ...w,
          id: archiveId,
          date: sessionDate,
          completed: true,
          completedAt: w.completedAt || (latestSetTime > 0 ? new Date(latestSetTime).toISOString() : new Date().toISOString()),
        };
        result.push(archivedWorkout);
        existingArchiveIds.add(archiveId);
        archivedCount++;
      }

      // 2. Reset the active scheduled workout for today
      const cleanActiveWorkout: Workout = {
        ...w,
        date: todayStr,
        completed: false,
        completedAt: undefined,
        actualDurationMinutes: undefined,
        exercises: w.exercises.map((ex) => ({
          ...ex,
          completedSets: [],
        })),
      };
      result.push(cleanActiveWorkout);
    } else if (pastSets.length > 0 && todaySets.length > 0) {
      // Rare edge case: mix of old and new sets in same active workout.
      // Separate them: archive past sets, keep only today's sets on active workout.
      const latestPastTime = pastSets.reduce((max, s) => Math.max(max, s.timestamp || 0), 0);
      const sessionDate = new Date(latestPastTime).toISOString().split('T')[0];
      const archiveId = `archive-${w.id}-${sessionDate}`;

      if (!existingArchiveIds.has(archiveId)) {
        const archivedWorkout: Workout = {
          ...w,
          id: archiveId,
          date: sessionDate,
          completed: true,
          completedAt: new Date(latestPastTime).toISOString(),
          exercises: w.exercises.map((ex) => ({
            ...ex,
            completedSets: ex.completedSets.filter((s) => !isSetFromToday(s, todayStr)),
          })),
        };
        result.push(archivedWorkout);
        existingArchiveIds.add(archiveId);
        archivedCount++;
      }

      const activeWorkout: Workout = {
        ...w,
        date: todayStr,
        exercises: w.exercises.map((ex) => ({
          ...ex,
          completedSets: ex.completedSets.filter((s) => isSetFromToday(s, todayStr)),
        })),
      };
      result.push(activeWorkout);
    } else {
      // Normal: either clean (0 sets) or actively logged today
      result.push({
        ...w,
        date: w.date || todayStr,
      });
    }
  }

  return { workouts: result, archivedCount };
}

/**
 * Manually resets an active workout session.
 * Archives current sets into history and returns a clean workout with 0 completed sets.
 */
export function resetWorkoutToFreshSession(
  workout: Workout,
  workouts: Workout[]
): { updatedWorkouts: Workout[]; cleanWorkout: Workout } {
  const todayStr = getTodayDateString();
  const completedCount = workout.exercises.reduce(
    (acc, ex) => acc + ex.completedSets.length,
    0
  );

  let updatedWorkouts = [...workouts];

  // If there were sets, archive them first so no user effort is ever deleted
  if (completedCount > 0) {
    const archiveId = `archive-${workout.id}-${todayStr}-${Date.now()}`;
    const archivedWorkout: Workout = {
      ...workout,
      id: archiveId,
      date: workout.date || todayStr,
      completed: true,
      completedAt: workout.completedAt || new Date().toISOString(),
    };
    updatedWorkouts.push(archivedWorkout);
  }

  // Create clean workout
  const cleanWorkout: Workout = {
    ...workout,
    date: todayStr,
    completed: false,
    completedAt: undefined,
    actualDurationMinutes: undefined,
    exercises: workout.exercises.map((ex) => ({
      ...ex,
      completedSets: [],
    })),
  };

  updatedWorkouts = updatedWorkouts.map((w) =>
    w.id === workout.id ? cleanWorkout : w
  );

  return { updatedWorkouts, cleanWorkout };
}
