import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { OptionItem } from '../config/questions';

interface MultiSelectGridProps {
  options: OptionItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onContinue: () => void;
  accentColor?: string;
  variant?: string;
}

export const MultiSelectGrid: React.FC<MultiSelectGridProps> = ({
  options,
  selectedIds,
  onChange,
  onContinue,
  accentColor = '#B91C1C',
  variant,
}) => {
  const reducedMotion = useReducedMotion();
  const isGlass = variant === 'glass';

  const toggleOption = (id: string) => {
    if (id === 'nenhuma' || id === 'nenhum') {
      // Regra: marcar "nenhuma" ou "nenhum" limpa as demais
      onChange([id]);
      return;
    }

    // Se clicar em qualquer outra, remove "nenhuma" ou "nenhum" da lista
    const withoutNone = selectedIds.filter((item) => item !== 'nenhuma' && item !== 'nenhum');
    if (withoutNone.includes(id)) {
      const remaining = withoutNone.filter((item) => item !== id);
      onChange(remaining);
    } else {
      onChange([...withoutNone, id]);
    }
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <div id="multi-select-container" className="w-full flex flex-col gap-3 select-none">
      <div id="multi-options-grid" className="grid grid-cols-2 gap-2.5 w-full">
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          const isNone = opt.id === 'nenhuma' || opt.id === 'nenhum';

          const glassBg = isSelected
            ? 'rgba(228, 3, 46, 0.16)'
            : 'rgba(214, 178, 120, 0.07)';
          const glassBorder = isSelected
            ? accentColor
            : 'rgba(255, 235, 210, 0.16)';
          const glassText = isSelected ? '#FFF4E6' : 'rgba(255, 244, 230, 0.92)';

          return (
            <motion.button
              key={opt.id}
              id={`multi-option-${opt.id}`}
              type="button"
              onClick={() => toggleOption(opt.id)}
              whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
              whileHover={
                isGlass && !isSelected
                  ? { backgroundColor: 'rgba(214, 178, 120, 0.14)' }
                  : undefined
              }
              className={`p-3.5 rounded-xl transition-colors duration-150 cursor-pointer flex items-center justify-between will-change-transform ${
                isNone ? 'col-span-2' : 'col-span-1'
              } ${
                isGlass
                  ? 'backdrop-blur-md shadow-xs'
                  : `border shadow-xs active:shadow-none ${
                      isSelected
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white hover:border-[#1A1A1A] text-[#1A1A1A] border-[#E5E5E1]'
                    }`
              }`}
              style={
                isGlass
                  ? {
                      backgroundColor: glassBg,
                      border: `${isSelected ? '1.5px' : '1px'} solid ${glassBorder}`,
                      color: glassText,
                    }
                  : {
                      borderColor: isSelected ? accentColor : undefined,
                    }
              }
            >
              <span
                className={`font-medium text-xs sm:text-sm leading-tight ${
                  isGlass ? 'font-glass-sans' : ''
                }`}
              >
                {opt.label}
              </span>

              <div
                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                  isSelected
                    ? 'border-transparent'
                    : isGlass
                    ? 'border-[rgba(255,235,210,0.3)] bg-transparent'
                    : 'border-[#CCC] bg-transparent'
                }`}
                style={{
                  backgroundColor: isSelected ? accentColor : 'transparent',
                }}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 16 16" fill="none">
                    <motion.path
                      d="M3 7l4 4 6-6"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                    />
                  </svg>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        id="continue-multi-step-btn"
        type="button"
        disabled={!hasSelection}
        onClick={onContinue}
        whileTap={hasSelection ? { scale: 0.97 } : undefined}
        animate={{
          opacity: hasSelection ? 1 : 0.45,
          cursor: hasSelection ? 'pointer' : 'not-allowed',
        }}
        transition={{ duration: 0.2 }}
        className={`w-full mt-4 py-3.5 px-6 rounded-xl font-medium text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 border shadow-sm will-change-transform ${
          isGlass
            ? hasSelection
              ? 'text-white'
              : 'bg-[rgba(255,244,230,0.06)] text-[rgba(255,235,210,0.4)] border-[rgba(255,235,210,0.12)]'
            : hasSelection
            ? 'text-white'
            : 'bg-[#F5F5F3] text-[#AAA] border-[#E5E5E1]'
        }`}
        style={
          hasSelection
            ? {
                backgroundColor: isGlass ? 'rgba(255, 244, 230, 0.16)' : accentColor,
                borderColor: isGlass ? 'rgba(255, 235, 210, 0.3)' : accentColor,
                backdropFilter: isGlass ? 'blur(12px)' : undefined,
                boxShadow: isGlass ? `0 4px 20px ${accentColor}40` : undefined,
              }
            : undefined
        }
      >
        <span className={isGlass ? 'font-glass-sans' : ''}>Continuar</span>
        <span aria-hidden="true">→</span>
      </motion.button>
    </div>
  );
};

