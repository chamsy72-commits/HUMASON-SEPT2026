import React from 'react';

interface HumasonLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'icon' | 'full';
  className?: string;
  withGlow?: boolean;
  color?: string;
}

/**
 * Official HUMASON Brand Logo Component
 * Faithfully reproduces the official Humason emblem uploaded by the user:
 * - Maghrebine horseshoe arch (arc outrepassé) with double contour
 * - Central human figure with raised arms embracing the arch
 * - Horizontal soundwave / audio frequency waveform traversing the torso
 * - Modern geometric uppercase typography "HUMASON"
 *
 * Styled in the signature Sidi Bou Saïd Electric Cyan (#00A6D6) with ambient glow,
 * harmonizing with the dark studio mockup (#0B0E14) and light mode.
 */
export const HumasonLogo: React.FC<HumasonLogoProps> = ({
  size = 'md',
  variant = 'icon',
  className = '',
  withGlow = true,
  color
}) => {
  const iconSizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28'
  };

  const fullSizeMap = {
    sm: 'w-20 h-auto',
    md: 'w-32 h-auto',
    lg: 'w-44 h-auto',
    xl: 'w-60 h-auto',
    '2xl': 'w-80 h-auto'
  };

  const containerSize = variant === 'full' ? fullSizeMap[size] : iconSizeMap[size];
  const primaryColor = color || '#00A6D6';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${containerSize} ${className}`}
      title="HUMASON - Sonic Archivist & Ethnomusicology"
    >
      {/* Ambient Glow */}
      {withGlow && (
        <div
          className="absolute inset-0 rounded-full blur-md pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        />
      )}

      {/* Official Humason Vector Logo SVG */}
      <svg
        viewBox={variant === 'full' ? '0 0 500 520' : '0 0 500 420'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
        style={{
          filter: withGlow ? `drop-shadow(0 0 6px ${primaryColor}66)` : undefined
        }}
      >
        <defs>
          <linearGradient id="humasonBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00C8FF" />
            <stop offset="60%" stopColor={primaryColor} />
            <stop offset="100%" stopColor="#0077B6" />
          </linearGradient>
        </defs>

        {/* ============================================================
            1. OUTER HORSESHOE ARCH (Arc Outrepassé)
            ============================================================ */}
        <path
          d="
            M 165 255
            L 165 200
            C 165 190 152 182 152 165
            C 152 105 195 60 250 60
            C 305 60 348 105 348 165
            C 348 182 335 190 335 200
            L 335 255
          "
          stroke="url(#humasonBrandGrad)"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Outer arch side-step decorative wings */}
        <path
          d="
            M 165 200
            C 155 200 148 208 148 220
            L 148 255
          "
          stroke="url(#humasonBrandGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="
            M 335 200
            C 345 200 352 208 352 220
            L 352 255
          "
          stroke="url(#humasonBrandGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />

        {/* ============================================================
            2. INNER CONCENTRIC HORSESHOE ARCH
            ============================================================ */}
        <path
          d="
            M 190 240
            L 190 195
            C 190 188 182 182 182 170
            C 182 125 212 90 250 90
            C 288 90 318 125 318 170
            C 318 182 310 188 310 195
            L 310 240
          "
          stroke="url(#humasonBrandGrad)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* ============================================================
            3. HUMAN SILHOUETTE (Standing with raised embracing arms)
            ============================================================ */}
        {/* Head */}
        <circle
          cx="250"
          cy="138"
          r="19"
          fill="url(#humasonBrandGrad)"
        />

        {/* Body, Torso, and Raised Arms */}
        <path
          d="
            M 250 160
            C 244 160 236 166 232 174
            C 220 162 205 145 194 130
            C 190 125 186 127 188 132
            C 198 152 215 174 227 190
            C 226 205 226 240 226 270
            L 226 308
            L 242 308
            L 242 270
            L 242 345
            C 242 355 238 358 226 362
            L 246 362
            C 249 352 250 330 250 315
            C 250 330 251 352 254 362
            L 274 362
            C 262 358 258 355 258 345
            L 258 270
            L 258 308
            L 274 308
            L 274 270
            C 274 240 274 205 273 190
            C 285 174 302 152 312 132
            C 314 127 310 125 306 130
            C 295 145 280 162 268 174
            C 264 166 256 160 250 160
            Z
          "
          fill="url(#humasonBrandGrad)"
        />

        {/* Lower torso & legs continuous fill */}
        <path
          d="
            M 230 260
            C 230 285 230 310 234 350
            L 225 358
            L 247 358
            C 249 340 250 320 250 285
            C 250 320 251 340 253 358
            L 275 358
            L 266 350
            C 270 310 270 285 270 260
            Z
          "
          fill="url(#humasonBrandGrad)"
        />

        {/* ============================================================
            4. HORIZONTAL AUDIO SOUNDWAVE / FREQUENCY WAVEFORM
            Traverses horizontally across the waist of the human figure
            ============================================================ */}
        <path
          d="
            M 65 308
            L 92 308
            L 106 280
            L 118 335
            L 126 235
            L 138 375
            L 150 275
            L 162 345
            L 174 245
            L 185 365
            L 196 285
            L 208 345
            L 218 290
            L 228 308
            L 272 308
            L 282 290
            L 292 345
            L 304 285
            L 315 365
            L 326 245
            L 338 345
            L 350 275
            L 362 375
            L 374 235
            L 382 335
            L 394 280
            L 408 308
            L 435 308
          "
          stroke="url(#humasonBrandGrad)"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Waveform pass-through bridge across the figure */}
        <path
          d="M 226 302 L 274 302"
          stroke="url(#humasonBrandGrad)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* ============================================================
            5. TYPOGRAPHY "HUMASON" (For variant="full")
            ============================================================ */}
        {variant === 'full' && (
          <text
            x="250"
            y="470"
            textAnchor="middle"
            fill="url(#humasonBrandGrad)"
            fontFamily="'Hanken Grotesk', system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="74"
            letterSpacing="6"
          >
            HUMASON
          </text>
        )}
      </svg>
    </div>
  );
};
