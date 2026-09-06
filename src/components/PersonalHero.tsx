import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { TiltCard } from './TiltCard';
import type { Personal } from '../types';

interface PersonalHeroProps {
  personal: Personal;
  onStart: () => void;
}

export const PersonalHero: React.FC<PersonalHeroProps> = ({ personal, onStart }) => {
  const reducedMotion = useReducedMotion();
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    }
  }, []);

  // Magnetic CTA (desktop only, ±4px tracking cursor)
  const btnX = useMotionValue(0);
  const btnY = useMotionValue(0);
  const springBtnX = useSpring(btnX, { damping: 15, stiffness: 220 });
  const springBtnY = useSpring(btnY, { damping: 15, stiffness: 220 });

  const handleBtnMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedMotion || isTouch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8; // ±4px
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8; // ±4px
    btnX.set(x);
    btnY.set(y);
  };

  const handleBtnMouseLeave = () => {
    btnX.set(0);
    btnY.set(0);
  };

  const accent = personal.accent || '#B91C1C';
  const nameWords = personal.name ? personal.name.trim().split(/\s+/) : [];

  return (
    <div id="personal-hero" className="w-full max-w-md mx-auto text-center flex flex-col items-center pt-2 pb-4 px-2">
      {/* 3D Tilt Card (Avatar) */}
      <div className="mb-5">
        <TiltCard photo={personal.photo} name={personal.name} accent={accent} />
      </div>

      {/* Badge CREF (se existir): shimmer sweep único no load */}
      {personal.cref && personal.cref.trim() !== '' ? (
        <motion.div
          id="cref-badge-container"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center gap-2 mb-3"
        >
          <div className="relative overflow-hidden text-[10px] tracking-[0.2em] font-semibold text-[#888] border border-[#E5E5E1] px-2.5 py-1 rounded uppercase">
            <span id="cref-badge">{personal.cref}</span>
            {!reducedMotion && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ delay: 0.5, duration: 1, ease: 'easeInOut' }}
              />
            )}
          </div>
        </motion.div>
      ) : null}

      {/* Título (nome): Revelação em máscara de linha */}
      <motion.h1
        id="personal-name"
        className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] font-normal tracking-tight mb-2 leading-snug flex flex-wrap justify-center"
        initial={reducedMotion ? { opacity: 0 } : { y: '100%' }}
        animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {nameWords.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden mr-2 last:mr-0">
            <motion.span
              style={{ display: 'inline-block' }}
              initial={reducedMotion ? { opacity: 0 } : { y: '100%' }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: reducedMotion ? 0.2 : 0.8,
                ease: [0.22, 1, 0.36, 1],
                delay: reducedMotion ? 0 : i * 0.08,
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.h1>

      {/* Tagline: fade-up 120ms após título (delay 0.12s) */}
      <motion.p
        id="personal-tagline"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0.2 : 0.45,
          delay: reducedMotion ? 0 : 0.12,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="text-sm sm:text-base text-[#444] leading-relaxed mb-6 italic font-serif max-w-sm"
      >
        {personal.tagline}
      </motion.p>

      {/* Chips: stagger 60ms, scale 0.9→1, duration 400ms */}
      {personal.specialties && personal.specialties.length > 0 && (
        <motion.div
          id="specialties-list"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: reducedMotion ? 0 : 0.06,
                delayChildren: reducedMotion ? 0 : 0.22,
              },
            },
          }}
          className="flex flex-wrap items-center justify-center gap-1.5 mb-8 max-w-md"
        >
          {personal.specialties.map((spec) => (
            <motion.span
              key={spec}
              variants={{
                hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 4 },
                visible: { opacity: 1, scale: 1, y: 0 },
              }}
              transition={{ duration: reducedMotion ? 0.2 : 0.4 }}
              className="text-[11px] bg-[#F5F5F3] px-3 py-1 rounded-full border border-[#E5E5E1] text-[#666] font-medium"
            >
              {spec}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* CTA Magnético (desktop only): ±4px seguindo cursor, press scale 0.97 (100ms), glow suave no hover */}
      <motion.button
        id="start-assessment-btn"
        type="button"
        onClick={onStart}
        onMouseMove={handleBtnMouseMove}
        onMouseLeave={handleBtnMouseLeave}
        style={{
          x: reducedMotion || isTouch ? 0 : springBtnX,
          y: reducedMotion || isTouch ? 0 : springBtnY,
          backgroundColor: accent,
          borderColor: accent,
        }}
        whileHover={
          reducedMotion
            ? { opacity: 0.94 }
            : {
                scale: 1.015,
                boxShadow: `0 0 20px ${accent}40`,
              }
        }
        whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        className="w-full py-4 px-6 rounded-xl text-white font-medium text-sm sm:text-base tracking-wide transition-colors duration-150 cursor-pointer shadow-sm flex items-center justify-center gap-2 border will-change-transform"
      >
        <span>Fazer minha avaliação gratuita</span>
        <span aria-hidden="true" className="text-base">↗</span>
      </motion.button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#888]">
        <span>Leva cerca de 1 minuto</span>
        <span>·</span>
        <span>6 passos rápidos</span>
      </div>
    </div>
  );
};

