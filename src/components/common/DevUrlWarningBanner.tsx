import React, { useState, useEffect } from 'react';
import { Smartphone, ChevronRight, X } from 'lucide-react';
import { PERMANENT_APP_URL } from './PWAInstallModal';

interface DevUrlWarningBannerProps {
  onOpenInstallModal: () => void;
}

export const DevUrlWarningBanner: React.FC<DevUrlWarningBannerProps> = ({ onOpenInstallModal }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('pulse_dismiss_dev_banner') === 'true';
    if (isDismissed) return;

    // Check if standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Only show if running on dev URL or if accessed on mobile browser without standalone
    const isDev = typeof window !== 'undefined' && window.location.hostname.includes('ais-dev-');

    if (isDev && !isStandalone) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem('pulse_dismiss_dev_banner', 'true');
  };

  return (
    <div
      className="bg-gradient-to-r from-[#FF453A]/20 via-[#FF453A]/10 to-transparent border-b border-[#FF453A]/30 px-3 py-2 text-xs text-white"
      style={{
        paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 0.5rem), 0.5rem)',
      }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        <button
          onClick={onOpenInstallModal}
          className="flex-1 flex items-center gap-2 text-left cursor-pointer hover:opacity-90 transition-opacity min-w-0"
        >
          <div className="w-5 h-5 rounded-md bg-[#FF453A] text-white flex items-center justify-center shrink-0">
            <Smartphone size={12} />
          </div>
          <p className="truncate text-[11px] sm:text-xs">
            <strong className="text-[#FF453A] font-semibold">Home-Bildschirm Tipp:</strong> Nutze den dauerhaften Freigabe-Link zum Aufwecken!
          </p>
          <ChevronRight size={14} className="text-[#8E8E93] shrink-0" />
        </button>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-md text-[#8E8E93] hover:text-white transition-colors cursor-pointer shrink-0"
          title="Schließen"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
