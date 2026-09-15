import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QuestionCard } from './QuestionCard';
import { OptionGrid } from './OptionGrid';
import { MultiSelectGrid } from './MultiSelectGrid';
import { formatBRPhone, cleanPhoneDigits, PhoneSchema } from '../lib/lead';
import type { JourneyStep } from '../types';

interface DynamicStepRendererProps {
  stepConfig: JourneyStep;
  value: unknown;
  onChange: (field: string, value: unknown) => void;
  onNext: () => void;
  accentColor: string;
  isLastStep: boolean;
  variant?: string;
}

export const DynamicStepRenderer: React.FC<DynamicStepRendererProps> = ({
  stepConfig,
  value,
  onChange,
  onNext,
  accentColor,
  isLastStep,
  variant,
}) => {
  const [inputFocused, setInputFocused] = useState(false);
  const [error, setError] = useState('');
  const isGlass = variant === 'glass';

  // 1. Single Select
  if (stepConfig.type === 'single') {
    const selectedId = typeof value === 'string' ? value : '';
    const handleSelect = (id: string) => {
      onChange(stepConfig.field, id);
      setTimeout(() => {
        onNext();
      }, 160);
    };

    return (
      <QuestionCard title={stepConfig.title} subtitle={stepConfig.subtitle} variant={variant}>
        <OptionGrid
          options={stepConfig.options || []}
          selectedId={selectedId}
          onSelect={handleSelect}
          accentColor={accentColor}
          variant={variant}
        />
      </QuestionCard>
    );
  }

  // 2. Multi Select
  if (stepConfig.type === 'multi') {
    const selectedIds = Array.isArray(value) ? (value as string[]) : [];

    const handleContinue = () => {
      if (selectedIds.length > 0) {
        onNext();
      }
    };

    return (
      <QuestionCard title={stepConfig.title} subtitle={stepConfig.subtitle} variant={variant}>
        <MultiSelectGrid
          options={stepConfig.options || []}
          selectedIds={selectedIds}
          onChange={(newIds) => onChange(stepConfig.field, newIds)}
          onContinue={handleContinue}
          accentColor={accentColor}
          variant={variant}
        />
      </QuestionCard>
    );
  }

  // 3. Phone Input (com máscara BR e validação zod DDD)
  if (stepConfig.type === 'phone') {
    const phoneVal = typeof value === 'string' ? value : '';

    const handlePhoneSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const digits = cleanPhoneDigits(phoneVal);
      const validation = PhoneSchema.safeParse(digits);
      if (!validation.success) {
        setError(validation.error.issues[0]?.message || 'Informe um WhatsApp válido com DDD (10 ou 11 dígitos).');
        return;
      }
      setError('');
      onNext();
    };

    const digitsCount = cleanPhoneDigits(phoneVal).length;
    const isValid = digitsCount >= 10 && digitsCount <= 11;

    return (
      <QuestionCard title={stepConfig.title} subtitle={stepConfig.subtitle} variant={variant}>
        <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
          <div className="relative pt-1">
            <motion.label
              htmlFor={`input-${stepConfig.field}`}
              className={`block text-[11px] uppercase tracking-[0.18em] mb-1.5 font-mono ${
                isGlass ? '' : ''
              }`}
              animate={{
                color: inputFocused
                  ? accentColor
                  : isGlass
                  ? 'rgba(255, 235, 210, 0.65)'
                  : '#888',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              WhatsApp com DDD
            </motion.label>
            <input
              id={`input-${stepConfig.field}`}
              type="tel"
              autoFocus
              value={phoneVal}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onChange={(e) => {
                const formatted = formatBRPhone(e.target.value);
                onChange(stepConfig.field, formatted);
                if (error) setError('');
              }}
              placeholder={stepConfig.placeholder || '(11) 98765-4321'}
              className={`w-full p-4 rounded-xl text-base transition-all font-mono focus:outline-none ${
                isGlass
                  ? 'bg-[rgba(255,244,230,0.05)] backdrop-blur-[9px] text-[#FFF4E6] placeholder:text-[rgba(255,235,210,0.4)] border-b-2 border-t-0 border-x-0 rounded-b-none'
                  : 'border border-[#E5E5E1] bg-white text-[#1A1A1A] placeholder:text-[#999] shadow-2xs'
              }`}
              style={{
                borderColor: inputFocused
                  ? accentColor
                  : isGlass
                  ? 'rgba(255, 235, 210, 0.25)'
                  : '#E5E5E1',
                boxShadow: inputFocused
                  ? isGlass
                    ? `0 2px 12px ${accentColor}40`
                    : `0 0 0 3px ${accentColor}20`
                  : 'none',
              }}
            />
            {error && (
              <p id="phone-error" className="text-[#FF5252] text-xs mt-2 pl-1 font-medium">
                {error}
              </p>
            )}
          </div>

          <motion.button
            id={`finish-${stepConfig.field}-btn`}
            type="submit"
            disabled={!isValid}
            animate={{
              opacity: isValid ? 1 : 0.45,
              cursor: isValid ? 'pointer' : 'not-allowed',
            }}
            transition={{ duration: 0.2 }}
            whileTap={isValid ? { scale: 0.97 } : undefined}
            className={`w-full py-4 px-6 rounded-xl font-medium text-base tracking-wide transition-colors duration-150 shadow-sm flex items-center justify-center gap-2 border will-change-transform ${
              isGlass ? 'text-white' : 'text-white'
            }`}
            style={
              isGlass
                ? {
                    backgroundColor: isValid ? 'rgba(255, 244, 230, 0.16)' : 'rgba(255, 244, 230, 0.06)',
                    borderColor: isValid ? 'rgba(255, 235, 210, 0.3)' : 'rgba(255, 235, 210, 0.12)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: isValid ? `0 4px 20px ${accentColor}40` : undefined,
                  }
                : {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  }
            }
          >
            <span className={isGlass ? 'font-glass-sans' : ''}>
              {isLastStep ? 'Concluir avaliação' : 'Continuar'}
            </span>
            <span aria-hidden="true">→</span>
          </motion.button>
        </form>
      </QuestionCard>
    );
  }

  // 4. Text / Textarea Input
  const textVal = typeof value === 'string' ? value : '';
  const isRequired = stepConfig.required !== false;
  const minChars = stepConfig.minChars || (isRequired ? 2 : 0);
  const isTextarea = stepConfig.field === 'difficulty' || stepConfig.field.includes('challenge') || stepConfig.field.includes('message');

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = textVal.trim();
    if (isRequired && cleanText.length < minChars) {
      setError(`Por favor, informe pelo menos ${minChars} caracteres.`);
      return;
    }
    setError('');
    onNext();
  };

  const isFormValid = !isRequired || textVal.trim().length >= minChars;

  return (
    <QuestionCard title={stepConfig.title} subtitle={stepConfig.subtitle} variant={variant}>
      <form onSubmit={handleTextSubmit} className="flex flex-col gap-4">
        <div className="relative pt-1">
          <motion.label
            htmlFor={`input-${stepConfig.field}`}
            className="block text-[11px] uppercase tracking-[0.18em] mb-1.5 font-mono"
            animate={{
              color: inputFocused
                ? accentColor
                : isGlass
                ? 'rgba(255, 235, 210, 0.65)'
                : '#888',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {isRequired ? 'Campo obrigatório' : 'Opcional'}
          </motion.label>

          {isTextarea ? (
            <textarea
              id={`input-${stepConfig.field}`}
              rows={4}
              value={textVal}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onChange={(e) => {
                onChange(stepConfig.field, e.target.value);
                if (error) setError('');
              }}
              placeholder={stepConfig.placeholder || 'Digite sua resposta...'}
              className={`w-full p-4 rounded-xl text-sm sm:text-base transition-all resize-none focus:outline-none ${
                isGlass
                  ? 'bg-[rgba(255,244,230,0.05)] backdrop-blur-[9px] text-[#FFF4E6] placeholder:text-[rgba(255,235,210,0.4)] border-b-2 border-t-0 border-x-0 rounded-b-none font-glass-sans'
                  : 'border border-[#E5E5E1] bg-white text-[#1A1A1A] placeholder:text-[#999] shadow-2xs'
              }`}
              style={{
                borderColor: inputFocused
                  ? accentColor
                  : isGlass
                  ? 'rgba(255, 235, 210, 0.25)'
                  : '#E5E5E1',
                boxShadow: inputFocused
                  ? isGlass
                    ? `0 2px 12px ${accentColor}40`
                    : `0 0 0 3px ${accentColor}20`
                  : 'none',
              }}
            />
          ) : (
            <input
              id={`input-${stepConfig.field}`}
              type="text"
              autoFocus
              value={textVal}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onChange={(e) => {
                onChange(stepConfig.field, e.target.value);
                if (error) setError('');
              }}
              placeholder={stepConfig.placeholder || 'Como podemos te chamar?'}
              className={`w-full p-4 rounded-xl text-base transition-all focus:outline-none ${
                isGlass
                  ? 'bg-[rgba(255,244,230,0.05)] backdrop-blur-[9px] text-[#FFF4E6] placeholder:text-[rgba(255,235,210,0.4)] border-b-2 border-t-0 border-x-0 rounded-b-none font-glass-sans'
                  : 'border border-[#E5E5E1] bg-white text-[#1A1A1A] placeholder:text-[#999] shadow-2xs'
              }`}
              style={{
                borderColor: inputFocused
                  ? accentColor
                  : isGlass
                  ? 'rgba(255, 235, 210, 0.25)'
                  : '#E5E5E1',
                boxShadow: inputFocused
                  ? isGlass
                    ? `0 2px 12px ${accentColor}40`
                    : `0 0 0 3px ${accentColor}20`
                  : 'none',
              }}
            />
          )}

          {error && (
            <p id={`${stepConfig.field}-error`} className="text-[#FF5252] text-xs mt-2 pl-1 font-medium">
              {error}
            </p>
          )}
        </div>

        <motion.button
          id={`finish-${stepConfig.field}-btn`}
          type="submit"
          disabled={!isFormValid}
          animate={{
            opacity: isFormValid ? 1 : 0.45,
            cursor: isFormValid ? 'pointer' : 'not-allowed',
          }}
          transition={{ duration: 0.2 }}
          whileTap={isFormValid ? { scale: 0.97 } : undefined}
          className={`w-full py-4 px-6 rounded-xl font-medium text-base tracking-wide transition-colors duration-150 shadow-sm flex items-center justify-center gap-2 border will-change-transform ${
            isGlass ? 'text-white' : 'text-white'
          }`}
          style={
            isGlass
              ? {
                  backgroundColor: isFormValid ? 'rgba(255, 244, 230, 0.16)' : 'rgba(255, 244, 230, 0.06)',
                  borderColor: isFormValid ? 'rgba(255, 235, 210, 0.3)' : 'rgba(255, 235, 210, 0.12)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: isFormValid ? `0 4px 20px ${accentColor}40` : undefined,
                }
              : {
                  backgroundColor: accentColor,
                  borderColor: accentColor,
                }
          }
        >
          <span className={isGlass ? 'font-glass-sans' : ''}>
            {isLastStep
              ? 'Concluir avaliação'
              : !isRequired && textVal.trim().length === 0
              ? 'Pular este passo'
              : 'Continuar'}
          </span>
          <span aria-hidden="true">→</span>
        </motion.button>
      </form>
    </QuestionCard>
  );
};
