import React from 'react';

interface MasonBrandIconProps {
  size?: number;
  className?: string;
}

/**
 * High-definition, standalone vector Mason Brand Icon in sky-blue citadel blueprint aesthetic.
 * Implemented as pure inline SVG to guarantee 100% reliable rendering across all deployment
 * environments including GitHub Pages subpaths, custom domains, offline mode, and installed PWAs.
 */
export const MasonBrandIcon: React.FC<MasonBrandIconProps> = ({ 
  size = 20, 
  className = '' 
}) => {
  return (
    <svg 
      viewBox="0 0 512 512" 
      width={size} 
      height={size} 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="masonBrandSkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="masonBrandApexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <filter id="masonBrandGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Blueprint Grid Pattern Sub-Layer */}
      <g stroke="#38bdf8" strokeOpacity="0.22" strokeWidth="2.5">
        <line x1="64" y1="0" x2="64" y2="512" />
        <line x1="128" y1="0" x2="128" y2="512" />
        <line x1="192" y1="0" x2="192" y2="512" />
        <line x1="256" y1="0" x2="256" y2="512" />
        <line x1="320" y1="0" x2="320" y2="512" />
        <line x1="384" y1="0" x2="384" y2="512" />
        <line x1="448" y1="0" x2="448" y2="512" />

        <line x1="0" y1="64" x2="512" y2="64" />
        <line x1="0" y1="128" x2="512" y2="128" />
        <line x1="0" y1="192" x2="512" y2="192" />
        <line x1="0" y1="256" x2="512" y2="256" />
        <line x1="0" y1="320" x2="512" y2="320" />
        <line x1="0" y1="384" x2="512" y2="384" />
        <line x1="0" y1="448" x2="512" y2="448" />
      </g>

      {/* Mason Isometric Citadel / Architecture "M" Symbol in Sky Blue */}
      <g filter="url(#masonBrandGlow)">
        {/* Left Pillar */}
        <path d="M 120 380 L 120 160 L 184 120 L 184 340 Z" fill="#0284c7" />
        <path d="M 184 120 L 224 144 L 224 364 L 184 340 Z" fill="#0369a1" />
        
        {/* Central Apex Peak & Chevrons */}
        <path d="M 184 120 L 256 168 L 328 120 L 256 72 Z" fill="url(#masonBrandApexGrad)" />
        <path d="M 224 200 L 256 220 L 288 200 L 256 180 Z" fill="#e0f2fe" />
        
        {/* Right Pillar */}
        <path d="M 328 120 L 392 160 L 392 380 L 328 340 Z" fill="#0ea5e9" />
        <path d="M 288 144 L 328 120 L 328 340 L 288 364 Z" fill="#0284c7" />

        {/* Center Keystone Pillar */}
        <path d="M 232 230 L 256 244 L 280 230 L 280 390 L 256 404 L 232 390 Z" fill="url(#masonBrandSkyGrad)" />
      </g>

      {/* Corner Blueprint Accents in Sky Blue */}
      <path d="M 80 100 L 80 80 L 100 80" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
      <path d="M 432 100 L 432 80 L 412 80" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
      <path d="M 80 412 L 80 432 L 100 432" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
      <path d="M 432 412 L 432 432 L 412 432" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
};
