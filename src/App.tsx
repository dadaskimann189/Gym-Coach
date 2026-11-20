/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  DayOfWeek,
  MuscleId,
  PersonalRecord,
  UserProfile,
  WeightEntry,
  Workout,
} from './types';
import { StorageService } from './services/storage';
import { calculateMuscleLoads } from './services/muscleLoadCalculator';
import {
  convertWorkoutLocation,
  generateWorkoutsForTrainingDays,
} from './services/trainingPlan';
import { normalizeAndArchiveWorkouts, resetWorkoutToFreshSession } from './services/workoutSessionManager';
import { INITIAL_WORKOUTS, INITIAL_WEIGHT_HISTORY, INITIAL_PERSONAL_RECORDS } from './data/mockData';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { LoginScreen } from './components/auth/LoginScreen';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { HomeScreen } from './components/home/HomeScreen';
import { TrainingScreen } from './components/training/TrainingScreen';
import { BodyScreen } from './components/body/BodyScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { ProgressView } from './components/progress/ProgressView';
import { WeightLogModal } from './components/weight/WeightLogModal';
import { ThemeProvider } from './context/ThemeContext';
import { DevUrlWarningBanner } from './components/common/DevUrlWarningBanner';
import { PWAInstallModal } from './components/common/PWAInstallModal';

