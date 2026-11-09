import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTenant } from '../lib/useTenant';
import { captureUTMs } from '../lib/utms';
import {
  buildDynamicWhatsAppMessage,
  buildWhatsAppUrl,
  cleanPhoneDigits,
  getStepDisplay,
  sendConciergeViaProxy,
} from '../lib/lead';
import { TenantHero } from './TenantHero';
import { ProgressBar } from './ProgressBar';
import { DynamicStepRenderer } from './DynamicStepRenderer';
import { WhatsAppCTA } from './WhatsAppCTA';
import { PixBlock } from './PixBlock';
import { Testimonials } from './Testimonials';
import { NotFoundTenant } from './NotFoundTenant';
import { BackgroundLayers } from './BackgroundLayers';
import type { UTMParams, ConciergeWebhookPayload, JourneyStep } from '../types';

export const TenantLink: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { tenant, loading, notFound } = useTenant(slug);
  const reducedMotion = useReducedMotion();

  // UTM tracking
  const [utms, setUtms] = useState<UTMParams>({});

  useEffect(() => {
    const captured = captureUTMs();
    setUtms(captured);
  }, []);

  const isConcierge = Boolean(tenant?.concierge);
  const accent = tenant?.theme?.accent || tenant?.accent || '#B91C1C';
  const variant = tenant?.theme?.variant;
  const isGlass = variant === 'glass';
  const backgroundImage = tenant?.theme?.backgroundImage || tenant?.backgroundImage;
  const customFooter = tenant?.footer;

  const dynamicSteps: JourneyStep[] = useMemo(() => {
    return tenant?.journey?.steps || [];
  }, [tenant]);
  const hasJourney = dynamicSteps.length > 0;

  // Steps condicionais: um step com `when` só aparece quando a resposta
  // de outro campo for igual ao valor esperado (ex.: serviços da
  // barbearia só quando direction === 'barber'). Sem `when`, sempre visível.
  const isStepVisible = (step: JourneyStep, answers: Record<string, unknown>): boolean => {
    if (!step.when) return true;
    const v = answers[step.when.field];
    const eq = step.when.equals;
    return Array.isArray(eq) ? eq.includes(v as string) : v === eq;
  };

  // Respostas da jornada dinâmica (field -> valor)
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, unknown>>({});

  // Só os steps visíveis entram na contagem, na navegação, no resumo e
  // na mensagem de WhatsApp — o resto nem existe para o lead.
  const visibleSteps: JourneyStep[] = useMemo(() => {
    return dynamicSteps.filter((s) => isStepVisible(s, dynamicAnswers));
  }, [dynamicSteps, dynamicAnswers]);

  // Step 0 = Hero/Abertura
  // Steps 1..totalSteps = Perguntas da jornada
  // Step finalStep = Tela final
  const totalSteps = visibleSteps.length;
  const finalStep = totalSteps + 1;
  const [step, setStep] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);

  const goToStep = (nextStep: number) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  // Se a troca de uma resposta esconder steps à frente (ex.: mudar de
  // barbearia para loja no passo 1), o passo atual não pode ficar além
  // do fim da jornada visível.
  useEffect(() => {
    if (step > finalStep) {
      setStep(finalStep);
    }
  }, [step, finalStep]);

  const handleDynamicChange = (field: string, val: unknown) => {
    setDynamicAnswers((prev) => {
      const next = { ...prev, [field]: val };
      // Descarta respostas de steps que deixaram de ser visíveis, para
      // não vazar dado velho no resumo nem na mensagem de WhatsApp.
      for (const s of dynamicSteps) {
        if (s.field !== field && !isStepVisible(s, next)) {
          delete next[s.field];
        }
      }
      return next;
    });
  };

  // Concierge Form & Webhook State
  const [conciergeSending, setConciergeSending] = useState<boolean>(false);
  const [conciergeSuccess, setConciergeSuccess] = useState<boolean>(false);
  const [conciergeFallback, setConciergeFallback] = useState<boolean>(false);

  const resolvedName = useMemo(() => {
    const v = dynamicAnswers.name;
    return typeof v === 'string' ? v.trim() : '';
  }, [dynamicAnswers.name]);

  const resolvedPhone = useMemo(() => {
    const v = dynamicAnswers.phone;
    return typeof v === 'string' ? v.trim() : '';
  }, [dynamicAnswers.phone]);

  // Dispatch webhook in concierge mode with 5s timeout & fallback
  const handleSendConcierge = async () => {
    if (conciergeSending || !tenant?.conciergeWebhook) return;
    setConciergeSending(true);
    setConciergeFallback(false);

    const leadPayload: Record<string, unknown> = {
      name: resolvedName,
      phone: cleanPhoneDigits(resolvedPhone),
      ...dynamicAnswers,
    };

    const payload: ConciergeWebhookPayload = {
      personalSlug: tenant.slug,
      lead: leadPayload,
      utms,
    };

    const result = await sendConciergeViaProxy(payload, 5000);

    setConciergeSending(false);

    if (result.success) {
      setConciergeSuccess(true);
    } else {
      console.warn('[Concierge] Falha no webhook (timeout ou erro), acionando fallback wa.me:', result.error);
      setConciergeFallback(true);
    }
  };

  // Build qualified WhatsApp payload (template do tenant ou resumo genérico)
  const whatsappUrl = useMemo(() => {
    if (!tenant) return '';
    const message = buildDynamicWhatsAppMessage(
      visibleSteps,
      dynamicAnswers,
      utms,
      tenant.whatsappTemplate,
      tenant.name
    );
    return buildWhatsAppUrl(tenant.whatsapp, message);
  }, [tenant, visibleSteps, dynamicAnswers, utms]);

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

  if (notFound || !tenant) {
    return <NotFoundTenant />;
  }

  // Enquanto alguma condição ainda não foi respondida, o total exibido
  // usa heroSteps (o caminho mais longo) — senão o passo 1 mostraria
  // só os steps sem `when` (ex.: "Passo 01 de 03" na Akis).
  const hasUnresolvedCondition = dynamicSteps.some(
    (s) => s.when && dynamicAnswers[s.when.field] === undefined
  );
  const progressTotal = hasUnresolvedCondition
    ? tenant.journey?.heroSteps || totalSteps
    : totalSteps;

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
      id="tenant-link-page"
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
                <TenantHero
                  tenant={tenant}
                  onStart={() => goToStep(1)}
                  totalSteps={tenant.journey?.heroSteps || totalSteps}
                />
                {/* Prova social: só renderiza se tenant.testimonials tiver itens */}
                <Testimonials
                  testimonials={tenant.testimonials}
                  accentColor={accent}
                  variant={variant}
                />
              </motion.div>
            )}

            {/* Steps 1..totalSteps: jornada dinâmica do JSON */}
            {hasJourney && step >= 1 && step <= totalSteps && (
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
                  totalSteps={progressTotal}
                  accentColor={accent}
                  variant={variant}
                  onBack={() => goToStep(step - 1)}
                />

                <DynamicStepRenderer
                  stepConfig={visibleSteps[step - 1]}
                  value={dynamicAnswers[visibleSteps[step - 1].field]}
                  onChange={handleDynamicChange}
                  onNext={() => goToStep(step + 1)}
                  accentColor={accent}
                  isLastStep={step === totalSteps}
                  variant={variant}
                  busyDates={tenant.booking?.busyDates}
                />
              </motion.div>
            )}

            {/* Tenant sem jornada configurada */}
            {!hasJourney && step >= 1 && (
              <motion.div
                key="no-journey"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full flex flex-col items-center text-center gap-3 py-8"
              >
                <p className={`text-sm ${isGlass ? 'text-[rgba(255,235,210,0.75)]' : 'text-[#555]'}`}>
                  Esta página ainda está em configuração.
                </p>
                <a
                  href={buildWhatsAppUrl(tenant.whatsapp, `Olá, ${tenant.name}! Vim pelo seu link.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-6 rounded-xl text-white font-medium text-sm"
                  style={{ backgroundColor: accent }}
                >
                  Chamar no WhatsApp
                </a>
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
                      O Nexo, concierge digital do <span className={isGlass ? 'font-semibold text-[#FFF4E6]' : 'font-semibold text-[#1A1A1A]'}>{tenant.name}</span>, já está te chamando no WhatsApp.
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
                              {tenant.name}
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

                    {visibleSteps
                      .filter((st) => st.field !== 'name' && st.field !== 'phone')
                      .map((st) => {
                        const val = dynamicAnswers[st.field];
                        if (val === undefined || val === null || val === '') return null;
                        if (Array.isArray(val) && val.length === 0) return null;
                        // getStepDisplay resolve single/multi e formata type=date em pt-BR
                        const display = getStepDisplay(visibleSteps, dynamicAnswers, st.field);
                        if (!display) return null;

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
                      })}
                  </dl>
                </motion.div>

                {/* Sinal via Pix: só renderiza se tenant.pix.key estiver configurada */}
                <PixBlock pix={tenant.pix} accentColor={accent} variant={variant} />

                {/* Ações de Conversão */}
                <div className="w-full mb-4">
                  {!isConcierge ? (
                    <WhatsAppCTA
                      tenantName={tenant.name}
                      whatsappUrl={whatsappUrl}
                      accentColor={accent}
                      variant={variant}
                    />
                  ) : conciergeSuccess ? (
                    <div className="w-full p-3.5 rounded-xl bg-[#F4F8F4] border border-[#D5E6D5] text-[#2D6A2E] text-xs sm:text-sm text-center font-medium">
                      ✓ Atendimento solicitado com sucesso
                    </div>
                  ) : conciergeFallback ? (
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
                        tenantName={tenant.name}
                        whatsappUrl={whatsappUrl}
                        accentColor={accent}
                        variant={variant}
                      />
                    </div>
                  ) : (
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
                {tenant.instagram && (
                  <motion.a
                    id="instagram-direct-link"
                    href={`https://instagram.com/${tenant.instagram.replace(/^@/, '')}`}
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
                    ou chama no direct @{tenant.instagram.replace(/^@/, '')}
                  </motion.a>
                )}

                {/* Voltar ao início: sem ele, o resumo era um beco sem saída */}
                <button
                  id="back-to-start-btn"
                  type="button"
                  onClick={() => goToStep(0)}
                  className={`inline-block text-xs underline underline-offset-4 transition-colors py-1 mt-1 cursor-pointer bg-transparent border-0 ${
                    isGlass
                      ? 'text-[rgba(255,235,210,0.65)] hover:text-[#FFF4E6]'
                      : 'text-[#888] hover:text-[#1A1A1A]'
                  }`}
                >
                  ← Voltar ao início
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer: Customizado se configurado, senão padrão Nexo Link */}
        {customFooter ? (
          <footer
            id="tenant-custom-footer"
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
