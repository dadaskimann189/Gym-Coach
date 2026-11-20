import { PersonalRecord, UserProfile, WeightEntry, Workout } from '../types';

export const INITIAL_DEMO_USER: UserProfile = {
  id: 'user-demo-1',
  name: 'Alex',
  email: 'alex.demo@pulsecoach.app',
  age: 28,
  gender: 'male',
  heightCm: 182,
  currentWeightKg: 74.7,
  targetWeightKg: 78.0,
  fitnessGoal: 'muscle_gain',
  trainingDays: [2, 4, 6], // Di, Do, Sa
  homeTrainingDays: [4], // Donnerstag als Home-Workout voreingestellt
  preferredGymDurationMinutes: 60, // Standard-Dauer im Gym
  profileImage: '',
  unit: 'kg',
  notificationsEnabled: true,
  isOnboarded: true,
  isDemo: true,
};

// Generate realistic date strings
const now = new Date();
const todayStr = now.toISOString().split('T')[0];
const oneDayMs = 86400000;

function daysAgo(n: number): string {
  return new Date(now.getTime() - n * oneDayMs).toISOString().split('T')[0];
}

export const INITIAL_WEIGHT_HISTORY: WeightEntry[] = [
  { id: 'w-1', date: daysAgo(28), weightKg: 75.6, note: 'Startpunkt' },
  { id: 'w-2', date: daysAgo(21), weightKg: 75.3 },
  { id: 'w-3', date: daysAgo(14), weightKg: 75.2 },
  { id: 'w-4', date: daysAgo(7), weightKg: 75.1, note: 'Letzte Woche' },
  { id: 'w-5', date: daysAgo(3), weightKg: 74.9 },
  { id: 'w-6', date: daysAgo(1), weightKg: 74.8 },
  { id: 'w-7', date: todayStr, weightKg: 74.7, note: 'Morgens nüchtern' },
];

export const INITIAL_WORKOUTS: Workout[] = [
  // Completed workout from 2 days ago: Beine & Rumpf
  {
    id: 'workout-legs-completed',
    userId: 'user-demo-1',
    date: daysAgo(2),
    dayOfWeek: 2,
    title: 'Beine & Rumpf',
    workoutType: 'legs',
    targetDurationMinutes: 45,
    actualDurationMinutes: 48,
    completed: true,
    completedAt: new Date(now.getTime() - 2 * oneDayMs).toISOString(),
    exercises: [
      {
        exerciseId: 'squats',
        exerciseName: 'Kniebeugen',
        targetSets: 3,
        targetReps: '8–10',
        completedSets: [
          { id: 's-sq-1', exerciseId: 'squats', setNumber: 1, weight: 80, repetitions: 10, completed: true, timestamp: now.getTime() - 2 * oneDayMs },
          { id: 's-sq-2', exerciseId: 'squats', setNumber: 2, weight: 85, repetitions: 8, completed: true, timestamp: now.getTime() - 2 * oneDayMs + 120000 },
          { id: 's-sq-3', exerciseId: 'squats', setNumber: 3, weight: 85, repetitions: 8, completed: true, timestamp: now.getTime() - 2 * oneDayMs + 240000 },
        ],
      },
      {
        exerciseId: 'leg-press',
        exerciseName: 'Beinpresse',
        targetSets: 3,
        targetReps: '10–12',
        completedSets: [
          { id: 's-lp-1', exerciseId: 'leg-press', setNumber: 1, weight: 140, repetitions: 12, completed: true, timestamp: now.getTime() - 2 * oneDayMs + 360000 },
          { id: 's-lp-2', exerciseId: 'leg-press', setNumber: 2, weight: 150, repetitions: 10, completed: true, timestamp: now.getTime() - 2 * oneDayMs + 480000 },
        ],
      },
      {
        exerciseId: 'leg-curl',
        exerciseName: 'Beinbeuger',
        targetSets: 3,
        targetReps: '10–12',
        completedSets: [
          { id: 's-lc-1', exerciseId: 'leg-curl', setNumber: 1, weight: 45, repetitions: 12, completed: true, timestamp: now.getTime() - 2 * oneDayMs + 600000 },
          { id: 's-lc-2', exerciseId: 'leg-curl', setNumber: 2, weight: 50, repetitions: 10, completed: true, timestamp: now.getTime() - 2 * oneDayMs + 720000 },
        ],
      },
      {
        exerciseId: 'calf-raises',
        exerciseName: 'Wadenheben',
        targetSets: 3,
        targetReps: '12–15',
        completedSets: [
          { id: 's-cr-1', exerciseId: 'calf-raises', setNumber: 1, weight: 60, repetitions: 15, completed: true, timestamp: now.getTime() - 2 * oneDayMs + 840000 },
          { id: 's-cr-2', exerciseId: 'calf-raises', setNumber: 2, weight: 65, repetitions: 14, completed: true, timestamp: now.getTime() - 2 * oneDayMs + 960000 },
        ],
      },
    ],
  },

  // Today's scheduled or active workout: Oberkörper (Matching prompt!)
  {
    id: 'workout-today-upper',
    userId: 'user-demo-1',
    date: todayStr,
    dayOfWeek: 4,
    title: 'Oberkörper',
    workoutType: 'upper',
    targetDurationMinutes: 45,
    completed: false,
    exercises: [
      {
        exerciseId: 'chest-press-machine',
        exerciseName: 'Brustpresse',
        targetSets: 3,
        targetReps: '8–12',
        completedSets: [],
      },
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bankdrücken',
        targetSets: 3,
        targetReps: '8–12',
        completedSets: [],
      },
      {
        exerciseId: 'overhead-press',
        exerciseName: 'Schulterpresse',
        targetSets: 3,
        targetReps: '8–10',
        completedSets: [],
      },
      {
        exerciseId: 'lateral-raises',
        exerciseName: 'Seitheben',
        targetSets: 3,
        targetReps: '12–15',
        completedSets: [],
      },
      {
        exerciseId: 'triceps-pushdown',
        exerciseName: 'Trizepsdrücken',
        targetSets: 3,
        targetReps: '10–12',
        completedSets: [],
      },
    ],
  },

  // Upcoming Saturday workout: Rücken & Arme
  {
    id: 'workout-sat-back',
    userId: 'user-demo-1',
    date: daysAgo(-2), // 2 days in the future
    dayOfWeek: 6,
    title: 'Rücken & Arme',
    workoutType: 'pull',
    targetDurationMinutes: 45,
    completed: false,
    exercises: [
      {
        exerciseId: 'lat-pulldown',
        exerciseName: 'Latzug',
        targetSets: 3,
        targetReps: '8–12',
        completedSets: [],
      },
      {
        exerciseId: 'seated-cable-row',
        exerciseName: 'Kabelrudern',
        targetSets: 3,
        targetReps: '8–12',
        completedSets: [],
      },
      {
        exerciseId: 'reverse-fly',
        exerciseName: 'Reverse Fly',
        targetSets: 3,
        targetReps: '12–15',
        completedSets: [],
      },
      {
        exerciseId: 'biceps-curls',
        exerciseName: 'Bizeps-Curls',
        targetSets: 3,
        targetReps: '10–12',
        completedSets: [],
      },
    ],
  },
];

export const INITIAL_PERSONAL_RECORDS: PersonalRecord[] = [];
