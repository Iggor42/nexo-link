import React from 'react';
import { Link } from 'react-router-dom';
import { BackgroundLayers } from './BackgroundLayers';
import { TENANTS } from '../lib/tenants';

/**
 * Landing institucional do Nexo Link (raiz "/").
 *
 * Não redireciona para nenhum cliente específico: com múltiplos
 * inquilinos, a raiz é a vitrine do produto + lista de profissionais.
 */
export const Home: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-[#FAF9F6] text-[#1A1A1A] font-sans relative">
      <BackgroundLayers accentColor="#0B9BE8" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xs border border-[#E5E5E1] shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[36px] overflow-hidden flex flex-col relative">
        <div className="p-6 sm:p-8 text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#888] font-mono mb-4">
            Nexo Link
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight leading-snug mb-3">
            Do clique à conversa qualificada.
          </h1>
          <p className="text-[#555] text-sm leading-relaxed mb-8">
            Escolha o profissional e responda à jornada — seu contato chega
            qualificado no WhatsApp dele.
          </p>

          <div className="flex flex-col gap-3">
            {TENANTS.map((t) => (
              <Link
                key={t.slug}
                to={`/${t.slug}`}
                className="w-full py-4 px-5 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white transition-all shadow-sm flex items-center justify-between gap-3 border border-[#1A1A1A] text-left"
              >
                <span>
                  <span className="block font-medium text-sm sm:text-base">{t.name}</span>
                  <span className="block text-xs text-white/60 mt-0.5">{t.profession}</span>
                </span>
                <span aria-hidden="true" className="text-white/60">→</span>
              </Link>
            ))}
          </div>

          <a
            href="#"
            className="inline-block mt-8 text-xs text-[#888] underline hover:text-[#1A1A1A] transition-colors"
          >
            Sou profissional, quero o meu link
          </a>
        </div>

        <footer className="py-4 border-t border-[#F0F0F0] text-center text-[10px] text-[#BBB] uppercase tracking-widest">
          Via Nexo Link
        </footer>
      </div>
    </div>
  );
};
