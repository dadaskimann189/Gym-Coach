import React, { useState } from 'react';
import { EXERCISE_DATABASE } from '../../data/exercises';
import {
  DayOfWeek,
  Exercise,
  ExerciseCoachMemory,
  ExerciseFeedbackRating,
  SetEntry,
  UserProfile,
  Workout,
  WorkoutExercisePlan,
} from '../../types';
import {
  adjustWorkoutForDuration,
  convertWorkoutLocation,
  getDayNameDe,
} from '../../services/trainingPlan';
import { MachineInfoModal } from './MachineInfoModal';
import { getRecommendedWeightAndReps, isExerciseTimed } from '../../services/exerciseWeightRecommender';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Dumbbell,
  HelpCircle,
  Home,
  Info,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TrainingScreenProps {
  currentWorkout: Workout;
  onSaveWorkout: (workout: Workout) => void;
  onResetWorkout?: (workout: Workout) => Workout;
  onNavigateToBody: () => void;
  user?: UserProfile | null;
  onUpdateUser?: (updated: UserProfile) => void;
  selectedExIndex?: number;
  onSelectExerciseIndex?: (index: number) => void;
}

export const TrainingScreen: React.FC<TrainingScreenProps> = ({
  currentWorkout,
  onSaveWorkout,
  onResetWorkout,
  onNavigateToBody,
  user,
  onUpdateUser,
  selectedExIndex: propSelectedExIndex,
  onSelectExerciseIndex,
}) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  const [workout, setWorkout] = useState<Workout>(currentWorkout);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Initialize selected exercise:
  // 1. From parent prop if valid
  // 2. From localStorage for this workout
  // 3. From first incomplete exercise in workout
  // 4. Default to 0
  const resolveInitialExerciseIndex = () => {
    if (
      propSelectedExIndex !== undefined &&
      propSelectedExIndex >= 0 &&
      propSelectedExIndex < currentWorkout.exercises.length
    ) {
      return propSelectedExIndex;
    }
    try {
      const saved = localStorage.getItem(`pulse_last_ex_${user?.id || 'guest'}_${currentWorkout.id}`);
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 0 && val < currentWorkout.exercises.length) {
          return val;
        }
      }
    } catch (e) {}

    const firstIncomplete = currentWorkout.exercises.findIndex(
      (e) => e.completedSets.length < e.targetSets
    );
    return firstIncomplete >= 0 ? firstIncomplete : 0;
  };

  const [selectedExIndex, setSelectedExIndex] = useState<number>(resolveInitialExerciseIndex);

  // Keep selected index in sync if parent updates it
  React.useEffect(() => {
    if (
      propSelectedExIndex !== undefined &&
      propSelectedExIndex >= 0 &&
      propSelectedExIndex < workout.exercises.length &&
      propSelectedExIndex !== selectedExIndex
    ) {
      setSelectedExIndex(propSelectedExIndex);
    }
  }, [propSelectedExIndex, workout.exercises.length]);

  // Time Customization State
  const [selectedDuration, setSelectedDuration] = useState<number>(
    currentWorkout.targetDurationMinutes || 45
  );
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // Machine Info & Swap Modal State
  const [inspectingExercise, setInspectingExercise] = useState<Exercise | null>(null);

  // Active set input states
  const currentPlan = workout.exercises[selectedExIndex] || workout.exercises[0];
  const nextSetNumber = (currentPlan?.completedSets.length || 0) + 1;

  const currentExerciseData = EXERCISE_DATABASE.find(
    (e) => e.id === currentPlan?.exerciseId
  );
  const isCardio = currentExerciseData?.machineType === 'cardio' || currentPlan?.exerciseId === 'cardio-treadmill';
  const isTimed = isExerciseTimed(currentPlan?.exerciseId || '') || currentExerciseData?.id === 'plank';
  const isBodyweight = currentExerciseData?.machineType === 'bodyweight';

  // Compute profile tailored default if no previous set
  const initialRecommended = currentExerciseData
    ? getRecommendedWeightAndReps(currentExerciseData, user)
    : { weight: 25, repetitions: 10, isCardio: false, isBodyweight: false, isTimed: false, unitLabel: 'kg' };

  // Previous completed set or defaults
  const lastSet = currentPlan?.completedSets[currentPlan.completedSets.length - 1];
  const [inputWeight, setInputWeight] = useState<number>(() => lastSet ? lastSet.weight : initialRecommended.weight);
  const [inputReps, setInputReps] = useState<number>(() => lastSet ? lastSet.repetitions : initialRecommended.repetitions);

  // Micro-feedback state
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [showWorkoutCompletedModal, setShowWorkoutCompletedModal] = useState<boolean>(false);

  // Keep workout synced if parent updates
  React.useEffect(() => {
    setWorkout(currentWorkout);
    setSelectedDuration(currentWorkout.targetDurationMinutes || 45);
  }, [currentWorkout]);

  // Sync inputs whenever selected exercise changes
  React.useEffect(() => {
    if (!currentPlan) return;
    const prev = currentPlan.completedSets[currentPlan.completedSets.length - 1];
    if (prev) {
      setInputWeight(prev.weight);
      setInputReps(prev.repetitions);
    } else if (currentExerciseData) {
      const rec = getRecommendedWeightAndReps(currentExerciseData, user);
      setInputWeight(rec.weight);
      setInputReps(rec.repetitions);
    }
  }, [selectedExIndex, currentPlan?.exerciseId, user?.currentWeightKg, user?.gender]);

  // Timer interval for set rest
  React.useEffect(() => {
    let timer: any;
    if (isResting && restSeconds !== null && restSeconds > 0) {
      timer = setInterval(() => {
        setRestSeconds((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
      }, 1000);
    } else if (restSeconds === 0) {
      setIsResting(false);
    }
    return () => clearInterval(timer);
  }, [isResting, restSeconds]);

  // Update inputs when exercise changes manually
  const handleSelectExercise = (idx: number) => {
    setSelectedExIndex(idx);
    if (onSelectExerciseIndex) {
      onSelectExerciseIndex(idx);
    }
    try {
      localStorage.setItem(`pulse_last_ex_${user?.id || 'guest'}_${workout.id}`, String(idx));
    } catch (e) {}

    const plan = workout.exercises[idx];
    if (!plan) return;
    const prev = plan.completedSets[plan.completedSets.length - 1];
    const exMeta = EXERCISE_DATABASE.find((e) => e.id === plan.exerciseId);

    if (prev) {
      setInputWeight(prev.weight);
      setInputReps(prev.repetitions);
    } else if (exMeta) {
      const rec = getRecommendedWeightAndReps(exMeta, user);
      setInputWeight(rec.weight);
      setInputReps(rec.repetitions);
    }
    setFeedbackMessage(null);
  };

  // Location toggle handler: converts workout between Gym and Home
  const handleToggleLocation = (targetLoc: 'gym' | 'home') => {
    if (workout.location === targetLoc) return;
    const converted = convertWorkoutLocation(workout, targetLoc);
    setWorkout(converted);
    onSaveWorkout(converted);

    const safeIdx = Math.min(selectedExIndex, converted.exercises.length - 1);
    const newIdx = Math.max(0, safeIdx);
    setSelectedExIndex(newIdx);
    if (onSelectExerciseIndex) {
      onSelectExerciseIndex(newIdx);
    }
    try {
      localStorage.setItem(`pulse_last_ex_${user?.id || 'guest'}_${converted.id}`, String(newIdx));
    } catch (e) {}

    const currentPlanAfter = converted.exercises[newIdx];
    const currentMetaAfter = EXERCISE_DATABASE.find((e) => e.id === currentPlanAfter?.exerciseId);
    if (currentMetaAfter) {
      const rec = getRecommendedWeightAndReps(currentMetaAfter, user);
      setInputWeight(rec.weight);
      setInputReps(rec.repetitions);
    }

    setFeedbackMessage(
      targetLoc === 'home'
        ? 'Auf Home-Workout umgestellt'
        : 'Auf Gym-Workout umgestellt'
    );
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Time customization handler (30, 45, 60, 90 mins)
  const handleSelectDuration = (targetMinutes: number) => {
    setSelectedDuration(targetMinutes);
    setShowTimePicker(false);

    const adapted = adjustWorkoutForDuration(workout, targetMinutes);
    setWorkout(adapted);
    onSaveWorkout(adapted);

    const safeIdx = Math.min(selectedExIndex, adapted.exercises.length - 1);
    const newIdx = Math.max(0, safeIdx);
    setSelectedExIndex(newIdx);
    if (onSelectExerciseIndex) {
      onSelectExerciseIndex(newIdx);
    }
    try {
      localStorage.setItem(`pulse_last_ex_${user?.id || 'guest'}_${adapted.id}`, String(newIdx));
    } catch (e) {}

    if (user && onUpdateUser && workout.location !== 'home') {
      onUpdateUser({
        ...user,
        preferredGymDurationMinutes: targetMinutes,
      });
    }

    setFeedbackMessage(`Workout-Dauer auf ca. ${targetMinutes} Min angepasst`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Exercise Swap Replacement Handler
  const handleSwapExercise = (newExercise: Exercise) => {
    const updatedExercises = [...workout.exercises];
    const currentP = updatedExercises[selectedExIndex];
    if (!currentP) return;

    updatedExercises[selectedExIndex] = {
      ...currentP,
      exerciseId: newExercise.id,
      exerciseName: newExercise.name,
    };

    const updatedWorkout: Workout = {
      ...workout,
      exercises: updatedExercises,
    };

    setWorkout(updatedWorkout);
    onSaveWorkout(updatedWorkout);
    setInspectingExercise(null);

    const rec = getRecommendedWeightAndReps(newExercise, user);
    setInputWeight(rec.weight);
    setInputReps(rec.repetitions);

    setFeedbackMessage(`${newExercise.name} als Ersatz aktiviert`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Save Set Entry Handler
  const handleSaveSet = () => {
    if (!currentPlan) return;

    const newSet: SetEntry = {
      id: `set-${Date.now()}`,
      exerciseId: currentPlan.exerciseId,
      setNumber: nextSetNumber,
      weight: (isCardio || isTimed) ? 0 : Number(inputWeight),
      repetitions: Number(inputReps),
      completed: true,
      timestamp: Date.now(),
    };

    const updatedExercises = [...workout.exercises];
    const updatedPlan = {
      ...currentPlan,
      completedSets: [...currentPlan.completedSets, newSet],
    };
    updatedExercises[selectedExIndex] = updatedPlan;

    const updatedWorkout: Workout = {
      ...workout,
      date: new Date().toISOString().split('T')[0],
      exercises: updatedExercises,
    };

    setWorkout(updatedWorkout);
    onSaveWorkout(updatedWorkout);

    try {
      localStorage.setItem(
        `pulse_last_ex_${user?.id || 'guest'}_${updatedWorkout.id}`,
        String(selectedExIndex)
      );
      localStorage.setItem('pulse_backup_last_saved_workout', JSON.stringify(updatedWorkout));
    } catch (e) {}

    if (isCardio) {
      setFeedbackMessage(`Laufband-Einheit (${inputReps} Min.) erfasst`);
    } else if (isTimed) {
      setFeedbackMessage(`${currentPlan.exerciseName} (${inputReps} Sek.) erfasst`);
      setRestSeconds(45);
      setIsResting(true);
    } else {
      setFeedbackMessage(`Satz ${nextSetNumber} erfasst`);
      setRestSeconds(60);
      setIsResting(true);
    }

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  // Delete a previously logged set (e.g. accidentally logged on wrong exercise or wrong input)
  const handleDeleteSet = (setId: string) => {
    if (!currentPlan) return;

    const remainingSets = currentPlan.completedSets
      .filter((s) => s.id !== setId)
      .map((s, idx) => ({
        ...s,
        setNumber: idx + 1, // Keep set numbering sequential (1, 2, 3...)
      }));

    const updatedExercises = [...workout.exercises];
    updatedExercises[selectedExIndex] = {
      ...currentPlan,
      completedSets: remainingSets,
    };

    const updatedWorkout: Workout = {
      ...workout,
      completed: false, // Re-open workout if it was completed
      exercises: updatedExercises,
    };

    setWorkout(updatedWorkout);
    onSaveWorkout(updatedWorkout);

    // Sync input fields to last remaining set or default
    const lastRemaining = remainingSets[remainingSets.length - 1];
    if (lastRemaining) {
      setInputWeight(lastRemaining.weight);
      setInputReps(lastRemaining.repetitions);
    }

    setFeedbackMessage('Satz gelöscht');
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2500);
  };

  // Coach Adaptive Learning Feedback Handler
  const handleExerciseFeedback = (rating: ExerciseFeedbackRating) => {
    if (!currentPlan) return;

    const updatedExercises = [...workout.exercises];
    let newTargetSets = currentPlan.targetSets;
    const completedCount = currentPlan.completedSets.length;

    if (rating === 'too_hard') {
      if (completedCount > 0 && completedCount < currentPlan.targetSets) {
        newTargetSets = completedCount;
      } else {
        newTargetSets = Math.max(1, currentPlan.targetSets - 1);
      }
    } else if (rating === 'too_easy') {
      newTargetSets = currentPlan.targetSets + 1;
    }

    const updatedPlan: WorkoutExercisePlan = {
      ...currentPlan,
      targetSets: newTargetSets,
      feedback: rating,
    };
    updatedExercises[selectedExIndex] = updatedPlan;

    const updatedWorkout: Workout = {
      ...workout,
      exercises: updatedExercises,
    };

    setWorkout(updatedWorkout);
    onSaveWorkout(updatedWorkout);

    if (user && onUpdateUser) {
      const memory: Record<string, ExerciseCoachMemory> = {
        ...(user.coachMemory || {}),
        [currentPlan.exerciseId]: {
          exerciseId: currentPlan.exerciseId,
          rating,
          updatedAt: new Date().toISOString(),
          adjustmentSets: rating === 'too_hard' ? -1 : rating === 'too_easy' ? 1 : 0,
          recommendedWeightMultiplier:
            rating === 'too_hard' ? 0.9 : rating === 'too_easy' ? 1.05 : 1.0,
          note:
            rating === 'too_hard'
              ? 'Sätze/Gewicht beim nächsten Mal reduzieren'
              : rating === 'too_easy'
              ? 'Nächstes Mal Gewicht oder Satzanzahl steigern'
              : 'Aktuelles Niveau ist optimal',
        },
      };

      onUpdateUser({
        ...user,
        coachMemory: memory,
      });
    }

    if (rating === 'too_hard') {
      setFeedbackMessage(`Ziel auf ${newTargetSets} Sätze angepasst`);
    } else if (rating === 'too_easy') {
      setFeedbackMessage(`Für nächstes Mal gesteigert`);
    } else {
      setFeedbackMessage(`Optimaler Trainingsreiz gespeichert`);
    }

    setTimeout(() => {
      setFeedbackMessage(null), 3000;
    });
  };

  const handleFinishWorkout = () => {
    const completedWorkout: Workout = {
      ...workout,
      completed: true,
      completedAt: new Date().toISOString(),
      actualDurationMinutes: workout.actualDurationMinutes || selectedDuration,
    };

    setWorkout(completedWorkout);
    onSaveWorkout(completedWorkout);
    setShowWorkoutCompletedModal(true);
  };

  const totalCompletedSets = workout.exercises.reduce(
    (acc, ex) => acc + (ex.completedSets || []).length,
    0
  );
  const todayStr = new Date().toISOString().split('T')[0];
  const hasPastSessionSets = workout.exercises.some((e) =>
    (e.completedSets || []).some((s) => {
      try {
        return new Date(s.timestamp).toISOString().split('T')[0] < todayStr;
      } catch {
        return false;
      }
    })
  );

  const handleConfirmResetSession = () => {
    let clean: Workout;
    if (onResetWorkout) {
      clean = onResetWorkout(workout);
    } else {
      clean = {
        ...workout,
        date: todayStr,
        completed: false,
        completedAt: undefined,
        actualDurationMinutes: undefined,
        exercises: workout.exercises.map((e) => ({ ...e, completedSets: [] })),
      };
      onSaveWorkout(clean);
    }
    setWorkout(clean);
    setSelectedExIndex(0);
    const firstPlan = clean.exercises[0];
    const exMeta = EXERCISE_DATABASE.find((e) => e.id === firstPlan?.exerciseId);
    if (exMeta) {
      const rec = getRecommendedWeightAndReps(exMeta, user);
      setInputWeight(rec.weight);
      setInputReps(rec.repetitions);
    }
    setShowResetConfirmModal(false);
    setFeedbackMessage('Frisches Training für heute gestartet (0 Sätze)');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & WORKOUT CONTROLS */}
      <div className="bg-[#1C1C1E] rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wider block"
              style={{ color: accentHex }}
            >
              Aktives Workout
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              {workout.title}
            </h1>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              {workout.exercises.length} Übungen · {workout.location === 'home' ? 'Zuhause' : 'Gym'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {totalCompletedSets > 0 && (
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(true)}
                title="Training für heute neu starten (0 Sätze)"
                className="px-3 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#8E8E93] hover:text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Neu starten</span>
              </button>
            )}

            <button
              onClick={handleFinishWorkout}
              className="px-4 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Abschließen</span>
            </button>
          </div>
        </div>

        {/* Location & Duration Segmented Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-[#2C2C2E]/60">
          {/* Gym / Home Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#2C2C2E] rounded-xl text-xs font-medium w-full sm:w-56">
            <button
              type="button"
              onClick={() => handleToggleLocation('gym')}
              className={`py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                workout.location !== 'home'
                  ? 'bg-[#3A3A3C] text-white font-semibold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <Dumbbell size={13} strokeWidth={1.75} />
              <span>Gym</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleLocation('home')}
              className={`py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                workout.location === 'home'
                  ? 'bg-[#3A3A3C] text-white font-semibold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <Home size={13} strokeWidth={1.75} />
              <span>Zuhause</span>
            </button>
          </div>

          {/* Duration Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTimePicker(!showTimePicker)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-medium text-white flex items-center justify-between sm:justify-start gap-2 transition-colors cursor-pointer"
            >
              <Clock size={13} className="text-[#8E8E93]" />
              <span>ca. {selectedDuration} Min</span>
              <ChevronDown size={13} className="text-[#8E8E93]" />
            </button>

            {showTimePicker && (
              <div className="absolute right-0 top-10 z-20 w-44 bg-[#2C2C2E] rounded-xl border border-[#3A3A3C] shadow-lg p-1.5 space-y-1">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleSelectDuration(mins)}
                    style={
                      selectedDuration === mins
                        ? { backgroundColor: accentHex, color: accent.contrastText }
                        : undefined
                    }
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                      selectedDuration === mins
                        ? 'font-semibold'
                        : 'text-[#8E8E93] hover:text-white hover:bg-[#38383A]'
                    }`}
                  >
                    ca. {mins} Minuten
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3 bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl text-xs text-white/90 flex items-center gap-2 animate-in fade-in duration-200">
          <Info size={14} style={{ color: accentHex }} className="shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Past Session Alert Banner */}
      {hasPastSessionSets && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-200">
                Vorherige Trainingssession erkannt ({totalCompletedSets} Sätze)
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                Diese Sätze wurden an einem früheren Tag geloggt. Möchtest du sie archivieren und heute mit einem leeren Training (0 Sätze) starten?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConfirmResetSession}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-xl transition-colors shrink-0 cursor-pointer self-start sm:self-auto shadow-xs"
          >
            Heute neu starten (0 Sätze)
          </button>
        </div>
      )}

      {/* 2. EXERCISE LIST (iOS Settings Grouped Style) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-1 block">
          Übungen
        </span>

        <div className="bg-[#1C1C1E] rounded-2xl divide-y divide-[#2C2C2E]/60 overflow-hidden">
          {workout.exercises.map((ex, idx) => {
            const isSelected = idx === selectedExIndex;
            const completedCount = ex.completedSets.length;
            const isFinished = completedCount >= ex.targetSets;
            const exData = EXERCISE_DATABASE.find((e) => e.id === ex.exerciseId);

            return (
              <div
                key={ex.exerciseId + idx}
                onClick={() => handleSelectExercise(idx)}
                className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#242426]' : 'hover:bg-[#202022]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    style={isSelected ? { backgroundColor: accentHex } : undefined}
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isSelected
                        ? ''
                        : isFinished
                        ? 'bg-emerald-500'
                        : 'bg-[#3A3A3C]'
                    }`}
                  />
                  <div className="min-w-0">
                    <span className={`text-sm font-semibold block truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {ex.exerciseName}
                    </span>
                    <span className="text-xs text-[#8E8E93] block mt-0.5">
                      {ex.exerciseId === 'cardio-treadmill'
                        ? `${ex.targetSets === 1 ? '1 Einheit' : `${ex.targetSets} Sätze`} · ${ex.targetReps}`
                        : isExerciseTimed(ex.exerciseId)
                        ? `${ex.targetSets} Sätze · ${ex.targetReps}`
                        : `${ex.targetSets} Sätze · ${ex.targetReps} Wdh.`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs tabular-nums font-medium ${
                      isFinished
                        ? 'text-emerald-500'
                        : completedCount > 0
                        ? 'text-white'
                        : 'text-[#8E8E93]'
                    }`}
                  >
                    {completedCount}/{ex.targetSets}
                  </span>

                  {exData && (
                    <button
                      type="button"
                      title="Geräte-Info & Tauschen"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingExercise(exData);
                      }}
                      className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2C2C2E] transition-colors"
                    >
                      <HelpCircle size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE SET LOGGING PANEL */}
      {currentPlan && (
        <div className="bg-[#1C1C1E] rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#8E8E93] block">
                Aktive Übung
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                {currentPlan.exerciseName}
              </h2>
            </div>

            {currentExerciseData && (
              <button
                onClick={() => setInspectingExercise(currentExerciseData)}
                className="px-3 py-1.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#8E8E93] hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Info & Tausch</span>
              </button>
            )}
          </div>

          {/* List of completed sets for this exercise */}
          {currentPlan.completedSets.length > 0 && (
            <div className="space-y-1.5 bg-[#2C2C2E] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block">
                  Erfasste Sätze ({currentPlan.completedSets.length})
                </span>
                <span className="text-[10px] text-[#8E8E93]">Tippe auf Papierkorb zum Löschen</span>
              </div>
              <div className="divide-y divide-[#3A3A3C]">
                {currentPlan.completedSets.map((s) => (
                  <div
                    key={s.id}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#3A3A3C] text-white flex items-center justify-center font-bold text-[10px]">
                        {s.setNumber}
                      </span>
                      {isCardio ? (
                        <span className="font-semibold text-white">
                          {s.repetitions} Min. gelaufen
                        </span>
                      ) : isTimed ? (
                        <span className="font-semibold text-white">
                          {s.repetitions} Sek. gehalten
                        </span>
                      ) : (
                        <>
                          <span className="font-semibold text-white">
                            {s.weight > 0 ? `${s.weight} kg` : (isBodyweight ? 'Eigengewicht' : '0 kg')}
                          </span>
                          <span className="text-[#8E8E93]">×</span>
                          <span className="font-semibold text-white">
                            {s.repetitions} Wdh.
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-medium text-[11px] flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Erfasst</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSet(s.id)}
                        title={`Satz ${s.setNumber} löschen`}
                        className="p-1 rounded-md text-[#8E8E93] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        aria-label={`Satz ${s.setNumber} löschen`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Set Logger Inputs */}
          <div className="p-4 rounded-xl bg-[#2C2C2E] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                {isCardio ? `Cardio-Einheit (Warmup)` : `Satz ${nextSetNumber} von ${currentPlan.targetSets}`}
              </span>

              {isResting && restSeconds !== null && restSeconds > 0 && (
                <div
                  className="flex items-center gap-1 text-xs font-semibold"
                  style={{ color: accentHex }}
                >
                  <Clock size={12} />
                  <span>Pause: {restSeconds}s</span>
                </div>
              )}
            </div>

            {/* Weight Input Row (Only shown for weight-based exercises, hidden for cardio & plank/timed) */}
            {!isCardio && !isTimed && (
              <div>
                <div className="flex justify-between items-center text-xs text-[#8E8E93] mb-1">
                  <span>{isBodyweight ? 'Zusatzgewicht' : 'Gewicht'}</span>
                  <span>{isBodyweight ? '(0 = nur Eigengewicht)' : 'Kilogramm'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInputWeight((w) => Math.max(0, Number((w - 5).toFixed(1))))}
                    className="h-11 px-3 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputWeight((w) => Math.max(0, Number((w - 1).toFixed(1))))}
                    className="h-11 px-3 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Minus size={13} />
                  </button>

                  <div className="flex-1 h-11 bg-[#1C1C1E] rounded-lg flex items-center justify-center px-2">
                    <input
                      type="number"
                      step="0.5"
                      value={inputWeight}
                      onChange={(e) => setInputWeight(Number(e.target.value))}
                      className="w-full text-center text-xl font-bold text-white tabular-nums focus:outline-hidden"
                    />
                    <span className="text-xs text-[#8E8E93] ml-1">kg</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInputWeight((w) => Number((w + 1).toFixed(1)))}
                    className="h-11 px-3 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputWeight((w) => Number((w + 5).toFixed(1)))}
                    className="h-11 px-3 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
            )}

            {/* Reps / Duration Input Row */}
            <div>
              <div className="flex justify-between items-center text-xs text-[#8E8E93] mb-1">
                <span>{isCardio ? 'Dauer' : isTimed ? 'Haltedauer' : 'Wiederholungen'}</span>
                <span>{isCardio ? 'Minuten gelaufen' : isTimed ? 'Sekunden gehalten' : 'Reps'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isTimed && (
                  <button
                    type="button"
                    onClick={() => setInputReps((r) => Math.max(5, r - 15))}
                    className="h-11 px-2.5 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    -15s
                  </button>
                )}
                {isCardio && (
                  <button
                    type="button"
                    onClick={() => setInputReps((r) => Math.max(1, r - 5))}
                    className="h-11 px-3 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    -5m
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInputReps((r) => Math.max(1, isTimed ? r - 5 : r - 1))}
                  className="h-11 px-3.5 sm:px-4 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  {isTimed ? '-5s' : <Minus size={13} />}
                </button>

                <div className="flex-1 h-11 bg-[#1C1C1E] rounded-lg flex items-center justify-center px-2">
                  <input
                    type="number"
                    value={inputReps}
                    onChange={(e) => setInputReps(Math.max(1, Number(e.target.value)))}
                    className="w-full text-center text-xl font-bold text-white tabular-nums focus:outline-hidden"
                  />
                  <span className="text-xs text-[#8E8E93] ml-1">
                    {isCardio ? 'Min' : isTimed ? 'Sek' : 'Wdh'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setInputReps((r) => isTimed ? r + 5 : r + 1)}
                  className="h-11 px-3.5 sm:px-4 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  {isTimed ? '+5s' : <Plus size={13} />}
                </button>
                {isTimed && (
                  <button
                    type="button"
                    onClick={() => setInputReps((r) => r + 15)}
                    className="h-11 px-2.5 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    +15s
                  </button>
                )}
                {isCardio && (
                  <button
                    type="button"
                    onClick={() => setInputReps((r) => r + 5)}
                    className="h-11 px-3 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    +5m
                  </button>
                )}
              </div>
            </div>

            {/* Save Set Button */}
            <button
              onClick={handleSaveSet}
              style={{ backgroundColor: accentHex, color: accent.contrastText }}
              className="w-full h-12 rounded-xl active:opacity-90 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95 shadow-xs"
            >
              <Check size={16} />
              <span>
                {isCardio
                  ? `Laufband-Einheit speichern (${inputReps} Min.)`
                  : isTimed
                  ? `Satz speichern (${inputReps} Sek.)`
                  : 'Satz speichern'}
              </span>
            </button>
          </div>

          {/* Coach Feedback Adaptive Row */}
          <div className="p-3 bg-[#2C2C2E] rounded-xl space-y-2">
            <span className="text-xs font-medium text-[#8E8E93] block">
              Wie hat sich der Satz angefühlt?
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleExerciseFeedback('too_easy')}
                style={
                  currentPlan.feedback === 'too_easy'
                    ? { backgroundColor: accentHex, color: accent.contrastText }
                    : undefined
                }
                className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPlan.feedback === 'too_easy'
                    ? 'font-semibold'
                    : 'bg-[#3A3A3C] text-white/90 hover:bg-[#48484A]'
                }`}
              >
                Zu leicht
              </button>
              <button
                type="button"
                onClick={() => handleExerciseFeedback('just_right')}
                style={
                  currentPlan.feedback === 'just_right'
                    ? { backgroundColor: accentHex, color: accent.contrastText }
                    : undefined
                }
                className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPlan.feedback === 'just_right'
                    ? 'font-semibold'
                    : 'bg-[#3A3A3C] text-white/90 hover:bg-[#48484A]'
                }`}
              >
                Genau richtig
              </button>
              <button
                type="button"
                onClick={() => handleExerciseFeedback('too_hard')}
                style={
                  currentPlan.feedback === 'too_hard'
                    ? { backgroundColor: accentHex, color: accent.contrastText }
                    : undefined
                }
                className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentPlan.feedback === 'too_hard'
                    ? 'font-semibold'
                    : 'bg-[#3A3A3C] text-white/90 hover:bg-[#48484A]'
                }`}
              >
                Zu schwer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Machine Info / Swap Modal */}
      {inspectingExercise && (
        <MachineInfoModal
          exercise={inspectingExercise}
          onClose={() => setInspectingExercise(null)}
          onSwapExercise={handleSwapExercise}
        />
      )}

      {/* Workout Completed Modal */}
      {showWorkoutCompletedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1C1C1E] text-white rounded-2xl p-6 border border-[#2C2C2E] space-y-4 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
              style={{
                backgroundColor: `${accentHex}25`,
                color: accentHex,
              }}
            >
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Workout abgeschlossen</h3>
              <p className="text-xs text-[#8E8E93] mt-1">
                Klasse Leistung! Alle Sätze und Gewichte wurden gespeichert.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowWorkoutCompletedModal(false);
                  onNavigateToBody();
                }}
                style={{ backgroundColor: accentHex, color: accent.contrastText }}
                className="w-full py-3 rounded-xl hover:opacity-95 font-semibold text-xs transition-opacity cursor-pointer shadow-xs"
              >
                Körperstatus ansehen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset / New Session Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1C1C1E] text-white rounded-2xl p-6 border border-[#2C2C2E] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-amber-500/20 text-amber-400">
              <RotateCcw size={24} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Training neu starten?</h3>
              <p className="text-xs text-[#8E8E93] mt-1.5 leading-relaxed">
                Möchtest du alle erfassten Sätze zurücksetzen und die heutige Session mit 0 Sätzen beginnen?
                Deine bisherigen Sätze werden sicher in deiner Trainingshistorie archiviert und bleiben erhalten.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmResetSession}
                style={{ backgroundColor: accentHex, color: accent.contrastText }}
                className="w-full py-3 rounded-xl font-semibold text-xs transition-opacity cursor-pointer shadow-xs hover:opacity-95"
              >
                Ja, neues Training starten (0 Sätze)
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#8E8E93] hover:text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
