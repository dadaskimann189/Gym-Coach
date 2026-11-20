import React, { useMemo, useState } from 'react';
import {
  PersonalRecord,
  WeightEntry,
  Workout,
  MuscleLoadStatus,
  MuscleId,
} from '../../types';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  LineChart,
  Plus,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ProgressViewProps {
  weightHistory: WeightEntry[];
  workouts: Workout[];
  personalRecords: PersonalRecord[];
  muscleStatus: Record<MuscleId, MuscleLoadStatus>;
  onLogWeightClick: () => void;
  onNavigateToTraining?: () => void;
}

interface StrengthDataPoint {
  dateLabel: string;
  weightKg: number;
  reps?: number;
  isLatest?: boolean;
}

interface StrengthTrackedExercise {
  id: string;
  name: string;
  targetInfo: string;
}

const TRACKED_EXERCISES: StrengthTrackedExercise[] = [
  { id: 'biceps-curls', name: 'Bizeps Curls', targetInfo: '3 Sätze × 10–12 Wdh.' },
  { id: 'bench-press', name: 'Bankdrücken', targetInfo: '3 Sätze × 8–10 Wdh.' },
  { id: 'squats', name: 'Kniebeugen', targetInfo: '4 Sätze × 6–10 Wdh.' },
  { id: 'lat-pulldown', name: 'Latzug', targetInfo: '3 Sätze × 8–12 Wdh.' },
  { id: 'overhead-press', name: 'Schulterpresse', targetInfo: '3 Sätze × 8–10 Wdh.' },
  { id: 'leg-press', name: 'Beinpresse', targetInfo: '4 Sätze × 10–12 Wdh.' },
];

