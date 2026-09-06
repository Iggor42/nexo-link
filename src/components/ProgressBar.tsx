import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onBack?: () => void;
  accentColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps = 6,
  onBack,
  accentColor = '#1A1A1A',
}) => {
  const reducedMotion = useReducedMotion();
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div id="progress-bar-container" className="w-full mx-auto mb-6 select-none">
      <div className="flex items-center justify-between text-xs text-[#888] mb-2 px-0.5">
        {onBack ? (
          <button
            id="back-step-btn"
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#1A1A1A] py-1 transition-colors cursor-pointer"
          >
            <span aria-hidden="true">←</span>
            <span>Voltar</span>
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1.5">
          {/* Dot do passo que pulsa 1x (scale 1 -> 1.4 -> 1, duration 300ms) */}
          <motion.span
            key={`dot-${currentStep}`}
            animate={{ scale: reducedMotion ? 1 : [1, 1.4, 1] }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accentColor || '#1A1A1A' }}
          />
          <span id="step-counter" className="text-[11px] uppercase tracking-widest text-[#999] font-medium font-mono">
            Passo 0{currentStep} de 0{totalSteps}
          </span>
        </div>
      </div>

      <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden flex relative">
        <motion.div
          id="progress-indicator"
          className="h-full rounded-full"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{
            type: reducedMotion ? 'tween' : 'spring',
            damping: 24,
            stiffness: 180,
            duration: reducedMotion ? 0.2 : undefined,
          }}
          style={{
            backgroundColor: accentColor || '#1A1A1A',
          }}
        />
      </div>
    </div>
  );
};

