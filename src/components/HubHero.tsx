import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { buildWhatsAppUrl } from '../lib/lead';
import type { Tenant, JourneyStepOption, HeroAccess } from '../types';

interface HubHeroProps {
  tenant: Tenant;
  accesses: HeroAccess[];
  /** Serviços da barbearia (tabela oficial), p/ o modal "Tabela completa". */
  services: JourneyStepOption[];
  onAccess: (value: string) => void;
}

/**
 * Hub escuro da Akis (padrão original do zip): fundo todo preto com a
 * foto do barber pole ao fundo, logo oficial cromada, endereço,
 * Instagrams e os dois acessos — Agende o seu horário / Atendimento
 * Loja. Os fluxos (passos claros) começam ao tocar num acesso.
 */
export const HubHero: React.FC<HubHeroProps> = ({ tenant, accesses, services, onAccess }) => {
  const reducedMotion = useReducedMotion();
  const [showPriceTable, setShowPriceTable] = useState(false);

  useEffect(() => {
    if (!showPriceTable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPriceTable(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPriceTable]);

  const directWhatsAppUrl = buildWhatsAppUrl(
    tenant.whatsapp,
    'Olá! Gostaria de informações sobre os serviços e atendimento da Akis.'
  );

  // Endereço vem do footer ("Rua Padre Vieira, nº 448 · São Judas · Montes Claros/MG")
  const addressLine = tenant.footer?.lines?.[1] || '';
  const addressParts = addressLine.split(' · ');
  const addressMain = addressParts[0] || addressLine;
  const addressSub = addressParts.slice(1).join(' · ');

  const fadeIn = {
    initial: { opacity: 0, y: reducedMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reducedMotion ? 0 : -12 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div id="akis-hub" className="w-full flex flex-col items-center text-center relative">
      {/* Foto de fundo (barber pole) escurecida — o preto domina */}
      {tenant.heroBackground && (
        <>
          <img
            src={tenant.heroBackground}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85 pointer-events-none" />
        </>
      )}

      <div className="relative z-10 w-full flex flex-col items-center px-1 pt-2 pb-2">
        {/* Logo oficial cromada */}
        {tenant.heroLogo && (
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 mb-3"
          >
            <img
              src={tenant.heroLogo}
              alt="Akis Barbearia | Loja Masculina"
              className="w-[260px] sm:w-[300px] max-w-full h-auto drop-shadow-[0_4px_16px_rgba(255,255,255,0.18)]"
            />
          </motion.div>
        )}

        {/* Subtítulo com linhas laterais */}
        <div className="w-full flex items-center justify-center gap-3 my-1">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#444]" />
          <h2 className="font-urban text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-zinc-300 whitespace-nowrap">
            Barbearia | Loja Masculina
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#444]" />
        </div>

        {tenant.tagline && (
          <p className="text-xs italic text-zinc-400 mt-1 mb-3">{tenant.tagline}</p>
        )}

        {/* Localização */}
        {addressLine && (
          <a
            href={tenant.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir no Google Maps"
            className="group my-2 px-4 py-2 rounded-xl bg-[#161616]/90 hover:bg-[#1C1C1C] border border-[#2A2A2A] hover:border-zinc-500 transition-all flex flex-col items-center justify-center cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2 text-white font-urban text-xs sm:text-sm font-bold tracking-wider uppercase">
              <svg className="w-4 h-4 text-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>{addressMain}</span>
            </div>
            {addressSub && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-6 h-[1px] bg-zinc-600" />
                <span className="font-urban text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em]">
                  {addressSub}
                </span>
                <span className="w-6 h-[1px] bg-zinc-600" />
              </div>
            )}
          </a>
        )}

        {/* Instagrams */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5 mt-1">
          {[tenant.instagram, tenant.instagramSecondary].filter(Boolean).map((handle) => (
            <a
              key={handle}
              href={`https://instagram.com/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-[#181818]/90 border border-[#2D2D2D] hover:border-zinc-500 text-[11px] text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>@{handle}</span>
            </a>
          ))}
        </div>

        {/* Os dois acessos */}
        <div className="w-full text-left mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 block mb-2 px-1">
            Selecione seu atendimento
          </span>
        </div>

        <div className="w-full flex flex-col gap-3.5">
          {accesses.map((access, idx) => (
            <motion.div
              key={access.value}
              whileHover={reducedMotion ? {} : { scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onAccess(access.value)}
              role="button"
              tabIndex={0}
              aria-label={access.title}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAccess(access.value);
                }
              }}
              className={`w-full p-4 sm:p-5 rounded-2xl border cursor-pointer text-left transition-all relative overflow-hidden group ${
                idx === 0
                  ? 'bg-gradient-to-br from-[#181818] via-[#141414] to-[#0E0E0E] border-[#E5E7EB]/50 hover:border-[#E5E7EB] shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
                  : 'bg-gradient-to-br from-[#161616] via-[#121212] to-[#0A0A0A] border-[#333] hover:border-zinc-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
              }`}
            >
              {idx === 0 && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {access.badge && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-urban uppercase font-semibold text-zinc-200 tracking-wider mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E5E7EB]" />
                      {access.badge}
                    </div>
                  )}

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                      {access.icon === 'bag' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth={1.5} />
                          <path strokeLinecap="round" d="M16 15v1.5l1 0.5" stroke="currentColor" strokeWidth={1.5} />
                        </svg>
                      )}
                    </div>

                    <div>
                      <h3 className="font-urban font-bold text-base sm:text-lg text-white tracking-wide uppercase leading-tight">
                        {access.title}
                      </h3>
                      {access.subtitle && (
                        <p className="font-urban text-[11px] sm:text-xs text-zinc-300 tracking-wider uppercase mt-0.5 font-medium">
                          {access.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {access.chips && access.chips.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                      {access.chips.map((chip) => (
                        <span key={chip} className="bg-black/40 px-2 py-0.5 rounded text-zinc-300 font-mono font-medium">
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="self-center">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:translate-x-0.5 transition-all ${
                      idx === 0
                        ? 'bg-white text-black'
                        : 'bg-[#2A2A2A] text-white group-hover:bg-white group-hover:text-black'
                    }`}
                  >
                    →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Auxiliares: tabela completa + chamar no Whats */}
        <div className="w-full grid grid-cols-2 gap-2.5 pt-4 mt-4 border-t border-[#222]">
          <button
            type="button"
            onClick={() => setShowPriceTable(true)}
            className="py-2.5 px-3 rounded-xl bg-[#161616] hover:bg-[#1E1E1E] border border-[#2D2D2D] hover:border-zinc-500 text-xs font-urban font-semibold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Tabela Completa
          </button>

          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-[#161616] hover:bg-[#1E1E1E] border border-[#2D2D2D] hover:border-zinc-500 text-xs font-urban font-semibold uppercase tracking-wider text-zinc-100 hover:text-white transition-colors flex items-center justify-center gap-1.5"
          >
            Chamar no Whats
          </a>
        </div>
      </div>

      {/* Modal: tabela completa de serviços (fonte única: journey do tenant) */}
      <AnimatePresence>
        {showPriceTable && (
          <motion.div
            key="price-table-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPriceTable(false)}
          >
            <motion.div
              {...fadeIn}
              className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#2A2A2A] shadow-2xl overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#252525]">
                <h3 className="font-urban font-bold text-sm uppercase tracking-wider text-white">
                  Tabela de valores · Akis
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPriceTable(false)}
                  aria-label="Fechar tabela"
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/15 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
                    <span className="font-urban font-medium text-sm text-zinc-200">{s.label}</span>
                    <span className="font-mono font-bold text-sm text-white">{s.description || ''}</span>
                  </div>
                ))}
              </div>
              <p className="px-5 py-3 text-[11px] text-zinc-500 border-t border-[#252525]">
                Valores da tabela oficial da Akis. Toque em “Agende o seu horário” para escolher os serviços.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
