import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { OptionItem } from '../config/questions';

interface OptionGridProps {
  options: OptionItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  accentColor?: string;
  variant?: string;
}

export const OptionGrid: React.FC<OptionGridProps> = ({
  options,
  selectedId,
  onSelect,
  accentColor = '#B91C1C',
  variant,
}) => {
  const reducedMotion = useReducedMotion();
  const isGlass = variant === 'glass';

  return (
    <div id="options-grid" className="flex flex-col gap-2.5 w-full select-none">
      {options.map((opt) => {
        const isSelected = selectedId === opt.id;

        // Estilos específicos para modo Glass
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
            id={`option-${opt.id}`}
            type="button"
            onClick={() => onSelect(opt.id)}
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
            whileHover={
              isGlass && !isSelected
                ? { backgroundColor: 'rgba(214, 178, 120, 0.14)' }
                : undefined
            }
            className={`w-full text-left p-4 rounded-xl transition-colors duration-150 cursor-pointer flex items-center justify-between will-change-transform ${
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
            <div className="flex flex-col pr-2">
              <span
                className={`font-medium text-sm sm:text-base leading-tight ${
                  isGlass ? 'font-glass-sans' : ''
                }`}
              >
                {opt.label}
              </span>
              {opt.description && (
                <span
                  className={`text-xs mt-1 leading-normal ${
                    isGlass
                      ? 'text-[rgba(255,235,210,0.65)] font-glass-sans'
                      : isSelected
                      ? 'text-[#CCC]'
                      : 'text-[#777]'
                  }`}
                >
                  {opt.description}
                </span>
              )}
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
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
  );
};

