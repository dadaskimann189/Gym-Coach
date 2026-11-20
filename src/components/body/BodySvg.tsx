import React, { useState } from 'react';
import { MuscleId, MuscleLoadStatus } from '../../types';
import { getMuscleColor } from '../../services/muscleLoadCalculator';
import { useTheme } from '../../context/ThemeContext';

interface BodySvgProps {
  view: 'front' | 'back';
  gender?: 'male' | 'female' | 'other';
  muscleStatus: Record<MuscleId, MuscleLoadStatus>;
  selectedMuscle: MuscleId | null;
  onSelectMuscle: (muscle: MuscleId) => void;
}

export const BodySvg: React.FC<BodySvgProps> = ({
  view,
  gender = 'male',
  muscleStatus,
  selectedMuscle,
  onSelectMuscle,
}) => {
  const { accent, themeMode } = useTheme();
  const accentHex = themeMode === 'light' ? accent.lightHex : accent.hex;

  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleId | null>(null);

  const isFemale = gender === 'female';

  const getLoad = (id: MuscleId) => {
    return muscleStatus[id]?.load || 0;
  };

  const isSelected = (id: MuscleId) => selectedMuscle === id;
  const isHovered = (id: MuscleId) => hoveredMuscle === id;

  const activeMuscle = selectedMuscle || hoveredMuscle;
  const activeStatus = activeMuscle ? muscleStatus[activeMuscle] : null;

  /**
   * Render an interactive muscle group in the minimalist Apple dark aesthetic:
   * Dark neutral gray when rested, glowing accent color when loaded.
   */
  const renderMuscle = (
    id: MuscleId,
    paths: string[],
    label: string,
    centerCoord?: { x: number; y: number }
  ) => {
    const active = isSelected(id);
    const hovered = isHovered(id);
    const load = getLoad(id);
    const isLoaded = load > 0;

    // Physiological Red Heat Scale (Unabhängig von App-Akzentfarbe: Reize sind immer rot!)
    // Bei 0%: Erholtes neutrales Schiefergrau (#242426)
    // Bei 1–25% (z.B. 1 Satz Bankdrücken mit 15%):
    //   Sanftes, helles Korallen-Rosa-Rot (#FF8A80) mit feinem Rand – keinesfalls dunkel!
    // Bei 26–50%: Klares Signalrot (#FF453A)
    // Bei 51–75%: Kräftiges Karmesinrot (#DC2626)
    // Bei 76–100%: Maximale Reizung / Tiefes Dunkelrot (#991B1B)
    let fill = '#242426';
    let fillOpacity = 1.0;
    let strokeColor = '#3A3A3C';
    let strokeWidth = '1.5';

    if (isLoaded) {
      if (load <= 25) {
        // Sanfter, hell-leuchtender Korallenrot-Ton (hell und dezent, 1 Satz / 15%)
        fill = '#FF8A80';
        fillOpacity = 0.85;
        strokeColor = '#FFA299';
      } else if (load <= 50) {
        // Klares Signalrot
        fill = '#FF453A';
        fillOpacity = 0.90;
        strokeColor = '#FF6961';
      } else if (load <= 75) {
        // Kräftiges Karmesinrot
        fill = '#DC2626';
        fillOpacity = 0.95;
        strokeColor = '#EF4444';
      } else {
        // Maximale Auslastung / Tiefes, sattes Dunkelrot
        fill = '#991B1B';
        fillOpacity = 1.0;
        strokeColor = '#DC2626';
      }
    }

    if (active) {
      strokeColor = '#FFFFFF';
      strokeWidth = '2';
    } else if (hovered) {
      strokeColor = '#FF3B30';
      strokeWidth = '1.75';
    }

    return (
      <g
        key={id}
        className="cursor-pointer transition-all duration-150 group outline-hidden"
        onClick={() => onSelectMuscle(id)}
        onMouseEnter={() => setHoveredMuscle(id)}
        onMouseLeave={() => setHoveredMuscle(null)}
        role="button"
        tabIndex={0}
        aria-label={`${label} Belastung ${load}%`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectMuscle(id);
          }
        }}
      >
        {paths.map((d, index) => (
          <path
            key={`muscle-${id}-${index}`}
            d={d}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="transition-all duration-150"
          />
        ))}

        {/* Load indicator badge for high load */}
        {isLoaded && load >= 60 && centerCoord && (
          <circle
            cx={centerCoord.x}
            cy={centerCoord.y}
            r={active ? 3.5 : 2.5}
            fill="#FFFFFF"
            stroke="#DC2626"
            strokeWidth="1.5"
            className="pointer-events-none"
          />
        )}
      </g>
    );
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Floating Active Muscle Status Banner */}
      <div className="h-7 mb-2 flex items-center justify-center">
        {activeStatus ? (
          <div className="px-3 py-1 rounded-full bg-[#2C2C2E] border border-[#3A3A3C] text-white text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-100">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeStatus.load > 0 ? getMuscleColor(activeStatus.load) : '#8E8E93' }}
            />
            <span>{activeStatus.nameDe}</span>
            <span className="font-mono tabular-nums text-rose-500">{activeStatus.load}%</span>
            <span className="text-[10px] text-[#8E8E93] font-normal border-l border-[#3A3A3C] pl-2">
              {activeStatus.statusLevel}
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-[#8E8E93] font-medium">
            Tippe auf eine Muskelgruppe für Details
          </div>
        )}
      </div>

      {/* Main Clean Dark Canvas */}
      <div className="relative w-full max-w-[280px] sm:max-w-[310px] aspect-[2/3] rounded-2xl overflow-hidden bg-[#1C1C1E] border border-[#2C2C2E] p-3 flex items-center justify-center">
        <svg
          viewBox="0 0 240 380"
          className="w-full h-full relative z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Neutral Mannequin Structure (Head, Neck, Hands, Feet) */}
          <g id="neutral-body" fill="#1C1C1E" stroke="#2C2C2E" strokeWidth="1.5">
            {/* Head */}
            <ellipse
              cx="120"
              cy="34"
              rx={isFemale ? '11' : '12'}
              ry={isFemale ? '15' : '16'}
              fill="#242426"
              stroke="#2C2C2E"
            />
            {/* Neck */}
            <path
              d={
                isFemale
                  ? 'M113 48 L113 64 L127 64 L127 48 Z'
                  : 'M112 49 L112 66 L128 66 L128 49 Z'
              }
              fill="#242426"
              stroke="#2C2C2E"
            />

            {/* Hands */}
            <path
              d="M47 200 C43 208 42 220 44 230 C46 234 49 233 51 228 C53 220 54 210 52 200 Z"
              fill="#242426"
              stroke="#2C2C2E"
            />
            <path
              d="M193 200 C197 208 198 220 196 230 C194 234 191 233 189 228 C187 220 186 210 188 200 Z"
              fill="#242426"
              stroke="#2C2C2E"
            />

            {/* Groin / Pelvis */}
            <path
              d={
                isFemale
                  ? 'M108 194 Q120 208 132 194 Q120 212 108 194 Z'
                  : 'M108 196 Q120 210 132 196 Q120 214 108 196 Z'
              }
              fill="#242426"
              stroke="#2C2C2E"
            />

            {/* Knees */}
            {view === 'front' && (
              <g fill="#2C2C2E" stroke="#2C2C2E">
                <circle cx="95" cy="272" r="3.5" />
                <circle cx="145" cy="272" r="3.5" />
              </g>
            )}

            {/* Feet */}
            <g fill="#242426" stroke="#2C2C2E">
              <path d="M86 344 L82 358 Q90 362 98 358 L94 344 Z" />
              <path d="M154 344 L158 358 Q150 362 142 358 L146 344 Z" />
            </g>
          </g>

          {/* ================================================================ */}
          {/* ======================= FRONT VIEW (VORN) ====================== */}
          {/* ================================================================ */}
          {view === 'front' && (
            <g id="front-muscles">
              {/* 1. CHEST (Brust) */}
              {renderMuscle(
                'chest',
                isFemale
                  ? [
                      'M118 66 C102 66 88 72 82 84 C78 98 90 110 106 110 C116 110 118 96 118 66 Z',
                      'M122 66 C138 66 152 72 158 84 C162 98 150 110 134 110 C124 110 122 96 122 66 Z',
                    ]
                  : [
                      'M118 68 C104 67 86 68 76 71 C73 80 74 91 76 97 C82 108 97 111 112 109 C117 108 118 100 118 68 Z',
                      'M122 68 C136 67 154 68 164 71 C167 80 166 91 164 97 C158 108 143 111 128 109 C123 108 122 100 122 68 Z',
                    ],
                'Brust',
                { x: 120, y: 88 }
              )}

              {/* 2. DELTOIDS / SHOULDERS (Vordere Schulter) - Organically rounded, no sharp spikes */}
              {renderMuscle(
                'front_delts',
                isFemale
                  ? [
                      'M76 68 C70 67 63 70 60 76 C57 82 58 88 61 94 C65 98 70 98 74 94 C77 88 78 78 76 68 Z',
                      'M164 68 C170 67 177 70 180 76 C183 82 182 88 179 94 C175 98 170 98 166 94 C163 88 162 78 164 68 Z',
                    ]
                  : [
                      'M74 69 C67 68 59 71 55 77 C51 83 51 90 54 96 C58 101 64 100 68 96 C72 90 73 80 74 69 Z',
                      'M166 69 C173 68 181 71 185 77 C189 83 189 90 186 96 C182 101 176 100 172 96 C168 90 167 80 166 69 Z',
                    ],
                'Vordere Schulter',
                { x: isFemale ? 67 : 64, y: 82 }
              )}

              {/* 3. BICEPS (Bizeps) */}
              {renderMuscle(
                'biceps',
                isFemale
                  ? [
                      'M58 102 C54 110 53 122 56 132 C59 136 65 136 67 130 C70 122 70 112 68 102 Z',
                      'M182 102 C186 110 187 122 184 132 C181 136 175 136 173 130 C170 122 170 112 172 102 Z',
                    ]
                  : [
                      'M54 101 C49 110 48 122 51 133 C54 137 61 137 64 131 C67 121 67 111 64 101 Z',
                      'M186 101 C191 110 192 122 189 133 C186 137 179 137 176 131 C173 121 173 111 176 101 Z',
                    ],
                'Bizeps',
                { x: isFemale ? 62 : 58, y: 118 }
              )}

              {/* 4. FOREARMS (Unterarme) */}
              {renderMuscle(
                'forearms',
                isFemale
                  ? [
                      'M54 138 C49 150 47 166 49 184 C52 188 57 186 59 178 C62 168 64 154 65 138 Z',
                      'M186 138 C191 150 193 166 191 184 C188 188 183 186 181 178 C178 168 176 154 175 138 Z',
                    ]
                  : [
                      'M50 138 C44 150 42 168 44 188 C48 193 54 191 56 182 C59 170 61 154 62 138 Z',
                      'M190 138 C196 150 198 168 196 188 C192 193 186 191 184 182 C181 170 179 154 178 138 Z',
                    ],
                'Unterarme',
                { x: isFemale ? 54 : 52, y: 162 }
              )}

              {/* 5. ABDOMINALS (Bauch) - 6 Bauchmuskeln (Six-Pack: 3 Paare) */}
              {renderMuscle(
                'abs',
                isFemale
                  ? [
                      // Top pair
                      'M105 116 Q117 115 117 116 L117 132 Q117 134 105 134 Q103 134 103 132 L103 118 Q103 116 105 116 Z',
                      'M123 116 Q123 115 135 116 Q137 116 137 118 L137 132 Q137 134 135 134 Q123 134 123 132 L123 116 Z',
                      // Mid pair
                      'M105 138 Q117 137 117 138 L117 154 Q117 156 105 156 Q103 156 103 154 L103 140 Q103 138 105 138 Z',
                      'M123 138 Q123 137 135 138 Q137 138 137 140 L137 154 Q137 156 135 156 Q123 156 123 154 L123 138 Z',
                      // Bottom pair
                      'M106 160 Q117 159 117 160 L117 180 Q115 182 108 180 Q104 179 104 176 L104 162 Q104 160 106 160 Z',
                      'M123 160 Q123 159 134 160 Q136 160 136 162 L136 176 Q136 179 132 180 Q125 182 123 180 L123 160 Z',
                    ]
                  : [
                      // Top pair (Row 1)
                      'M104 114 Q117 113 117 114 L117 131 Q117 133 104 133 Q102 133 102 131 L102 116 Q102 114 104 114 Z',
                      'M123 114 Q123 113 136 114 Q138 114 138 116 L138 131 Q138 133 136 133 Q123 133 123 131 L123 114 Z',
                      // Mid pair (Row 2)
                      'M104 137 Q117 136 117 137 L117 155 Q117 157 104 157 Q102 157 102 155 L102 139 Q102 137 104 137 Z',
                      'M123 137 Q123 136 136 137 Q138 137 138 139 L138 155 Q138 157 136 157 Q123 157 123 155 L123 137 Z',
                      // Bottom pair (Row 3 - Six-Pack completed)
                      'M104 161 Q117 160 117 161 L117 182 Q115 184 106 182 Q103 181 103 178 L103 163 Q103 161 104 161 Z',
                      'M123 161 Q123 160 136 161 Q137 161 137 163 L137 178 Q137 181 134 182 Q125 184 123 182 L123 161 Z',
                    ],
                'Bauch',
                { x: 120, y: 146 }
              )}

              {/* 6. OBLIQUES (Seitliche Bauchmuskeln) - Schlank & wohlproportioniert */}
              {renderMuscle(
                'obliques',
                isFemale
                  ? [
                      'M91 116 C88 130 87 146 90 162 C93 172 98 180 103 180 C102 164 102 138 103 116 Z',
                      'M149 116 C152 130 153 146 150 162 C147 172 142 180 137 180 C138 164 138 138 137 116 Z',
                    ]
                  : [
                      'M89 114 C85 128 84 146 86 162 C88 172 92 180 99 182 C99 164 100 138 100 114 Z',
                      'M151 114 C155 128 156 146 154 162 C152 172 148 180 141 182 C141 164 140 138 140 114 Z',
                    ],
                'Seitliche Bauchmuskeln',
                { x: isFemale ? 94 : 92, y: 148 }
              )}

              {/* 7. QUADRICEPS (Quadrizeps) */}
              {renderMuscle(
                'quads',
                isFemale
                  ? [
                      'M92 192 C83 208 81 232 84 254 C88 262 95 262 100 256 C105 244 109 222 110 192 Z',
                      'M148 192 C157 208 159 232 156 254 C152 262 145 262 140 256 C135 244 131 222 130 192 Z',
                    ]
                  : [
                      'M89 194 C80 210 78 234 82 258 C86 268 94 268 100 262 C106 250 110 226 110 194 Z',
                      'M151 194 C160 210 162 234 158 258 C154 268 146 268 140 262 C134 250 130 226 130 194 Z',
                    ],
                'Quadrizeps',
                { x: 94, y: 226 }
              )}

              {/* 8. CALVES FRONT (Waden Vorn) */}
              {renderMuscle(
                'calves',
                isFemale
                  ? [
                      'M86 280 C81 292 80 308 84 328 C88 334 95 332 98 326 C101 316 100 298 97 280 Z',
                      'M154 280 C159 292 160 308 156 328 C152 334 145 332 142 326 C139 316 140 298 143 280 Z',
                    ]
                  : [
                      'M85 282 C79 294 78 312 82 334 C87 340 95 338 98 330 C101 318 101 298 97 282 Z',
                      'M155 282 C161 294 162 312 158 334 C153 340 145 338 142 330 C139 318 139 298 143 282 Z',
                    ],
                'Waden',
                { x: 90, y: 306 }
              )}
            </g>
          )}

          {/* ================================================================ */}
          {/* ======================= BACK VIEW (HINTEN) ===================== */}
          {/* ================================================================ */}
          {view === 'back' && (
            <g id="back-muscles">
              {/* 1. TRAPEZIUS (Trapez) */}
              {renderMuscle(
                'traps',
                isFemale
                  ? [
                      'M120 48 L126 56 C136 62 148 64 158 66 C148 84 136 102 120 118 C104 102 92 84 82 66 C92 64 104 62 114 56 Z',
                    ]
                  : [
                      'M120 48 L128 58 C140 64 154 66 166 68 C154 88 140 108 120 128 C100 108 86 88 74 68 C86 66 100 64 112 58 Z',
                    ],
                'Trapez',
                { x: 120, y: 86 }
              )}

              {/* 2. REAR DELTOIDS (Hintere Schulter) - Organically rounded */}
              {renderMuscle(
                'rear_delts',
                isFemale
                  ? [
                      'M76 68 C70 67 63 70 60 76 C58 82 59 88 63 92 C67 94 72 92 74 86 C76 80 76 74 76 68 Z',
                      'M164 68 C170 67 177 70 180 76 C182 82 181 88 177 92 C173 94 168 92 166 86 C164 80 164 74 164 68 Z',
                    ]
                  : [
                      'M74 68 C68 67 60 70 56 76 C53 82 54 90 58 94 C64 96 70 94 72 88 C74 80 74 74 74 68 Z',
                      'M166 68 C172 67 180 70 184 76 C187 82 186 90 182 94 C176 96 170 94 168 88 C166 80 166 74 166 68 Z',
                    ],
                'Hintere Schulter',
                { x: isFemale ? 68 : 64, y: 80 }
              )}

              {/* 3. TRICEPS (Trizeps) */}
              {renderMuscle(
                'triceps',
                isFemale
                  ? [
                      'M58 98 C53 106 52 118 55 128 C60 132 66 128 68 122 C70 114 69 104 67 98 Z',
                      'M182 98 C187 106 188 118 185 128 C180 132 174 128 172 122 C170 114 171 104 173 98 Z',
                    ]
                  : [
                      'M55 98 C48 108 48 122 52 134 C58 138 65 134 66 126 C68 116 67 106 64 98 Z',
                      'M185 98 C192 108 192 122 188 134 C182 138 175 134 174 126 C172 116 173 106 176 98 Z',
                    ],
                'Trizeps',
                { x: isFemale ? 62 : 58, y: 114 }
              )}

              {/* 4. LATISSIMUS DORSI (Latissimus) - Natürlicher V-Taper */}
              {renderMuscle(
                'lats',
                isFemale
                  ? [
                      'M82 76 C76 90 77 110 86 134 C92 138 98 134 100 126 C95 110 90 92 86 76 Z',
                      'M158 76 C164 90 163 110 154 134 C148 138 142 134 140 126 C145 110 150 92 154 76 Z',
                    ]
                  : [
                      'M78 76 C70 92 72 114 82 140 C88 144 96 140 99 132 C92 114 88 94 82 76 Z',
                      'M162 76 C170 92 168 114 158 140 C152 144 144 140 141 132 C148 114 152 94 158 76 Z',
                    ],
                'Latissimus',
                { x: isFemale ? 91 : 89, y: 108 }
              )}

              {/* 5. LOWER BACK (Unterer Rücken) */}
              {renderMuscle(
                'lower_back',
                isFemale
                  ? [
                      'M118 134 L110 144 C112 156 113 168 116 178 L118 178 Z',
                      'M122 134 L130 144 C128 156 127 168 124 178 L122 178 Z',
                    ]
                  : [
                      'M118 134 L109 146 C111 158 113 170 116 182 L118 182 Z',
                      'M122 134 L131 146 C129 158 127 170 124 182 L122 182 Z',
                    ],
                'Unterer Rücken',
                { x: 120, y: 156 }
              )}

              {/* 6. GLUTEUS (Gesäß) */}
              {renderMuscle(
                'glutes',
                isFemale
                  ? [
                      'M86 184 C74 196 74 214 82 228 C92 234 104 230 114 220 C113 204 109 190 102 184 Z',
                      'M154 184 C166 196 166 214 158 228 C148 234 136 230 126 220 C127 204 131 190 138 184 Z',
                    ]
                  : [
                      'M88 186 C76 198 76 216 84 230 C93 236 106 232 115 222 C114 206 110 192 104 186 Z',
                      'M152 186 C164 198 164 216 156 230 C147 236 134 232 125 222 C126 206 130 192 136 186 Z',
                    ],
                'Gesäß',
                { x: 99, y: 208 }
              )}

              {/* 7. HAMSTRINGS (Beinbeuger) */}
              {renderMuscle(
                'hamstrings',
                isFemale
                  ? [
                      'M86 232 C80 244 80 258 85 268 C92 272 101 268 106 260 C110 248 111 236 111 224 Z',
                      'M154 232 C160 244 160 258 155 268 C148 272 139 268 134 260 C130 248 129 236 129 224 Z',
                    ]
                  : [
                      'M85 236 C78 250 78 264 83 274 C90 278 100 274 106 266 C111 254 112 240 112 228 Z',
                      'M155 236 C162 250 162 264 157 274 C150 278 140 274 134 266 C129 254 128 240 128 228 Z',
                    ],
                'Beinbeuger',
                { x: 96, y: 250 }
              )}

              {/* 8. CALVES POSTERIOR (Waden Hinten) */}
              {renderMuscle(
                'calves',
                isFemale
                  ? [
                      'M86 280 C79 292 79 308 83 328 C87 334 96 332 98 326 C101 316 100 298 97 280 Z',
                      'M154 280 C161 292 161 308 157 328 C153 334 144 332 142 326 C139 316 140 298 143 280 Z',
                    ]
                  : [
                      'M85 284 C77 298 77 314 81 334 C86 340 96 338 99 330 C102 318 102 298 97 284 Z',
                      'M155 284 C163 298 163 314 159 334 C154 340 144 338 141 330 C138 318 138 298 143 284 Z',
                    ],
                'Waden',
                { x: 90, y: 306 }
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
