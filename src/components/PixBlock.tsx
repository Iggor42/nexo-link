import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { TenantPix } from '../types';

interface PixBlockProps {
  pix?: TenantPix;
  accentColor?: string;
  variant?: string;
}

export function formatBRL(amount: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  } catch {
    return `R$ ${amount.toFixed(2).replace('.', ',')}`;
  }
}

/**
 * Bloco de sinal via Pix (tela final do funil).
 * Renderiza SOMENTE quando o inquilino tem `pix.key` configurada;
 * sem config (ausente/vazia) retorna null — nenhum vestígio na tela.
 * Sem gateway: o lead copia a chave e confirma o pagamento no WhatsApp.
 */
export const PixBlock: React.FC<PixBlockProps> = ({ pix, accentColor = '#B91C1C', variant }) => {
  const [copied, setCopied] = useState(false);
  const isGlass = variant === 'glass';

  if (!pix || !pix.key || !pix.key.trim()) return null;

  const key = pix.key.trim();
  const label = pix.label?.trim() || 'Sinal de reserva';
  const hasAmount = typeof pix.amount === 'number' && Number.isFinite(pix.amount) && pix.amount > 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(key);
    } catch {
      // Fallback para navegadores/contextos sem Clipboard API
      try {
        const ta = document.createElement('textarea');
        ta.value = key;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="pix-block"
      className={`w-full rounded-2xl p-4 sm:p-5 text-left mb-6 ${
        isGlass
          ? 'bg-[rgba(255,244,230,0.05)] backdrop-blur-[9px] border border-[rgba(255,235,210,0.16)] text-[#FFF4E6]'
          : 'bg-[#FAF9F6] border border-[#E5E5E1] text-[#1A1A1A]'
      }`}
    >
      <div
        className={`text-[10px] font-mono uppercase tracking-[0.18em] mb-2 ${
          isGlass ? 'text-[rgba(255,235,210,0.65)]' : 'text-[#888]'
        }`}
      >
        Reserve sua data
      </div>

      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <span className={`text-sm font-medium ${isGlass ? 'font-glass-sans' : ''}`}>{label}</span>
        {hasAmount && (
          <span id="pix-amount" className="text-lg font-semibold" style={{ color: isGlass ? '#FFF4E6' : accentColor }}>
            {formatBRL(pix.amount as number)}
          </span>
        )}
      </div>

      <p className={`text-xs leading-relaxed mt-1.5 ${isGlass ? 'text-[rgba(255,235,210,0.7)]' : 'text-[#666]'}`}>
        Pague o sinal via Pix para garantir a data e confirme o pagamento na conversa do WhatsApp.
      </p>

      <div
        className={`mt-3 flex items-stretch gap-2 rounded-xl p-2 pl-3 ${
          isGlass ? 'bg-[rgba(255,244,230,0.06)] border border-[rgba(255,235,210,0.14)]' : 'bg-white border border-[#E5E5E1]'
        }`}
      >
        <span id="pix-key" className="flex-1 min-w-0 font-mono text-xs sm:text-sm break-all self-center">
          {key}
        </span>
        <motion.button
          id="pix-copy-btn"
          type="button"
          onClick={handleCopy}
          whileTap={{ scale: 0.97 }}
          className={`shrink-0 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer border transition-colors ${
            copied ? '' : ''
          }`}
          style={{
            backgroundColor: copied ? '#15803d' : accentColor,
            borderColor: copied ? '#15803d' : accentColor,
          }}
          aria-live="polite"
        >
          {copied ? 'Copiado ✓' : 'Copiar chave Pix'}
        </motion.button>
      </div>
    </div>
  );
};
