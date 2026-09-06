import React from 'react';

interface QuestionCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  id = 'question-card',
  title,
  subtitle,
  children,
}) => {
  return (
    <div id={id} className="w-full mx-auto animate-step-fade">
      <div className="mb-6 text-left">
        <h2
          id="question-title"
          className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-normal leading-snug tracking-tight"
        >
          {title}
        </h2>
        {subtitle && (
          <p id="question-subtitle" className="text-[#666] text-sm mt-1.5 leading-relaxed font-sans">
            {subtitle}
          </p>
        )}
      </div>

      <div className="w-full">{children}</div>
    </div>
  );
};
