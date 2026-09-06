import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface WhatsAppCTAProps {
  personalName: string;
  whatsappUrl: string;
  accentColor?: string;
}

export const WhatsAppCTA: React.FC<WhatsAppCTAProps> = ({
  personalName,
  whatsappUrl,
  accentColor = '#B91C1C',
}) => {
  const reducedMotion = useReducedMotion();
  const [isClicked, setIsClicked] = useState(false);

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
          className="absolute inset-0 rounded-xl pointer-events-none animate-radial-click border-2"
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
          reducedMotion
            ? { opacity: 0.94 }
            : { scale: 1.015 }
        }
        className={`relative w-full py-4 px-6 rounded-xl text-white font-medium text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer border shadow-md will-change-transform ${
          reducedMotion ? '' : 'animate-cta-pulse'
        }`}
        style={
          {
            backgroundColor: accentColor,
            borderColor: accentColor,
            '--cta-pulse-color': `${accentColor}33`,
            '--cta-glow-color': `${accentColor}26`,
          } as React.CSSProperties
        }
      >
        <span>Falar com {personalName} no WhatsApp</span>
        <span aria-hidden="true" className="text-base">↗</span>
      </motion.a>
    </div>
  );
};


