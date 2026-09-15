import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePersonal } from '../lib/usePersonal';
import { captureUTMs } from '../lib/utms';
import {
  OBJETIVO_OPTIONS,
  EXPERIENCE_OPTIONS,
  RESTRICTIONS_OPTIONS,
  AVAILABILITY_OPTIONS,
  MODALITY_OPTIONS,
  getLabel,
  getMultipleLabels,
} from '../config/questions';
import {
  LeadSchema,
  PhoneSchema,
  buildWhatsAppMessage,
  buildDynamicWhatsAppMessage,
  buildWhatsAppUrl,
  formatBRPhone,
  cleanPhoneDigits,
  sendConciergeWebhook,
} from '../lib/lead';
import { PersonalHero } from './PersonalHero';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { OptionGrid } from './OptionGrid';
import { MultiSelectGrid } from './MultiSelectGrid';
import { DynamicStepRenderer } from './DynamicStepRenderer';
import { WhatsAppCTA } from './WhatsAppCTA';
import { NotFoundPersonal } from './NotFoundPersonal';
import { BackgroundLayers } from './BackgroundLayers';
import type { LeadData, UTMParams, ConciergeWebhookPayload, JourneyStep } from '../types';

export const PersonalLink: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { personal, loading, notFound } = usePersonal(slug);
  const reducedMotion = useReducedMotion();

  // UTM tracking
  const [utms, setUtms] = useState<UTMParams>({});

  useEffect(() => {
    const captured = captureUTMs();
    setUtms(captured);
  }, []);

  const isConcierge = Boolean(personal?.concierge);
  const accent = personal?.theme?.accent || personal?.accent || '#B91C1C';
  const variant = personal?.theme?.variant;
  const isGlass = variant === 'glass';
  const backgroundImage = personal?.theme?.backgroundImage || personal?.backgroundImage;
  const customFooter = personal?.footer;

  // Verifica se o personal possui jornada configurada no JSON
  const hasDynamicJourney = Boolean(personal?.journey?.steps && personal.journey.steps.length > 0);
  const dynamicSteps: JourneyStep[] = useMemo(() => {
    return personal?.journey?.steps || [];
  }, [personal]);

  // Contagem dinâmica de steps
  const totalSteps = hasDynamicJourney
    ? dynamicSteps.length
    : isConcierge
    ? 7
    : 6;
  const finalStep = totalSteps + 1;

  // Step 0 = Hero/Abertura
  // Steps 1..totalSteps = Perguntas da jornada
  // Step finalStep = Tela final
  const [step, setStep] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);

  const goToStep = (nextStep: number) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  // Generic Dynamic Answers State (para jornada configurada no JSON)
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, unknown>>({});

  const handleDynamicChange = (field: string, val: unknown) => {
    setDynamicAnswers((prev) => ({ ...prev, [field]: val }));
  };

  // Form State do Fluxo Padrão Fitness (para manter 100% retrocompatibilidade de /p/lucaspersonal)
  const [objetivo, setObjetivo] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>('');
  const [modality, setModality] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [nameFocused, setNameFocused] = useState<boolean>(false);
  const [difficultyFocused, setDifficultyFocused] = useState<boolean>(false);

  // Concierge Form & Webhook State
  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [phoneFocused, setPhoneFocused] = useState<boolean>(false);
  const [conciergeSending, setConciergeSending] = useState<boolean>(false);
  const [conciergeSuccess, setConciergeSuccess] = useState<boolean>(false);
  const [conciergeFallback, setConciergeFallback] = useState<boolean>(false);

  // Nome e telefone consolidados (compatível tanto com dinâmico quanto com clássico)
  const resolvedName = useMemo(() => {
    if (hasDynamicJourney && typeof dynamicAnswers.name === 'string') {
      return dynamicAnswers.name.trim();
    }
    return name.trim();
  }, [hasDynamicJourney, dynamicAnswers.name, name]);

  const resolvedPhone = useMemo(() => {
    if (hasDynamicJourney && typeof dynamicAnswers.phone === 'string') {
      return dynamicAnswers.phone.trim();
    }
    return phone.trim();
  }, [hasDynamicJourney, dynamicAnswers.phone, phone]);

  // Handle auto-advance on single select with subtle timing for user recognition (fluxo clássico)
  const handleSelectObjetivo = (id: string) => {
    setObjetivo(id);
    setTimeout(() => {
      goToStep(2);
    }, 150);
  };

  const handleSelectExperience = (id: string) => {
    setExperience(id);
    setTimeout(() => {
      goToStep(3);
    }, 150);
  };

  const handleContinueRestrictions = () => {
    if (restrictions.length > 0) {
      goToStep(4);
    }
  };

  const handleContinueRotina = () => {
    if (availability && modality) {
      goToStep(5);
    }
  };

  const handleContinueDifficulty = () => {
    goToStep(6);
  };

  const handleFinishNameStep = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setNameError('Por favor, informe pelo menos 2 caracteres.');
      return;
    }
    setNameError('');

    if (isConcierge) {
      // Avança para o Passo 7 (WhatsApp)
      goToStep(7);
    } else {
      // Validação final do fluxo sem concierge
      const leadData: LeadData = {
        objetivo,
        experience,
        restrictions,
        availability,
        modality,
        difficulty,
        name: cleanName,
      };

      const validation = LeadSchema.safeParse(leadData);
      if (!validation.success) {
        const issue = validation.error.issues[0];
        setNameError(issue?.message || 'Dados incompletos');
        return;
      }

      goToStep(finalStep);
    }
  };

  const handleFinishPhoneStep = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cleanPhoneDigits(phone);
    const phoneValidation = PhoneSchema.safeParse(digits);
    if (!phoneValidation.success) {
      setPhoneError(phoneValidation.error.issues[0]?.message || 'Informe um WhatsApp válido com DDD (10 ou 11 dígitos).');
      return;
    }
    setPhoneError('');

    const leadData: LeadData = {
      objetivo,
      experience,
      restrictions,
      availability,
      modality,
      difficulty,
      name: name.trim(),
      phone: digits,
    };

    const fullValidation = LeadSchema.safeParse(leadData);
    if (!fullValidation.success) {
      setPhoneError('Dados incompletos');
      return;
    }

    goToStep(finalStep);
  };

  // Dispatch webhook in concierge mode with 5s timeout & fallback
  const handleSendConcierge = async () => {
    if (conciergeSending || !personal?.conciergeWebhook) return;
    setConciergeSending(true);
    setConciergeFallback(false);

    let leadPayload: Record<string, unknown> = {};

    if (hasDynamicJourney) {
      // Monta lead dinamicamente mapeando o field de cada step
      leadPayload = {
        name: resolvedName,
        phone: cleanPhoneDigits(resolvedPhone),
        ...dynamicAnswers,
      };
      // Normaliza aliases comuns se existirem
      if (dynamicAnswers.goal && !leadPayload.objetivo) {
        leadPayload.objetivo = dynamicAnswers.goal;
      }
    } else {
      leadPayload = {
        name: name.trim(),
        phone: cleanPhoneDigits(phone),
        goal: objetivo,
        experience,
        restrictions: restrictions.length > 0 ? restrictions : ['nenhuma'],
        availability,
        modality,
        difficulty: difficulty.trim(),
      };
    }

    const payload: ConciergeWebhookPayload = {
      personalSlug: personal.slug,
      lead: leadPayload,
      utms,
    };

    const result = await sendConciergeWebhook(
      personal.conciergeWebhook,
      personal.conciergeSecret,
      payload,
      5000
    );

    setConciergeSending(false);

    if (result.success) {
      setConciergeSuccess(true);
    } else {
      console.warn('[Concierge] Falha no webhook (timeout ou erro), acionando fallback wa.me:', result.error);
      setConciergeFallback(true);
    }
  };

  // Build qualified WhatsApp payload
  const whatsappUrl = useMemo(() => {
    if (!personal) return '';

    if (hasDynamicJourney) {
      const message = buildDynamicWhatsAppMessage(
        dynamicSteps,
        dynamicAnswers,
        utms,
        personal.journey?.niche,
        personal.name
      );
      return buildWhatsAppUrl(personal.whatsapp, message);
    }

    const leadData: LeadData = {
      objetivo,
      experience,
      restrictions: restrictions.length > 0 ? restrictions : ['nenhuma'],
      availability,
      modality,
      difficulty,
      name: name.trim() || 'Aluno',
      phone: cleanPhoneDigits(phone),
    };
    const message = buildWhatsAppMessage(leadData, utms);
    return buildWhatsAppUrl(personal.whatsapp, message);
  }, [personal, hasDynamicJourney, dynamicSteps, dynamicAnswers, objetivo, experience, restrictions, availability, modality, difficulty, name, phone, utms]);

  if (loading) {
    return (
      <div id="loading-skeleton" className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-[#FAF9F6]">
        <div className="w-full max-w-md flex flex-col items-center animate-pulse bg-white border border-[#E5E5E1] rounded-2xl sm:rounded-[40px] p-8 shadow-xl">
          <div className="w-24 h-24 rounded-full bg-[#F0F0F0] mb-5 border border-[#E5E5E1]" />
          <div className="h-4 w-28 bg-[#F0F0F0] rounded mb-3" />
          <div className="h-8 w-48 bg-[#F0F0F0] rounded mb-3" />
          <div className="h-4 w-64 bg-[#F0F0F0] rounded mb-6" />
          <div className="h-12 w-full bg-[#F0F0F0] rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !personal) {
    return <NotFoundPersonal />;
  }

  // Step 3D Transition Variants
  const stepVariants = {
    enter: (dir: number) => ({
      rotateY: reducedMotion ? 0 : dir > 0 ? 8 : -8,
      x: reducedMotion ? 0 : dir > 0 ? 48 : -48,
      opacity: 0,
    }),
    center: {
      rotateY: 0,
      x: 0,
      opacity: 1,
      transition: {
        type: reducedMotion ? 'tween' : 'spring',
        damping: 26,
        stiffness: 220,
        duration: reducedMotion ? 0.2 : 0.45,
      },
    },
    exit: (dir: number) => ({
      rotateY: reducedMotion ? 0 : dir > 0 ? -8 : 8,
      x: reducedMotion ? 0 : dir > 0 ? -48 : 48,
      opacity: 0,
      transition: {
        duration: reducedMotion ? 0.18 : 0.22,
        ease: 'easeIn',
      },
    }),
  };

  return (
    <div
      id="personal-link-page"
      className={`min-h-screen w-full flex items-center justify-center p-3 sm:p-6 md:p-8 relative ${
        isGlass ? 'text-[#FFF4E6]' : 'bg-[#FAF9F6] text-[#1A1A1A] font-sans'
      }`}
    >
      {/* 3-Layer Background System */}
      <BackgroundLayers accentColor={accent} variant={variant} backgroundImage={backgroundImage} />

      <div
        className={`w-full max-w-md overflow-hidden flex flex-col relative my-auto min-h-[580px] transition-all ${
          isGlass
            ? 'rounded-[24px] border border-[rgba(255,235,210,0.14)] bg-[rgba(255,244,230,0.05)] backdrop-blur-[9px] backdrop-saturate-[1.2] shadow-[0_20px_60px_rgba(0,0,0,0.45)]'
            : 'bg-white/95 backdrop-blur-xs border border-[#E5E5E1] shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[40px]'
        }`}
        style={isGlass ? { textShadow: '0 1px 12px rgba(0, 0, 0, 0.55)' } : undefined}
      >
        {/* Top Brand Bar */}
        <header
          className={`w-full p-5 sm:p-6 pb-3 flex items-center justify-between border-b ${
            isGlass ? 'border-[rgba(255,235,210,0.10)]' : 'border-[#F0F0F0]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: accent, boxShadow: isGlass ? `0 0 8px ${accent}` : undefined }}
            />
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                isGlass ? 'text-[rgba(255,235,210,0.65)]' : 'text-[#888]'
              }`}
            >
              Nexo Link
            </span>
          </div>

          {step > 0 && step <= totalSteps && (
            <button
              id="cancel-assessment-btn"
              type="button"
              onClick={() => goToStep(0)}
              className={`text-xs transition-colors cursor-pointer ${
                isGlass
                  ? 'text-[rgba(255,235,210,0.65)] hover:text-[#FFF4E6]'
                  : 'text-[#888] hover:text-[#1A1A1A]'
              }`}
            >
              Cancelar
            </button>
          )}
        </header>

        {/* Main Content Area with 3D Perspective */}
        <main
          style={{ perspective: 1200 }}
          className="w-full p-5 sm:p-6 flex-1 flex flex-col justify-center overflow-hidden"
        >
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 0: Hero / Abertura */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full will-change-transform"
              >
                <PersonalHero
                  personal={personal}
                  onStart={() => goToStep(1)}
                  totalSteps={totalSteps}
                />
              </motion.div>
            )}

            {/* Steps 1 to totalSteps with Progress Bar and 3D Transitions */}
            {step >= 1 && step <= totalSteps && (
              <motion.div
                key={`step-group-${step}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full flex flex-col will-change-transform"
              >
                <ProgressBar
                  currentStep={step}
                  totalSteps={totalSteps}
                  accentColor={accent}
                  variant={variant}
                  onBack={() => goToStep(step - 1)}
                />

                {/* Se a jornada for configurada por JSON: usa DynamicStepRenderer */}
                {hasDynamicJourney ? (
                  <DynamicStepRenderer
                    stepConfig={dynamicSteps[step - 1]}
                    value={dynamicAnswers[dynamicSteps[step - 1].field]}
                    onChange={handleDynamicChange}
                    onNext={() => goToStep(step + 1)}
                    accentColor={accent}
                    isLastStep={step === totalSteps}
                    variant={variant}
                  />
                ) : (
                  // Caso contrário: Jornada fitness padrão de 6 passos (ou 7 com concierge) intacta
                  <>
                    {/* Step 1: Objetivo (single) */}
                    {step === 1 && (
                      <QuestionCard
                        title="Qual é o seu objetivo principal hoje?"
                        subtitle="Selecione o foco central do seu novo plano de treino."
                      >
                        <OptionGrid
                          options={OBJETIVO_OPTIONS}
                          selectedId={objetivo}
                          onSelect={handleSelectObjetivo}
                          accentColor={accent}
                        />
                      </QuestionCard>
                    )}

                    {/* Step 2: Experience / Nível (single) */}
                    {step === 2 && (
                      <QuestionCard
                        title="Como está sua rotina de treinos hoje?"
                        subtitle="Nos ajuda a calibrar a intensidade e o volume inicial."
                      >
                        <OptionGrid
                          options={EXPERIENCE_OPTIONS}
                          selectedId={experience}
                          onSelect={handleSelectExperience}
                          accentColor={accent}
                        />
                      </QuestionCard>
                    )}

                    {/* Step 3: Restrictions / Limitações (MULTI + regra nenhuma) */}
                    {step === 3 && (
                      <QuestionCard
                        title="Você possui alguma dor ou limitação física?"
                        subtitle="Marque todas as aplicáveis ou escolha 'Nenhuma' para avançar com segurança."
                      >
                        <MultiSelectGrid
                          options={RESTRICTIONS_OPTIONS}
                          selectedIds={restrictions}
                          onChange={setRestrictions}
                          onContinue={handleContinueRestrictions}
                          accentColor={accent}
                        />
                      </QuestionCard>
                    )}

                    {/* Step 4: Rotina (2 selects na mesma tela) */}
                    {step === 4 && (
                      <QuestionCard
                        title="Como você prefere organizar sua rotina?"
                        subtitle="Defina sua frequência semanal e o modelo de acompanhamento."
                      >
                        <div className="flex flex-col gap-6 select-none">
                          {/* Availability */}
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-2">
                              Frequência semanal desejada
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {AVAILABILITY_OPTIONS.map((opt) => {
                                const isSelected = availability === opt.id;
                                return (
                                  <motion.button
                                    key={opt.id}
                                    type="button"
                                    id={`avail-${opt.id}`}
                                    onClick={() => setAvailability(opt.id)}
                                    whileTap={{ scale: 0.97 }}
                                    className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium text-left transition-colors cursor-pointer will-change-transform ${
                                      isSelected
                                        ? 'bg-[#1A1A1A] text-white shadow-sm'
                                        : 'bg-white text-[#1A1A1A] border-[#E5E5E1] hover:border-[#1A1A1A]'
                                    }`}
                                    style={{
                                      borderColor: isSelected ? accent : undefined,
                                    }}
                                  >
                                    {opt.label}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Modality */}
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-2">
                              Modalidade de treino
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {MODALITY_OPTIONS.map((opt) => {
                                const isSelected = modality === opt.id;
                                return (
                                  <motion.button
                                    key={opt.id}
                                    type="button"
                                    id={`modal-${opt.id}`}
                                    onClick={() => setModality(opt.id)}
                                    whileTap={{ scale: 0.97 }}
                                    className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium text-center transition-colors cursor-pointer will-change-transform ${
                                      isSelected
                                        ? 'bg-[#1A1A1A] text-white shadow-sm'
                                        : 'bg-white text-[#1A1A1A] border-[#E5E5E1] hover:border-[#1A1A1A]'
                                    }`}
                                    style={{
                                      borderColor: isSelected ? accent : undefined,
                                    }}
                                  >
                                    {opt.label}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>

                          <motion.button
                            id="continue-rotina-btn"
                            type="button"
                            disabled={!availability || !modality}
                            onClick={handleContinueRotina}
                            whileTap={availability && modality ? { scale: 0.97 } : undefined}
                            animate={{
                              opacity: availability && modality ? 1 : 0.45,
                              cursor: availability && modality ? 'pointer' : 'not-allowed',
                            }}
                            transition={{ duration: 0.2 }}
                            className={`w-full py-3.5 px-6 rounded-xl font-medium text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 border shadow-sm will-change-transform ${
                              availability && modality
                                ? 'text-white'
                                : 'bg-[#F5F5F3] text-[#AAA] border-[#E5E5E1]'
                            }`}
                            style={
                              availability && modality
                                ? { backgroundColor: accent, borderColor: accent }
                                : undefined
                            }
                          >
                            <span>Continuar</span>
                            <span aria-hidden="true">→</span>
                          </motion.button>
                        </div>
                      </QuestionCard>
                    )}

                    {/* Step 5: Difficulty (texto livre, opcional) */}
                    {step === 5 && (
                      <QuestionCard
                        title="Qual a sua maior dificuldade para treinar hoje?"
                        subtitle="Campo opcional. Conte em poucas palavras o que mais tem impedido sua evolução."
                      >
                        <div className="flex flex-col gap-4">
                          <div className="relative pt-2">
                            <motion.label
                              htmlFor="difficulty-input"
                              className="block text-[11px] font-mono uppercase tracking-widest mb-1.5"
                              animate={{
                                color: difficultyFocused ? accent : '#888',
                              }}
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                              Descreva sua rotina ou desafios (opcional)
                            </motion.label>
                            <textarea
                              id="difficulty-input"
                              rows={4}
                              value={difficulty}
                              onFocus={() => setDifficultyFocused(true)}
                              onBlur={() => setDifficultyFocused(false)}
                              onChange={(e) => setDifficulty(e.target.value)}
                              placeholder="Ex.: constância, falta de tempo, não sei montar meu treino..."
                              className="w-full p-4 rounded-xl border border-[#E5E5E1] bg-white text-[#1A1A1A] text-sm sm:text-base placeholder:text-[#999] focus:outline-none transition-all resize-none shadow-2xs"
                              style={{
                                borderColor: difficultyFocused ? accent : '#E5E5E1',
                                boxShadow: difficultyFocused ? `0 0 0 3px ${accent}20` : 'none',
                              }}
                            />
                          </div>

                          <motion.button
                            id="continue-difficulty-btn"
                            type="button"
                            onClick={handleContinueDifficulty}
                            whileTap={{ scale: 0.97 }}
                            className="w-full py-3.5 px-6 rounded-xl text-white font-medium text-sm sm:text-base tracking-wide transition-colors duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer border will-change-transform"
                            style={{
                              backgroundColor: accent,
                              borderColor: accent,
                            }}
                          >
                            <span>{difficulty.trim().length > 0 ? 'Continuar' : 'Pular este passo'}</span>
                            <span aria-hidden="true">→</span>
                          </motion.button>
                        </div>
                      </QuestionCard>
                    )}

                    {/* Step 6: Name (texto, obrigatório, mínimo 2 caracteres) */}
                    {step === 6 && (
                      <QuestionCard
                        title="Como podemos te chamar?"
                        subtitle="Informe seu nome para que seu atendimento seja personalizado."
                      >
                        <form onSubmit={handleFinishNameStep} className="flex flex-col gap-4">
                          <div className="relative pt-1">
                            <motion.label
                              htmlFor="name-input"
                              className="block text-[11px] font-mono uppercase tracking-widest mb-1.5"
                              animate={{
                                color: nameFocused ? accent : '#888',
                              }}
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                              Seu nome completo ou apelido
                            </motion.label>
                            <input
                              id="name-input"
                              type="text"
                              autoFocus
                              value={name}
                              onFocus={() => setNameFocused(true)}
                              onBlur={() => setNameFocused(false)}
                              onChange={(e) => {
                                setName(e.target.value);
                                if (nameError) setNameError('');
                              }}
                              placeholder="Como podemos te chamar?"
                              className="w-full p-4 rounded-xl border border-[#E5E5E1] bg-white text-[#1A1A1A] text-base placeholder:text-[#999] focus:outline-none transition-all shadow-2xs"
                              style={{
                                borderColor: nameFocused ? accent : '#E5E5E1',
                                boxShadow: nameFocused ? `0 0 0 3px ${accent}20` : 'none',
                              }}
                            />
                            {nameError && (
                              <p id="name-error" className="text-red-700 text-xs mt-2 pl-1 font-medium">
                                {nameError}
                              </p>
                            )}
                          </div>

                          {/* Botão com disabled até seleção válida e fade de estado */}
                          <motion.button
                            id="finish-name-btn"
                            type="submit"
                            disabled={name.trim().length < 2}
                            animate={{
                              opacity: name.trim().length >= 2 ? 1 : 0.45,
                              cursor: name.trim().length >= 2 ? 'pointer' : 'not-allowed',
                            }}
                            transition={{ duration: 0.2 }}
                            whileTap={name.trim().length >= 2 ? { scale: 0.97 } : undefined}
                            className="w-full py-4 px-6 rounded-xl text-white font-medium text-base tracking-wide transition-colors duration-150 shadow-sm flex items-center justify-center gap-2 border will-change-transform"
                            style={{
                              backgroundColor: accent,
                              borderColor: accent,
                            }}
                          >
                            <span>{isConcierge ? 'Continuar' : 'Concluir avaliação'}</span>
                            <span aria-hidden="true">→</span>
                          </motion.button>
                        </form>
                      </QuestionCard>
                    )}

                    {/* Step 7 (Modo Concierge clássico): WhatsApp */}
                    {isConcierge && step === 7 && (
                      <QuestionCard
                        title="Qual é o seu WhatsApp?"
                        subtitle={`Para que o Nexo, concierge digital de ${personal.name}, já inicie seu atendimento.`}
                      >
                        <form onSubmit={handleFinishPhoneStep} className="flex flex-col gap-4">
                          <div className="relative pt-1">
                            <motion.label
                              htmlFor="phone-input"
                              className="block text-[11px] font-mono uppercase tracking-widest mb-1.5"
                              animate={{
                                color: phoneFocused ? accent : '#888',
                              }}
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                              Seu WhatsApp com DDD
                            </motion.label>
                            <input
                              id="phone-input"
                              type="tel"
                              autoFocus
                              value={phone}
                              onFocus={() => setPhoneFocused(true)}
                              onBlur={() => setPhoneFocused(false)}
                              onChange={(e) => {
                                const formatted = formatBRPhone(e.target.value);
                                setPhone(formatted);
                                if (phoneError) setPhoneError('');
                              }}
                              placeholder="(11) 98765-4321"
                              className="w-full p-4 rounded-xl border border-[#E5E5E1] bg-white text-[#1A1A1A] text-base placeholder:text-[#999] focus:outline-none transition-all shadow-2xs font-mono"
                              style={{
                                borderColor: phoneFocused ? accent : '#E5E5E1',
                                boxShadow: phoneFocused ? `0 0 0 3px ${accent}20` : 'none',
                              }}
                            />
                            {phoneError && (
                              <p id="phone-error" className="text-red-700 text-xs mt-2 pl-1 font-medium">
                                {phoneError}
                              </p>
                            )}
                          </div>

                          <motion.button
                            id="finish-phone-btn"
                            type="submit"
                            disabled={cleanPhoneDigits(phone).length < 10}
                            animate={{
                              opacity: cleanPhoneDigits(phone).length >= 10 ? 1 : 0.45,
                              cursor: cleanPhoneDigits(phone).length >= 10 ? 'pointer' : 'not-allowed',
                            }}
                            transition={{ duration: 0.2 }}
                            whileTap={cleanPhoneDigits(phone).length >= 10 ? { scale: 0.97 } : undefined}
                            className="w-full py-4 px-6 rounded-xl text-white font-medium text-base tracking-wide transition-colors duration-150 shadow-sm flex items-center justify-center gap-2 border will-change-transform"
                            style={{
                              backgroundColor: accent,
                              borderColor: accent,
                            }}
                          >
                            <span>Concluir avaliação</span>
                            <span aria-hidden="true">→</span>
                          </motion.button>
                        </form>
                      </QuestionCard>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Final Step: Tela Final de Conversão */}
            {step === finalStep && (
              <motion.div
                key="step-final"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full flex flex-col items-center text-center will-change-transform"
              >
                {conciergeSuccess ? (
                  // Tela de Sucesso Concierge
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`w-14 h-14 rounded-full text-white flex items-center justify-center mb-4 shadow-md ${
                        isGlass ? 'backdrop-blur-md border border-[rgba(255,235,210,0.3)]' : ''
                      }`}
                      style={{ backgroundColor: isGlass ? 'rgba(214, 178, 120, 0.25)' : '#15803d' }}
                    >
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>

                    <h1
                      id="concierge-success-heading"
                      className={`${
                        isGlass
                          ? 'font-glass-serif text-2xl sm:text-3xl font-medium tracking-[0.01em] text-[#FFF4E6]'
                          : 'font-serif text-2xl sm:text-3xl font-normal tracking-tight text-[#1A1A1A]'
                      } mb-3 leading-snug`}
                    >
                      Pronto!
                    </h1>

                    <p
                      id="concierge-success-message"
                      className={`text-sm sm:text-base leading-relaxed max-w-sm mb-3 font-medium ${
                        isGlass
                          ? 'text-[rgba(255,235,210,0.9)] font-glass-sans'
                          : 'text-[#333]'
                      }`}
                    >
                      O Nexo, concierge digital do <span className={isGlass ? 'font-semibold text-[#FFF4E6]' : 'font-semibold text-[#1A1A1A]'}>{personal.name}</span>, já está te chamando no WhatsApp.
                    </p>

                    <p
                      className={`text-xs max-w-xs mb-6 ${
                        isGlass ? 'text-[rgba(255,235,210,0.65)] font-glass-sans' : 'text-[#777]'
                      }`}
                    >
                      Fique de olho nas mensagens do número <strong className={`font-mono ${isGlass ? 'text-[#FFF4E6]' : 'text-[#444]'}`}>{resolvedPhone}</strong>.
                    </p>
                  </>
                ) : (
                  // Tela de Pré-Disparo / Resumo
                  <>
                    <div
                      className={`w-12 h-12 rounded-full text-white flex items-center justify-center mb-4 ${
                        isGlass ? 'backdrop-blur-md border border-[rgba(255,235,210,0.25)]' : 'shadow-sm'
                      }`}
                      style={{
                        backgroundColor: isGlass ? 'rgba(255, 244, 230, 0.14)' : accent,
                        boxShadow: isGlass ? `0 0 20px ${accent}40` : undefined,
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <h1
                      id="final-greeting"
                      className={`${
                        isGlass
                          ? 'font-glass-serif text-3xl font-medium tracking-[0.01em] text-[#FFF4E6]'
                          : 'font-serif text-3xl font-normal tracking-tight text-[#1A1A1A]'
                      } mb-2 leading-snug`}
                    >
                      Tudo pronto{resolvedName ? `, ${resolvedName}` : ''}.
                    </h1>

                    <p
                      className={`text-sm leading-relaxed max-w-sm mb-6 ${
                        isGlass ? 'text-[rgba(255,235,210,0.75)] font-glass-sans' : 'text-[#555]'
                      }`}
                    >
                      {isConcierge
                        ? 'Sua solicitação foi compilada. Receba seu atendimento personalizado instantaneamente pelo WhatsApp.'
                        : (
                          <>
                            Sua solicitação inicial foi compilada. Envie a mensagem pré-formatada para{' '}
                            <strong className={isGlass ? 'text-[#FFF4E6] font-semibold' : 'text-[#1A1A1A] font-semibold'}>
                              {personal.name}
                            </strong>{' '}
                            para receber sua proposta.
                          </>
                        )}
                    </p>
                  </>
                )}

                {/* Summary card com Flip 3D: rotateX 90deg -> 0, origin top, 500ms */}
                <motion.div
                  initial={reducedMotion ? { opacity: 0 } : { rotateX: 90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  transition={{
                    duration: reducedMotion ? 0.2 : 0.5,
                    ease: [0.22, 1, 0.36, 1],
                    delay: reducedMotion ? 0 : 0.08,
                  }}
                  style={{ transformOrigin: 'top center', perspective: 1000 }}
                  className={`w-full rounded-2xl p-4 sm:p-5 text-left mb-6 shadow-xs will-change-transform ${
                    isGlass
                      ? 'bg-[rgba(255,244,230,0.05)] backdrop-blur-[9px] border border-[rgba(255,235,210,0.16)] text-[#FFF4E6]'
                      : 'bg-[#FAF9F6] border border-[#E5E5E1]'
                  }`}
                >
                  <div
                    className={`text-[10px] font-mono uppercase tracking-[0.18em] mb-3 pb-2 border-b ${
                      isGlass
                        ? 'text-[rgba(255,235,210,0.65)] border-[rgba(255,235,210,0.12)]'
                        : 'text-[#888] border-[#E5E5E1]'
                    }`}
                  >
                    Resumo da solicitação
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    {resolvedPhone && (
                      <div
                        className={`sm:col-span-2 pb-2 border-b ${
                          isGlass ? 'border-[rgba(255,235,210,0.12)]' : 'border-[#EAEAE7]'
                        }`}
                      >
                        <dt className={isGlass ? 'text-[rgba(255,235,210,0.65)]' : 'text-[#888]'}>WhatsApp informado</dt>
                        <dd
                          className={`font-medium mt-0.5 font-mono ${
                            isGlass ? 'text-[#FFF4E6]' : 'text-[#1A1A1A]'
                          }`}
                        >
                          {resolvedPhone}
                        </dd>
                      </div>
                    )}

                    {hasDynamicJourney ? (
                      // Renderiza resumo com base nos steps dinâmicos
                      dynamicSteps
                        .filter((st) => st.field !== 'name' && st.field !== 'phone')
                        .map((st) => {
                          const val = dynamicAnswers[st.field];
                          if (val === undefined || val === null || val === '') return null;
                          let display = String(val);

                          if (Array.isArray(val)) {
                            if (val.length === 0) return null;
                            display = val
                              .map((v) => st.options?.find((o) => o.id === v)?.label || v)
                              .join(', ');
                          } else if (typeof val === 'string') {
                            display = st.options?.find((o) => o.id === val)?.label || val;
                          }

                          return (
                            <div key={st.id} className={st.type === 'text' ? 'sm:col-span-2' : undefined}>
                              <dt className={isGlass ? 'text-[rgba(255,235,210,0.65)]' : 'text-[#888]'}>
                                {st.title}
                              </dt>
                              <dd
                                className={`font-medium mt-0.5 ${
                                  isGlass ? 'text-[#FFF4E6]' : 'text-[#1A1A1A]'
                                } ${st.type === 'text' ? 'italic' : ''}`}
                              >
                                {st.type === 'text' ? `"${display.trim()}"` : display}
                              </dd>
                            </div>
                          );
                        })
                    ) : (
                      // Resumo do fluxo padrão
                      <>
                        <div>
                          <dt className="text-[#888]">Objetivo</dt>
                          <dd className="font-medium text-[#1A1A1A] mt-0.5">{getLabel(OBJETIVO_OPTIONS, objetivo)}</dd>
                        </div>
                        <div>
                          <dt className="text-[#888]">Nível Atual</dt>
                          <dd className="font-medium text-[#1A1A1A] mt-0.5">{getLabel(EXPERIENCE_OPTIONS, experience)}</dd>
                        </div>
                        <div>
                          <dt className="text-[#888]">Limitações</dt>
                          <dd className="font-medium text-[#1A1A1A] mt-0.5">{getMultipleLabels(RESTRICTIONS_OPTIONS, restrictions)}</dd>
                        </div>
                        <div>
                          <dt className="text-[#888]">Rotina</dt>
                          <dd className="font-medium text-[#1A1A1A] mt-0.5">
                            {getLabel(AVAILABILITY_OPTIONS, availability)} · {getLabel(MODALITY_OPTIONS, modality)}
                          </dd>
                        </div>
                        {difficulty.trim().length > 0 && (
                          <div className="sm:col-span-2">
                            <dt className="text-[#888]">Maior dificuldade</dt>
                            <dd className="font-medium text-[#1A1A1A] mt-0.5 italic">"{difficulty.trim()}"</dd>
                          </div>
                        )}
                      </>
                    )}
                  </dl>
                </motion.div>

                {/* Ações de Conversão */}
                <div className="w-full mb-4">
                  {!isConcierge ? (
                    // Fluxo Clássico (wa.me)
                    <WhatsAppCTA
                      personalName={personal.name}
                      whatsappUrl={whatsappUrl}
                      accentColor={accent}
                      variant={variant}
                    />
                  ) : conciergeSuccess ? (
                    // Já disparado com sucesso: mensagem informativa
                    <div className="w-full p-3.5 rounded-xl bg-[#F4F8F4] border border-[#D5E6D5] text-[#2D6A2E] text-xs sm:text-sm text-center font-medium">
                      ✓ Atendimento solicitado com sucesso
                    </div>
                  ) : conciergeFallback ? (
                    // Fallback automático caso o webhook falhe ou dê timeout de 5s
                    <div className="w-full flex flex-col gap-3">
                      <p
                        id="concierge-fallback-notice"
                        className={`text-xs p-3 text-center rounded-xl border ${
                          isGlass
                            ? 'text-[rgba(255,235,210,0.7)] bg-[rgba(255,244,230,0.06)] border-[rgba(255,235,210,0.16)]'
                            : 'text-[#777] bg-[#F7F7F5] border-[#E5E5E1]'
                        }`}
                      >
                        Não foi possível conectar ao concierge digital no momento. Você pode iniciar a conversa diretamente pelo WhatsApp abaixo:
                      </p>
                      <WhatsAppCTA
                        personalName={personal.name}
                        whatsappUrl={whatsappUrl}
                        accentColor={accent}
                        variant={variant}
                      />
                    </div>
                  ) : (
                    // Botão Nexo Concierge (POST no conciergeWebhook)
                    <motion.button
                      id="concierge-cta-btn"
                      type="button"
                      disabled={conciergeSending}
                      onClick={handleSendConcierge}
                      whileTap={!conciergeSending ? { scale: 0.97 } : undefined}
                      whileHover={
                        reducedMotion
                          ? { opacity: 0.95 }
                          : { scale: 1.015 }
                      }
                      className={`relative w-full py-4 px-6 text-white font-medium text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer border shadow-md will-change-transform disabled:opacity-85 disabled:cursor-wait ${
                        isGlass ? 'rounded-full backdrop-blur-md' : 'rounded-xl'
                      }`}
                      style={{
                        backgroundColor: accent,
                        borderColor: accent,
                      }}
                    >
                      {conciergeSending ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Recebendo atendimento...</span>
                        </span>
                      ) : (
                        <>
                          <span>Receber o atendimento do Nexo agora</span>
                          <span aria-hidden="true" className="text-base">↗</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>

                {/* Link secundário: chama no direct com fade-up (mantido sempre) */}
                {personal.instagram && (
                  <motion.a
                    id="instagram-direct-link"
                    href={`https://instagram.com/${personal.instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reducedMotion ? 0 : 0.15,
                      duration: 0.35,
                    }}
                    className={`inline-block text-xs underline underline-offset-4 transition-colors py-1 ${
                      isGlass
                        ? 'text-[rgba(255,235,210,0.65)] hover:text-[#FFF4E6]'
                        : 'text-[#888] hover:text-[#1A1A1A]'
                    }`}
                  >
                    ou chama no direct @{personal.instagram.replace(/^@/, '')}
                  </motion.a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer: Customizado se configurado, senão padrão Nexo Link */}
        {customFooter ? (
          <footer
            id="personal-custom-footer"
            className={`w-full p-4 sm:p-5 text-center border-t mt-auto flex flex-col items-center justify-center gap-1 text-[11px] tracking-wider ${
              isGlass
                ? 'border-[rgba(255,235,210,0.10)] text-[rgba(255,235,210,0.65)] font-glass-sans'
                : 'border-[#F0F0F0] text-[#888]'
            }`}
          >
            {customFooter.lines.map((line, idx) => (
              <span key={idx}>{line}</span>
            ))}
          </footer>
        ) : (
          <footer className="w-full p-4 sm:p-5 text-center border-t border-[#F0F0F0] mt-auto flex items-center justify-center text-[10px] text-[#BBB] uppercase tracking-widest font-mono">
            <span>Via Nexo Link</span>
          </footer>
        )}
      </div>
    </div>
  );
};

export default PersonalLink;

