import React from 'react';

interface BackgroundLayersProps {
  accentColor?: string;
}

export const BackgroundLayers: React.FC<BackgroundLayersProps> = ({
  accentColor = '#B91C1C',
}) => {
  const accent = accentColor || '#B91C1C';

  return (
    <div
      id="background-layers"
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden -z-10 select-none"
    >
      {/* Camada 1: Gradiente radial no accent do personal (opacity 5%) */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${accent}08, transparent 70%)`,
        }}
      />

      {/* Camada 2: 2 orbes flutuantes com blur-3xl, accent a 8% */}
      {/* Orbe 1: top-20 left-10, w-96 h-96, blur-3xl, deriva 30s */}
      <div
        className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl pointer-events-none z-0 animate-drift-1"
        style={{
          backgroundColor: accent,
          opacity: 0.08,
        }}
      />
      {/* Orbe 2: bottom-20 right-10, w-80 h-80, blur-3xl, deriva 35s */}
      <div
        className="absolute bottom-20 right-10 w-80 h-80 rounded-full blur-3xl pointer-events-none z-0 animate-drift-2"
        style={{
          backgroundColor: accent,
          opacity: 0.08,
        }}
      />

      {/* Camada 3: Grain de filme via SVG inline (noise filter) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] z-0 mix-blend-multiply">
        <filter id="grain">
          <feTurbulence baseFrequency="0.65" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
};
