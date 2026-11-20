import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Share,
  PlusSquare,
  Copy,
  Check,
  ExternalLink,
  Zap,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const PERMANENT_APP_URL = 'https://ais-pre-2uhnstficqc56lokdvscrx-340351295214.us-west2.run.app';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;
  const [copied, setCopied] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
  }, []);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PERMANENT_APP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isCurrentDevUrl = typeof window !== 'undefined' && window.location.hostname.includes('ais-dev-');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1C1C1E] border border-[#2C2C2E] rounded-3xl p-6 shadow-2xl space-y-5 text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-black border border-[#3A3A3C] p-2 flex items-center justify-center shrink-0 shadow-lg">
            <svg viewBox="0 0 512 512" fill="none" className="w-full h-full">
              <path
                d="M80 266 H174 L215 133 L261 379 L302 195 L333 266 H432"
                stroke="#FF453A"
                strokeWidth="48"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="80" cy="266" r="32" fill="#FF453A" />
              <circle cx="432" cy="266" r="32" fill="#FF453A" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              PULSE als iOS-App installieren
            </h2>
            <p className="text-xs text-[#8E8E93] font-medium">
              Autonomer Start ohne AI Studio
            </p>
          </div>
        </div>

        {/* Explanatory Box */}
        <div className="p-3.5 bg-black/40 border border-[#2C2C2E] rounded-2xl space-y-2">
          <div className="flex items-start gap-2.5">
            <Zap size={16} className="text-[#FF453A] shrink-0 mt-0.5" />
            <div className="text-xs text-[#AEAEB2] leading-relaxed">
              <strong className="text-white block font-medium">Warum war die App vorher nicht erreichbar?</strong>
              Der temporäre Entwickler-Link (<code className="text-[#FF453A] font-mono text-[10px]">ais-dev-...</code>) läuft nur, wenn das AI Studio Projekt aktiv geöffnet ist.
              <br /><br />
              Mit dem <strong className="text-white">dauerhaften App-Link</strong> (<code className="text-emerald-400 font-mono text-[10px]">ais-pre-...</code>) und unserem neuen <strong className="text-white">Offline-PWA-Speicher</strong> wacht der Server bei jedem Klick sofort automatisch auf und die App startet in Millisekunden!
            </div>
          </div>
        </div>

        {/* Link Copy Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
            Dauerhafter App-Link
          </label>
          <div className="flex items-center gap-2 bg-[#2C2C2E]/80 p-2 rounded-xl border border-[#3A3A3C]">
            <input
              type="text"
              readOnly
              value={PERMANENT_APP_URL}
              className="flex-1 bg-transparent text-xs text-emerald-400 font-mono focus:outline-none truncate select-all px-1"
            />
            <button
              onClick={handleCopy}
              style={copied ? { backgroundColor: '#34C759', color: '#000' } : { backgroundColor: accentHex, color: accent.contrastText }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
          </div>
          {isCurrentDevUrl && (
            <a
              href={PERMANENT_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Jetzt im dauerhaften Link öffnen</span>
            </a>
          )}
        </div>

        {/* iOS Step-by-Step Instructions */}
        <div className="space-y-3 pt-1">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Anleitung für iPhone / iPad (Safari):
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 bg-[#242426] p-3 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-[#3A3A3C] text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <div className="text-xs text-[#E5E5EA]">
                Öffne den obigen dauerhaften Link im <strong className="text-white">Safari-Browser</strong> auf deinem iPhone.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#242426] p-3 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-[#3A3A3C] text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <div className="text-xs text-[#E5E5EA]">
                Tippe unten in der Safari-Leiste auf das <strong className="text-white">Teilen-Symbol</strong>
                <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-[#3A3A3C] text-white">
                  <Share size={12} className="inline mr-1" /> Teilen
                </span>
                (Viereck mit Pfeil nach oben).
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#242426] p-3 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-[#3A3A3C] text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <div className="text-xs text-[#E5E5EA]">
                Scrolle nach unten und wähle
                <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-[#3A3A3C] text-white font-medium">
                  <PlusSquare size={12} className="inline mr-1" /> Zum Home-Bildschirm
                </span>
                aus und tippe oben rechts auf <strong className="text-white">Hinzufügen</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Benefits badge */}
        <div className="flex items-center gap-2 text-[11px] text-[#8E8E93] pt-1">
          <ShieldCheck size={14} className="text-[#34C759] shrink-0" />
          <span>Startet im nativen Vollbildmodus, speichert Workouts lokal und wacht automatisch auf.</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          Verstanden & Schließen
        </button>
      </div>
    </div>
  );
};
