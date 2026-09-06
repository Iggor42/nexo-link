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
import { LeadSchema, buildWhatsAppMessage, buildWhatsAppUrl } from '../lib/lead';
import { PersonalHero } from './PersonalHero';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import { OptionGrid } from './OptionGrid';
import { MultiSelectGrid } from './MultiSelectGrid';
import { WhatsAppCTA } from './WhatsAppCTA';
import { NotFoundPersonal } from './NotFoundPersonal';
import { BackgroundLayers } from './BackgroundLayers';
import type { LeadData, UTMParams } from '../types';

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

  // Step 0 = Hero/Abertura
  // Steps 1..6 = Perguntas da jornada
  // Step 7 = Tela final
  const [step, setStep] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);

  const goToStep = (nextStep: number) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  // Form State
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

  // Handle auto-advance on single select with subtle timing for user recognition
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

  const handleFinishAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setNameError('Por favor, informe pelo menos 2 caracteres.');
      return;
    }
    setNameError('');

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

    goToStep(7);
  };

  // Build qualified WhatsApp payload
  const whatsappUrl = useMemo(() => {
    if (!personal) return '';
    const leadData: LeadData = {
      objetivo,
      experience,
      restrictions: restrictions.length > 0 ? restrictions : ['nenhuma'],
      availability,
      modality,
      difficulty,
      name: name.trim() || 'Aluno',
    };
    const message = buildWhatsAppMessage(leadData, utms);
    return buildWhatsAppUrl(personal.whatsapp, message);
  }, [personal, objetivo, experience, restrictions, availability, modality, difficulty, name, utms]);

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

  const accent = personal.accent || '#B91C1C';

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
      className="min-h-screen w-full bg-[#FAF9F6] text-[#1A1A1A] font-sans flex items-center justify-center p-3 sm:p-6 md:p-8 relative"
    >
      {/* 3-Layer Background System */}
      <BackgroundLayers accentColor={accent} />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xs border border-[#E5E5E1] shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[40px] overflow-hidden flex flex-col relative my-auto min-h-[580px]">
        {/* Top Brand Bar */}
        <header className="w-full p-5 sm:p-6 pb-3 flex items-center justify-between border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
              Nexo Link
            </span>
          </div>

          {step > 0 && step <= 6 && (
            <button
              id="cancel-assessment-btn"
              type="button"
              onClick={() => goToStep(0)}
              className="text-xs text-[#888] hover:text-[#1A1A1A] transition-colors cursor-pointer"
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
                <PersonalHero personal={personal} onStart={() => goToStep(1)} />
              </motion.div>
            )}

            {/* Steps 1 to 6 with Progress Bar and 3D Transitions */}
            {step >= 1 && step <= 6 && (
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
                  totalSteps={6}
                  accentColor={accent}
                  onBack={() => goToStep(step - 1)}
                />

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
                    title="Como o personal deve te chamar?"
                    subtitle="Informe seu nome para que seu atendimento no WhatsApp seja personalizado."
                  >
                    <form onSubmit={handleFinishAssessment} className="flex flex-col gap-4">
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

                      {/* Botão "continuar" com disabled até seleção válida e fade de estado */}
                      <motion.button
                        id="finish-assessment-btn"
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
                        <span>Concluir avaliação</span>
                        <span aria-hidden="true">→</span>
                      </motion.button>
                    </form>
                  </QuestionCard>
                )}
              </motion.div>
            )}

            {/* Step 7: Tela Final com Flip no Card de Resumo */}
            {step === 7 && (
              <motion.div
                key="step-final"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ transformStyle: 'preserve-3d' }}
                className="text-center flex flex-col items-center will-change-transform"
              >
                <div
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center mb-4 shadow-sm"
                  style={{ backgroundColor: accent }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h1
                  id="final-greeting"
                  className="font-serif text-3xl font-normal tracking-tight text-[#1A1A1A] mb-2 leading-snug"
                >
                  Tudo pronto, {name}.
                </h1>

                <p className="text-[#555] text-sm leading-relaxed max-w-sm mb-6">
                  Sua avaliação inicial foi compilada. Envie a mensagem pré-formatada para{' '}
                  <strong className="text-[#1A1A1A] font-semibold">{personal.name}</strong> para iniciar seu plano.
                </p>

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
                  className="w-full bg-[#FAF9F6] rounded-2xl border border-[#E5E5E1] p-4 sm:p-5 text-left mb-6 shadow-xs will-change-transform"
                >
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#888] mb-3 pb-2 border-b border-[#E5E5E1]">
                    Resumo da avaliação
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
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
                  </dl>
                </motion.div>

                {/* WhatsApp CTA */}
                <div className="w-full mb-4">
                  <WhatsAppCTA
                    personalName={personal.name}
                    whatsappUrl={whatsappUrl}
                    accentColor={accent}
                  />
                </div>

                {/* Link secundário: chama no direct com fade-up */}
                {personal.instagram && (
                  <motion.a
                    id="instagram-direct-link"
                    href={`https://instagram.com/${personal.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reducedMotion ? 0 : 0.15,
                      duration: 0.35,
                    }}
                    className="inline-block text-xs text-[#888] hover:text-[#1A1A1A] underline underline-offset-4 transition-colors py-1"
                  >
                    ou chama no direct @{personal.instagram}
                  </motion.a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer discreto */}
        <footer className="w-full p-4 sm:p-5 text-center border-t border-[#F0F0F0] mt-auto flex items-center justify-between text-[10px] text-[#BBB] uppercase tracking-widest font-mono">
          <span>Via Nexo Link Personal</span>
          <a
            id="footer-sou-personal-link"
            href="#"
            className="hover:text-[#1A1A1A] transition-colors"
          >
            É personal? ↗
          </a>
        </footer>
      </div>
    </div>
  );
};

