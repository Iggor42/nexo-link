import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QuestionCard } from './QuestionCard';
import { OptionGrid } from './OptionGrid';
import { MultiSelectGrid } from './MultiSelectGrid';
import {
  formatBRPhone,
  cleanPhoneDigits,
  PhoneSchema,
  NO_DATE_VALUE,
  formatEventDateBR,
  formatEventDateShortBR,
  isISODateString,
} from '../lib/lead';
import type { JourneyStep } from '../types';

interface DynamicStepRendererProps {
  stepConfig: JourneyStep;
  value: unknown;
  onChange: (field: string, value: unknown) => void;
  onNext: () => void;
  accentColor: string;
  isLastStep: boolean;
  variant?: string;
  /** Datas ocupadas do inquilino (tenant.booking.busyDates), p/ etapas type === 'date'. */
  busyDates?: string[];
  /** Volta ao passo anterior (usado pelo estado vazio da etapa de horários). */
  onBack?: () => void;
  /** Resumo legível da grade de atendimento, exibido na etapa de data. */
  scheduleHint?: string;
}

export const DynamicStepRenderer: React.FC<DynamicStepRendererProps> = ({
  stepConfig,
  value,
  onChange,
  onNext,
  accentColor,
  isLastStep,
  variant,
  busyDates,
  onBack,
  scheduleHint,
}) => {
  const [inputFocused, setInputFocused] = useState(false);
  const [error, setError] = useState('');
  const isGlass = variant === 'glass';

  // 0. Horários livres (optionsSource === 'bookingSlots'): grade compacta
  // de chips HH:mm; sem horários no dia, oferece voltar e trocar a data.
  if (stepConfig.type === 'single' && stepConfig.optionsSource === 'bookingSlots') {
    const options = stepConfig.options || [];
    const selectedId = typeof value === 'string' ? value : '';
    const handleSelect = (id: string) => {
      onChange(stepConfig.field, id);
      setTimeout(() => {
        onNext();
      }, 160);
    };

    return (
      <QuestionCard title={stepConfig.title} subtitle={stepConfig.subtitle} variant={variant}>
        {options.length === 0 ? (
          <div className="flex flex-col gap-4 items-center text-center py-2">
            <p className={`text-sm leading-relaxed ${isGlass ? 'text-[rgba(255,235,210,0.8)]' : 'text-[#555]'}`}>
              Sem horários livres neste dia — a agenda está cheia ou não há atendimento.
            </p>
            <button
              id="slot-empty-back-btn"
              type="button"
              onClick={onBack}
              className={`w-full py-3.5 px-6 rounded-xl font-medium text-sm sm:text-base tracking-wide transition-colors cursor-pointer border ${
                isGlass
                  ? 'text-[#FFF4E6] bg-[rgba(255,244,230,0.12)] border-[rgba(255,235,210,0.28)]'
                  : 'text-white bg-[#1A1A1A] border-[#1A1A1A]'
              }`}
            >
              ← Escolher outra data
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full select-none">
            {options.map((opt) => {
              const isSelected = selectedId === opt.id;
              return (
                <motion.button
                  key={opt.id}
                  id={`slot-${opt.id}`}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  whileTap={{ scale: 0.96, transition: { duration: 0.1 } }}
                  className={`py-3 px-1 rounded-xl font-mono font-medium text-sm text-center transition-colors cursor-pointer border ${
                    isGlass
                      ? 'backdrop-blur-md'
                      : isSelected
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-white hover:border-[#1A1A1A] text-[#1A1A1A] border-[#E5E5E1]'
                  }`}
                  style={
                    isGlass
                      ? {
                          backgroundColor: isSelected ? 'rgba(228, 3, 46, 0.16)' : 'rgba(214, 178, 120, 0.07)',
                          borderColor: isSelected ? accentColor : 'rgba(255, 235, 210, 0.16)',
                          color: '#FFF4E6',
                        }
                      : undefined
                  }
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </div>
        )}
      </QuestionCard>
    );
  }

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

  // 3. Date (agendamento: data do evento + "Ainda sem data"; datas ocupadas bloqueadas)
  if (stepConfig.type === 'date') {
    const allBusy = Array.from(
      new Set([...(busyDates || []), ...(stepConfig.busyDates || [])].filter(isISODateString))
    ).sort();
    const busySet = new Set(allBusy);
    const dateVal = typeof value === 'string' ? value : '';
    const isUndecided = dateVal === NO_DATE_VALUE;
    const selectedDate = !isUndecided && isISODateString(dateVal) ? dateVal : '';
    const isBusy = selectedDate !== '' && busySet.has(selectedDate);
    const isDateValid = isUndecided || (selectedDate !== '' && !isBusy);
    const todayISO = new Date().toLocaleDateString('en-CA');

    const handleDateContinue = () => {
      if (!isDateValid) {
        setError(
          isBusy
            ? 'Esta data já está ocupada. Escolha outra data ou continue sem data definida.'
            : 'Escolha uma data ou toque em "Ainda sem data".'
        );
        return;
      }
      setError('');
      onNext();
    };

    return (
      <QuestionCard title={stepConfig.title} subtitle={stepConfig.subtitle} variant={variant}>
        <div className="flex flex-col gap-4">
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
              {stepConfig.dateLabel || 'Data do evento'}
            </motion.label>
            <input
              id={`input-${stepConfig.field}`}
              type="date"
              min={todayISO}
              value={selectedDate}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onChange={(e) => {
                onChange(stepConfig.field, e.target.value);
                if (error) setError('');
              }}
              className={`w-full p-4 rounded-xl text-base transition-all focus:outline-none ${
                isGlass
                  ? 'bg-[rgba(255,244,230,0.05)] backdrop-blur-[9px] text-[#FFF4E6] border-b-2 border-t-0 border-x-0 rounded-b-none font-glass-sans [color-scheme:dark]'
                  : 'border border-[#E5E5E1] bg-white text-[#1A1A1A] shadow-2xs'
              }`}
              style={{
                borderColor: isBusy
                  ? '#FF5252'
                  : inputFocused
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
            {selectedDate && !isBusy && (
              <p className={`text-xs mt-2 pl-1 font-medium ${isGlass ? 'text-[rgba(255,235,210,0.8)]' : 'text-[#555]'}`}>
                {formatEventDateBR(selectedDate)}
              </p>
            )}
            {scheduleHint && !selectedDate && (
              <p className={`text-xs mt-2 pl-1 ${isGlass ? 'text-[rgba(255,235,210,0.65)]' : 'text-[#888]'}`}>
                Atendimento: {scheduleHint}
              </p>
            )}
            {isBusy && (
              <p id="date-busy-error" className="text-[#FF5252] text-xs mt-2 pl-1 font-medium">
                Esta data já está ocupada — escolha outra ou continue sem data definida.
              </p>
            )}
            {error && !isBusy && (
              <p id="date-error" className="text-[#FF5252] text-xs mt-2 pl-1 font-medium">
                {error}
              </p>
            )}
          </div>

          {allBusy.length > 0 && (
            <div id="busy-dates-list">
              <p className={`text-[11px] uppercase tracking-[0.14em] font-mono mb-2 ${isGlass ? 'text-[rgba(255,235,210,0.55)]' : 'text-[#999]'}`}>
                Datas já ocupadas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allBusy.map((d) => (
                  <span
                    key={d}
                    className={`text-[11px] px-2.5 py-1 rounded-full border line-through decoration-1 ${
                      isGlass
                        ? 'border-[rgba(255,235,210,0.18)] text-[rgba(255,235,210,0.55)] bg-[rgba(255,244,230,0.04)]'
                        : 'border-[#E5E5E1] text-[#999] bg-[#F5F5F3]'
                    }`}
                  >
                    {formatEventDateShortBR(d)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* "Ainda sem data" só aparece quando a etapa permite (allowNoDate !== false) */}
          {stepConfig.allowNoDate !== false && (
          <button
            id="date-no-date-btn"
            type="button"
            onClick={() => {
              onChange(stepConfig.field, NO_DATE_VALUE);
              if (error) setError('');
            }}
            className={`w-full text-left p-4 rounded-xl transition-colors duration-150 cursor-pointer flex items-center justify-between border ${
              isGlass
                ? 'backdrop-blur-md'
                : isUndecided
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-white hover:border-[#1A1A1A] text-[#1A1A1A] border-[#E5E5E1] shadow-xs'
            }`}
            style={
              isGlass
                ? {
                    backgroundColor: isUndecided ? 'rgba(228, 3, 46, 0.16)' : 'rgba(214, 178, 120, 0.07)',
                    borderColor: isUndecided ? accentColor : 'rgba(255, 235, 210, 0.16)',
                    color: '#FFF4E6',
                  }
                : undefined
            }
          >
            <span className={`font-medium text-sm sm:text-base ${isGlass ? 'font-glass-sans' : ''}`}>
              Ainda sem data
            </span>
            <span
              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                isUndecided ? 'border-transparent' : isGlass ? 'border-[rgba(255,235,210,0.3)]' : 'border-[#CCC]'
              }`}
              style={{ backgroundColor: isUndecided ? accentColor : 'transparent' }}
            >
              {isUndecided && (
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 16 16" fill="none">
                  <path d="M3 7l4 4 6-6" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </button>
          )}

          <motion.button
            id={`finish-${stepConfig.field}-btn`}
            type="button"
            onClick={handleDateContinue}
            disabled={!isDateValid}
            animate={{ opacity: isDateValid ? 1 : 0.45, cursor: isDateValid ? 'pointer' : 'not-allowed' }}
            transition={{ duration: 0.2 }}
            whileTap={isDateValid ? { scale: 0.97 } : undefined}
            className="w-full py-4 px-6 rounded-xl font-medium text-base tracking-wide transition-colors duration-150 shadow-sm flex items-center justify-center gap-2 border will-change-transform text-white"
            style={
              isGlass
                ? {
                    backgroundColor: isDateValid ? 'rgba(255, 244, 230, 0.16)' : 'rgba(255, 244, 230, 0.06)',
                    borderColor: isDateValid ? 'rgba(255, 235, 210, 0.3)' : 'rgba(255, 235, 210, 0.12)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: isDateValid ? `0 4px 20px ${accentColor}40` : undefined,
                  }
                : { backgroundColor: accentColor, borderColor: accentColor }
            }
          >
            <span className={isGlass ? 'font-glass-sans' : ''}>
              {isLastStep ? (stepConfig.lastStepCta || 'Concluir avaliação') : 'Continuar'}
            </span>
            <span aria-hidden="true">→</span>
          </motion.button>
        </div>
      </QuestionCard>
    );
  }

  // 4. Phone Input (com máscara BR e validação zod DDD)
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
              {isLastStep ? (stepConfig.lastStepCta || 'Concluir avaliação') : 'Continuar'}
            </span>
            <span aria-hidden="true">→</span>
          </motion.button>
        </form>
      </QuestionCard>
    );
  }

  // 5. Text / Textarea Input
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
              ? (stepConfig.lastStepCta || 'Concluir avaliação')
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
