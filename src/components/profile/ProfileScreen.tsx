import React, { useEffect, useState } from 'react';
import { DayOfWeek, FitnessGoal, UserProfile } from '../../types';
import { getDayNameDe, getShortDayNameDe } from '../../services/trainingPlan';
import {
  Camera,
  Check,
  ChevronRight,
  Copy,
  Dumbbell,
  Edit2,
  ExternalLink,
  Home,
  LineChart,
  LogOut,
  Moon,
  Palette,
  RefreshCw,
  Scale,
  Share,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PWAInstallModal, PERMANENT_APP_URL } from '../common/PWAInstallModal';

interface ProfileScreenProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onResetPlan: () => void;
  onSignOut: () => void;
  onNavigateToProgress: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onUpdateUser,
  onResetPlan,
  onSignOut,
  onNavigateToProgress,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editGender, setEditGender] = useState<'male' | 'female'>(user.gender === 'female' ? 'female' : 'male');
  const [editAge, setEditAge] = useState(user.age);
  const [editHeight, setEditHeight] = useState(user.heightCm);
  const [editWeight, setEditWeight] = useState(user.currentWeightKg);
  const [editTargetWeight, setEditTargetWeight] = useState(user.targetWeightKg || 78);
  const [editGoal, setEditGoal] = useState<FitnessGoal>(user.fitnessGoal);
  const [editDays, setEditDays] = useState<DayOfWeek[]>(user.trainingDays || [2, 4, 6]);
  const [editHomeDays, setEditHomeDays] = useState<DayOfWeek[]>(user.homeTrainingDays || [4]);
  const [editGymDuration, setEditGymDuration] = useState<number>(user.preferredGymDurationMinutes || 45);
  const [editProfileImage, setEditProfileImage] = useState<string | undefined>(user.profileImage);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setEditName(user.name);
    setEditGender(user.gender === 'female' ? 'female' : 'male');
    setEditAge(user.age);
    setEditHeight(user.heightCm);
    setEditWeight(user.currentWeightKg);
    setEditTargetWeight(user.targetWeightKg || 78);
    setEditGoal(user.fitnessGoal);
    setEditDays(user.trainingDays || [2, 4, 6]);
    setEditHomeDays(user.homeTrainingDays || [4]);
    setEditGymDuration(user.preferredGymDurationMinutes || 45);
    setEditProfileImage(user.profileImage);
  }, [user]);

  const { themeMode, accentColor, accent, setThemeMode, setAccentColor, palette } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  const goalLabels: Record<FitnessGoal, string> = {
    muscle_gain: 'Muskelaufbau',
    fat_loss: 'Fettabbau',
    strength: 'Kraftaufbau',
    general_fitness: 'Fitness & Gesundheit',
  };

  const allDays: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]; // Mo to So

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setEditProfileImage(compressed);
          onUpdateUser({
            ...user,
            profileImage: compressed,
          });
          setFeedback('Profilbild aktualisiert');
          setTimeout(() => setFeedback(null), 3000);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setEditProfileImage(undefined);
    onUpdateUser({
      ...user,
      profileImage: undefined,
    });
    setFeedback('Profilbild entfernt');
    setTimeout(() => setFeedback(null), 3000);
  };

  const toggleDay = (day: DayOfWeek) => {
    if (editDays.includes(day)) {
      if (editDays.length > 1) {
        setEditDays(editDays.filter((d) => d !== day));
        setEditHomeDays(editHomeDays.filter((d) => d !== day));
      }
    } else {
      setEditDays([...editDays, day]);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      name: editName.trim() || user.name,
      gender: editGender,
      age: Number(editAge),
      heightCm: Number(editHeight),
      currentWeightKg: Number(editWeight),
      targetWeightKg: Number(editTargetWeight),
      fitnessGoal: editGoal,
      trainingDays: editDays,
      homeTrainingDays: editHomeDays.filter((d) => editDays.includes(d)),
      preferredGymDurationMinutes: editGymDuration,
      profileImage: editProfileImage,
    };
    onUpdateUser(updated);
    setIsEditing(false);
    setFeedback('Änderungen gespeichert');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Profil
          </h1>
          <p className="text-xs text-[#8E8E93] mt-1 font-medium">
            Körperdaten & Einstellungen
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          style={isEditing ? { backgroundColor: accentHex, color: accent.contrastText } : undefined}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            isEditing
              ? ''
              : 'bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white'
          }`}
        >
          <Edit2 size={13} />
          <span>{isEditing ? 'Fertig' : 'Bearbeiten'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-[#1C1C1E] border border-[#2C2C2E]/60 rounded-xl text-xs text-white/90">
          {feedback}
        </div>
      )}

      {/* Profile Form (Edit Mode) */}
      {isEditing ? (
        <form
          onSubmit={handleSaveProfile}
          className="bg-[#1C1C1E] rounded-2xl p-5 space-y-5 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#2C2C2E] text-white flex items-center justify-center font-bold text-xl shrink-0">
                {editProfileImage ? (
                  <img
                    src={editProfileImage}
                    alt={editName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{editName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <label
                htmlFor="avatar-upload-edit"
                style={{ backgroundColor: accentHex, color: accent.contrastText }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                title="Foto ändern"
              >
                <Camera size={12} />
                <input
                  id="avatar-upload-edit"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-white block">Profilbild</span>
              <div className="flex items-center gap-2 mt-1.5">
                <label
                  htmlFor="avatar-upload-edit"
                  className="px-2.5 py-1 rounded-lg bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[11px] font-medium text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Upload size={11} />
                  <span>Foto hochladen</span>
                </label>
                {editProfileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveProfileImage}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 size={11} />
                    <span>Löschen</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#2C2C2E] text-sm text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                Geschlecht (Körpermodell)
              </label>
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value as 'male' | 'female')}
                className="w-full h-11 px-3.5 rounded-xl bg-[#2C2C2E] text-sm text-white focus:outline-hidden"
              >
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                Alter
              </label>
              <input
                type="number"
                min="14"
                max="100"
                value={editAge}
                onChange={(e) => setEditAge(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl bg-[#2C2C2E] text-sm text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                Größe (cm)
              </label>
              <input
                type="number"
                min="120"
                max="240"
                value={editHeight}
                onChange={(e) => setEditHeight(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl bg-[#2C2C2E] text-sm text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                Aktuelles Gewicht (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={editWeight}
                onChange={(e) => setEditWeight(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl bg-[#2C2C2E] text-sm text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                Wunschgewicht (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={editTargetWeight}
                onChange={(e) => setEditTargetWeight(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl bg-[#2C2C2E] text-sm text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#8E8E93] block mb-1">
                Fitnessziel
              </label>
              <select
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value as FitnessGoal)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#2C2C2E] text-sm text-white focus:outline-hidden"
              >
                <option value="muscle_gain">Muskelaufbau</option>
                <option value="fat_loss">Fettabbau</option>
                <option value="strength">Kraftaufbau</option>
                <option value="general_fitness">Allgemeine Fitness</option>
              </select>
            </div>
          </div>

          {/* Training Days */}
          <div>
            <label className="text-xs font-medium text-[#8E8E93] block mb-1.5">
              Trainingstage
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {allDays.map((day) => {
                const isChecked = editDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={isChecked ? { backgroundColor: accentHex, color: accent.contrastText } : undefined}
                    className={`py-2 rounded-xl text-center text-xs font-semibold transition-colors cursor-pointer ${
                      isChecked
                        ? ''
                        : 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <span>{getShortDayNameDe(day)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              style={{ backgroundColor: accentHex, color: accent.contrastText }}
              className="flex-1 py-3 rounded-xl hover:opacity-95 font-semibold text-xs transition-opacity cursor-pointer shadow-xs"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="py-3 px-5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : (
        /* READ-ONLY VIEW: iOS SETTINGS GROUPED STYLE */
        <div className="space-y-6">
          {/* User Profile Header Block */}
          <div className="bg-[#1C1C1E] rounded-2xl p-5 flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#2C2C2E] text-white flex items-center justify-center font-bold text-xl shrink-0">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <label
                htmlFor="avatar-upload-main"
                style={{ backgroundColor: accentHex, color: accent.contrastText }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                title="Foto hochladen"
              >
                <Camera size={12} />
                <input
                  id="avatar-upload-main"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-xs text-[#8E8E93] mt-0.5 font-medium">
                {user.email || 'dadaskimann981@gmail.com'}
              </p>
            </div>
          </div>

          {/* Section 1: KÖRPERDATEN (iOS Settings Grouped Style) */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-1 block">
              Körperdaten & Ziele
            </span>
            <div className="bg-[#1C1C1E] rounded-2xl divide-y divide-[#2C2C2E]/60 overflow-hidden">
              <div className="p-3.5 flex items-center justify-between text-sm">
                <span className="text-white/90">Geschlecht</span>
                <span className="text-[#8E8E93] font-medium">
                  {user.gender === 'female' ? 'Weiblich' : 'Männlich'}
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between text-sm">
                <span className="text-white/90">Aktuelles Gewicht</span>
                <span className="text-[#8E8E93] font-medium tabular-nums">
                  {user.currentWeightKg} kg
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between text-sm">
                <span className="text-white/90">Wunschgewicht</span>
                <span className="text-[#8E8E93] font-medium tabular-nums">
                  {user.targetWeightKg || '—'} kg
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between text-sm">
                <span className="text-white/90">Größe</span>
                <span className="text-[#8E8E93] font-medium tabular-nums">
                  {user.heightCm} cm
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between text-sm">
                <span className="text-white/90">Alter</span>
                <span className="text-[#8E8E93] font-medium tabular-nums">
                  {user.age} Jahre
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between text-sm">
                <span className="text-white/90">Hauptziel</span>
                <span className="text-[#8E8E93] font-medium">
                  {goalLabels[user.fitnessGoal]}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: TRAININGSPLAN & ZEIT (iOS Settings Grouped Style) */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-1 block">
              Trainingsplan & Zeiten
            </span>
            <div className="bg-[#1C1C1E] rounded-2xl divide-y divide-[#2C2C2E]/60 overflow-hidden">
              <div className="p-3.5 flex items-center justify-between text-sm">
                <span className="text-white/90">Trainingstage</span>
                <span className="text-[#8E8E93] font-medium">
                  {user.trainingDays && user.trainingDays.length > 0
                    ? user.trainingDays
                        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                        .map((d) => getShortDayNameDe(d))
                        .join(' · ')
                    : 'Keine'}
                </span>
              </div>

              {/* Home-Tage */}
              <div className="p-3.5 flex items-center justify-between text-sm">
                <span className="text-white/90">Feste Home-Tage</span>
                <span className="text-[#8E8E93] font-medium">
                  {(user.homeTrainingDays || []).length > 0
                    ? (user.homeTrainingDays || [])
                        .map((d) => getShortDayNameDe(d))
                        .join(' · ')
                    : 'Alle im Gym'}
                </span>
              </div>

              {/* Gym-Dauer Selector */}
              <div className="p-3.5 flex items-center justify-between text-sm">
                <span className="text-white/90">Bevorzugte Gym-Dauer</span>
                <div className="flex items-center gap-1">
                  {[30, 45, 60, 90].map((dur) => {
                    const active = (user.preferredGymDurationMinutes || 45) === dur;
                    return (
                      <button
                        key={dur}
                        type="button"
                        onClick={() =>
                          onUpdateUser({
                            ...user,
                            preferredGymDurationMinutes: dur,
                          })
                        }
                        style={active ? { backgroundColor: accentHex, color: accent.contrastText } : undefined}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? ''
                            : 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white'
                        }`}
                      >
                        {dur}m
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section: ERSCHEINUNGSBILD & FARBEN */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-1 block">
              Erscheinungsbild & Farben
            </span>
            <div className="bg-[#1C1C1E] rounded-2xl p-4 sm:p-5 space-y-4">
              {/* Dark / Light Mode Toggle */}
              <div>
                <span className="text-xs font-semibold text-white block mb-2">
                  Design-Modus
                </span>
                <div className="grid grid-cols-2 gap-2 bg-[#2C2C2E] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setThemeMode('dark');
                      onUpdateUser({ ...user, themeMode: 'dark' });
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      themeMode === 'dark'
                        ? 'bg-[#1C1C1E] text-white shadow-xs'
                        : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <Moon size={14} />
                    <span>Dunkel (Dark)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setThemeMode('light');
                      onUpdateUser({ ...user, themeMode: 'light' });
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      themeMode === 'light'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <Sun size={14} />
                    <span>Hell (Light)</span>
                  </button>
                </div>
              </div>

              {/* Accent Color Selection Palette */}
              <div className="pt-2 border-t border-[#2C2C2E]/60">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-white">
                    Akzentfarbe
                  </span>
                  <span className="text-xs font-medium" style={{ color: accentHex }}>
                    {accent.label}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {palette.map((item) => {
                    const isSelected = accentColor === item.id;
                    const itemHex = themeMode === 'light' ? item.lightHex : item.hex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setAccentColor(item.id);
                          onUpdateUser({ ...user, accentColor: item.id });
                        }}
                        title={item.label}
                        className={`h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-white scale-105 shadow-md'
                            : 'hover:scale-102 opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: itemHex }}
                      >
                        {isSelected && (
                          <Check
                            size={16}
                            strokeWidth={3}
                            style={{ color: item.contrastText }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section: IPHONE HOME-BILDSCHIRM & DAUERHAFTER APP-START */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
                Home-Bildschirm & App-Start
              </span>
              <span className="text-[11px] text-[#34C759] font-medium flex items-center gap-1">
                <ShieldCheck size={13} />
                PWA Offline-Cache aktiv
              </span>
            </div>
            <div className="bg-[#1C1C1E] rounded-2xl p-4 sm:p-5 space-y-4 border border-[#2C2C2E]/60">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2C2C2E] text-white flex items-center justify-center shrink-0">
                  <Smartphone size={20} className="text-[#FF453A]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    PULSE direkt auf dem iPhone starten
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-0.5 leading-relaxed">
                    Damit die App beim Tippen auf das Lesezeichen <strong>sofort aufwacht</strong> und nicht „nicht erreichbar“ meldet, muss der dauerhafte Freigabe-Link verwendet werden.
                  </p>
                </div>
              </div>

              {/* Permanent Link display with copy button */}
              <div className="bg-[#242426] p-2.5 rounded-xl border border-[#3A3A3C]/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                    Dauerhafter Freigabe-Link
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Autonomer Wake-up</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={PERMANENT_APP_URL}
                    className="flex-1 bg-black/40 px-2.5 py-1.5 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none select-all truncate border border-[#3A3A3C]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(PERMANENT_APP_URL);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    style={copiedLink ? { backgroundColor: '#34C759', color: '#000' } : { backgroundColor: accentHex, color: accent.contrastText }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-xs"
                  >
                    {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedLink ? 'Kopiert' : 'Kopieren'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowInstallModal(true)}
                  style={{ backgroundColor: accentHex, color: accent.contrastText }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Share size={14} />
                  <span>Anleitung für iPhone Home-Bildschirm</span>
                </button>
                <a
                  href={PERMANENT_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>Dauerhaften Link öffnen</span>
                </a>
              </div>
            </div>
          </div>

          {/* Section 3: ACCOUNT & SYSTEM (iOS Settings Grouped Style) */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider px-1 block">
              Konto
            </span>
            <div className="bg-[#1C1C1E] rounded-2xl divide-y divide-[#2C2C2E]/60 overflow-hidden">
              <button
                type="button"
                onClick={onResetPlan}
                className="w-full p-3.5 flex items-center justify-between text-sm text-left hover:bg-[#222224] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-white/90">
                  <RefreshCw size={15} className="text-[#8E8E93]" />
                  <span>Trainingsplan neu generieren</span>
                </div>
                <ChevronRight size={16} className="text-[#8E8E93]" />
              </button>

              <button
                type="button"
                onClick={onSignOut}
                className="w-full p-3.5 flex items-center justify-between text-sm text-left hover:bg-[#222224] transition-colors cursor-pointer text-rose-500 font-medium"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut size={15} />
                  <span>Abmelden</span>
                </div>
                <ChevronRight size={16} className="text-rose-500/60" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA iOS Home-Screen Guide Modal */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
