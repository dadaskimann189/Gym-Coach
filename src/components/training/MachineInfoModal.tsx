import React from 'react';
import { Exercise } from '../../types';
import { EXERCISE_DATABASE } from '../../data/exercises';
import {
  ArrowRightLeft,
  ChevronRight,
  Dumbbell,
  Info,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MachineInfoModalProps {
  exercise: Exercise;
  onClose: () => void;
  onSwapExercise: (newExercise: Exercise) => void;
}

export const MachineInfoModal: React.FC<MachineInfoModalProps> = ({
  exercise,
  onClose,
  onSwapExercise,
}) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  // Find alternatives
  const alternatives: Exercise[] = (exercise.alternativeExerciseIds || [])
    .map((id) => EXERCISE_DATABASE.find((e) => e.id === id))
    .filter((e): e is Exercise => !!e);

  // If no specific alternatives defined, find exercises from same category
  const fallbackAlternatives =
    alternatives.length > 0
      ? alternatives
      : EXERCISE_DATABASE.filter(
          (e) => e.category === exercise.category && e.id !== exercise.id
        ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-lg bg-[#1C1C1E] text-white rounded-t-3xl sm:rounded-2xl border border-[#2C2C2E] overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* iOS Grabber */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-9 h-1 bg-[#3A3A3C] rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between border-b border-[#2C2C2E]/60">
          <div>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider block"
              style={{ color: accentHex }}
            >
              {exercise.category} · {exercise.machineType || 'Maschine'}
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
              {exercise.name}
            </h3>
            <p className="text-xs text-[#8E8E93] mt-0.5 font-medium">
              {exercise.machineName || 'Gym-Geräteübersicht'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden"
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Photo */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-[#2C2C2E]/60">
            {exercise.imageUrl ? (
              <img
                src={exercise.imageUrl}
                alt={exercise.machineName || exercise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#8E8E93]">
                <Dumbbell size={36} className="mb-2 text-[#3A3A3C]" />
                <span className="text-xs font-medium">Gym-Gerät</span>
              </div>
            )}
          </div>

          {/* Equipment Tip */}
          <div className="p-3.5 bg-[#2C2C2E] rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Info size={14} style={{ color: accentHex }} className="shrink-0" />
              <span>Geräte-Erkennung im Gym:</span>
            </div>
            <p className="text-xs text-[#8E8E93] leading-relaxed font-normal">
              {exercise.equipmentTip || exercise.description}
            </p>
          </div>

          {/* Muscles Targeted */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
              Beanspruchte Muskeln
            </span>
            <div className="flex flex-wrap gap-1.5">
              {exercise.primaryMuscles.map((m, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[#2C2C2E] text-white text-xs font-medium"
                >
                  {m.muscle} ({m.weightPercent}%)
                </span>
              ))}
            </div>
          </div>

          {/* Alternative Exercises */}
          <div className="space-y-2.5 pt-2 border-t border-[#2C2C2E]/60">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <ArrowRightLeft size={14} style={{ color: accentHex }} />
                Maschine nicht verfügbar?
              </h4>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Gleichwertige Alternative für dieses Workout wählen:
              </p>
            </div>

            <div className="space-y-1.5">
              {fallbackAlternatives.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => onSwapExercise(alt)}
                  className="p-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0 flex items-center justify-center text-[#8E8E93]">
                      {alt.imageUrl ? (
                        <img
                          src={alt.imageUrl}
                          alt={alt.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Dumbbell size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white block truncate">
                        {alt.name}
                      </span>
                      <span className="text-[11px] text-[#8E8E93] font-medium block truncate">
                        {alt.machineName || alt.category}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSwapExercise(alt)}
                    style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                    className="px-3 py-1.5 rounded-lg hover:opacity-90 text-xs font-semibold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>Wählen</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2C2C2E]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Zurück zum Workout
          </button>
        </div>
      </div>
    </div>
  );
};
