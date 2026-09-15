import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

interface TiltCardProps {
  photo: string;
  name: string;
  accent?: string;
  variant?: string;
  className?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  photo,
  name,
  accent = '#B91C1C',
  variant,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const touchDetected =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsTouch(touchDetected);
    }
  }, []);

  // Mouse coords normalized (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics (stiffness 300, damping 20)
  const springX = useSpring(mouseX, { stiffness: 300, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 20 });

  // Map to rotateX/rotateY, max 6deg
  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || isTouch) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: 1000 }}
      className={`relative inline-block cursor-default select-none ${className}`}
    >
      <motion.div
        style={{
          rotateX: reducedMotion ? 0 : isTouch ? 0 : rotateX,
          rotateY: reducedMotion ? 0 : isTouch ? 3 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative inline-block will-change-transform"
      >
        {/* Anel accent 1px deslocado (border + ring-offset) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none translate-x-[3px] translate-y-[3px] -z-10"
          style={{
            border: `1px solid ${accent}${variant === 'glass' ? '88' : '66'}`,
            boxShadow: variant === 'glass' ? `0 0 16px ${accent}44` : undefined,
          }}
        />

        {/* Imagem com sombra multicamadas */}
        <img
          id="personal-avatar"
          src={photo}
          alt={name}
          loading="eager"
          fetchPriority="high"
          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover block ${
            variant === 'glass'
              ? 'border-2 border-[rgba(255,235,210,0.3)] bg-black/20'
              : 'border border-[#E5E5E1] bg-[#FAF9F6]'
          }`}
          style={{
            boxShadow:
              variant === 'glass'
                ? `0 20px 40px -10px ${accent}55, 0 0 25px ${accent}33, 0 8px 16px -4px rgba(0, 0, 0, 0.45)`
                : `0 20px 40px -10px ${accent}40, 0 8px 16px -4px rgba(0, 0, 0, 0.1)`,
          }}
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </div>
  );
};
