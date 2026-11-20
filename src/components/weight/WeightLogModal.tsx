import React, { useState } from 'react';
import { WeightEntry } from '../../types';
import { Check, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface WeightLogModalProps {
  currentWeight: number;
  onSaveWeight: (entry: WeightEntry) => void;
  onClose: () => void;
}

export const WeightLogModal: React.FC<WeightLogModalProps> = ({
  currentWeight,
  onSaveWeight,
  onClose,
}) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  const todayStr = new Date().toISOString().split('T')[0];
  const [weight, setWeight] = useState<number>(currentWeight || 81.5);
  const [date, setDate] = useState<string>(todayStr);
  const [note, setNote] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || weight <= 0) return;

    onSaveWeight({
      id: `w-${Date.now()}`,
      date,
      weightKg: Number(weight),
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md bg-[#1C1C1E] text-white rounded-t-3xl sm:rounded-2xl p-6 border border-[#2C2C2E] space-y-5 animate-in slide-in-from-bottom-4 duration-150">
        {/* iOS Grabber */}
        <div className="sm:hidden -mt-2 mb-1 flex justify-center">
          <div className="w-9 h-1 bg-[#3A3A3C] rounded-full" />
        </div>

        <div className="flex items-center justify-between border-b border-[#2C2C2E]/60 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Gewicht eintragen</h3>
            <p className="text-xs text-[#8E8E93] font-medium">Tägliche Messung für deinen Verlauf</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#8E8E93] block mb-1">
              Körpergewicht (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="30"
                max="250"
                required
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full h-12 px-4 rounded-xl bg-[#2C2C2E] text-2xl font-bold text-white tabular-nums focus:outline-hidden"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8E8E93]">
                kg
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#8E8E93] block mb-1">
              Datum
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#2C2C2E] text-sm text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#8E8E93] block mb-1">
              Notiz (optional)
            </label>
            <input
              type="text"
              placeholder="z. B. nüchtern nach dem Aufstehen"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#2C2C2E] text-sm text-white placeholder:text-[#636366] focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              style={{ backgroundColor: accentHex, color: accent.contrastText }}
              className="flex-1 py-3 rounded-xl hover:opacity-95 text-xs font-semibold transition-opacity flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check size={15} />
              <span>Speichern</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
