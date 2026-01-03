import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  fullWidth = true,
  className = '',
  disabled,
  ...props
}) => {

  const baseStyles = "relative flex items-center justify-center py-4 px-8 rounded-full font-bold text-base transition-all duration-300 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-opacity-50";

  const variants = {
    primary: "bg-soft-gold text-warm-900 shadow-soft hover:bg-soft-goldHover hover:shadow-float focus:ring-soft-gold",
    secondary: "bg-white text-warm-700 shadow-sm hover:bg-cream-100 focus:ring-cream-200",
    outline: "border-2 border-warm-500 text-warm-700 hover:bg-warm-50 focus:ring-warm-200"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin text-current" />
      ) : (
        children
      )}
    </button>
  );
};
