import React from 'react';
import { Link } from 'react-router-dom';
import { BackgroundLayers } from './BackgroundLayers';

export const NotFoundPersonal: React.FC = () => {
  return (
    <div
      id="not-found-personal-container"
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-[#FAF9F6] text-[#1A1A1A] font-sans relative"
    >
      <BackgroundLayers accentColor="#B91C1C" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xs border border-[#E5E5E1] shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-[36px] overflow-hidden flex flex-col relative p-6 sm:p-8 text-center items-center">
        <header className="w-full pb-4 text-center border-b border-[#F0F0F0] mb-6">
          <span className="text-[10px] uppercase tracking-widest text-[#888] font-mono">
            Nexo Link Personal
          </span>
        </header>

        <div className="w-16 h-16 rounded-full bg-[#F5F5F3] border border-[#E5E5E1] flex items-center justify-center mb-5 text-[#888]">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <h1
          id="not-found-heading"
          className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1A1A1A] mb-3 leading-snug"
        >
          Este personal ainda está chegando.
        </h1>

        <p className="text-[#555] text-sm leading-relaxed max-w-xs mb-8">
          A página que você tentou acessar não foi encontrada ou ainda está em fase de configuração.
        </p>

        <a
          id="want-my-link-btn"
          href="#"
          className="w-full py-3.5 px-6 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-medium text-sm sm:text-base tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 border border-[#1A1A1A]"
        >
          <span>Sou personal, quero o meu</span>
          <span aria-hidden="true">↗</span>
        </a>

        <div className="mt-8 pt-5 border-t border-[#F0F0F0] w-full text-xs text-[#888]">
          <p className="mb-2 font-medium">Link disponível:</p>
          <div className="flex justify-center gap-4">
            <Link to="/p/lucaspersonal" className="underline hover:text-[#1A1A1A] transition-colors font-semibold">
              /p/lucaspersonal
            </Link>
          </div>
        </div>

        <footer className="mt-6 pt-4 border-t border-[#F0F0F0] w-full text-center text-[10px] text-[#BBB] uppercase tracking-widest">
          Via Nexo Link Personal
        </footer>
      </div>
    </div>
  );
};
