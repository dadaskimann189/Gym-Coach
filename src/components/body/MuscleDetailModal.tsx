import React from 'react';
import { MuscleId, MuscleLoadStatus } from '../../types';
import { Calendar, Dumbbell, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getMuscleColor } from '../../services/muscleLoadCalculator';

interface MuscleDetailModalProps {
  muscleId: MuscleId | null;
  status: MuscleLoadStatus | null;
  onClose: () => void;
  onStartTargetWorkout?: (muscleId: MuscleId) => void;
}

export const MuscleDetailModal: React.FC<MuscleDetailModalProps> = ({
  muscleId,
  status,
  onClose,
  onStartTargetWorkout,
}) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  if (!muscleId || !status) return null;

  // Status label
  let statusText = 'Vollständig erholt';
  if (status.load > 80) {
    statusText = 'Sehr stark beansprucht';
  } else if (status.load > 60) {
    statusText = 'Stark belastet';
  } else if (status.load > 40) {
    statusText = 'Moderat belastet';
  } else if (status.load > 20) {
    statusText = 'Leicht stimuliert';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-md bg-[#1C1C1E] text-white rounded-t-3xl sm:rounded-2xl border border-[#2C2C2E] overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* iOS Grabber */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-9 h-1 bg-[#3A3A3C] rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between border-b border-[#2C2C2E]/60">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: status.load > 0 ? getMuscleColor(status.load) : '#8E8E93' }}
            />
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {status.nameDe}
              </h3>
              <p className="text-xs text-[#8E8E93] font-medium">
                Kategorie: {status.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden"
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Key Metric Card */}
          <div className="p-4 bg-[#2C2C2E] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#8E8E93] block mb-1">
                Belastung diese Woche
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white tabular-nums">
                  {status.load}
                </span>
                <span className="text-xs text-[#8E8E93]">/ 100</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium text-[#8E8E93] block mb-1">
                Absolvierte Sätze
              </span>
              <span className="text-2xl font-bold text-white tabular-nums">
                {status.totalSetsThisWeek}
              </span>
            </div>
          </div>

          {/* Load Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-[#8E8E93]">Status</span>
              <span className="text-white">{statusText}</span>
            </div>
            <div className="h-2 w-full bg-[#2C2C2E] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(4, status.load)}%`,
                  backgroundColor: status.load > 0 ? getMuscleColor(status.load) : '#8E8E93',
                }}
              />
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2.5 pt-1">
            <div className="p-3 bg-[#2C2C2E] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#8E8E93]">
                <Calendar size={14} />
                <span>Letztes Training</span>
              </div>
              <span className="font-semibold text-white">
                {status.lastTrainedDate || 'Diese Woche noch nicht'}
              </span>
            </div>

            {status.recentExercises.length > 0 && (
              <div className="p-3 bg-[#2C2C2E] rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#8E8E93]">
                  <Dumbbell size={14} />
                  <span>Beteiligte Übungen</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {status.recentExercises.map((ex, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#1C1C1E] text-white/90 font-medium text-[11px]"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2C2C2E]/60 flex gap-2">
          {onStartTargetWorkout && (
            <button
              onClick={() => onStartTargetWorkout(muscleId)}
              style={{ backgroundColor: accentHex, color: accent.contrastText }}
              className="flex-1 py-3 rounded-xl hover:opacity-95 text-xs font-semibold transition-opacity cursor-pointer shadow-xs"
            >
              Passendes Workout öffnen
            </button>
          )}
          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
