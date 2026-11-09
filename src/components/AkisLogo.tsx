import React from 'react';

interface AkisLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AkisLogo: React.FC<AkisLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: { width: 140, height: 42 },
    md: { width: 220, height: 66 },
    lg: { width: 280, height: 84 },
    xl: { width: 340, height: 102 },
  };

  const { width, height } = sizeMap[size];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 320 90"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-auto max-w-full drop-shadow-[0_4px_16px_rgba(255,255,255,0.18)]"
        aria-label="Akis Barbearia e Loja Masculina"
      >
        <defs>
          {/* Degradê Metálico Cromado Refinado */}
          <linearGradient id="akisChrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#F3F4F6" />
            <stop offset="55%" stopColor="#E5E7EB" />
            <stop offset="80%" stopColor="#9CA3AF" />
            <stop offset="100%" stopColor="#6B7280" />
          </linearGradient>

          {/* Brilho Especular Superior */}
          <linearGradient id="akisHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#E5E7EB" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#9CA3AF" stopOpacity="0.1" />
          </linearGradient>

          {/* Sombra Suave */}
          <filter id="akisShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.8" />
          </filter>
        </defs>

        <g filter="url(#akisShadow)">
          {/* Letra 'A' Geométrica Estilizada (Seta / Telhado / Triângulo sem travessão horizontal) */}
          <g>
            {/* Perna Esquerda da Seta 'A' */}
            <path
              d="M 52 10 L 14 78 L 32 78 L 52 38 L 52 10 Z"
              fill="url(#akisChrome)"
            />
            {/* Perna Direita da Seta 'A' */}
            <path
              d="M 52 10 L 90 78 L 72 78 L 52 38 L 52 10 Z"
              fill="url(#akisChrome)"
            />
            {/* Vértice Superior Pontiagudo com chanfro metálico */}
            <path
              d="M 44 26 L 52 10 L 60 26 Z"
              fill="#FFFFFF"
            />
          </g>

          {/* Letra 'K' Tech / Futurista */}
          <g transform="translate(100, 0)">
            {/* Haste vertical do K */}
            <rect x="6" y="16" width="16" height="62" rx="2" fill="url(#akisChrome)" />
            {/* Braço superior do K */}
            <path
              d="M 22 47 L 50 16 L 68 16 L 36 51 Z"
              fill="url(#akisChrome)"
            />
            {/* Perna inferior do K */}
            <path
              d="M 33 46 L 68 78 L 48 78 L 22 51 Z"
              fill="url(#akisChrome)"
            />
          </g>

          {/* Letra 'I' Geométrica */}
          <g transform="translate(182, 0)">
            <rect x="6" y="16" width="16" height="62" rx="2" fill="url(#akisChrome)" />
          </g>

          {/* Letra 'S' Geométrica e Cortada */}
          <g transform="translate(216, 0)">
            <path
              d="M 68 28 L 68 16 L 12 16 C 8 16 6 19 6 23 L 6 42 C 6 46 9 49 14 49 L 58 49 C 62 49 64 51 64 54 L 64 66 C 64 69 62 71 58 71 L 6 71 L 6 83 L 62 83 C 70 83 76 77 76 69 L 76 52 C 76 44 70 38 62 38 L 18 38 C 14 38 12 36 12 33 L 12 24 C 12 21 14 19 18 19 L 68 19 Z"
              fill="url(#akisChrome)"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
