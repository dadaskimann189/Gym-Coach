import React from 'react';
import {
  DayOfWeek,
  MuscleId,
  MuscleLoadStatus,
  UserProfile,
  WeightEntry,
  Workout,
} from '../../types';
import { getDayNameDe } from '../../services/trainingPlan';
import {
  ArrowRight,
  ChevronRight,
  Dumbbell,
  Home,
  Play,
  Plus,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface HomeScreenProps {
  user: UserProfile;
  todayWorkout: Workout | null;
  workouts?: Workout[];
  isTodayTrainingDay?: boolean;
  nextUpcomingWorkout?: Workout | null;
  muscleStatus: Record<MuscleId, MuscleLoadStatus>;
  weightHistory: WeightEntry[];
  onStartWorkout: (workout?: Workout) => void;
  onNavigateToBody: () => void;
  onNavigateToProgress: () => void;
  onNavigateToProfile?: () => void;
  onOpenWeightModal: () => void;
  onToggleWorkoutLocation?: (targetLocation: 'gym' | 'home', setPermanent?: boolean) => void;
  onToggleDayPermanentLocation?: (day: DayOfWeek, location: 'gym' | 'home') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  todayWorkout,
  workouts = [],
  isTodayTrainingDay: propIsTodayTrainingDay,
  nextUpcomingWorkout,
  muscleStatus,
  weightHistory,
  onStartWorkout,
  onNavigateToBody,
  onNavigateToProgress,
  onNavigateToProfile,
  onOpenWeightModal,
  onToggleWorkoutLocation,
  onToggleDayPermanentLocation,
}) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  let greeting = 'Guten Morgen';
  if (hour >= 12 && hour < 18) greeting = 'Guten Tag';
  if (hour >= 18) greeting = 'Guten Abend';

  // Current day of week: 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
  const todayDay = new Date().getDay() as DayOfWeek;
  const [selectedDay, setSelectedDay] = React.useState<DayOfWeek>(todayDay);

  // Determine whether today is a scheduled training day
  const isTodayTrainingDay =
    propIsTodayTrainingDay !== undefined
      ? propIsTodayTrainingDay
      : Boolean(user?.trainingDays?.includes(todayDay));

  const dayNamesDe = [
    'Sonntag',
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
    'Samstag',
  ];
  const currentDayName = dayNamesDe[todayDay];
  const selectedDayName = dayNamesDe[selectedDay];

  // Selected day's workout (prefer active non-archived workout)
  const selectedWorkout = React.useMemo(() => {
    return (
      workouts.find((w) => w.dayOfWeek === selectedDay && !w.id.startsWith('archive-')) ||
      workouts.find((w) => w.dayOfWeek === selectedDay) ||
      null
    );
  }, [workouts, selectedDay]);

  const isSelectedDayTraining = Boolean(user?.trainingDays?.includes(selectedDay));
  const isViewingToday = selectedDay === todayDay;
  const activeDisplayedWorkout = isViewingToday ? todayWorkout : selectedWorkout;

  // Resolve next upcoming workout if not provided
  const resolvedNextWorkout =
    nextUpcomingWorkout ||
    (() => {
      const activeOnly = workouts.filter((w) => !w.id.startsWith('archive-'));
      if (!user?.trainingDays || user.trainingDays.length === 0) return activeOnly[0] || null;
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
      return activeOnly.find((w) => w.dayOfWeek === nextDay) || activeOnly[0] || null;
    })();

  const daysUntilNextWorkout = resolvedNextWorkout
    ? (() => {
        let diff = resolvedNextWorkout.dayOfWeek - todayDay;
        if (diff <= 0) diff += 7;
        return diff;
      })()
    : 0;

  // Current weight and trend
  const sortedWeights = [...weightHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const currentWeight =
    sortedWeights[sortedWeights.length - 1]?.weightKg || user.currentWeightKg || 81.5;

  const weekAgoTime = Date.now() - 7 * 86400000;
  const weekAgoEntry =
    sortedWeights.filter((w) => new Date(w.date).getTime() <= weekAgoTime).pop() ||
    sortedWeights[0];
  const weekDiff = Number(
    (currentWeight - (weekAgoEntry?.weightKg || currentWeight)).toFixed(1)
  );

  // Calculate current week dates (Mo - So) for the Apple-style week overview
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const weekDaysOrder: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];
  const dayShortNames: Record<DayOfWeek, string> = {
    1: 'Mo',
    2: 'Di',
    3: 'Mi',
    4: 'Do',
    5: 'Fr',
    6: 'Sa',
    0: 'So',
  };

  const weekDays = weekDaysOrder.map((day, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return {
      dayOfWeek: day,
      label: dayShortNames[day],
      dateNumber: d.getDate(),
      isToday: day === todayDay,
      isTraining: Boolean(user?.trainingDays?.includes(day)),
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. HEADER & GREETING */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {greeting}, {user.name || 'Athlet'}
          </h1>
          <p className="text-xs text-[#8E8E93] mt-1 font-medium">
            {isTodayTrainingDay
              ? `${currentDayName} · Geplantes Training`
              : `${currentDayName} · Regeneration`}
          </p>
        </div>

        {onNavigateToProfile && (
          <button
            onClick={onNavigateToProfile}
            className="w-11 h-11 rounded-full bg-[#1C1C1E] border border-[#2C2C2E] overflow-hidden flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:border-[#38383A] transition-colors focus:outline-hidden"
            aria-label="Profil"
          >
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name || 'Profil'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{(user.name || 'A').charAt(0).toUpperCase()}</span>
            )}
          </button>
        )}
      </div>

      {/* 2. WOCHENÜBERSICHT (Apple Fitness Style) */}
      <div className="bg-[#1C1C1E] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
            Woche
          </span>
          <span className="text-xs text-[#8E8E93]">
            {isTodayTrainingDay ? 'Heute Training' : 'Heute Pause'}
          </span>
        </div>

        {/* Clean 7-day columns with ample spacing and zero overlap */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((item) => {
            const isSelected = item.dayOfWeek === selectedDay;
            return (
              <div
                key={item.dayOfWeek}
                className="flex flex-col items-center justify-center py-1 transition-colors"
              >
                {/* Day abbreviation */}
                <span
                  className={`text-[11px] font-medium mb-1.5 ${
                    isSelected || item.isToday
                      ? 'text-white font-semibold'
                      : 'text-[#8E8E93]'
                  }`}
                >
                  {item.label}
                </span>

                {/* Day number with subtle accent indicator */}
                <button
                  type="button"
                  onClick={() => setSelectedDay(item.dayOfWeek)}
                  style={
                    isSelected
                      ? { backgroundColor: accentHex, color: accent.contrastText }
                      : item.isToday
                      ? { borderColor: accentHex }
                      : undefined
                  }
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'font-bold shadow-xs'
                      : item.isToday
                      ? 'border border-solid text-white font-semibold'
                      : 'text-white/80 hover:text-white font-medium hover:bg-[#2C2C2E]'
                  }`}
                >
                  {item.dateNumber}
                </button>

                {/* Status dot for planned training day */}
                <div className="h-2 flex items-center justify-center mt-1">
                  {item.isTraining ? (
                    <span
                      className="w-1.5 h-1.5 rounded-full transition-colors"
                      style={{
                        backgroundColor: accentHex,
                        opacity: isSelected || item.isToday ? 1 : 0.8,
                      }}
                    />
                  ) : (
                    <span className="w-1.5 h-1.5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. HAUPTKARTE: WORKOUT ODER REGENERATION */}
      {activeDisplayedWorkout ? (
        <div className="bg-[#1C1C1E] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block"
                style={{ color: accentHex }}
              >
                {isViewingToday ? 'Heutiges Training' : `Training am ${selectedDayName}`}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                {activeDisplayedWorkout.title}
              </h2>
              <p className="text-xs text-[#8E8E93] mt-1 font-medium">
                {activeDisplayedWorkout.exercises.length} Übungen · ca. {activeDisplayedWorkout.targetDurationMinutes} Min ·{' '}
                {activeDisplayedWorkout.location === 'home' ? 'Zuhause' : 'Gym'}
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-[#2C2C2E] text-white flex items-center justify-center shrink-0">
              {activeDisplayedWorkout.location === 'home' ? (
                <Home size={18} strokeWidth={1.75} />
              ) : (
                <Dumbbell size={18} strokeWidth={1.75} />
              )}
            </div>
          </div>

          {/* Location Toggle (Apple Segmented Style) */}
          {onToggleWorkoutLocation && isViewingToday && todayWorkout && (
            <div className="pt-1">
              <div className="grid grid-cols-2 p-1 bg-[#2C2C2E] rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => onToggleWorkoutLocation('gym')}
                  className={`py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    todayWorkout.location !== 'home'
                      ? 'bg-[#3A3A3C] text-white font-semibold'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <Dumbbell size={13} strokeWidth={1.75} />
                  <span>Gym</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleWorkoutLocation('home')}
                  className={`py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    todayWorkout.location === 'home'
                      ? 'bg-[#3A3A3C] text-white font-semibold'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <Home size={13} strokeWidth={1.75} />
                  <span>Zuhause</span>
                </button>
              </div>

              {onToggleDayPermanentLocation && (
                <div className="flex items-center justify-between text-[11px] text-[#8E8E93] pt-2 px-1">
                  <span>Jeden {currentDayName}s fest zuhause?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const isCurrentlyHome = (user.homeTrainingDays || []).includes(
                        todayWorkout.dayOfWeek
                      );
                      onToggleDayPermanentLocation(
                        todayWorkout.dayOfWeek,
                        isCurrentlyHome ? 'gym' : 'home'
                      );
                    }}
                    style={
                      (user.homeTrainingDays || []).includes(todayWorkout.dayOfWeek)
                        ? { color: accentHex }
                        : undefined
                    }
                    className={`font-semibold cursor-pointer transition-colors ${
                      (user.homeTrainingDays || []).includes(todayWorkout.dayOfWeek)
                        ? ''
                        : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    {(user.homeTrainingDays || []).includes(todayWorkout.dayOfWeek)
                      ? 'Fest geplant'
                      : 'Aktivieren'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Primary Action Button */}
          <button
            onClick={() => onStartWorkout(activeDisplayedWorkout)}
            style={{ backgroundColor: accentHex, color: accent.contrastText }}
            className="w-full h-12 rounded-xl active:opacity-90 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95 shadow-xs"
          >
            <Play size={15} fill="currentColor" />
            <span>
              {activeDisplayedWorkout.completed
                ? 'Training ansehen'
                : isViewingToday
                ? 'Training starten'
                : `${selectedDayName} starten`}
            </span>
          </button>
        </div>
      ) : (
        <div className="bg-[#1C1C1E] rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
              Regeneration
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
              {isViewingToday ? 'Trainingsfrei' : `${selectedDayName} · Trainingsfrei`}
            </h2>
            <p className="text-xs text-[#8E8E93] mt-1 font-medium">
              {isViewingToday
                ? 'Heute steht Erholung auf dem Plan. Muskeln regenerieren und bauen auf.'
                : `Am ${selectedDayName} ist ein wohlverdienter Ruhetag eingeplant.`}
            </p>
          </div>

          {/* Next Workout Sub-card */}
          {resolvedNextWorkout && (
            <div className="p-4 rounded-xl bg-[#2C2C2E] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] text-[#8E8E93] font-medium block">
                  Nächstes Training in {daysUntilNextWorkout}{' '}
                  {daysUntilNextWorkout === 1 ? 'Tag' : 'Tagen'} ({getDayNameDe(resolvedNextWorkout.dayOfWeek)})
                </span>
                <span className="text-sm font-semibold text-white truncate block mt-0.5">
                  {resolvedNextWorkout.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onStartWorkout(resolvedNextWorkout)}
                className="px-3.5 py-2 rounded-lg bg-[#3A3A3C] hover:bg-[#48484A] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Vorziehen</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. KÖRPERGEWICHT */}
      <div className="bg-[#1C1C1E] rounded-2xl p-5 sm:p-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
            Aktuelles Gewicht
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-white tabular-nums">
              {currentWeight}
            </span>
            <span className="text-sm font-medium text-[#8E8E93]">{user.unit || 'kg'}</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-medium text-[#8E8E93] mt-0.5">
            {weekDiff > 0 ? (
              <span className="flex items-center text-white/90">
                <TrendingUp size={12} className="mr-1" style={{ color: accentHex }} /> +{weekDiff} kg diese Woche
              </span>
            ) : weekDiff < 0 ? (
              <span className="flex items-center text-white/90">
                <TrendingDown size={12} className="mr-1" style={{ color: accentHex }} /> {weekDiff} kg diese Woche
              </span>
            ) : (
              <span>Konstant</span>
            )}
          </div>
        </div>

        <button
          onClick={onOpenWeightModal}
          className="h-10 px-3.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>Eintragen</span>
        </button>
      </div>
    </div>
  );
};
