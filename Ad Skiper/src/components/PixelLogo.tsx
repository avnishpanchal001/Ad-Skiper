import React from 'react';

interface PixelLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const PixelLogo: React.FC<PixelLogoProps> = ({ size = 'md', showText = true }) => {
  const dimensions = {
    sm: { box: 'w-7 h-7', svg: 16, text: 'text-sm' },
    md: { box: 'w-9 h-9', svg: 20, text: 'text-lg' },
    lg: { box: 'w-14 h-14', svg: 32, text: 'text-2xl' }
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      {/* Yellow Logo Badge */}
      <div
        className={`${dimensions.box} rounded-xl bg-[#FFE600] flex items-center justify-center shadow-sm border border-slate-900/15 shrink-0 select-none`}
      >
        {/* YouTube Ad Skip Button Icon in Crisp Black Pixel Format */}
        <svg
          width={dimensions.svg}
          height={dimensions.svg}
          viewBox="0 0 14 12"
          className="shape-rendering-crispEdges"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Right-Pointing Triangle Arrow (Pixel Format) */}
          <rect x="1" y="2" width="1" height="8" fill="#000000" />
          <rect x="2" y="2" width="1" height="8" fill="#000000" />
          <rect x="3" y="3" width="1" height="6" fill="#000000" />
          <rect x="4" y="3" width="1" height="6" fill="#000000" />
          <rect x="5" y="4" width="1" height="4" fill="#000000" />
          <rect x="6" y="4" width="1" height="4" fill="#000000" />
          <rect x="7" y="5" width="1" height="2" fill="#000000" />
          <rect x="8" y="5" width="1" height="2" fill="#000000" />

          {/* Vertical Stop/Skip Bar (Pixel Format) */}
          <rect x="10" y="2" width="1.5" height="8" fill="#000000" />
          <rect x="11.5" y="2" width="1" height="8" fill="#000000" />
        </svg>
      </div>

      {showText && (
        <span className={`font-black tracking-tight text-slate-900 ${dimensions.text}`}>
          adskiper
        </span>
      )}
    </div>
  );
};
