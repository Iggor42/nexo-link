import React from 'react';

interface QuestionCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  id = 'question-card',
  title,
  subtitle,
  children,
  variant,
}) => {
  const isGlass = variant === 'glass';

  return (
    <div id={id} className="w-full mx-auto animate-step-fade">
      <div className="mb-6 text-left">
        <h2
          id="question-title"
          className={`${
            isGlass
              ? 'font-glass-serif text-2xl sm:text-3xl text-[#FFF4E6] font-medium leading-snug tracking-[0.01em]'
              : 'font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-normal leading-snug tracking-tight'
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            id="question-subtitle"
            className={`text-sm mt-1.5 leading-relaxed ${
              isGlass
                ? 'font-glass-sans text-[rgba(255,235,210,0.72)] font-normal'
                : 'font-sans text-[#666]'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="w-full">{children}</div>
    </div>
  );
};
