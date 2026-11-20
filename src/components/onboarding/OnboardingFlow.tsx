import React, { useState } from 'react';
import { DayOfWeek, FitnessGoal, UserProfile } from '../../types';
import { getDayNameDe, getShortDayNameDe } from '../../services/trainingPlan';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Dumbbell,
  Home,
  Trash2,
  Upload,
} from 'lucide-react';

interface OnboardingFlowProps {
  initialName?: string;
  initialEmail?: string;
  onFinishOnboarding: (userData: Partial<UserProfile>) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialName = 'Damian',
  initialEmail = 'dadaskimann981@gmail.com',
  onFinishOnboarding,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Über dich & Profilbild
  const [name, setName] = useState(initialName);
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [age, setAge] = useState<number>(16);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [heightCm, setHeightCm] = useState<number>(182);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(81.5);

  // Image Upload Handler
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setProfileImage(compressed);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Dein Ziel
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('fat_loss');
  const [targetWeightKg, setTargetWeightKg] = useState<number>(75.0);

  // Step 3: Wann trainierst du?
  const [trainingDays, setTrainingDays] = useState<DayOfWeek[]>([2, 4, 6]);
  const [homeTrainingDays, setHomeTrainingDays] = useState<DayOfWeek[]>([]);
  const [preferredGymDurationMinutes, setPreferredGymDurationMinutes] = useState<number>(60);

