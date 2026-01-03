import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  dim?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', dim = false }) => {
  return (
    <div className={`
      bg-white rounded-[32px] p-6 sm:p-8 shadow-float w-full
      transition-all duration-500 ease-in-out
      ${dim ? 'opacity-60 scale-95 pointer-events-none grayscale-[0.5]' : 'opacity-100 scale-100'}
      ${className}
    `}>
      {children}
    </div>
  );
};