export default function App() {
  // 1. STATE PERSISTENCE INITIALIZATION
  const [user, setUser] = useState<UserProfile | null>(() => StorageService.getUser());
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    const raw = StorageService.getWorkouts();
    const { workouts: normalized, archivedCount } = normalizeAndArchiveWorkouts(raw);
    if (archivedCount > 0) {
      StorageService.saveWorkouts(normalized);
    }
    return normalized;
  });
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(() =>
    StorageService.getWeightHistory()
  );
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>(() => {
    const prs = StorageService.getPersonalRecords();
    const u = StorageService.getUser();
    if (u && !u.isDemo) {
      return (prs || []).filter(
        (r) =>
          !(
            (r.exerciseId === 'bench-press' && r.weight === 65) ||
            (r.exerciseId === 'squats' && r.weight === 85) ||
            (r.exerciseId === 'leg-press' && r.weight === 150) ||
            (r.exerciseId === 'lat-pulldown' && r.weight === 60)
          )
      );
    }
    return prs;
  });

  const [currentTab, setCurrentTab] = useState<
    'home' | 'training' | 'body' | 'profile' | 'progress'
  >('home');
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Background account sync on load
  useEffect(() => {
    const activeEmail = StorageService.getActiveEmail();
    if (activeEmail) {
      StorageService.loadAccount(activeEmail).then((acc) => {
        if (acc && acc.user) {
          let loadedWorkouts = acc.workouts || [];
          let loadedRecords = acc.personalRecords || [];
          let loadedWeights = acc.weightHistory || [];

          if (loadedWorkouts.length === 0) {
            loadedWorkouts = generateWorkoutsForTrainingDays(
              acc.user.id,
              acc.user.trainingDays || [2, 4, 6],
              acc.user.homeTrainingDays || [4],
              INITIAL_WORKOUTS,
              acc.user.preferredGymDurationMinutes || 60
            );
          } else {
            // Repair any legacy workouts: ensure Laufband is 1 set and Plank is time-based
            loadedWorkouts = loadedWorkouts.map((w) => ({
              ...w,
              exercises: w.exercises.map((ex) => {
                if (ex.exerciseId === 'cardio-treadmill') {
                  return { ...ex, targetSets: 1, targetReps: '15 Min' };
                }
                if (ex.exerciseId === 'plank' && (!ex.targetReps || ex.targetReps.includes('Wdh') || ex.targetReps === '45–60s')) {
                  return { ...ex, targetReps: '45–60 Sek' };
                }
                return ex;
              }),
            }));
          }

          // Normalize and archive past sessions so new days start fresh (0 sets)
          const { workouts: normalizedWorkouts } = normalizeAndArchiveWorkouts(loadedWorkouts);
          loadedWorkouts = normalizedWorkouts;

          if (!acc.user.isDemo) {
            // Real user: clean any remaining demo seeded PRs
            loadedRecords = (acc.personalRecords || []).filter(
              (r) =>
                !(
                  (r.exerciseId === 'bench-press' && r.weight === 65) ||
                  (r.exerciseId === 'squats' && r.weight === 85) ||
                  (r.exerciseId === 'leg-press' && r.weight === 150) ||
                  (r.exerciseId === 'lat-pulldown' && r.weight === 60)
                )
            );
          } else if (loadedRecords.length === 0) {
            loadedRecords = INITIAL_PERSONAL_RECORDS;
          }
          if (loadedWeights.length === 0) {
            loadedWeights = [
              ...INITIAL_WEIGHT_HISTORY.filter((w) => w.date !== new Date().toISOString().split('T')[0]),
              {
                id: `w-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                weightKg: acc.user.currentWeightKg || 81.5,
                note: 'Aktuelles Gewicht',
              },
            ];
          }

          setUser(acc.user);
          setWorkouts(loadedWorkouts);
          setWeightHistory(loadedWeights);
          setPersonalRecords(loadedRecords);

          StorageService.saveFullAccount(activeEmail, {
            user: acc.user,
            workouts: loadedWorkouts,
            weightHistory: loadedWeights,
            personalRecords: loadedRecords,
            updatedAt: new Date().toISOString(),
          });
        }
      });
    }
  }, []);

  // 2. MUSCLE LOAD CALCULATION ENGINE
  // Automatically recalculates whenever workouts change or sets are logged
  const muscleStatus = useMemo(() => {
    return calculateMuscleLoads(workouts, user?.currentWeightKg || 75);
  }, [workouts, user?.currentWeightKg]);

  // Active non-archived workouts for weekly schedule & active training
  const activeWorkouts = useMemo(() => {
    return workouts.filter((w) => !w.id.startsWith('archive-') && !w.id.startsWith('workout-archive-'));
  }, [workouts]);

  // 3. TODAY'S WORKOUT & REGENERATION RESOLVER
  const todayDay = new Date().getDay() as DayOfWeek;
  const isTodayTrainingDay = Boolean(user?.trainingDays?.includes(todayDay));

  // Today's scheduled workout: strictly if today is an active training day
  const todayWorkout = useMemo(() => {
    if (!isTodayTrainingDay) return null;
    return activeWorkouts.find((w) => w.dayOfWeek === todayDay) || null;
  }, [activeWorkouts, isTodayTrainingDay, todayDay]);

  // Next upcoming scheduled workout in the week
  const nextUpcomingWorkout = useMemo(() => {
    if (!user?.trainingDays || user.trainingDays.length === 0) return activeWorkouts[0] || null;

    let minDays = 8;
    let nextDay: DayOfWeek = user.trainingDays[0];

    for (const d of user.trainingDays) {
      let diff = d - todayDay;
      if (diff <= 0) diff += 7;
      if (diff < minDays) {
        minDays = diff;
        nextDay = d;
      }
    }

    return activeWorkouts.find((w) => w.dayOfWeek === nextDay) || activeWorkouts[0] || null;
  }, [activeWorkouts, user?.trainingDays, todayDay]);

  // Dedicated workout selected for training session
  const [selectedTrainingWorkoutId, setSelectedTrainingWorkoutId] = useState<string | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);

  // Active training workout dynamically resolved from the latest workouts state
  const currentTrainingWorkout = useMemo(() => {
    if (selectedTrainingWorkoutId) {
      const found = activeWorkouts.find((w) => w.id === selectedTrainingWorkoutId);
      if (found) return found;
    }
    return todayWorkout || nextUpcomingWorkout || activeWorkouts[0];
  }, [selectedTrainingWorkoutId, activeWorkouts, todayWorkout, nextUpcomingWorkout]);

  const handleResetWorkout = (targetWorkout: Workout): Workout => {
    const { updatedWorkouts, cleanWorkout } = resetWorkoutToFreshSession(targetWorkout, workouts);
    setWorkouts(updatedWorkouts);
    StorageService.saveWorkouts(updatedWorkouts);
    setSelectedTrainingWorkoutId(cleanWorkout.id);
    return cleanWorkout;
  };

  // Sync state changes to storage
  const handleSaveWorkout = (updatedWorkout: Workout) => {
    // Keep active workout ID
    setSelectedTrainingWorkoutId(updatedWorkout.id);

    const exists = workouts.some((w) => w.id === updatedWorkout.id);
    const newWorkouts = exists
      ? workouts.map((w) => (w.id === updatedWorkout.id ? updatedWorkout : w))
      : [...workouts, updatedWorkout];
    setWorkouts(newWorkouts);
    StorageService.saveWorkouts(newWorkouts);

    // Also check for personal records
    const newPRs = [...personalRecords];
    let prUpdated = false;

    for (const ex of updatedWorkout.exercises) {
      for (const set of ex.completedSets) {
        if (!set.completed) continue;
        const existing = newPRs.find((p) => p.exerciseId === set.exerciseId);
        if (!existing || set.weight > existing.weight) {
          if (existing) {
            existing.weight = set.weight;
            existing.reps = set.repetitions;
            existing.date = new Date().toISOString().split('T')[0];
          } else {
            newPRs.push({
              exerciseId: set.exerciseId,
              exerciseName: ex.exerciseName,
              weight: set.weight,
              reps: set.repetitions,
              date: new Date().toISOString().split('T')[0],
            });
          }
          prUpdated = true;
        }
      }
    }

    if (prUpdated) {
      setPersonalRecords(newPRs);
      StorageService.savePersonalRecords(newPRs);
    }
  };

  const handleSaveWeightEntry = (entry: WeightEntry) => {
    const newHistory = [...weightHistory, entry];
    setWeightHistory(newHistory);
    StorageService.saveWeightHistory(newHistory);

    // Also update current weight on user
    if (user) {
      const updatedUser = { ...user, currentWeightKg: entry.weightKg };
      setUser(updatedUser);
      StorageService.saveUser(updatedUser);
    }
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    // If training days, home training days, or preferred gym duration changed, recompute/adjust the workout schedule
    const daysChanged =
      JSON.stringify(user?.trainingDays?.slice().sort()) !==
      JSON.stringify(updatedUser.trainingDays?.slice().sort()) ||
      JSON.stringify(user?.homeTrainingDays?.slice().sort()) !==
      JSON.stringify(updatedUser.homeTrainingDays?.slice().sort());

    const durationChanged =
      user?.preferredGymDurationMinutes !== updatedUser.preferredGymDurationMinutes;

    setUser(updatedUser);
    StorageService.saveUser(updatedUser);

    if (daysChanged || durationChanged) {
      const newPlan = generateWorkoutsForTrainingDays(
        updatedUser.id,
        updatedUser.trainingDays,
        updatedUser.homeTrainingDays || [],
        workouts,
        updatedUser.preferredGymDurationMinutes || 45
      );
      setWorkouts(newPlan);
      StorageService.saveWorkouts(newPlan);
    }
  };

  const handleResetPlan = () => {
    if (!user) return;
    const newPlan = generateWorkoutsForTrainingDays(
      user.id,
      user.trainingDays,
      user.homeTrainingDays || [],
      [],
      user.preferredGymDurationMinutes || 45
    );
    setWorkouts(newPlan);
    StorageService.saveWorkouts(newPlan);
    alert('Trainingsplan wurde anhand deiner Trainingstage, Orte und Gym-Dauer neu generiert.');
  };

  const handleToggleTodayLocation = (targetLocation: 'gym' | 'home', setPermanentForDay = false) => {
    if (!todayWorkout) return;
    const updated = convertWorkoutLocation(todayWorkout, targetLocation);
    handleSaveWorkout(updated);

    if (setPermanentForDay && user) {
      const todayDay = todayWorkout.dayOfWeek;
      const currentHomeDays = user.homeTrainingDays || [];
      let newHomeDays: DayOfWeek[];

      if (targetLocation === 'home') {
        newHomeDays = currentHomeDays.includes(todayDay)
          ? currentHomeDays
          : [...currentHomeDays, todayDay];
      } else {
        newHomeDays = currentHomeDays.filter((d) => d !== todayDay);
      }

      handleUpdateUser({
        ...user,
        homeTrainingDays: newHomeDays,
      });
    }
  };

  const handleToggleDayPermanentLocation = (day: DayOfWeek, location: 'gym' | 'home') => {
    if (!user) return;
    const currentHomeDays = user.homeTrainingDays || [];
    let newHomeDays: DayOfWeek[];

    if (location === 'home') {
      newHomeDays = currentHomeDays.includes(day)
        ? currentHomeDays
        : [...currentHomeDays, day];
    } else {
      newHomeDays = currentHomeDays.filter((d) => d !== day);
    }

    handleUpdateUser({
      ...user,
      homeTrainingDays: newHomeDays,
    });
  };

  const handleSignOut = () => {
    StorageService.clearSession();
    setUser(null);
    setWorkouts([]);
    setWeightHistory([]);
    setPersonalRecords([]);
    setCurrentTab('home');
  };

  const handleLoginSuccess = async (loginData: { name: string; email: string }) => {
    const email = loginData.email.toLowerCase().trim();
    setIsAuthLoading(true);
    StorageService.setActiveEmail(email);

    try {
      const existingAccount = await StorageService.loadAccount(email);
      if (existingAccount && existingAccount.user && existingAccount.user.isOnboarded) {
        // User already has an onboarded profile! Load all data without going through onboarding!
        let loadedWorkouts = existingAccount.workouts || [];
        let loadedRecords = existingAccount.personalRecords || [];
        let loadedWeights = existingAccount.weightHistory || [];

        if (loadedWorkouts.length === 0) {
          loadedWorkouts = generateWorkoutsForTrainingDays(
            existingAccount.user.id,
            existingAccount.user.trainingDays || [2, 4, 6],
            existingAccount.user.homeTrainingDays || [4],
            INITIAL_WORKOUTS,
            existingAccount.user.preferredGymDurationMinutes || 60
          );
        } else {
          // Normalize Laufband to 1 set and Plank to time-based
          loadedWorkouts = loadedWorkouts.map((w) => ({
            ...w,
            exercises: w.exercises.map((ex) => {
              if (ex.exerciseId === 'cardio-treadmill') {
                return { ...ex, targetSets: 1, targetReps: '15 Min' };
              }
              if (ex.exerciseId === 'plank' && (!ex.targetReps || ex.targetReps.includes('Wdh') || ex.targetReps === '45–60s')) {
                return { ...ex, targetReps: '45–60 Sek' };
              }
              return ex;
            }),
          }));
        }
        if (!existingAccount.user.isDemo) {
          loadedRecords = (existingAccount.personalRecords || []).filter(
            (r) =>
              !(
                (r.exerciseId === 'bench-press' && r.weight === 65) ||
                (r.exerciseId === 'squats' && r.weight === 85) ||
                (r.exerciseId === 'leg-press' && r.weight === 150) ||
                (r.exerciseId === 'lat-pulldown' && r.weight === 60)
              )
          );
        } else if (loadedRecords.length === 0) {
          loadedRecords = INITIAL_PERSONAL_RECORDS;
        }
        if (loadedWeights.length === 0) {
          loadedWeights = [
            ...INITIAL_WEIGHT_HISTORY.filter((w) => w.date !== new Date().toISOString().split('T')[0]),
            {
              id: `w-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              weightKg: existingAccount.user.currentWeightKg || 81.5,
              note: 'Aktuelles Gewicht',
            },
          ];
        }

        setUser(existingAccount.user);
        setWorkouts(loadedWorkouts);
        setWeightHistory(loadedWeights);
        setPersonalRecords(loadedRecords);

        // Immediately persist the enriched account
        StorageService.saveFullAccount(email, {
          user: existingAccount.user,
          workouts: loadedWorkouts,
          weightHistory: loadedWeights,
          personalRecords: loadedRecords,
          updatedAt: new Date().toISOString(),
        });

        setCurrentTab('home');
        setIsAuthLoading(false);
        return;
      }
    } catch (e) {
      console.error('Error loading account on login:', e);
    }

    // New user or incomplete onboarding
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: loginData.name || 'Athlet',
      email: email,
      age: 26,
      gender: 'male',
      heightCm: 180,
      currentWeightKg: 75.0,
      targetWeightKg: 78.0,
      fitnessGoal: 'muscle_gain',
      trainingDays: [2, 4, 6],
      preferredGymDurationMinutes: 60,
      unit: 'kg',
      notificationsEnabled: true,
      isOnboarded: false, // will proceed to onboarding once
      isDemo: false,
    };
    setUser(newUser);
    StorageService.saveUser(newUser);
    setIsAuthLoading(false);
  };

  const handleFinishOnboarding = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      ...data,
      isOnboarded: true,
      isDemo: false,
    } as UserProfile;

    // Generate custom training plan
    const generatedWorkouts = generateWorkoutsForTrainingDays(
      updatedUser.id,
      updatedUser.trainingDays,
      updatedUser.homeTrainingDays || [],
      [],
      updatedUser.preferredGymDurationMinutes || 60
    );

    // Initial weight log
    const initialWeightEntry: WeightEntry = {
      id: `w-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      weightKg: updatedUser.currentWeightKg,
      note: 'Startgewicht Onboarding',
    };
    const newHistory = [initialWeightEntry];

    setUser(updatedUser);
    setWorkouts(generatedWorkouts);
    setWeightHistory(newHistory);
    setPersonalRecords([]);

    // Save full account immediately to localStorage and server
    StorageService.saveFullAccount(updatedUser.email, {
      user: updatedUser,
      workouts: generatedWorkouts,
      weightHistory: newHistory,
      personalRecords: [],
      updatedAt: new Date().toISOString(),
    });

    setCurrentTab('home');
  };

  // 4. SCREEN RENDERING ROUTING
  // Screen A: Login (Direct login screen, no demo account auto-load)
  if (!user) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        isLoading={isAuthLoading}
      />
    );
  }

  // Screen B: Onboarding
  if (!user.isOnboarded) {
    return (
      <OnboardingFlow
        initialName={user.name}
        initialEmail={user.email}
        onFinishOnboarding={handleFinishOnboarding}
      />
    );
  }

  // Screen C: Main Application (Home, Training, Körper, Profil, Fortschritt)
  return (
    <ThemeProvider
      initialThemeMode={user.themeMode || 'dark'}
      initialAccentColor={user.accentColor || 'blue'}
      onThemeChange={(themeMode, accentColor) => {
        handleUpdateUser({ ...user, themeMode, accentColor });
      }}
    >
      <div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-x-hidden w-full">
      {/* Dev URL Warning / PWA Install Guide Banner */}
      <DevUrlWarningBanner onOpenInstallModal={() => setIsPWAInstallModalOpen(true)} />

      {/* iOS Status Bar Safe Area Spacer */}
      <div
        className="w-full shrink-0 select-none pointer-events-none"
        style={{
          height: 'env(safe-area-inset-top, 0px)',
        }}
        aria-hidden="true"
      />

      {/* 3-Zone Desktop & Tablet Top Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        user={user}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 pb-28 overflow-x-hidden app-main-content">
        {currentTab === 'home' && (
          <HomeScreen
            user={user}
            todayWorkout={todayWorkout}
            workouts={workouts}
            isTodayTrainingDay={isTodayTrainingDay}
            nextUpcomingWorkout={nextUpcomingWorkout}
            muscleStatus={muscleStatus}
            weightHistory={weightHistory}
            onStartWorkout={(workoutToStart?: Workout) => {
              if (workoutToStart) {
                setSelectedTrainingWorkoutId(workoutToStart.id);
              } else if (todayWorkout) {
                setSelectedTrainingWorkoutId(todayWorkout.id);
              } else if (nextUpcomingWorkout) {
                setSelectedTrainingWorkoutId(nextUpcomingWorkout.id);
              }
              setCurrentTab('training');
            }}
            onNavigateToBody={() => setCurrentTab('body')}
            onNavigateToProgress={() => setCurrentTab('progress')}
            onNavigateToProfile={() => setCurrentTab('profile')}
            onOpenWeightModal={() => setIsWeightModalOpen(true)}
            onToggleWorkoutLocation={handleToggleTodayLocation}
            onToggleDayPermanentLocation={handleToggleDayPermanentLocation}
          />
        )}

        {/* Keep TrainingScreen mounted so state, active exercise, inputs & rest timer are NEVER lost when switching tabs */}
        <div className={currentTab === 'training' ? 'block' : 'hidden'}>
          {currentTrainingWorkout && (
            <TrainingScreen
              currentWorkout={currentTrainingWorkout}
              onSaveWorkout={handleSaveWorkout}
              onResetWorkout={handleResetWorkout}
              onNavigateToBody={() => setCurrentTab('body')}
              user={user}
              onUpdateUser={handleUpdateUser}
              selectedExIndex={activeExerciseIndex}
              onSelectExerciseIndex={(idx) => setActiveExerciseIndex(idx)}
            />
          )}
        </div>

        {currentTab === 'body' && (
          <BodyScreen
            user={user}
            muscleStatus={muscleStatus}
            workouts={workouts}
            onNavigateToWorkout={() => setCurrentTab('training')}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressView
            weightHistory={weightHistory}
            workouts={workouts}
            personalRecords={personalRecords}
            muscleStatus={muscleStatus}
            onLogWeightClick={() => setIsWeightModalOpen(true)}
            onNavigateToTraining={() => setCurrentTab('training')}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileScreen
            user={user}
            onUpdateUser={handleUpdateUser}
            onResetPlan={handleResetPlan}
            onSignOut={handleSignOut}
            onNavigateToProgress={() => setCurrentTab('progress')}
          />
        )}
      </main>

      {/* Mobile Floating iOS Capsule Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        user={user}
      />

      {/* Body Weight Logging Dialog */}
      {isWeightModalOpen && (
        <WeightLogModal
          currentWeight={user.currentWeightKg}
          onSaveWeight={handleSaveWeightEntry}
          onClose={() => setIsWeightModalOpen(false)}
        />
      )}

      {/* PWA Home Screen Install Guide Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
      />
    </div>
    </ThemeProvider>
  );
}