  const allDays: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]; // Mo - So

  const toggleDay = (day: DayOfWeek) => {
    if (trainingDays.includes(day)) {
      if (trainingDays.length > 1) {
        setTrainingDays(trainingDays.filter((d) => d !== day));
        setHomeTrainingDays(homeTrainingDays.filter((d) => d !== day));
      }
    } else {
      setTrainingDays([...trainingDays, day]);
    }
  };

  const toggleDayLocation = (day: DayOfWeek, loc: 'gym' | 'home') => {
    if (loc === 'home') {
      if (!homeTrainingDays.includes(day)) {
        setHomeTrainingDays([...homeTrainingDays, day]);
      }
    } else {
      setHomeTrainingDays(homeTrainingDays.filter((d) => d !== day));
    }
  };

  const handleComplete = () => {
    onFinishOnboarding({
      name: name.trim() || 'Damian',
      email: initialEmail,
      profileImage,
      age: Number(age) || 16,
      gender,
      heightCm: Number(heightCm) || 182,
      currentWeightKg: Number(currentWeightKg) || 81.5,
      targetWeightKg: Number(targetWeightKg) || 75.0,
      fitnessGoal,
      trainingDays,
      homeTrainingDays,
      preferredGymDurationMinutes,
      isOnboarded: true,
      unit: 'kg',
      notificationsEnabled: true,
    });
  };

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col justify-between max-w-md mx-auto p-5 select-none"
      style={{
        paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 1.25rem), 1.5rem)',
        paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 1.25rem), 1.5rem)',
      }}
    >
      {/* Header & Step progress */}
      <div>
        <div className="flex items-center justify-between pt-2 mb-4">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="w-10 h-10 rounded-full bg-[#1C1C1E] border border-[#2C2C2E] flex items-center justify-center text-white hover:bg-[#2C2C2E] transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}

          <div className="flex items-center gap-1.5">
            <span
              style={step >= 1 ? { backgroundColor: 'var(--accent, #30D158)' } : undefined}
              className={`w-6 h-1 rounded-full transition-colors ${
                step >= 1 ? '' : 'bg-[#2C2C2E]'
              }`}
            />
            <span
              style={step >= 2 ? { backgroundColor: 'var(--accent, #30D158)' } : undefined}
              className={`w-6 h-1 rounded-full transition-colors ${
                step >= 2 ? '' : 'bg-[#2C2C2E]'
              }`}
            />
            <span
              style={step >= 3 ? { backgroundColor: 'var(--accent, #30D158)' } : undefined}
              className={`w-6 h-1 rounded-full transition-colors ${
                step >= 3 ? '' : 'bg-[#2C2C2E]'
              }`}
            />
          </div>

          <span className="text-xs font-semibold text-[#8E8E93] tabular-nums">
            Schritt {step} von 3
          </span>
        </div>
      </div>

      {/* Main Step Content */}
      <div className="my-auto py-4">
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block"
                style={{ color: 'var(--accent, #30D158)' }}
              >
                Schritt 1
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                Über dich
              </h1>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Grundlage für die Berechnung deiner Pläne und Gewichte.
              </p>
            </div>

            {/* Profile Picture Upload */}
            <div className="flex items-center gap-4 p-4 bg-[#1C1C1E] rounded-2xl border border-[#2C2C2E]/60">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#2C2C2E] text-white flex items-center justify-center font-bold text-xl overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profilbild"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{name.charAt(0).toUpperCase() || 'D'}</span>
                  )}
                </div>
                <label
                  htmlFor="onboarding-avatar-upload"
                  style={{
                    backgroundColor: 'var(--accent, #30D158)',
                    color: 'var(--accent-contrast, #000000)',
                  }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                  title="Foto hochladen"
                >
                  <Camera size={12} />
                  <input
                    id="onboarding-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-white block">
                  Dein Profilbild
                </span>
                <p className="text-[11px] text-[#8E8E93]">
                  Optional für dein Profil
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <label
                    htmlFor="onboarding-avatar-upload"
                    className="px-2.5 py-1 rounded-lg bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[11px] font-medium text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Upload size={11} />
                    <span>{profileImage ? 'Foto ändern' : 'Foto hochladen'}</span>
                  </label>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => setProfileImage(undefined)}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 size={11} />
                      <span>Löschen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                  Vorname
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dein Vorname"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#1C1C1E] text-sm text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                    Alter
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#1C1C1E] text-sm text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                    Geschlecht
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl bg-[#1C1C1E] text-sm text-white focus:outline-hidden"
                  >
                    <option value="male">Männlich</option>
                    <option value="female">Weiblich</option>
                    <option value="other">Divers</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                    Größe (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#1C1C1E] text-sm text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                    Gewicht (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentWeightKg}
                    onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#1C1C1E] text-sm text-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block"
                style={{ color: 'var(--accent, #30D158)' }}
              >
                Schritt 2
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                Dein Ziel
              </h1>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Der Plan passt Volumen und Übungen auf deinen Fokus an.
              </p>
            </div>

            {/* Goal options */}
            <div className="space-y-2">
              {[
                { id: 'fat_loss', title: 'Fettabbau', desc: 'Körperfett reduzieren & Muskulatur definieren' },
                { id: 'muscle_gain', title: 'Muskelaufbau', desc: 'Hypertrophie & progressive Steigerung' },
                { id: 'strength', title: 'Kraftaufbau', desc: 'Maximalkraft auf Grundübungen' },
                { id: 'general_fitness', title: 'Fitness & Gesundheit', desc: 'Gesunde Athletik & Mobilität' },
              ].map((g) => {
                const active = fitnessGoal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setFitnessGoal(g.id as any)}
                    style={active ? { borderColor: 'var(--accent, #30D158)' } : undefined}
                    className={`w-full p-4 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer ${
                      active
                        ? 'bg-[#2C2C2E] border'
                        : 'bg-[#1C1C1E] border border-[#2C2C2E]/60 hover:bg-[#242426]'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        {g.title}
                      </span>
                      <span className="text-xs text-[#8E8E93] block mt-0.5">
                        {g.desc}
                      </span>
                    </div>

                    <div
                      style={
                        active
                          ? {
                              backgroundColor: 'var(--accent, #30D158)',
                              borderColor: 'var(--accent, #30D158)',
                              color: 'var(--accent-contrast, #000000)',
                            }
                          : undefined
                      }
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        active ? '' : 'border-[#3A3A3C]'
                      }`}
                    >
                      {active && <Check size={12} strokeWidth={2.5} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional Target Weight */}
            <div className="pt-2">
              <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                Wunschgewicht (kg)
              </label>
              <input
                type="number"
                step="0.5"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                placeholder="z. B. 75"
                className="w-full h-11 px-3.5 rounded-xl bg-[#1C1C1E] text-sm text-white focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block"
                style={{ color: 'var(--accent, #30D158)' }}
              >
                Schritt 3
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                Trainingstage
              </h1>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Wähle deine bevorzugten Tage für den Split.
              </p>
            </div>

            {/* Training Days Checklist */}
            <div className="space-y-2">
              {allDays.map((day) => {
                const checked = trainingDays.includes(day);
                const isHome = homeTrainingDays.includes(day);

                return (
                  <div
                    key={day}
                    className={`p-3.5 rounded-xl transition-colors ${
                      checked
                        ? 'bg-[#1C1C1E] border border-[#3A3A3C]'
                        : 'bg-[#1C1C1E]/60 border border-[#2C2C2E]/60'
                    }`}
                  >
                    <div
                      onClick={() => toggleDay(day)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <span className="text-sm font-semibold text-white">
                        {getDayNameDe(day)}
                      </span>
                      <div
                        style={
                          checked
                            ? {
                                backgroundColor: 'var(--accent, #30D158)',
                                borderColor: 'var(--accent, #30D158)',
                                color: 'var(--accent-contrast, #000000)',
                              }
                            : undefined
                        }
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          checked ? '' : 'border-[#3A3A3C]'
                        }`}
                      >
                        {checked && <Check size={12} strokeWidth={2.5} />}
                      </div>
                    </div>

                    {/* Quick Location Switcher if day is active */}
                    {checked && (
                      <div className="mt-2.5 pt-2.5 border-t border-[#2C2C2E]/60 flex items-center justify-between gap-2">
                        <span className="text-xs text-[#8E8E93]">
                          Ort:
                        </span>
                        <div className="flex items-center gap-1 bg-[#2C2C2E] p-0.5 rounded-lg shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDayLocation(day, 'gym');
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              !isHome
                                ? 'bg-[#3A3A3C] text-white'
                                : 'text-[#8E8E93] hover:text-white'
                            }`}
                          >
                            Gym
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDayLocation(day, 'home');
                            }}
                            style={
                              isHome
                                ? {
                                    backgroundColor: 'var(--accent, #30D158)',
                                    color: 'var(--accent-contrast, #000000)',
                                  }
                                : undefined
                            }
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              isHome
                                ? 'font-semibold'
                                : 'text-[#8E8E93] hover:text-white'
                            }`}
                          >
                            Zuhause
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Preferred Gym Duration */}
            <div className="p-4 bg-[#1C1C1E] rounded-xl border border-[#2C2C2E]/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">
                  Gewünschte Dauer im Gym
                </span>
                <span className="text-xs font-bold" style={{ color: 'var(--accent, #30D158)' }}>
                  {preferredGymDurationMinutes} Min
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[30, 45, 60, 75, 90].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setPreferredGymDurationMinutes(dur)}
                    style={
                      preferredGymDurationMinutes === dur
                        ? {
                            backgroundColor: 'var(--accent, #30D158)',
                            color: 'var(--accent-contrast, #000000)',
                          }
                        : undefined
                    }
                    className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      preferredGymDurationMinutes === dur
                        ? 'font-semibold'
                        : 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Button */}
      <div className="pt-4">
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as any)}
            className="w-full h-12 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Weiter</span>
            <ArrowRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            style={{
              backgroundColor: 'var(--accent, #30D158)',
              color: 'var(--accent-contrast, #000000)',
            }}
            className="w-full h-12 rounded-xl hover:opacity-95 font-semibold text-sm flex items-center justify-center gap-2 transition-opacity cursor-pointer shadow-xs"
          >
            <Check size={16} strokeWidth={2.5} />
            <span>Trainingsplan erstellen</span>
          </button>
        )}
      </div>
    </div>
  );
};
