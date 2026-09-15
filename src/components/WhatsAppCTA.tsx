import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface WhatsAppCTAProps {
  personalName: string;
  whatsappUrl: string;
  accentColor?: string;
  variant?: string;
}

export const WhatsAppCTA: React.FC<WhatsAppCTAProps> = ({
  personalName,
  whatsappUrl,
  accentColor = '#B91C1C',
  variant,
}) => {
  const reducedMotion = useReducedMotion();
  const [isClicked, setIsClicked] = useState(false);
  const isGlass = variant === 'glass';

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 450);
  };

  return (
    <div className="relative w-full">
      {/* Pulso radial único a partir do botão após clique: scale 1 -> 1.2, opacity 1 -> 0 */}
      {isClicked && !reducedMotion && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none animate-radial-click border-2"
          style={{
            borderColor: accentColor,
            backgroundColor: `${accentColor}33`,
          }}
        />
      )}

      <motion.a
        id="whatsapp-cta-link"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        whileTap={{ scale: 0.97 }}
        whileHover={
          isGlass
            ? {
                backgroundColor: 'rgba(255, 244, 230, 0.20)',
                boxShadow: `0 8px 32px ${accentColor}55`,
                scale: reducedMotion ? 1 : 1.015,
              }
            : reducedMotion
            ? { opacity: 0.94 }
            : { scale: 1.015 }
        }
        className={`relative w-full py-4 px-6 font-medium text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer border will-change-transform ${
          isGlass
            ? 'rounded-full text-[#FFF4E6] backdrop-blur-md transition-all duration-200'
            : `rounded-xl text-white shadow-md ${reducedMotion ? '' : 'animate-cta-pulse'}`
        }`}
        style={
          isGlass
            ? {
                backgroundColor: 'rgba(255, 244, 230, 0.12)',
                borderColor: 'rgba(255, 235, 210, 0.28)',
                boxShadow: `0 4px 24px rgba(0, 0, 0, 0.35), 0 0 16px ${accentColor}30`,
              }
            : ({
                backgroundColor: accentColor,
                borderColor: accentColor,
                '--cta-pulse-color': `${accentColor}33`,
                '--cta-glow-color': `${accentColor}26`,
              } as React.CSSProperties)
        }
      >
        <span className={isGlass ? 'font-glass-sans' : ''}>
          Falar com {personalName} no WhatsApp
        </span>
        <span aria-hidden="true" className="text-base">↗</span>
      </motion.a>
    </div>
  );
};


