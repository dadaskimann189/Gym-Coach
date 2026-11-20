import React, { useEffect, useState } from 'react';
import { MuscleId, MuscleLoadStatus, UserProfile, Workout } from '../../types';
import { BodySvg } from './BodySvg';
import { MuscleDetailModal } from './MuscleDetailModal';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getMuscleColor } from '../../services/muscleLoadCalculator';

interface BodyScreenProps {
  user?: UserProfile | null;
  muscleStatus: Record<MuscleId, MuscleLoadStatus>;
  workouts: Workout[];
  onNavigateToWorkout: () => void;
}

export const BodyScreen: React.FC<BodyScreenProps> = ({
  user,
  muscleStatus,
  onNavigateToWorkout,
}) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  const [view, setView] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleId | null>(null);

  // Automatically derived from user's profile configuration
  const gender: 'male' | 'female' = user?.gender === 'female' ? 'female' : 'male';

  // Group top loaded muscles
  const statusArray = Object.values(muscleStatus);
  const mostLoaded = [...statusArray]
    .filter((s) => s.load > 0)
    .sort((a, b) => b.load - a.load);

  // Overall total body load percentage across all muscle groups
  const totalLoadValues = statusArray.map((s) => s.load || 0);
  const totalBodyLoad = Math.round(
    totalLoadValues.reduce((a, b) => a + b, 0) / (totalLoadValues.length || 1)
  );

  // Category ratings for Apple Health-style progress bars
  const getCategoryLoad = (muscles: MuscleId[]): number => {
    const sum = muscles.reduce((acc, m) => acc + (muscleStatus[m]?.load || 0), 0);
    return Math.round(sum / (muscles.length || 1));
  };

  const categories = [
    { name: 'Brust', load: getCategoryLoad(['chest']) },
    { name: 'Rücken', load: getCategoryLoad(['lats', 'traps', 'lower_back']) },
    { name: 'Schultern', load: getCategoryLoad(['front_delts', 'side_delts', 'rear_delts']) },
    { name: 'Arme', load: getCategoryLoad(['biceps', 'triceps', 'forearms']) },
    { name: 'Beine', load: getCategoryLoad(['quads', 'hamstrings', 'calves', 'glutes']) },
    { name: 'Bauch & Core', load: getCategoryLoad(['abs', 'obliques']) },
  ];

  const selectedStatus = selectedMuscle ? muscleStatus[selectedMuscle] : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Körperstatus
          </h1>
          <p className="text-xs text-[#8E8E93] mt-1 font-medium">
            Muskelbelastung & Erholungsbereitschaft
          </p>
        </div>

        {/* Front / Back Toggle */}
        <div className="inline-flex w-fit self-start sm:self-auto p-1 bg-[#2C2C2E] rounded-xl text-xs font-medium">
          <button
            onClick={() => setView('front')}
            className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer text-center ${
              view === 'front'
                ? 'bg-[#3A3A3C] text-white font-semibold shadow-xs'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Vorn
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer text-center ${
              view === 'back'
                ? 'bg-[#3A3A3C] text-white font-semibold shadow-xs'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Hinten
          </button>
        </div>
      </div>

      {/* Main Body Map Visual Card */}
      <div className="bg-[#1C1C1E] rounded-2xl p-5 sm:p-6 flex flex-col items-center">
        {/* SVG Interactive Body */}
        <div className="w-full flex justify-center py-2">
          <BodySvg
            view={view}
            gender={gender}
            muscleStatus={muscleStatus}
            selectedMuscle={selectedMuscle}
            onSelectMuscle={(id) => setSelectedMuscle(id)}
          />
        </div>

        {/* Minimal Color Legend - Reize immer rot */}
        <div className="mt-4 pt-4 border-t border-[#2C2C2E]/60 w-full">
          <div className="flex items-center justify-center flex-wrap gap-4 text-[11px] font-medium text-[#8E8E93]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#242426] border border-[#3A3A3C]" />
              <span>Erholt (0%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: '#FF8A80' }}
              />
              <span>Leicht (1–25%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: '#FF453A' }}
              />
              <span>Moderat (26–60%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: '#991B1B' }}
              />
              <span>Maximal (61–100%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Körperauslastung Prozent-Anzeige & Bereiche */}
      <div className="bg-[#1C1C1E] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
              Körperauslastung
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white tabular-nums">
                {totalBodyLoad}%
              </span>
              <span className="text-xs text-[#8E8E93] font-medium">
                {totalBodyLoad === 0
                  ? 'Vollständig erholt · Trainingsbereit'
                  : totalBodyLoad < 30
                  ? 'Leicht beansprucht'
                  : totalBodyLoad < 60
                  ? 'Optimal ausgelastet'
                  : 'Stark gefordert'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#8E8E93] font-medium">
              {mostLoaded.length} {mostLoaded.length === 1 ? 'Gruppe aktiv' : 'Gruppen aktiv'}
            </span>
          </div>
        </div>

        {/* Overall Load Progress Bar - Rot für physiologische Trainingsbelastung */}
        <div className="h-2 w-full bg-[#2C2C2E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(totalBodyLoad > 0 ? 3 : 0, totalBodyLoad)}%`,
              backgroundColor: '#FF3B30',
            }}
          />
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3 pt-3 border-t border-[#2C2C2E]/60">
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
            Auslastung nach Bereichen
          </span>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/90 font-medium">{cat.name}</span>
                  <span className="text-[#8E8E93] tabular-nums font-medium">{cat.load}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#2C2C2E] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(cat.load > 0 ? 2 : 0, cat.load)}%`,
                      backgroundColor: cat.load > 0 ? getMuscleColor(cat.load) : 'transparent',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Muscle Load List */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-1 block">
          Aktuelle Muskelbelastung
        </span>

        <div className="bg-[#1C1C1E] rounded-2xl divide-y divide-[#2C2C2E]/60 overflow-hidden">
          {mostLoaded.length > 0 ? (
            mostLoaded.map((item) => (
              <div
                key={item.muscleId}
                onClick={() => setSelectedMuscle(item.muscleId)}
                className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-[#242426] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getMuscleColor(item.load) }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {item.nameDe}
                      </span>
                      <span className="text-xs text-[#8E8E93]">· {item.category}</span>
                    </div>
                    <span className="text-xs text-[#8E8E93] block mt-0.5">
                      {item.totalSetsThisWeek} Sätze diese Woche
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-white tabular-nums">
                      {item.load}
                    </span>
                    <span className="text-xs text-[#8E8E93]"> / 100</span>
                  </div>
                  <ChevronRight size={16} className="text-[#8E8E93]" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#8E8E93] p-5 text-center">
              Noch keine Belastung erfasst. Starte ein Workout, um deinen Status zu füllen.
            </p>
          )}
        </div>
      </div>

      {/* Modal for Details */}
      <MuscleDetailModal
        muscleId={selectedMuscle}
        status={selectedStatus}
        onClose={() => setSelectedMuscle(null)}
        onStartTargetWorkout={() => {
          setSelectedMuscle(null);
          onNavigateToWorkout();
        }}
      />
    </div>
  );
};
