import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { TiltCard } from './TiltCard';
import type { Personal } from '../types';

interface PersonalHeroProps {
  personal: Personal;
  onStart: () => void;
  totalSteps?: number;
}

export const PersonalHero: React.FC<PersonalHeroProps> = ({ personal, onStart, totalSteps = 6 }) => {
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

  const accent = personal.theme?.accent || personal.accent || '#B91C1C';
  const isGlass = personal.theme?.variant === 'glass';
  const nameWords = personal.name ? personal.name.trim().split(/\s+/) : [];

  return (
    <div id="personal-hero" className="w-full max-w-md mx-auto text-center flex flex-col items-center pt-2 pb-4 px-2">
      {/* 3D Tilt Card (Avatar) */}
      <div className="mb-5">
        <TiltCard
          photo={personal.photo}
          name={personal.name}
          accent={accent}
          variant={personal.theme?.variant}
        />
      </div>

      {/* Badge CREF ou Cidade / Desde (se existir): shimmer sweep único no load */}
      {personal.cref && personal.cref.trim() !== '' ? (
        <motion.div
          id="cref-badge-container"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center gap-2 mb-3"
        >
          <div
            className={`relative overflow-hidden text-[10px] tracking-[0.2em] font-semibold px-2.5 py-1 rounded uppercase ${
              isGlass
                ? 'text-[rgba(255,235,210,0.7)] border border-[rgba(255,235,210,0.18)] bg-[rgba(255,244,230,0.06)]'
                : 'text-[#888] border border-[#E5E5E1]'
            }`}
          >
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
      ) : personal.city || personal.since ? (
        <motion.div
          id="city-badge-container"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center gap-2 mb-3"
        >
          <div
            className={`relative overflow-hidden text-[11px] tracking-[0.18em] font-semibold px-2.5 py-1 rounded uppercase ${
              isGlass
                ? 'text-[rgba(255,235,210,0.65)] border border-[rgba(255,235,210,0.18)] bg-[rgba(255,244,230,0.06)]'
                : 'text-[#888] border border-[#E5E5E1]'
            }`}
          >
            <span>
              {personal.city ? personal.city : ''}
              {personal.city && personal.since ? ' · ' : ''}
              {personal.since ? `Desde ${personal.since}` : ''}
            </span>
          </div>
        </motion.div>
      ) : null}

      {/* Título (nome): Revelação em máscara de linha */}
      <motion.h1
        id="personal-name"
        className={`${
          isGlass
            ? 'font-glass-serif text-3xl sm:text-4xl text-[#FFF4E6] font-medium tracking-[0.01em]'
            : 'font-serif text-3xl sm:text-4xl text-[#1A1A1A] font-normal tracking-tight'
        } mb-2 leading-snug flex flex-wrap justify-center`}
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

      {/* Tagline ou Profession: fade-up 120ms após título (delay 0.12s) */}
      {(personal.tagline || personal.profession) && (
        <motion.p
          id="personal-tagline"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0.2 : 0.45,
            delay: reducedMotion ? 0 : 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={`text-sm sm:text-base leading-relaxed mb-6 italic max-w-sm ${
            isGlass
              ? 'text-[rgba(255,235,210,0.75)] font-glass-serif'
              : 'text-[#444] font-serif'
          }`}
        >
          {personal.tagline || personal.profession}
        </motion.p>
      )}

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
              className={`text-[11px] px-3 py-1 rounded-full border font-medium ${
                isGlass
                  ? 'bg-[rgba(255,244,230,0.08)] border-[rgba(255,235,210,0.16)] text-[rgba(255,235,210,0.85)] font-glass-sans'
                  : 'bg-[#F5F5F3] border-[#E5E5E1] text-[#666]'
              }`}
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
        style={
          isGlass
            ? {
                x: reducedMotion || isTouch ? 0 : springBtnX,
                y: reducedMotion || isTouch ? 0 : springBtnY,
                backgroundColor: 'rgba(255, 244, 230, 0.12)',
                borderColor: 'rgba(255, 235, 210, 0.28)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
              }
            : {
                x: reducedMotion || isTouch ? 0 : springBtnX,
                y: reducedMotion || isTouch ? 0 : springBtnY,
                backgroundColor: accent,
                borderColor: accent,
              }
        }
        whileHover={
          isGlass
            ? {
                backgroundColor: 'rgba(255, 244, 230, 0.20)',
                boxShadow: `0 8px 32px ${accent}55`,
                scale: reducedMotion ? 1 : 1.015,
              }
            : reducedMotion
            ? { opacity: 0.94 }
            : {
                scale: 1.015,
                boxShadow: `0 0 20px ${accent}40`,
              }
        }
        whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        className={`w-full py-4 px-6 font-medium text-sm sm:text-base tracking-wide transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 border will-change-transform ${
          isGlass
            ? 'rounded-full text-[#FFF4E6] backdrop-blur-md'
            : 'rounded-xl text-white shadow-sm'
        }`}
      >
        <span className={isGlass ? 'font-glass-sans' : ''}>
          {personal.journey?.niche === 'eventos'
            ? 'Solicitar orçamento personalizado'
            : 'Fazer minha avaliação gratuita'}
        </span>
        <span aria-hidden="true" className="text-base">↗</span>
      </motion.button>

      <div
        className={`mt-4 flex items-center justify-center gap-2 text-xs ${
          isGlass
            ? 'text-[rgba(255,235,210,0.65)] font-glass-sans'
            : 'text-[#888]'
        }`}
      >
        <span>Leva cerca de 1 minuto</span>
        <span>·</span>
        <span>{totalSteps} passos rápidos</span>
      </div>
    </div>
  );
};

