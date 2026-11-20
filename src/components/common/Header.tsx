import React from 'react';
import { UserProfile } from '../../types';
import { User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  currentTab: 'home' | 'training' | 'body' | 'profile' | 'progress';
  onSelectTab: (tab: 'home' | 'training' | 'body' | 'profile' | 'progress') => void;
  user: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  user,
}) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  return (
    <header
      className="hidden sm:block sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-[#2C2C2E]/80 transition-colors"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('home')}
          className="text-base font-bold tracking-tight text-white transition-colors flex items-center gap-2 cursor-pointer focus:outline-hidden"
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentHex }} />
          <span className="tracking-wider text-sm font-bold">PULSE</span>
        </button>

        {/* Zone 2: Desktop clean text navigation links (hidden on mobile, uses bottom nav) */}
        <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-[#8E8E93]">
          {(
            [
              { id: 'home', label: 'Home' },
              { id: 'training', label: 'Training' },
              { id: 'body', label: 'Körper' },
              { id: 'progress', label: 'Fortschritt' },
              { id: 'profile', label: 'Profil' },
            ] as const
          ).map((t) => {
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                style={isActive ? { color: accentHex } : undefined}
                className={`transition-colors hover:text-white cursor-pointer ${
                  isActive ? 'font-semibold' : ''
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Profile avatar button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('profile')}
            className="w-8 h-8 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-[#2C2C2E] flex items-center justify-center text-white font-semibold text-xs transition-colors cursor-pointer overflow-hidden focus:outline-hidden"
            aria-label="Profil"
            title="Zu deinem Profil"
          >
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name || 'Profil'}
                className="w-full h-full object-cover"
              />
            ) : user.name ? (
              <span>{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User size={14} className="text-[#8E8E93]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
