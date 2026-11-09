import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AkisLogo } from './AkisLogo';
import type { Tenant, UTMParams, BarberService, StoreCategory } from '../types';

interface AkisExperienceProps {
  tenant: Tenant;
  utms?: UTMParams;
}

type DirectionMode = 'hub' | 'barber' | 'store';

export const AkisExperience: React.FC<AkisExperienceProps> = ({ tenant, utms }: AkisExperienceProps) => {
  const safeUtms: UTMParams = utms || {};
  const reducedMotion = useReducedMotion();

  // Mode: 'hub' (main two-direction doors), 'barber' (booking journey), 'store' (fashion journey)
  const [direction, setDirection] = useState<DirectionMode>('hub');
  const [showPriceTable, setShowPriceTable] = useState<boolean>(false);

  // Identidade real da marca: preto, branco e cromado — sem cor de acento. O barber pole existe na fachada fisica, nao na paleta digital.
  const instagramBarber = tenant.instagram || 'akisbarbearia_';
  const instagramStore = tenant.instagramSecondary || 'akisformen_';
  const whatsappDigits = tenant.whatsapp.replace(/\D/g, '');

  // Proximos 7 dias gerados a partir de hoje (nunca mais dia fixo que vence na semana seguinte).
  const nextDays = useMemo(() => {
    const fmtDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
    const fmtDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const wd = fmtDay.format(d).replace('.', '');
      const dt = fmtDate.format(d);
      if (i === 0) return `Hoje · ${wd} ${dt}`;
      if (i === 1) return `Amanhã · ${wd} ${dt}`;
      return `${wd} ${dt}`;
    });
  }, []);

  // Fecha a tabela de precos com Esc.
  useEffect(() => {
    if (!showPriceTable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPriceTable(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPriceTable]);

  // Barber Flow State
  // Step 1: Services Selection (multi-select with pricing)
  // Step 2: Day & Period
  // Step 3: Barber (Alisson or Any)
  // Step 4: Name
  // Step 5: Summary & WhatsApp CTA
  const [barberStep, setBarberStep] = useState<number>(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [preferredDay, setPreferredDay] = useState<string>('');
  const [preferredPeriod, setPreferredPeriod] = useState<string>('');
  const [preferredBarber, setPreferredBarber] = useState<string>('');
  const [barberClientName, setBarberClientName] = useState<string>('');
  const [barberNameError, setBarberNameError] = useState<string>('');

  // Store Flow State
  // Step 1: Category / Interest
  // Step 2: Size
  // Step 3: Occasion / Style
  // Step 4: Name
  // Step 5: Summary & WhatsApp CTA
  const [storeStep, setStoreStep] = useState<number>(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('');
  const [storeClientName, setStoreClientName] = useState<string>('');
  const [storeNameError, setStoreNameError] = useState<string>('');

  const services: BarberService[] = useMemo(() => {
    return (
      tenant.barberServices || [
        // Tabela oficial (Tabela de Valores Akis, 09/11/2026) — manter igual ao akis.json
        { id: 'corte', name: 'Corte', price: 30, formattedPrice: 'R$ 30', popular: true, description: 'Corte tradicional ou degradê com acabamento impecável.' },
        { id: 'barba', name: 'Barba', price: 20, formattedPrice: 'R$ 20', description: 'Desenho, alinhamento, toalha quente e pós-barba.' },
        { id: 'barboterapia', name: 'Barboterapia', price: 35, formattedPrice: 'R$ 35' },
        { id: 'pezinho', name: 'Pezinho', price: 12, formattedPrice: 'R$ 12', description: 'Acabamento no contorno, nuca e costeletas na navalha.' },
        { id: 'corte_barba', name: 'Corte + Barba', price: 50, formattedPrice: 'R$ 50', popular: true, badge: 'Mais Pedido', description: 'Combo completo de cabelo alinhado e barba modelada.' },
        { id: 'sobrancelha', name: 'Sobrancelha', price: 7, formattedPrice: 'R$ 7' },
        { id: 'sobrancelha_pinca', name: 'Sobrancelha na Pinça', price: 10, formattedPrice: 'R$ 10' },
        { id: 'luzes', name: 'Luzes', price: 90, formattedPrice: 'R$ 90' },
        { id: 'platinado', name: 'Platinado', price: 100, formattedPrice: 'R$ 100' },
        { id: 'limpeza_nasal', name: 'Limpeza Nasal', price: 10, formattedPrice: 'R$ 10' },
        { id: 'limpeza_pele', name: 'Limpeza de Pele', price: 20, formattedPrice: 'R$ 20' },
        { id: 'relaxamento', name: 'Relaxamento', price: 20, formattedPrice: 'R$ 20' },
        { id: 'progressiva', name: 'Progressiva', price: 80, formattedPrice: 'R$ 80' },
        { id: 'corte_visagismo', name: 'Corte Visagismo', price: 80, formattedPrice: 'R$ 80' },
      ]
    );
  }, [tenant.barberServices]);

  const storeCategories: StoreCategory[] = useMemo(() => {
    return (
      tenant.storeCategories || [
        { id: 'camisetas', name: 'Camisetas & Estilo Urbano' },
        { id: 'bones', name: 'Bonés & Acessórios' },
        { id: 'bermudas', name: 'Bermudas, Shorts & Calças' },
        { id: 'camisas', name: 'Camisas & Polos' },
        { id: 'novidades', name: 'Novidades & Lançamentos' },
        { id: 'look_completo', name: 'Look Completo / Consultoria' },
      ]
    );
  }, [tenant.storeCategories]);

  // Total price calculation for Barber services
  const selectedServices = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + item.price, 0);
  }, [selectedServices]);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // WhatsApp Message Builders
  const barberWhatsAppUrl = useMemo(() => {
    const serviceNames = selectedServices.map((s) => `${s.name} (${s.formattedPrice})`).join(', ');
    const client = barberClientName.trim() || 'Cliente';

    let text = `Olá! Gostaria de agendar um horário na *Akis Barbearia*:\n\n`;
    text += `✂️ *Serviço(s):* ${serviceNames}\n`;
    text += `💰 *Total estimado:* R$ ${totalPrice}\n`;
    text += `📅 *Dia preferido:* ${preferredDay}\n`;
    text += `⏰ *Turno:* ${preferredPeriod}\n`;
    text += `💈 *Barbeiro:* ${preferredBarber}\n`;
    text += `👤 *Nome:* ${client}\n\n`;
    text += `Tem disponibilidade para esse horário?`;

    if (safeUtms.utm_source) {
      text += `\n\n_[Origem: ${safeUtms.utm_source}]_`;
    }

    const cleanPhone = tenant.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }, [selectedServices, totalPrice, preferredDay, preferredPeriod, preferredBarber, barberClientName, safeUtms, tenant.whatsapp]);

  const storeWhatsAppUrl = useMemo(() => {
    const categoryNames = storeCategories
      .filter((c) => selectedCategories.includes(c.id))
      .map((c) => c.name)
      .join(', ');
    const client = storeClientName.trim() || 'Cliente';

    let text = `Olá equipe *Akis For Men*! Gostaria de atendimento na loja masculina:\n\n`;
    text += `👕 *Interesse:* ${categoryNames}\n`;
    text += `📏 *Tamanho:* ${selectedSize}\n`;
    text += `🎯 *Estilo/Ocasião:* ${selectedOccasion}\n`;
    text += `👤 *Nome:* ${client}\n\n`;
    text += `Gostaria de ver os modelos disponíveis em estoque e novidades!`;

    if (safeUtms.utm_source) {
      text += `\n\n_[Origem: ${safeUtms.utm_source}]_`;
    }

    const cleanPhone = tenant.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }, [storeCategories, selectedCategories, selectedSize, selectedOccasion, storeClientName, safeUtms, tenant.whatsapp]);

  const directWhatsAppUrl = useMemo(() => {
    const text = 'Olá! Gostaria de informações sobre os serviços e atendimento da Akis.';
    const cleanPhone = tenant.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }, [tenant.whatsapp]);

  const mapsUrl =
    tenant.mapUrl ||
    'https://www.google.com/maps/search/?api=1&query=Rua+Padre+Vieira+448+Sao+Judas+Montes+Claros+MG';

  // Animation variants
  const fadeIn = {
    initial: { opacity: 0, y: reducedMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reducedMotion ? 0 : -12 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Container Principal Estilo Dark Luxury */}
      <div className="w-full rounded-[28px] sm:rounded-[36px] bg-[#111111]/90 border border-[#272727] backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col text-white">
        {/* Barra de Status Superior com Barber Pole Sutil */}
        <header className="w-full px-5 py-3.5 flex items-center justify-between border-b border-[#222222] bg-[#0C0C0C]/80">
          <div className="flex items-center gap-2.5">
            {/* Ícone Barber Pole em miniatura */}
            <div className="w-[2px] h-6 rounded-full bg-[#E5E7EB]" aria-hidden="true" />
            <span className="font-urban text-[11px] font-bold tracking-[0.2em] text-white uppercase">
              AKIS
            </span>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
              Nexo Link
            </span>
          </div>

          <div className="flex items-center gap-2">
            {direction !== 'hub' && (
              <button
                type="button"
                onClick={() => setDirection('hub')}
                className="text-[11px] font-urban uppercase tracking-wider text-zinc-400 hover:text-white px-2.5 py-1 rounded-md border border-[#333] hover:border-zinc-500 transition-colors"
              >
                ← Início
              </button>
            )}
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-urban uppercase font-semibold text-zinc-200 bg-white/5 border border-white/15 px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5E7EB] animate-pulse" />
              WhatsApp
            </a>
          </div>
        </header>

        {/* ============================================================== */}
        {/* DIREÇÃO 0: HUB PRINCIPAL (OS DOIS DIRECIONAMENTOS DA MARCA)   */}
        {/* ============================================================== */}
        <AnimatePresence mode="wait">
          {direction === 'hub' && (
            <motion.div
              key="hub"
              {...fadeIn}
              className="w-full p-5 sm:p-7 flex flex-col items-center text-center"
            >
              {/* Logotipo Akis SVG Metálico com Sombra */}
              <div className="mt-2 mb-3">
                <AkisLogo size="lg" />
              </div>

              {/* Subtítulo com Linhas Laterais Finas */}
              <div className="w-full flex items-center justify-center gap-3 my-2">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#444]" />
                <h2 className="font-urban text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-zinc-300">
                  Barbearia | Loja Masculina
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#444]" />
              </div>

              {/* Localização com Pin Branco (do print) */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir no Google Maps"
                className="group my-3 px-4 py-2 rounded-xl bg-[#161616] hover:bg-[#1C1C1C] border border-[#2A2A2A] hover:border-zinc-500 transition-all flex flex-col items-center justify-center cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2 text-white font-urban text-xs sm:text-sm font-bold tracking-wider uppercase">
                  <svg
                    className="w-4 h-4 text-white group-hover:scale-110 transition-transform"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>Rua Padre Vieira, nº 448</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-6 h-[1px] bg-zinc-600" />
                  <span className="font-urban text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.2em]">
                    São Judas · Montes Claros
                  </span>
                  <span className="w-6 h-[1px] bg-zinc-600" />
                </div>
              </a>

              {/* Links de Instagram e Telefone */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <a
                  href={`https://instagram.com/${instagramBarber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#181818] border border-[#2D2D2D] hover:border-zinc-500 text-[11px] text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>@{instagramBarber}</span>
                </a>
                <a
                  href={`https://instagram.com/${instagramStore}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#181818] border border-[#2D2D2D] hover:border-zinc-500 text-[11px] text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>@{instagramStore}</span>
                </a>
              </div>

              {/* SEÇÃO DOS DOIS DIRECIONAMENTOS */}
              <div className="w-full text-left mb-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 block mb-2 px-1">
                  Selecione seu atendimento
                </span>
              </div>

              {/* DIRECIONAMENTO 1: AGENDAR BARBEARIA (Com o box idêntico ao print) */}
              <motion.div
                whileHover={reducedMotion ? {} : { scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  setDirection('barber');
                  setBarberStep(1);
                }}
                role="button"
                tabIndex={0}
                aria-label="Agendar horario na barbearia"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDirection('barber');
                    setBarberStep(1);
                  }
                }}
                className="w-full mb-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#181818] via-[#141414] to-[#0E0E0E] border border-[#E5E7EB]/50 hover:border-[#E5E7EB] shadow-[0_10px_30px_rgba(0,0,0,0.6)] cursor-pointer text-left transition-all relative overflow-hidden group"
              >
                {/* Linha de brilho metálico superior */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-urban uppercase font-semibold text-zinc-200 tracking-wider mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E5E7EB]" />
                      Cortes & Barba · A partir de R$ 7
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Ícone de Calendário com Relógio do Print */}
                      <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth={1.5} />
                          <path strokeLinecap="round" d="M16 15v1.5l1 0.5" stroke="currentColor" strokeWidth={1.5} />
                        </svg>
                      </div>

                      <div>
                        {/* Título em Itálico Dinâmico conforme especificado */}
                        <h3 className="font-urban font-bold text-base sm:text-lg text-white tracking-wide uppercase leading-tight">
                          Agende seu horário
                        </h3>
                        <p className="font-urban text-[11px] sm:text-xs text-zinc-300 tracking-wider uppercase mt-0.5 font-medium">
                          E venha fazer parte dessa nova jornada!
                        </p>
                      </div>
                    </div>

                    {/* Preços rápidos destacados */}
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                      <span className="bg-black/40 px-2 py-0.5 rounded text-white font-mono font-medium">Corte R$ 30</span>
                      <span className="bg-black/40 px-2 py-0.5 rounded text-white font-mono font-medium">Corte+Barba R$ 50</span>
                      <span className="bg-black/40 px-2 py-0.5 rounded text-white font-mono font-medium">Barba R$ 20</span>
                      <span className="text-zinc-500 font-urban text-[10px]">+ 11 opções</span>
                    </div>
                  </div>

                  <div className="self-center">
                    <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm shadow-md group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* DIRECIONAMENTO 2: ATENDIMENTO NA LOJA MASCULINA */}
              <motion.div
                whileHover={reducedMotion ? {} : { scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  setDirection('store');
                  setStoreStep(1);
                }}
                role="button"
                tabIndex={0}
                aria-label="Atendimento na loja masculina"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDirection('store');
                    setStoreStep(1);
                  }
                }}
                className="w-full mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#161616] via-[#121212] to-[#0A0A0A] border border-[#333] hover:border-zinc-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer text-left transition-all relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/15 text-[10px] font-urban uppercase font-semibold text-zinc-300 tracking-wider mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E5E7EB]" />
                      Akis For Men · Moda & Streetwear
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>

                      <div>
                        <h3 className="font-urban font-bold text-base sm:text-lg text-white tracking-wide uppercase leading-tight">
                          Atendimento Loja Masculina
                        </h3>
                        <p className="font-urban text-[11px] sm:text-xs text-zinc-300 tracking-wider uppercase mt-0.5 font-medium">
                          Camisetas, bonés, bermudas & tendências
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                      <span className="bg-black/40 px-2 py-0.5 rounded text-zinc-300">Consultar modelos</span>
                      <span className="bg-black/40 px-2 py-0.5 rounded text-zinc-300">Tamanhos P ao XGG</span>
                      <span className="bg-black/40 px-2 py-0.5 rounded text-zinc-300">Lançamentos</span>
                    </div>
                  </div>

                  <div className="self-center">
                    <span className="w-8 h-8 rounded-full bg-[#2A2A2A] text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-white group-hover:text-black group-hover:translate-x-0.5 transition-all">
                      →
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Botões Auxiliares de Consulta Rápida */}
              <div className="w-full grid grid-cols-2 gap-2.5 pt-2 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowPriceTable(true)}
                  className="py-2.5 px-3 rounded-xl bg-[#161616] hover:bg-[#1E1E1E] border border-[#2D2D2D] hover:border-zinc-500 text-xs font-urban font-semibold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
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
                  <svg className="w-4 h-4 text-[#E5E7EB]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.058-1.516-.271-.977-.367-1.748-1.077-2.28-1.802-.078-.106-.615-.824-.615-1.572 0-.749.387-1.117.525-1.27.137-.154.301-.193.401-.193.101 0 .201.002.288.006.093.004.218-.035.341.261.127.306.435 1.059.474 1.137.039.078.065.169.013.272-.052.104-.078.169-.155.26-.078.091-.164.203-.234.272-.078.078-.16.162-.069.318.091.156.403.666.865 1.078.595.53 1.097.694 1.253.772.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.351-.078.143.052.909.429 1.065.507.156.078.26.117.299.182.039.065.039.377-.105.782z" />
                  </svg>
                  Chamar no Whats
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* FLUXO 1: AGENDAR HORÁRIO NA BARBEARIA                          */}
        {/* ============================================================== */}
        <AnimatePresence mode="wait">
          {direction === 'barber' && (
            <motion.div
              key="barber-flow"
              {...fadeIn}
              className="w-full p-5 sm:p-7 flex flex-col"
            >
              {/* Cabeçalho do Fluxo com Indicador de Passos */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#252525]">
                <button
                  type="button"
                  onClick={() => {
                    if (barberStep === 1) {
                      setDirection('hub');
                    } else {
                      setBarberStep((prev) => prev - 1);
                    }
                  }}
                  className="flex items-center gap-1 text-xs font-urban uppercase font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  ← Voltar
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Barbearia</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                    Passo {barberStep} de 5
                  </span>
                </div>
              </div>

              {/* PASSO 1 DA BARBEARIA: SELEÇÃO DE SERVIÇOS TABELADOS */}
              {barberStep === 1 && (
                <div className="flex flex-col">
                  <div className="mb-4">
                    <h2 className="font-urban font-bold text-xl sm:text-2xl text-white uppercase tracking-tight">
                      Escolha seus serviços
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Selecione um ou mais serviços da tabela oficial da Akis:
                    </p>
                  </div>

                  {/* Grid de Serviços */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {services.map((service) => {
                      const isSelected = selectedServiceIds.includes(service.id);
                      return (
                        <div
                          key={service.id}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleService(service.id);
                            }
                          }}
                          onClick={() => toggleService(service.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative select-none ${
                            isSelected
                              ? 'bg-[#1C1C1C] border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                              : 'bg-[#141414] border-[#2A2A2A] hover:border-zinc-500 opacity-90'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-urban font-bold text-sm ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                                  {service.name}
                                </span>
                                {service.badge && (
                                  <span className="text-[9px] font-urban uppercase font-bold px-1.5 py-0.5 rounded bg-[#E5E7EB] text-black tracking-wider">
                                    {service.badge}
                                  </span>
                                )}
                              </div>
                              {service.description && (
                                <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight line-clamp-1">
                                  {service.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-sm text-[#E5E7EB]">
                                {service.formattedPrice}
                              </span>
                            </div>
                          </div>

                          {/* Indicador de Seleção */}
                          <div className="mt-2 flex items-center justify-between text-[10px] pt-1.5 border-t border-white/5">
                            <span className={isSelected ? 'text-white font-medium' : 'text-zinc-500'}>
                              {isSelected ? '✓ Selecionado' : '+ Adicionar'}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'bg-white border-white text-black' : 'border-zinc-600'
                              }`}
                            >
                              {isSelected && <span className="text-[10px] font-bold">✓</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Barra Flutuante de Total e Avanço */}
                  <div className="mt-4 pt-3 border-t border-[#252525] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">Total Selecionado:</span>
                      <span className="font-urban text-lg sm:text-xl font-bold text-[#E5E7EB]">
                        {selectedServices.length === 0 ? '—' : `R$ ${totalPrice}`}
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-urban">
                        ({selectedServices.length} {selectedServices.length === 1 ? 'serviço' : 'serviços'})
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={selectedServices.length === 0}
                      onClick={() => setBarberStep(2)}
                      className="py-3 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md disabled:opacity-40"
                    >
                      <span>Avançar</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 2 DA BARBEARIA: PREFERÊNCIA DE DIA E TURNO */}
              {barberStep === 2 && (
                <div className="flex flex-col">
                  <div className="mb-4">
                    <h2 className="font-urban font-bold text-xl sm:text-2xl text-white uppercase tracking-tight">
                      Quando prefere vir?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Escolha o dia e período mais conveniente para o seu corte:
                    </p>
                  </div>

                  {/* Seleção de Dia */}
                  <label className="text-[11px] font-urban uppercase font-bold text-zinc-300 tracking-wider mb-2 block">
                    Dia preferido:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {[...nextDays, 'Outro dia'].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setPreferredDay(day)}
                        className={`p-2.5 rounded-xl border text-xs font-urban font-bold transition-all text-center ${
                          preferredDay === day
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-[#161616] text-zinc-300 border-[#2A2A2A] hover:border-zinc-500'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  {/* Seleção de Turno */}
                  <label className="text-[11px] font-urban uppercase font-bold text-zinc-300 tracking-wider mb-2 block">
                    Turno desejado:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
                    {[
                      { id: 'Manhã (09h às 12h)', label: 'Manhã', hours: '09h às 12h' },
                      { id: 'Tarde (13h às 18h)', label: 'Tarde', hours: '13h às 18h' },
                      { id: 'Noite (18h às 20h)', label: 'Noite', hours: '18h às 20h' },
                    ].map((period) => (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => setPreferredPeriod(period.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          preferredPeriod === period.id
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-[#161616] text-zinc-300 border-[#2A2A2A] hover:border-zinc-500'
                        }`}
                      >
                        <span className="font-urban font-bold text-xs uppercase block">{period.label}</span>
                        <span className="font-mono text-[10px] opacity-80 block">{period.hours}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={!preferredDay || !preferredPeriod}
                    onClick={() => setBarberStep(3)}
                    className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                  >
                    <span>Continuar</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* PASSO 3 DA BARBEARIA: PREFERÊNCIA DE PROFISSIONAL */}
              {barberStep === 3 && (
                <div className="flex flex-col">
                  <div className="mb-4">
                    <h2 className="font-urban font-bold text-xl sm:text-2xl text-white uppercase tracking-tight">
                      Preferência de Barbeiro
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Você pode solicitar o Alisson ou o primeiro horário disponível:
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mb-6">
                    {[
                      {
                        id: 'Alisson Barbeiro',
                        title: 'Alisson Barbeiro',
                        desc: 'Atendimento exclusivo do Alisson (conforme agenda).',
                        badge: 'Em Destaque',
                      },
                      {
                        id: 'Primeiro barbeiro disponível',
                        title: 'Primeiro horário livre',
                        desc: 'Mais rapidez no atendimento com qualquer membro da equipe.',
                        badge: 'Mais Rápido',
                      },
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={preferredBarber === opt.id}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPreferredBarber(opt.id);
                          }
                        }}
                        onClick={() => setPreferredBarber(opt.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          preferredBarber === opt.id
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-[#161616] text-zinc-300 border-[#2A2A2A] hover:border-zinc-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-urban font-extrabold text-sm uppercase">{opt.title}</span>
                          <span
                            className={`text-[10px] font-urban uppercase font-bold px-2 py-0.5 rounded ${
                              preferredBarber === opt.id ? 'bg-black text-white' : 'bg-white/10 text-zinc-300'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${preferredBarber === opt.id ? 'text-zinc-700' : 'text-zinc-400'}`}>
                          {opt.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={!preferredBarber}
                    onClick={() => setBarberStep(4)}
                    className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                  >
                    <span>Avançar para identificação</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* PASSO 4 DA BARBEARIA: NOME DO CLIENTE */}
              {barberStep === 4 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (barberClientName.trim().length < 2) {
                      setBarberNameError('Por favor, informe seu nome com pelo menos 2 letras.');
                      return;
                    }
                    setBarberNameError('');
                    setBarberStep(5);
                  }}
                  className="flex flex-col"
                >
                  <div className="mb-4">
                    <h2 className="font-urban font-bold text-xl sm:text-2xl text-white uppercase tracking-tight">
                      Como podemos te chamar?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Seu nome para confirmarmos sua reserva na barbearia:
                    </p>
                  </div>

                  <div className="mb-4">
                    <input
                      type="text"
                      autoFocus
                      value={barberClientName}
                      onChange={(e) => {
                        setBarberClientName(e.target.value);
                        if (barberNameError) setBarberNameError('');
                      }}
                      placeholder="Ex.: Alisson, Lucas, Gabriel..."
                      className="w-full p-4 rounded-xl bg-[#161616] border border-[#333] focus:border-white text-white text-base font-urban focus:outline-none placeholder:text-zinc-600 transition-colors shadow-inner"
                    />
                    {barberNameError && (
                      <p className="text-red-400 text-xs mt-1.5 font-medium">{barberNameError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={barberClientName.trim().length < 2}
                    className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                  >
                    <span>Ver Resumo do Agendamento</span>
                    <span>→</span>
                  </button>
                </form>
              )}

              {/* PASSO 5 DA BARBEARIA: RESUMO & DISPARO DO WHATSAPP */}
              {barberStep === 5 && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/20 text-[#E5E7EB] flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h2 className="font-urban font-bold text-xl sm:text-2xl text-white uppercase tracking-tight mb-1">
                    Quase lá, {barberClientName}!
                  </h2>
                  <p className="text-xs text-zinc-400 mb-4 max-w-xs">
                    Sua solicitação foi compilada. Toque no botão abaixo para enviar diretamente no WhatsApp da Akis Barbearia:
                  </p>

                  {/* Ticket Dark VIP de Agendamento */}
                  <div className="w-full p-4 rounded-2xl bg-[#161616] border border-[#333] text-left mb-5 shadow-lg relative">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-dashed border-zinc-700">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                        AKIS TICKET · BARBEARIA
                      </span>
                      <span className="font-mono text-xs font-bold text-[#E5E7EB]">
                        Total R$ {totalPrice}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="col-span-2">
                        <dt className="text-zinc-500 text-[10px] uppercase font-mono">Serviço(s):</dt>
                        <dd className="font-urban font-bold text-white text-sm">
                          {selectedServices.map((s) => s.name).join(' + ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500 text-[10px] uppercase font-mono">Dia:</dt>
                        <dd className="font-urban font-medium text-zinc-200">{preferredDay}</dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500 text-[10px] uppercase font-mono">Turno:</dt>
                        <dd className="font-urban font-medium text-zinc-200">{preferredPeriod}</dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500 text-[10px] uppercase font-mono">Profissional:</dt>
                        <dd className="font-urban font-medium text-zinc-200">{preferredBarber}</dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500 text-[10px] uppercase font-mono">Cliente:</dt>
                        <dd className="font-urban font-medium text-zinc-200">{barberClientName}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* CTA Principal WhatsApp */}
                  <a
                    href={barberWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-sm sm:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>Enviar Agendamento no WhatsApp</span>
                    <span className="text-lg">↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setDirection('hub')}
                    className="text-xs font-urban uppercase text-zinc-500 hover:text-zinc-300 mt-4 underline underline-offset-4"
                  >
                    Voltar ao início da Akis
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* FLUXO 2: ATENDIMENTO NA LOJA MASCULINA (AKIS FOR MEN)          */}
        {/* ============================================================== */}
        <AnimatePresence mode="wait">
          {direction === 'store' && (
            <motion.div
              key="store-flow"
              {...fadeIn}
              className="w-full p-5 sm:p-7 flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#252525]">
                <button
                  type="button"
                  onClick={() => {
                    if (storeStep === 1) {
                      setDirection('hub');
                    } else {
                      setStoreStep((prev) => prev - 1);
                    }
                  }}
                  className="flex items-center gap-1 text-xs font-urban uppercase font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  ← Voltar
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">Akis For Men</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold border border-white/20">
                    Passo {storeStep} de 5
                  </span>
                </div>
              </div>

              {/* PASSO 1 DA LOJA: CATEGORIAS / PRODUTOS */}
              {storeStep === 1 && (
                <div className="flex flex-col">
                  <div className="mb-4">
                    <h2 className="font-urban font-bold text-xl sm:text-2xl text-white uppercase tracking-tight">
                      O que você procura?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Selecione suas categorias de interesse na loja física:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                    {storeCategories.map((cat) => {
                      const isSelected = selectedCategories.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleCategory(cat.id);
                            }
                          }}
                          onClick={() => toggleCategory(cat.id)}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all select-none ${
                            isSelected
                              ? 'bg-white text-black border-white shadow-sm'
                              : 'bg-[#161616] border-[#2A2A2A] text-zinc-300 hover:border-zinc-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-urban font-bold text-xs uppercase">{cat.name}</span>
                            <span className={`text-xs ${isSelected ? 'text-black' : 'text-zinc-600'}`}>
                              {isSelected ? '✓' : '+'}
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{cat.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={selectedCategories.length === 0}
                    onClick={() => setStoreStep(2)}
                    className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                  >
                    <span>Continuar</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* PASSO 2 DA LOJA: TAMANHO HABITUAL */}
              {storeStep === 2 && (
                <div className="flex flex-col">
                  <div className="mb-4">
                    <h2 className="font-urban font-bold text-xl sm:text-2xl text-white uppercase tracking-tight">
                      Qual é o seu tamanho?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Para conferirmos a disponibilidade imediata das peças:
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 mb-6">
                    {['P', 'M', 'G', 'GG', 'XGG', 'Acessórios / Bonés'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`p-3 rounded-xl border font-urban font-bold text-xs uppercase transition-all ${
                          selectedSize === sz
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-[#161616] text-zinc-300 border-[#2A2A2A] hover:border-zinc-500'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={!selectedSize}
                    onClick={() => setStoreStep(3)}
                    className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                  >
                    <span>Continuar</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* PASSO 3 DA LOJA: OCASIÃO OU ESTILO */}
              {storeStep === 3 && (
                <div className="flex flex-col">
                  <div className="mb-4">
                    <h2 className="font-urban font-bold text-xl sm:text-2xl text-white uppercase tracking-tight">
                      Qual é o seu objetivo?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Nos ajuda a selecionar os modelos que mais combinam:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                    {[
                      'Streetwear / Urbano',
                      'Casual / Dia a dia',
                      'Rolê / Balada',
                      'Treino / Esportivo',
                      'Presente para alguém',
                      'Quero sugestões de looks',
                    ].map((occ) => (
                      <button
                        key={occ}
                        type="button"
                        onClick={() => setSelectedOccasion(occ)}
                        className={`p-3.5 rounded-xl border font-urban font-bold text-xs text-left uppercase transition-all ${
                          selectedOccasion === occ
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-[#161616] text-zinc-300 border-[#2A2A2A] hover:border-zinc-500'
                        }`}
                      >
                        {occ}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={!selectedOccasion}
                    onClick={() => setStoreStep(4)}
                    className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                  >
                    <span>Avançar para seu nome</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* PASSO 4 DA LOJA: NOME DO CLIENTE */}
              {storeStep === 4 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (storeClientName.trim().length < 2) {
                      setStoreNameError('Por favor, informe seu nome com pelo menos 2 letras.');
                      return;
                    }
                    setStoreNameError('');
                    setStoreStep(5);
                  }}
                  className="flex flex-col"
                >
                  <div className="mb-4">
                    <h2 className="font-urban font-bold text-xl sm:text-2xl text-white uppercase tracking-tight">
                      Qual é o seu nome?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Para o consultor da Akis For Men iniciar seu atendimento:
                    </p>
                  </div>

                  <div className="mb-4">
                    <input
                      type="text"
                      autoFocus
                      value={storeClientName}
                      onChange={(e) => {
                        setStoreClientName(e.target.value);
                        if (storeNameError) setStoreNameError('');
                      }}
                      placeholder="Seu nome"
                      className="w-full p-4 rounded-xl bg-[#161616] border border-[#333] focus:border-white text-white text-base font-urban focus:outline-none placeholder:text-zinc-600 transition-colors shadow-inner"
                    />
                    {storeNameError && (
                      <p className="text-red-400 text-xs mt-1.5 font-medium">{storeNameError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={storeClientName.trim().length < 2}
                    className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                  >
                    <span>Ver Resumo da Loja</span>
                    <span>→</span>
                  </button>
                </form>
              )}

              {/* PASSO 5 DA LOJA: RESUMO & DISPARO DO WHATSAPP DA LOJA */}
              {storeStep === 5 && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/20 text-[#E5E7EB] flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h2 className="font-urban font-bold text-xl sm:text-2xl text-white uppercase tracking-tight mb-1">
                    Pronto, {storeClientName}!
                  </h2>
                  <p className="text-xs text-zinc-400 mb-4 max-w-xs">
                    Sua solicitação para a loja foi preparada. Clique no botão abaixo para receber fotos de peças e opções disponíveis:
                  </p>

                  <div className="w-full p-4 rounded-2xl bg-[#161616] border border-[#333] text-left mb-5 shadow-lg relative">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-dashed border-zinc-700">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#E5E7EB]">
                        AKIS FOR MEN · LOJA MASCULINA
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-300">
                        Tam. {selectedSize}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="col-span-2">
                        <dt className="text-zinc-500 text-[10px] uppercase font-mono">Interesse:</dt>
                        <dd className="font-urban font-bold text-white text-sm">
                          {storeCategories
                            .filter((c) => selectedCategories.includes(c.id))
                            .map((c) => c.name)
                            .join(', ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500 text-[10px] uppercase font-mono">Tamanho:</dt>
                        <dd className="font-urban font-medium text-zinc-200">{selectedSize}</dd>
                      </div>
                      <div>
                        <dt className="text-zinc-500 text-[10px] uppercase font-mono">Estilo:</dt>
                        <dd className="font-urban font-medium text-zinc-200">{selectedOccasion}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-zinc-500 text-[10px] uppercase font-mono">Cliente:</dt>
                        <dd className="font-urban font-medium text-zinc-200">{storeClientName}</dd>
                      </div>
                    </dl>
                  </div>

                  <a
                    href={storeWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-sm sm:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>Receber Modelos no WhatsApp</span>
                    <span className="text-lg">↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setDirection('hub')}
                    className="text-xs font-urban uppercase text-zinc-500 hover:text-zinc-300 mt-4 underline underline-offset-4"
                  >
                    Voltar ao início da Akis
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rodapé Interno com Informações Legais e Contato */}
        <footer className="w-full px-5 py-4 border-t border-[#222] bg-[#0A0A0A] text-center flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2 text-[10px] font-urban uppercase tracking-widest text-zinc-400">
            <span>AKIS</span>
            <span>·</span>
            <span>Montes Claros/MG</span>
            <span>·</span>
            <a href={`tel:+${whatsappDigits}`} className="text-zinc-300 hover:text-white underline">
              (38) 9 9892-9279
            </a>
          </div>
          {tenant.tagline && (
            <span className="text-[9px] font-urban uppercase tracking-[0.25em] text-zinc-500">
              {tenant.tagline}
            </span>
          )}
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600">
            Via Nexo Link
          </span>
        </footer>
      </div>

      {/* ============================================================== */}
      {/* MODAL / GAVETA RÁPIDA: TABELA COMPLETA DE PREÇOS DA BARBEARIA */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showPriceTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowPriceTable(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="Tabela de precos da Akis"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[#141414] border border-[#333] p-5 sm:p-6 text-white shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#282828]">
                <div>
                  <span className="font-urban text-[10px] uppercase font-bold tracking-widest text-[#E5E7EB]">
                    Tabela Oficial
                  </span>
                  <h3 className="font-urban font-black text-lg uppercase tracking-tight">
                    Serviços & Valores · Akis
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPriceTable(false)}
                  className="w-8 h-8 rounded-full bg-[#222] hover:bg-[#333] text-zinc-300 hover:text-white flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="divide-y divide-[#222] mb-5">
                {services.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-urban font-bold text-zinc-100">{item.name}</span>
                      {item.badge && (
                        <span className="ml-2 text-[9px] font-urban uppercase font-bold px-1.5 py-0.5 rounded bg-[#E5E7EB] text-black">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#E5E7EB]">{item.formattedPrice}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPriceTable(false);
                    setDirection('barber');
                    setBarberStep(1);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-urban font-bold text-xs uppercase tracking-wider transition-colors text-center"
                >
                  Agendar Agora
                </button>
                <button
                  type="button"
                  onClick={() => setShowPriceTable(false)}
                  className="py-3 px-4 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-zinc-300 font-urban font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
