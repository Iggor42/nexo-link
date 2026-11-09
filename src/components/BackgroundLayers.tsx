import React from 'react';

interface BackgroundLayersProps {
  accentColor?: string;
  variant?: string;
  backgroundImage?: string;
}

export const BackgroundLayers: React.FC<BackgroundLayersProps> = ({
  accentColor = '#B91C1C',
  variant,
  backgroundImage,
}) => {
  const accent = accentColor || '#B91C1C';
  const isGlass = variant === 'glass';

  if (variant === 'barber') {
    const bgUrl = backgroundImage || '/assets/akis-fachada.webp';

    return (
      <div
        id="background-layers-barber"
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden -z-10 select-none bg-[#090909]"
      >
        {/* Foto de fachada com overlay escuro atmosferico */}
        {bgUrl && (
          <img
            src={bgUrl}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-15 grayscale contrast-125 scale-105"
          />
        )}

        {/* Vinheta escura profunda de alto contraste */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 20%, rgba(10, 10, 10, 0.7) 0%, rgba(7, 7, 7, 0.95) 70%, #060606 100%)',
          }}
        />

        {/* Glow unico cromado, bem contido — o luxo aqui e contencao, nao cor */}
        <div
          className="absolute -top-24 right-0 w-96 h-96 rounded-full blur-[110px] pointer-events-none opacity-[0.07]"
          style={{ backgroundColor: '#E5E7EB' }}
        />

        {/* Brilho central metalico sutil */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at 50% 10%, rgba(255, 255, 255, 0.12), transparent 60%)',
          }}
        />

        {/* Grain de textura urbana */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.045] mix-blend-overlay">
          <filter id="grain-barber">
            <feTurbulence baseFrequency="0.75" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-barber)" />
        </svg>
      </div>
    );
  }

  if (isGlass) {
    const bgUrl = backgroundImage || '/assets/caio-bg.webp';

    return (
      <div
        id="background-layers-glass"
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden -z-10 select-none"
      >
        {/* Imagem full-bleed fixa */}
        <picture>
          <source srcSet="/assets/caio-bg.webp" type="image/webp" />
          <img
            src={bgUrl}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </picture>

        {/* Overlay escuro em gradiente vertical para legibilidade (contraste >= 4.5:1) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(10, 7, 4, 0.72) 0%, rgba(10, 7, 4, 0.32) 40%, rgba(10, 7, 4, 0.82) 100%)',
          }}
        />

        {/* Brilho âmbar/accent translúcido sutil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 25%, ${accent}18, transparent 75%)`,
          }}
        />

        {/* Grain sutil */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04] mix-blend-overlay">
          <filter id="grain-glass">
            <feTurbulence baseFrequency="0.65" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-glass)" />
        </svg>
      </div>
    );
  }

  return (
    <div
      id="background-layers"
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden -z-10 select-none"
    >
      {/* Camada 1: Gradiente radial no accent do tenant (opacity 5%) */}
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
