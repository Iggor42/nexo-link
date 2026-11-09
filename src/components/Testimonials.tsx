import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Testimonial } from '../types';

interface TestimonialsProps {
  testimonials?: Testimonial[];
  accentColor?: string;
  variant?: string;
}

/**
 * Prova social: carrossel simples de depoimentos (navegação anterior/próximo + dots).
 * Renderiza SOMENTE quando o inquilino tem itens em `testimonials`;
 * array vazio/ausente retorna null — seção oculta.
 */
export const Testimonials: React.FC<TestimonialsProps> = ({
  testimonials,
  accentColor = '#B91C1C',
  variant,
}) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reducedMotion = useReducedMotion();
  const isGlass = variant === 'glass';

  const items = (testimonials || []).filter(
    (t) => t && t.quote?.trim() && t.name?.trim()
  );

  if (items.length === 0) return null;

  const current = items[Math.min(index, items.length - 1)];
  const go = (next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex(((next % items.length) + items.length) % items.length);
  };

  const meta = [current.eventType, current.city].filter(Boolean).join(' · ');

  return (
    <section
      id="testimonials-section"
      aria-label="Depoimentos de clientes"
      className={`w-full mt-6 rounded-2xl p-4 sm:p-5 text-left ${
        isGlass
          ? 'bg-[rgba(255,244,230,0.05)] backdrop-blur-[9px] border border-[rgba(255,235,210,0.16)]'
          : 'bg-[#FAF9F6] border border-[#E5E5E1]'
      }`}
    >
      <div
        className={`text-[10px] font-mono uppercase tracking-[0.18em] mb-3 ${
          isGlass ? 'text-[rgba(255,235,210,0.65)]' : 'text-[#888]'
        }`}
      >
        Quem já contratou
      </div>

      <div className="relative overflow-hidden min-h-[96px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.figure
            key={index}
            id={`testimonial-${index}`}
            custom={direction}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.28, ease: 'easeOut' }}
          >
            <blockquote
              className={`text-sm leading-relaxed italic ${
                isGlass ? 'text-[#FFF4E6] font-glass-sans' : 'text-[#333]'
              }`}
            >
              “{current.quote}”
            </blockquote>
            <figcaption className="mt-3">
              <span
                className={`block text-sm font-semibold ${
                  isGlass ? 'text-[#FFF4E6]' : 'text-[#1A1A1A]'
                }`}
              >
                {current.name}
              </span>
              {meta && (
                <span
                  className={`block text-xs mt-0.5 ${
                    isGlass ? 'text-[rgba(255,235,210,0.65)]' : 'text-[#888]'
                  }`}
                >
                  {meta}
                </span>
              )}
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Depoimentos">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Depoimento ${i + 1}`}
                onClick={() => go(i)}
                className="w-2 h-2 rounded-full cursor-pointer transition-all"
                style={{
                  backgroundColor: i === index ? accentColor : isGlass ? 'rgba(255,235,210,0.3)' : '#D4D4D0',
                  transform: i === index ? 'scale(1.25)' : 'scale(1)',
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              id="testimonial-prev-btn"
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Depoimento anterior"
              className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                isGlass
                  ? 'border-[rgba(255,235,210,0.25)] text-[#FFF4E6] hover:bg-[rgba(255,244,230,0.1)]'
                  : 'border-[#E5E5E1] text-[#555] hover:border-[#1A1A1A]'
              }`}
            >
              ←
            </button>
            <button
              id="testimonial-next-btn"
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Próximo depoimento"
              className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                isGlass
                  ? 'border-[rgba(255,235,210,0.25)] text-[#FFF4E6] hover:bg-[rgba(255,244,230,0.1)]'
                  : 'border-[#E5E5E1] text-[#555] hover:border-[#1A1A1A]'
              }`}
            >
              →
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
