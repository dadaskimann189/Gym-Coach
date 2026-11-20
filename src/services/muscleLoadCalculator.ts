import { EXERCISE_DATABASE, MUSCLE_METADATA } from '../data/exercises';
import { MuscleId, MuscleLoadStatus, SetEntry, Workout } from '../types';

export function calculateMuscleLoads(
  workouts: Workout[],
  userWeightKg = 75
): Record<MuscleId, MuscleLoadStatus> {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Initial structure for all muscles
  const muscleAccumulators: Record<
    MuscleId,
    {
      rawLoad: number;
      setsThisWeek: number;
      lastTrainedTimestamp: number | null;
      recentExercises: Set<string>;
    }
  > = {
    chest: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    front_delts: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    side_delts: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    rear_delts: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    biceps: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    triceps: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    forearms: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    abs: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    obliques: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    quads: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    hamstrings: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    calves: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    glutes: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    lats: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    traps: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
    lower_back: { rawLoad: 0, setsThisWeek: 0, lastTrainedTimestamp: null, recentExercises: new Set() },
  };

  const exerciseMap = new Map(EXERCISE_DATABASE.map(e => [e.id, e]));

  // Process all workouts and their completed sets
  for (const workout of workouts) {
    for (const exPlan of workout.exercises) {
      const exercise = exerciseMap.get(exPlan.exerciseId);
      if (!exercise) continue;

      const completedSets = exPlan.completedSets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;

      for (const set of completedSets) {
        // Precise set timestamp: use set.timestamp, or completedAt, or fallback to now
        const setTime = set.timestamp || (workout.completedAt ? new Date(workout.completedAt).getTime() : now);
        const setDaysAgo = Math.max(0, (now - setTime) / ONE_DAY_MS);
        // If older than 7 days, recovery is complete
        if (setDaysAgo > 7) continue;

        // Decay factor: Day 0 -> 1.0 (fresh stimulus), recovering over 4-5 days
        const recoveryMultiplier = Math.exp(-0.35 * setDaysAgo);

        // Base stimulus per set:
        let setVolumeStimulus: number;
        if (exercise.machineType === 'cardio') {
          // Duration in minutes (e.g. 15 Min Laufband) provides gentle cardio activation
          const minutes = set.repetitions > 0 ? set.repetitions : 15;
          setVolumeStimulus = Math.min(8, Math.max(3, minutes * 0.3));
        } else if (exercise.id === 'plank' || exercise.id === 'mountain-climbers-home' || exercise.id === 'jump-rope-home') {
          // Time-based core/isometric hold (seconds held)
          const seconds = set.repetitions > 0 ? set.repetitions : 45;
          setVolumeStimulus = 14 * Math.min(1.4, Math.max(0.6, seconds / 45));
        } else {
          // Normalized with typical strength volume
          const normalizedWeight = set.weight > 0 ? Math.min(1.5, Math.max(0.4, set.weight / userWeightKg)) : 0.85;
          const repFactor = Math.min(1.3, Math.max(0.6, set.repetitions / 10));
          setVolumeStimulus = 14 * normalizedWeight * repFactor;
        }

        // Attribute to primary muscles
        for (const target of exercise.primaryMuscles) {
          const muscle = target.muscle;
          const share = target.weightPercent / 100;
          const points = setVolumeStimulus * share * recoveryMultiplier;

          const acc = muscleAccumulators[muscle];
          if (acc) {
            acc.rawLoad += points;
            if (setDaysAgo <= 7) acc.setsThisWeek += 1;
            acc.recentExercises.add(exercise.name);
            if (!acc.lastTrainedTimestamp || setTime > acc.lastTrainedTimestamp) {
              acc.lastTrainedTimestamp = setTime;
            }
          }
        }

        // Attribute to secondary muscles
        for (const target of exercise.secondaryMuscles) {
          const muscle = target.muscle;
          const share = (target.weightPercent / 100) * 0.7;
          const points = setVolumeStimulus * share * recoveryMultiplier;

          const acc = muscleAccumulators[muscle];
          if (acc) {
            acc.rawLoad += points;
            acc.recentExercises.add(exercise.name);
            if (!acc.lastTrainedTimestamp || setTime > acc.lastTrainedTimestamp) {
              acc.lastTrainedTimestamp = setTime;
            }
          }
        }
      }
    }
  }

  // Format into final status record (0 to 100 scale)
  const result = {} as Record<MuscleId, MuscleLoadStatus>;

  for (const muscleKey of Object.keys(muscleAccumulators) as MuscleId[]) {
    const acc = muscleAccumulators[muscleKey];
    const meta = MUSCLE_METADATA[muscleKey];

    // Diminishing returns ceiling capped at 100
    // 1 set ~ 15-22% (light coral red)
    // 3-4 sets ~ 45-65% (clear red)
    // 6+ sets ~ 75-90% (deep dark red)
    const loadValue = Math.min(100, Math.round(100 * (1 - Math.exp(-acc.rawLoad / 38))));

    let statusLevel: MuscleLoadStatus['statusLevel'] = 'recovered';
    let recommendation = 'Diese Muskelgruppe ist erholt und bereit für das nächste Workout.';

    if (loadValue <= 20) {
      statusLevel = 'recovered';
      recommendation = 'Erholt und bereit für neue Reize mit hoher Intensität.';
    } else if (loadValue <= 40) {
      statusLevel = 'light';
      recommendation = 'Leicht belastet. Bereit für Training oder aktives Regenerationstraining.';
    } else if (loadValue <= 60) {
      statusLevel = 'moderate';
      recommendation = 'Moderat beansprucht. Training möglich, aber auf saubere Ausführung achten.';
    } else if (loadValue <= 80) {
      statusLevel = 'heavy';
      recommendation = 'Stark beansprucht. Empfehlung: Mindestens 24–48 Stunden Pause einplanen.';
    } else {
      statusLevel = 'very_heavy';
      recommendation = 'Sehr stark ermüdet. Diese Muskelgruppe sollte heute regenerieren.';
    }

    let daysAgo: number | undefined;
    let lastDateStr: string | undefined;

    if (acc.lastTrainedTimestamp) {
      const diffMs = now - acc.lastTrainedTimestamp;
      daysAgo = Math.floor(diffMs / ONE_DAY_MS);
      const d = new Date(acc.lastTrainedTimestamp);
      const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      lastDateStr = `${dayNames[d.getDay()]}, ${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`;
    }

    result[muscleKey] = {
      muscleId: muscleKey,
      nameDe: meta.nameDe,
      category: meta.category as any,
      load: loadValue,
      totalSetsThisWeek: acc.setsThisWeek,
      lastTrainedDate: lastDateStr,
      lastTrainedDaysAgo: daysAgo,
      recentExercises: Array.from(acc.recentExercises),
      recommendation,
      statusLevel,
    };
  }

  return result;
}

