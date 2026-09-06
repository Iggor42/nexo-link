import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { OptionItem } from '../config/questions';

interface OptionGridProps {
  options: OptionItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  accentColor?: string;
}

export const OptionGrid: React.FC<OptionGridProps> = ({
  options,
  selectedId,
  onSelect,
  accentColor = '#B91C1C',
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <div id="options-grid" className="flex flex-col gap-2.5 w-full select-none">
      {options.map((opt) => {
        const isSelected = selectedId === opt.id;
        return (
            <motion.button
            key={opt.id}
            id={`option-${opt.id}`}
            type="button"
            onClick={() => onSelect(opt.id)}
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
            className={`w-full text-left p-4 rounded-xl border transition-colors duration-150 cursor-pointer flex items-center justify-between shadow-xs active:shadow-none will-change-transform ${
              isSelected
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white hover:border-[#1A1A1A] text-[#1A1A1A] border-[#E5E5E1]'
            }`}
            style={{
              borderColor: isSelected ? accentColor : undefined,
            }}
          >
            <div className="flex flex-col pr-2">
              <span className="font-medium text-sm sm:text-base leading-tight">
                {opt.label}
              </span>
              {opt.description && (
                <span
                  className={`text-xs mt-1 leading-normal ${
                    isSelected ? 'text-[#CCC]' : 'text-[#777]'
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

