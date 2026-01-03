import React from 'react';

interface MoosMascotProps {
  className?: string;
  size?: number;
}

export const MoosMascot: React.FC<MoosMascotProps> = ({ className = '', size = 80 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="Moos Mascot"
    >
      <defs>
        <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
          <feOffset in="blur" dx="0" dy="4" result="offsetBlur"/>
          <feFlood floodColor="#8C7B6C" floodOpacity="0.12" result="colorBlur"/>
          <feComposite in="colorBlur" in2="offsetBlur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <g filter="url(#soft-glow)">
        {/* Body */}
        <ellipse cx="50" cy="62" rx="34" ry="30" fill="#FFFFFF"/>
        {/* Head */}
        <ellipse cx="50" cy="40" rx="22" ry="16" fill="#FFFFFF"/>
      </g>
      
      {/* Face */}
      <g transform="translate(0, 2)">
        <line x1="42" y1="40" x2="58" y2="40" stroke="#5D5752" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="42" cy="40" r="3" fill="#5D5752" />
        <circle cx="58" cy="40" r="3" fill="#5D5752" />
      </g>

      {/* Heart Badge */}
      <circle cx="68" cy="55" r="6" fill="#E6C288" />
    </svg>
  );
};