// Calculate physiological red stimulus heat color for load (0 - 100)
// Reize werden immer in Rottönen dargestellt (unabhängig vom App-Akzent):
// 0%: Erholt (#242426 - neutrales Graphitgrau)
// 1–25%: Sanftes, helles Korallen-Zartrot (#FF8A80) - dezent, sanft und keinesfalls dunkel
// 26–50%: Klares Signalrot (#FF453A)
// 51–75%: Kräftiges Rot (#DC2626)
// 76–100%: Tiefes, sattes Dunkelrot (#991B1B - maximale Reizung/Ermüdung)
export function getMuscleColor(load: number): string {
  if (load <= 0) return '#242426';
  if (load <= 25) return '#FF8A80';
  if (load <= 50) return '#FF453A';
  if (load <= 75) return '#DC2626';
  return '#991B1B';
}

// Compact dot rating for home screen: e.g. "Brust ●●●○"
export function getDotRating(load: number): { filled: number; total: number; dots: string } {
  // 4 dots scale
  // 0-20 -> 0 filled
  // 21-40 -> 1 filled
  // 41-60 -> 2 filled
  // 61-80 -> 3 filled
  // 81-100 -> 4 filled
  const filled = load <= 20 ? 0 : load <= 40 ? 1 : load <= 60 ? 2 : load <= 80 ? 3 : 4;
  const total = 4;
  const dots = '●'.repeat(filled) + '○'.repeat(total - filled);
  return { filled, total, dots };
}
