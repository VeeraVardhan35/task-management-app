import React from 'react';

export default function AppLogo({ size = 38, className = '' }) {
  return (
    <div 
      className={`app-brand-logo ${className}`} 
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg 
        viewBox="0 0 128 128" 
        width={size} 
        height={size} 
        style={{ overflow: 'visible', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.45))' }}
      >
        <defs>
          <radialGradient id="cmpLogoGlow" cx="50%" cy="50%" r="65%" fx="35%" fy="30%">
            <stop offset="0%" stop-color="#1e1b4b" stop-opacity="0.9" />
            <stop offset="60%" stop-color="#0f172a" stop-opacity="1" />
            <stop offset="100%" stop-color="#030712" stop-opacity="1" />
          </radialGradient>

          <linearGradient id="cmpFacetTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38BDF8" />
            <stop offset="50%" stop-color="#0284C7" />
            <stop offset="100%" stop-color="#2563EB" />
          </linearGradient>

          <linearGradient id="cmpFacetRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#C084FC" />
            <stop offset="50%" stop-color="#8B5CF6" />
            <stop offset="100%" stop-color="#6366F1" />
          </linearGradient>

          <linearGradient id="cmpFacetLeft" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#F43F5E" />
            <stop offset="50%" stop-color="#E11D48" />
            <stop offset="100%" stop-color="#FB7185" />
          </linearGradient>

          <linearGradient id="cmpCoreGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="40%" stop-color="#38BDF8" />
            <stop offset="100%" stop-color="#818CF8" />
          </linearGradient>

          <linearGradient id="cmpRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.9" />
            <stop offset="35%" stop-color="#818CF8" stop-opacity="0.4" />
            <stop offset="70%" stop-color="#C084FC" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#F43F5E" stop-opacity="0.6" />
          </linearGradient>

          <filter id="cmpSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect x="6" y="6" width="116" height="116" rx="28" fill="url(#cmpLogoGlow)" stroke="url(#cmpRingGrad)" stroke-width="2.5" />

        <circle cx="44" cy="40" r="22" fill="#38BDF8" opacity="0.18" filter="url(#cmpSoftGlow)" />
        <circle cx="84" cy="80" r="22" fill="#C084FC" opacity="0.18" filter="url(#cmpSoftGlow)" />

        <path d="M64 26 L94 43 L64 61 L34 43 Z" fill="url(#cmpFacetTop)" stroke="#7DD3FC" stroke-width="1.2" stroke-linejoin="round" />
        <path d="M64 29 L88 43 L64 57 L40 43 Z" fill="#FFFFFF" opacity="0.18" />

        <path d="M64 61 L94 43 L94 79 L64 97 Z" fill="url(#cmpFacetRight)" stroke="#D8B4FE" stroke-width="1.2" stroke-linejoin="round" />
        <path d="M67 63 L91 49 L91 77 L67 92 Z" fill="#FFFFFF" opacity="0.1" />

        <path d="M64 61 L64 97 L34 79 L34 43 Z" fill="url(#cmpFacetLeft)" stroke="#FDA4AF" stroke-width="1.2" stroke-linejoin="round" />

        <ellipse cx="64" cy="62" rx="44" ry="18" fill="none" stroke="url(#cmpRingGrad)" stroke-width="1.2" stroke-dasharray="8 6 18 6" transform="rotate(-25 64 62)" opacity="0.55" />

        <polygon points="64,52 72,61 64,70 56,61" fill="url(#cmpCoreGlow)" />
        <circle cx="64" cy="61" r="2.2" fill="#FFFFFF" />

        <circle cx="98" cy="45" r="2" fill="#38BDF8" opacity="0.9" />
        <circle cx="30" cy="77" r="1.8" fill="#F43F5E" opacity="0.85" />
        <circle cx="78" cy="99" r="1.8" fill="#C084FC" opacity="0.85" />
      </svg>
    </div>
  );
}
