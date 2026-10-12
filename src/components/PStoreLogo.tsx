import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export const PStoreLogo: React.FC<Props> = ({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Stylized "P" Vector Glyph */}
      <div className={`relative ${sizeMap[size]} shrink-0 group-hover:scale-105 transition-transform duration-200`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            {/* Background Multi-stop Premium Mesh Gradient */}
            <linearGradient id="pstore-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="45%" stopColor="#059669" />
              <stop offset="80%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Glowing Accent Gradient for Play arrow */}
            <linearGradient id="pstore-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Subtle Inner Glow */}
            <radialGradient id="pstore-inner-glow" cx="30%" cy="20%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Squircle App Badge Container */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="26"
            fill="url(#pstore-bg-grad)"
          />

          {/* Glass Highlight Sheen */}
          <path
            d="M4 30 C 4 15.64 15.64 4 30 4 L 70 4 C 84.36 4 96 15.64 96 30 C 70 38 35 42 4 56 Z"
            fill="url(#pstore-inner-glow)"
          />

          {/* Bold, Futuristic, Stylized Letter "P" */}
          {/* Main Stem & Loop */}
          <path
            d="M28 20 C28 17.79 29.79 16 32 16 H56 C68.15 16 78 25.85 78 38 C78 50.15 68.15 60 56 60 H42 V78 C42 80.21 40.21 82 38 82 H32 C29.79 82 28 80.21 28 78 V20 Z"
            fill="#ffffff"
          />

          {/* Inner Counter Hole with Futuristic Dark Contrast */}
          <path
            d="M42 28 H55 C60.52 28 65 32.48 65 38 C65 43.52 60.52 48 55 48 H42 V28 Z"
            fill="#09181d"
            fillOpacity="0.88"
          />

          {/* High-Tech Play Chevron Accent Inside the "P" */}
          <path
            d="M46 32.5 L 58 38 L 46 43.5 Z"
            fill="url(#pstore-accent-grad)"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <span className={`font-black tracking-tight text-slate-900 dark:text-white ${textSizes[size]} ${textClassName}`}>
          P<span className="text-emerald-500 font-extrabold">-</span>Store
        </span>
      )}
    </div>
  );
};
