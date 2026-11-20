import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Dumbbell, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import heroImage from '../../assets/images/coach_welcome_hero_1790450380429.jpg';

interface LoginScreenProps {
  onLoginSuccess: (user: { name: string; email: string }) => void;
  isLoading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  isLoading: propLoading = false,
}) => {
  const [emailInput, setEmailInput] = useState('dadaskimann981@gmail.com');
  const [nameInput, setNameInput] = useState('Damian');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customEmailMode, setCustomEmailMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSelect = (selectedEmail: string, selectedName: string) => {
    setIsSubmitting(true);
    setShowGoogleModal(false);
    onLoginSuccess({
      name: selectedName,
      email: selectedEmail,
    });
  };

  const handleDirectEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubmitting(true);
    const inferredName =
      nameInput.trim() ||
      emailInput.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    onLoginSuccess({
      name: inferredName,
      email: emailInput.trim(),
    });
  };

  const isLoading = propLoading || isSubmitting;

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col justify-between max-w-md mx-auto relative px-5 select-none"
      style={{
        paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 1.25rem), 1.5rem)',
        paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 1.25rem), 1.5rem)',
      }}
    >
      {/* Background Hero Asset */}
      <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden mb-6 bg-[#1C1C1E] border border-[#2C2C2E]/60">
        <img
          src={heroImage}
          alt="PULSE Gym Studio"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-5 text-white">
          <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--accent, #30D158)' }}>
            <Dumbbell size={16} strokeWidth={2} />
            <span className="text-[11px] font-bold tracking-widest uppercase">
              PULSE COACH
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            Dein digitaler Gym-Coach.
          </h1>
          <p className="text-xs text-[#8E8E93] mt-1 font-medium">
            Melde dich an, um deine Trainingsdaten zu synchronisieren.
          </p>
        </div>
      </div>

      {/* Feature Bullet Points */}
      <div className="space-y-4 px-1 my-auto">
        <div className="flex items-start gap-3">
          <div
            className="w-7 h-7 rounded-full bg-[#1C1C1E] flex items-center justify-center shrink-0 mt-0.5"
            style={{ color: 'var(--accent, #30D158)' }}
          >
            <CheckCircle2 size={15} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Echtzeit-Synchronisierung
            </h3>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Workouts, Kraftwerte & Gewichte sind unter deiner E-Mail gesichert.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="w-7 h-7 rounded-full bg-[#1C1C1E] flex items-center justify-center shrink-0 mt-0.5"
            style={{ color: 'var(--accent, #30D158)' }}
          >
            <Sparkles size={15} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Automatische Plangestaltung
            </h3>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Gym- und Home-Workouts angepasst an deine Wunschzeit (z. B. 60 Min).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="w-7 h-7 rounded-full bg-[#1C1C1E] flex items-center justify-center shrink-0 mt-0.5"
            style={{ color: 'var(--accent, #30D158)' }}
          >
            <ShieldCheck size={15} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Kein Datenverlust
            </h3>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Einmal eingerichtet: Anmelden und direkt weiter trainieren.
            </p>
          </div>
        </div>
      </div>

      {/* Login Actions */}
      <div className="pt-6 space-y-2.5">
        {/* Google Login Button */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-[#2C2C2E]/60 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isLoading ? 'Synchronisiere...' : 'Mit Google anmelden'}</span>
        </button>

        {/* Alternative: E-Mail Login Toggle */}
        {!customEmailMode ? (
          <button
            type="button"
            onClick={() => setCustomEmailMode(true)}
            className="w-full h-11 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] text-[#8E8E93] hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Mail size={14} />
            <span>Mit E-Mail-Adresse anmelden</span>
          </button>
        ) : (
          <form onSubmit={handleDirectEmailSubmit} className="space-y-2 pt-1 animate-in fade-in duration-150">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8E8E93] block">Deine E-Mail</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full h-11 px-3.5 rounded-xl bg-[#2C2C2E] text-xs font-semibold text-white focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: 'var(--accent, #30D158)', color: 'var(--accent-contrast, #000000)' }}
              className="w-full h-11 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
            >
              <span>{isLoading ? 'Lade Daten...' : 'Anmelden & Daten laden'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        <p className="text-[11px] text-[#8E8E93] text-center font-medium pt-1">
          Sichere Synchronisierung über deine E-Mail-Adresse
        </p>
      </div>

      {/* Google Account Picker Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1C1C1E] text-white rounded-2xl p-6 border border-[#2C2C2E] space-y-4">
            <div className="flex items-center gap-3 border-b border-[#2C2C2E] pb-3">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-bold text-white">Google-Konto wählen</h4>
                <p className="text-[11px] text-[#8E8E93]">für PULSE Coach</p>
              </div>
            </div>

            {/* User Account Option */}
            <button
              onClick={() => handleGoogleSelect('dadaskimann981@gmail.com', 'Damian')}
              className="w-full p-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] border border-[#3A3A3C] flex items-center gap-3 transition-colors text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-black text-white font-bold flex items-center justify-center text-sm shrink-0 border border-[#3A3A3C]">
                D
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-white block truncate">
                  Damian
                </span>
                <span className="text-[11px] text-[#8E8E93] block truncate">
                  dadaskimann981@gmail.com
                </span>
              </div>
            </button>

            {/* Custom Google Account Option */}
            <div className="pt-1">
              <button
                onClick={() => {
                  setShowGoogleModal(false);
                  setCustomEmailMode(true);
                }}
                className="w-full py-2.5 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-medium text-[#8E8E93] hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail size={13} />
                <span>Anderes Konto verwenden</span>
              </button>
            </div>

            <button
              onClick={() => setShowGoogleModal(false)}
              className="w-full py-2 rounded-xl text-xs font-medium text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
