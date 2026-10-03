import React from 'react';

interface CrossbarLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'responsive';
  variant?: 'full' | 'mark' | 'horizontal';
  showSubtitle?: boolean;
}

export const CrossbarLogo: React.FC<CrossbarLogoProps> = ({
  className = '',
  size = 'responsive',
  variant = 'full',
  showSubtitle = true
}) => {
  // Dimensions based on size
  const sizes = {
    sm: { mark: 32 },
    responsive: { mark: 40 },
    md: { mark: 44 },
    lg: { mark: 60 },
    xl: { mark: 88 }
  };

  const { mark } = sizes[size];

  // The Goal + Ball + Speed Streaks + 3D Turf perspective emblem
  const LogoMark = (
    <svg
      width={mark}
      height={mark * 0.88}
      viewBox="0 0 200 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 hover:scale-105"
      role="img"
      aria-label="Crossbar Metro Arena Emblem"
    >
      <defs>
        {/* Pitch green gradient */}
        <linearGradient id="grassLight" x1="100" y1="80" x2="100" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ADE80" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id="grassDark" x1="100" y1="80" x2="100" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22C55E" />
          <stop offset="1" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id="streakGreen" x1="100" y1="40" x2="100" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ADE80" stopOpacity="0.9" />
          <stop offset="1" stopColor="#15803D" stopOpacity="0.2" />
        </linearGradient>
        <filter id="glowBall" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#22C55E" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Goal Post Frame (Black & White border) */}
      <path
        d="M 46 95 L 46 28 L 154 28 L 154 95"
        stroke="#0F172A"
        strokeWidth="9"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M 46 95 L 46 28 L 154 28 L 154 95"
        stroke="#E2E8F0"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* 3D Perspective Turf Field */}
      {/* Stripe 1 (Far Left) */}
      <polygon points="18,145 52,88 72,88 48,145" fill="url(#grassDark)" />
      {/* Stripe 2 */}
      <polygon points="48,145 72,88 88,88 78,145" fill="url(#grassLight)" />
      {/* Stripe 3 (Center Left) */}
      <polygon points="78,145 88,88 100,88 98,145" fill="url(#grassDark)" />
      {/* Stripe 4 (Center Right) */}
      <polygon points="98,145 100,88 112,88 122,145" fill="url(#grassLight)" />
      {/* Stripe 5 */}
      <polygon points="122,145 112,88 128,88 152,145" fill="url(#grassDark)" />
      {/* Stripe 6 (Far Right) */}
      <polygon points="152,145 128,88 148,88 182,145" fill="url(#grassLight)" />

      {/* Field Boundary Base outline */}
      <polygon
        points="18,145 52,88 148,88 182,145"
        fill="none"
        stroke="#22C55E"
        strokeWidth="1.5"
      />

      {/* Turf Center Circle & Center Line in perspective */}
      <line x1="100" y1="88" x2="100" y2="145" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.95" />
      <ellipse cx="100" cy="94" rx="22" ry="7" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.9" />

      {/* Speed Streaks shooting down from the ball */}
      <polygon points="94,44 95,84 92,84" fill="#22C55E" />
      <polygon points="99,44 101,96 99,96" fill="#4ADE80" />
      <polygon points="106,44 107,84 104,84" fill="#22C55E" />

      {/* Soccer Ball hitting the Crossbar */}
      <g filter="url(#glowBall)">
        <circle cx="100" cy="27" r="16" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
        {/* Ball Pentagons */}
        <polygon points="100,21 106,25 104,31 96,31 94,25" fill="#0F172A" />
        <line x1="100" y1="21" x2="100" y2="13" stroke="#0F172A" strokeWidth="2" />
        <line x1="106" y1="25" x2="114" y2="22" stroke="#0F172A" strokeWidth="2" />
        <line x1="104" y1="31" x2="111" y2="38" stroke="#0F172A" strokeWidth="2" />
        <line x1="96" y1="31" x2="89" y2="38" stroke="#0F172A" strokeWidth="2" />
        <line x1="94" y1="25" x2="86" y2="22" stroke="#0F172A" strokeWidth="2" />
      </g>
    </svg>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{LogoMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      {LogoMark}

      <div className="flex flex-col">
        {/* Brand Main Wordmark */}
        <div className="flex items-center tracking-wider font-extrabold text-white text-base sm:text-lg md:text-xl leading-none font-display uppercase">
          <span>CROSS</span>
          <span className="text-emerald-400">BAR</span>
        </div>

        {/* METRO with lateral green divider rules */}
        <div className="flex items-center gap-1 sm:gap-1.5 my-0.5">
          <span className="h-[2px] w-2 sm:w-4 bg-emerald-400"></span>
          <span className="text-[10px] sm:text-[11px] md:text-xs font-black tracking-[0.2em] sm:tracking-[0.25em] text-emerald-400 uppercase font-mono">
            METRO
          </span>
          <span className="h-[2px] w-2 sm:w-4 bg-emerald-400"></span>
        </div>

        {/* ARENA spaced */}
        {showSubtitle && (
          <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.28em] sm:tracking-[0.35em] text-slate-300 uppercase leading-none pl-0.5 hidden xs:block">
            ARENA · DHAKA
          </div>
        )}
      </div>
    </div>
  );
};