export const ProgressView: React.FC<ProgressViewProps> = ({
  weightHistory,
  workouts,
  personalRecords,
  onLogWeightClick,
  onNavigateToTraining,
}) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('biceps-curls');

  // 1. GEWICHTSVERLAUF AUSWERTUNG (Verloren vs. Gewonnen)
  const sortedWeights = useMemo(() => {
    return [...weightHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [weightHistory]);

  const currentWeight = sortedWeights[sortedWeights.length - 1]?.weightKg || 81.5;
  const firstWeight = sortedWeights[0]?.weightKg || currentWeight;
  const totalChange = Number((currentWeight - firstWeight).toFixed(1));

  // 7 Tage Differenz
  const weekAgoTime = Date.now() - 7 * 86400000;
  const weekAgoEntry =
    sortedWeights.filter((w) => new Date(w.date).getTime() <= weekAgoTime).pop() ||
    sortedWeights[0];
  const weekChange = Number(
    (currentWeight - (weekAgoEntry?.weightKg || currentWeight)).toFixed(1)
  );

  // SVG Trend-Chart Koordinaten
  const minW = Math.min(...sortedWeights.map((w) => w.weightKg)) - 0.5;
  const maxW = Math.max(...sortedWeights.map((w) => w.weightKg)) + 0.5;
  const range = maxW - minW || 1;

  const points = sortedWeights.map((w, idx) => {
    const x = (idx / (sortedWeights.length - 1 || 1)) * 300;
    const y = 80 - ((w.weightKg - minW) / range) * 60;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(' L ')}`;

  // 2. KRAFTSTEIGERUNG DIAGRAMM (Übungen: z.B. Bizeps Curls 15kg -> 17kg)
  const selectedTracked =
    TRACKED_EXERCISES.find((e) => e.id === selectedExerciseId) || TRACKED_EXERCISES[0];

  // Dynamische Ergänzung aus echten Workout-Sätzen
  const progressionData: StrengthDataPoint[] = useMemo(() => {
    const loggedPoints: { date: string; maxWeight: number; reps: number }[] = [];

    // Durchsuche alle abgeschlossenen Sätze der Workouts für diese Übung
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (
          ex.exerciseId === selectedTracked.id ||
          ex.exerciseName.toLowerCase().includes(selectedTracked.name.toLowerCase().split(' ')[0])
        ) {
          const validSets = ex.completedSets.filter((s) => s.completed && s.weight > 0);
          if (validSets.length > 0) {
            const maxW = Math.max(...validSets.map((s) => s.weight));
            const bestSet = validSets.find((s) => s.weight === maxW);
            loggedPoints.push({
              date: w.date,
              maxWeight: maxW,
              reps: bestSet?.repetitions || 10,
            });
          }
        }
      }
    }

    // Auch persönliche Rekorde einbeziehen, falls vorhanden
    const prForEx = personalRecords.find(
      (pr) =>
        pr.exerciseId === selectedTracked.id ||
        pr.exerciseName.toLowerCase().includes(selectedTracked.name.toLowerCase().split(' ')[0])
    );
    if (prForEx && !loggedPoints.some((p) => p.date === prForEx.date)) {
      loggedPoints.push({
        date: prForEx.date,
        maxWeight: prForEx.weight,
        reps: prForEx.reps,
      });
    }

    if (loggedPoints.length === 0) {
      return [];
    }

    loggedPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return loggedPoints.slice(-4).map((pt, idx, arr) => ({
      dateLabel: new Date(pt.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      weightKg: pt.maxWeight,
      reps: pt.reps,
      isLatest: idx === arr.length - 1,
    }));
  }, [workouts, personalRecords, selectedTracked]);

  const hasStrengthData = progressionData.length > 0;
  const latestWeight = hasStrengthData ? progressionData[progressionData.length - 1]?.weightKg : 0;
  const previousWeight =
    progressionData.length > 1
      ? progressionData[progressionData.length - 2]?.weightKg
      : latestWeight;
  const strengthDiff = Number((latestWeight - previousWeight).toFixed(1));
  const strengthDiffPercent = previousWeight > 0
    ? Number(((strengthDiff / previousWeight) * 100).toFixed(1))
    : 0;

  // Chart-Skalierung für das Kraft-Diagramm
  const minStrength = hasStrengthData ? Math.min(...progressionData.map((d) => d.weightKg)) : 0;
  const maxStrength = hasStrengthData ? Math.max(...progressionData.map((d) => d.weightKg)) : 0;
  const strengthRange = maxStrength - minStrength || 5;

  // 3. WORKOUTS HISTORIE
  const completedWorkouts = workouts.filter(
    (w) => w.completed || w.exercises.some((e) => e.completedSets.length > 0)
  );

  return (
    <div className="space-y-6">
      {/* 1. SEITEN-HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Fortschritt
          </h1>
          <p className="text-xs text-[#8E8E93] mt-1 font-medium">
            Körpergewicht, Kraftwerte & Trainingshistorie
          </p>
        </div>
      </div>

      {/* 2. KÖRPERGEWICHT (Verloren vs. Gewonnen) */}
      <div className="bg-[#1C1C1E] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
              Körpergewicht
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white tabular-nums">
                {currentWeight}
              </span>
              <span className="text-sm font-medium text-[#8E8E93]">kg</span>
            </div>
          </div>

          <button
            onClick={onLogWeightClick}
            className="px-3.5 py-2 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Messung eintragen</span>
          </button>
        </div>

        {/* Status-Verlauf: Verloren / Gewonnen Kacheln */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Gesamtstatus */}
          <div className="p-3 bg-[#2C2C2E] rounded-xl space-y-0.5">
            <span className="text-[11px] text-[#8E8E93] font-medium block">
              Gesamtverlauf
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              {sortedWeights.length <= 1 ? (
                <span className="text-sm font-bold text-white">Startwert erfasst</span>
              ) : totalChange < 0 ? (
                <>
                  <TrendingDown size={14} style={{ color: accentHex }} />
                  <span className="text-sm font-bold text-white">
                    {Math.abs(totalChange)} kg verloren
                  </span>
                </>
              ) : totalChange > 0 ? (
                <>
                  <TrendingUp size={14} style={{ color: accentHex }} />
                  <span className="text-sm font-bold text-white">
                    +{totalChange} kg zugenommen
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-white">Konstant gehalten</span>
              )}
            </div>
          </div>

          {/* Woche */}
          <div className="p-3 bg-[#2C2C2E] rounded-xl space-y-0.5">
            <span className="text-[11px] text-[#8E8E93] font-medium block">
              Letzte 7 Tage
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              {sortedWeights.length <= 1 ? (
                <span className="text-xs text-[#8E8E93]">Noch keine Vorwoche</span>
              ) : weekChange < 0 ? (
                <>
                  <TrendingDown size={14} style={{ color: accentHex }} />
                  <span className="text-sm font-bold text-white">
                    {Math.abs(weekChange)} kg weniger
                  </span>
                </>
              ) : weekChange > 0 ? (
                <>
                  <TrendingUp size={14} style={{ color: accentHex }} />
                  <span className="text-sm font-bold text-white">
                    +{weekChange} kg mehr
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-white">±0.0 kg</span>
              )}
            </div>
          </div>

          {/* Startgewicht */}
          <div className="p-3 bg-[#2C2C2E] rounded-xl space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-[#8E8E93] font-medium block">
              Startgewicht
            </span>
            <span className="text-sm font-bold text-white block pt-0.5">
              {firstWeight} kg
            </span>
          </div>
        </div>

        {/* Minimalistisches Gewichtsdiagramm */}
        <div className="pt-2">
          <div className="h-28 w-full">
            <svg viewBox="0 0 300 90" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="weightDarkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentHex} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={accentHex} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Baseline grid */}
              <line x1="0" y1="80" x2="300" y2="80" stroke="#2C2C2E" strokeWidth="1" />

              {sortedWeights.length > 1 ? (
                <>
                  {/* Gradient fill */}
                  <path
                    d={`${pathD} L 300,85 L 0,85 Z`}
                    fill="url(#weightDarkGrad)"
                  />

                  {/* Trend Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={accentHex}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {sortedWeights.map((w, idx) => {
                    const x = (idx / (sortedWeights.length - 1 || 1)) * 300;
                    const y = 80 - ((w.weightKg - minW) / range) * 60;
                    return (
                      <circle
                        key={w.id}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#FFFFFF"
                        stroke={accentHex}
                        strokeWidth="2"
                      />
                    );
                  })}
                </>
              ) : (
                <g>
                  <line x1="0" y1="50" x2="300" y2="50" stroke={accentHex} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                  <circle cx="150" cy="50" r="4" fill="#FFFFFF" stroke={accentHex} strokeWidth="2.5" />
                  <text x="150" y="38" textAnchor="middle" fill="#8E8E93" fontSize="10" fontWeight="500">
                    {currentWeight} kg (Startwert)
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-[#8E8E93] font-medium pt-1.5">
            <span>Start: {sortedWeights[0]?.date || 'Heute'}</span>
            <span>
              {sortedWeights.length > 1
                ? `Aktuell: ${sortedWeights[sortedWeights.length - 1]?.date}`
                : '1 Messung erfasst'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. KRAFTSTEIGERUNGS-DIAGRAMM (Stärker geworden) */}
      <div className="bg-[#1C1C1E] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
              Kraftsteigerung
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
              {selectedTracked.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {hasStrengthData ? (
                <>
                  <span className="text-xs text-[#8E8E93] font-medium">
                    Aktuell {latestWeight} kg
                  </span>
                  {strengthDiff > 0 && (
                    <span
                      className="inline-flex items-center gap-0.5 text-xs font-semibold"
                      style={{ color: accentHex }}
                    >
                      <ArrowUpRight size={13} />
                      <span>+{strengthDiff} kg ({strengthDiffPercent > 0 ? `+${strengthDiffPercent}%` : ''}) stärker geworden</span>
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-[#8E8E93] font-medium">
                  {selectedTracked.targetInfo} · Noch kein Satz geloggt
                </span>
              )}
            </div>
          </div>

          <div
            className="w-10 h-10 rounded-xl bg-[#2C2C2E] flex items-center justify-center shrink-0"
            style={{ color: accentHex }}
          >
            <Trophy size={18} strokeWidth={1.75} />
          </div>
        </div>

        {/* Übungsauswahl Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {TRACKED_EXERCISES.map((ex) => {
            const isSelected = ex.id === selectedExerciseId;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedExerciseId(ex.id)}
                style={
                  isSelected
                    ? { backgroundColor: accentHex, color: accent.contrastText }
                    : undefined
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'font-semibold'
                    : 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white'
                }`}
              >
                {ex.name}
              </button>
            );
          })}
        </div>

        {/* Kraft-Diagramm oder Clean Empty State */}
        {hasStrengthData ? (
          <div className="p-4 bg-[#2C2C2E] rounded-xl space-y-4">
            <div className="flex items-center justify-between text-xs text-[#8E8E93] border-b border-[#3A3A3C] pb-2 font-medium">
              <span>Trainingsverlauf & Arbeitsgewicht</span>
              <span className="text-white font-semibold">Max: {maxStrength} kg</span>
            </div>

            {/* Säulendiagramm der Entwicklung */}
            <div className="grid grid-cols-4 gap-2 pt-2 items-end h-36">
              {progressionData.map((item, idx) => {
                const heightPercent = Math.max(
                  30,
                  Math.round(25 + ((item.weightKg - (minStrength - 2)) / (strengthRange + 4)) * 75)
                );

                return (
                  <div key={idx} className="flex flex-col items-center justify-end h-full">
                    <span
                      className={`text-xs font-bold tabular-nums mb-1.5 ${
                        item.isLatest ? 'font-extrabold' : 'text-white/90'
                      }`}
                      style={item.isLatest ? { color: accentHex } : undefined}
                    >
                      {item.weightKg} kg
                    </span>

                    <div className="w-full max-w-[42px] bg-[#1C1C1E] rounded-lg overflow-hidden h-24 flex items-end">
                      <div
                        className="w-full rounded-md transition-all duration-300"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: item.isLatest ? accentHex : '#3A3A3C',
                        }}
                      />
                    </div>

                    <span
                      className={`text-[10px] font-medium mt-2 whitespace-nowrap ${
                        item.isLatest ? 'text-white font-semibold' : 'text-[#8E8E93]'
                      }`}
                    >
                      {item.dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Zusammenfassung der Steigerung */}
            <div className="pt-2 border-t border-[#3A3A3C] flex items-center justify-between text-xs">
              <span className="text-[#8E8E93]">
                Vergleich Vorwoche:
              </span>
              <span className="font-semibold text-white">
                {previousWeight} kg <span className="text-[#8E8E93]">→</span>{' '}
                <span style={{ color: accentHex }}>{latestWeight} kg</span> (+{strengthDiff} kg)
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-[#2C2C2E] rounded-xl text-center space-y-3">
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-[#1C1C1E]"
              style={{ color: accentHex }}
            >
              <Dumbbell size={22} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Noch keine Trainingsdaten für {selectedTracked.name}
              </h4>
              <p className="text-xs text-[#8E8E93] max-w-sm mx-auto mt-1 leading-relaxed">
                Sobald du dein erstes Workout absolvierst und Sätze für {selectedTracked.name} einträgst, wird deine Kraftsteigerung hier automatisch als Diagramm erfasst.
              </p>
            </div>
            {onNavigateToTraining && (
              <button
                type="button"
                onClick={onNavigateToTraining}
                style={{ backgroundColor: accentHex, color: accent.contrastText }}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer"
              >
                <span>Zum heutigen Workout</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. PERSÖNLICHE REKORDE (PRs) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-1 block">
          Persönliche Rekorde
        </span>

        {personalRecords.length > 0 ? (
          <div className="bg-[#1C1C1E] rounded-2xl divide-y divide-[#2C2C2E]/60 overflow-hidden">
            {personalRecords.map((pr) => (
              <div
                key={pr.exerciseId}
                className="p-3.5 sm:p-4 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-semibold text-white block">
                    {pr.exerciseName}
                  </span>
                  <span className="text-xs text-[#8E8E93] block mt-0.5">
                    Erzielt am {pr.date}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold text-white tabular-nums">
                    {pr.weight} kg
                  </span>
                  <span className="text-xs text-[#8E8E93] ml-1">× {pr.reps} Wdh.</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1C1C1E] rounded-2xl p-5 text-center text-xs text-[#8E8E93]">
            Noch keine persönlichen Rekorde erfasst. Trage deine Sätze im Training ein, um Bestwerte festzuhalten.
          </div>
        )}
      </div>

      {/* 5. TRAININGSHISTORIE (Abgeschlossene Einheiten) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
            Trainingshistorie
          </span>
          <span className="text-xs text-[#8E8E93]">
            {completedWorkouts.length} Workouts erfasst
          </span>
        </div>

        <div className="bg-[#1C1C1E] rounded-2xl divide-y divide-[#2C2C2E]/60 overflow-hidden">
          {completedWorkouts.length > 0 ? (
            completedWorkouts.map((w) => {
              const totalSets = w.exercises.reduce(
                (sum, e) => sum + e.completedSets.length,
                0
              );
              const isOpened = selectedWorkout?.id === w.id;

              return (
                <div key={w.id} className="transition-colors">
                  <div
                    onClick={() => setSelectedWorkout(isOpened ? null : w)}
                    className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-[#222224] transition-colors"
                  >
                    <div>
                      <span className="text-[11px] text-[#8E8E93] font-medium block">
                        {w.date}
                      </span>
                      <h3 className="text-sm font-semibold text-white mt-0.5">
                        {w.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#8E8E93] mt-0.5">
                        <span>
                          {w.actualDurationMinutes || w.targetDurationMinutes} Min
                        </span>
                        <span>·</span>
                        <span>{w.exercises.length} Übungen</span>
                        <span>·</span>
                        <span>{totalSets} Sätze</span>
                      </div>
                    </div>

                    <div className="text-[#8E8E93]">
                      {isOpened ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </div>

                  {/* Ausklappbare Details */}
                  {isOpened && (
                    <div className="p-4 pt-1 bg-[#242426] border-t border-[#2C2C2E]/60 space-y-2 text-xs">
                      <span className="font-semibold text-[#8E8E93] block">
                        Übungen & Gewichte:
                      </span>
                      <div className="space-y-1.5">
                        {w.exercises.map((ex, i) => (
                          <div key={i} className="p-2.5 bg-[#1C1C1E] rounded-xl space-y-1">
                            <div className="flex justify-between font-medium text-white">
                              <span>{ex.exerciseName}</span>
                              <span className="text-[#8E8E93]">
                                {ex.completedSets.length} Sätze
                              </span>
                            </div>
                            {ex.completedSets.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {ex.completedSets.map((s, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="bg-[#2C2C2E] text-white/90 px-2 py-0.5 rounded-md font-mono text-[11px]"
                                  >
                                    S{s.setNumber}: {s.weight}kg × {s.repetitions}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#8E8E93] italic">Keine Sätze</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-[#8E8E93] p-5 text-center">
              Noch keine abgeschlossenen Einheiten. Starte ein Workout, um deine Historie aufzubauen.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
