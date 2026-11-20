import React from 'react';
import { Activity, Dumbbell, Home, LineChart, User } from 'lucide-react';
import { UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface BottomNavProps {
  currentTab: 'home' | 'training' | 'body' | 'progress' | 'profile';
  onSelectTab: (tab: 'home' | 'training' | 'body' | 'progress' | 'profile') => void;
  user?: UserProfile;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  user,
}) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  const tabs = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'training' as const,
      label: 'Training',
      icon: Dumbbell,
    },
    {
      id: 'body' as const,
      label: 'Körper',
      icon: Activity,
    },
    {
      id: 'progress' as const,
      label: 'Fortschritt',
      icon: LineChart,
    },
    {
      id: 'profile' as const,
      label: 'Profil',
      icon: User,
    },
  ];

  return (
    <div
      className="sm:hidden fixed left-3 right-3 z-40 max-w-[390px] mx-auto pointer-events-none"
      style={{
        bottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 0.75rem), 1.25rem)',
      }}
    >
      <nav className="pointer-events-auto bg-[#18181B]/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/90 rounded-full p-1.5 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isProfile = tab.id === 'profile';

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 min-h-[46px] rounded-full py-1 px-1.5 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer focus:outline-hidden ${
                isActive
                  ? 'bg-[#2C2C2E] text-white shadow-xs'
                  : 'text-[#8E8E93] hover:text-[#D1D1D6]'
              }`}
            >
              {isProfile && user?.profileImage ? (
                <div
                  className={`w-5 h-5 rounded-full overflow-hidden transition-all ${
                    isActive ? 'ring-2' : 'opacity-85'
                  }`}
                  style={isActive ? { ['--tw-ring-color' as any]: accentHex } : undefined}
                >
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2 : 1.75}
                  style={isActive ? { color: accentHex } : undefined}
                  className={!isActive ? 'text-[#8E8E93]' : ''}
                />
              )}

              <span
                className={`text-[9px] tracking-tight mt-0.5 leading-none transition-colors ${
                  isActive ? 'font-semibold text-white' : 'font-normal text-[#8E8E93]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
