import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col space-y-1 sm:space-y-2 w-full ${className}`}>
      <label className="text-sm font-bold text-warm-700 ml-4 transition-transform duration-300 transform origin-left">
        {label}
      </label>
      <input
        className={`
          w-full px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl bg-white border-2
          ${error ? 'border-red-300 bg-red-50' : 'border-transparent bg-white'}
          text-warm-900 placeholder-warm-500/50 shadow-soft text-base
          focus:outline-none focus:border-soft-gold focus:ring-4 focus:ring-soft-gold/20
          transition-all duration-300 ease-out
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 font-semibold ml-4 animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
};
