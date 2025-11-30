import React from 'react';

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  className?: string;
  variant?: 'primary' | 'gold' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({ 
  children, 
  onClick, 
  fullWidth = false, 
  className = '', 
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const baseClasses = "rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center shadow-lg active:scale-95";
  
  const sizeClasses = {
    sm: "py-2 px-4 text-xs",
    md: "py-3 px-6 text-sm",
    lg: "py-4 px-8 text-base"
  };

  const variantClasses = {
    primary: "bg-gradient-to-r from-brand-start to-brand-end text-white shadow-brand-start/30 hover:shadow-brand-start/50",
    gold: "bg-gradient-to-r from-brand-gold to-orange-500 text-black shadow-brand-gold/30 hover:shadow-brand-gold/50",
    outline: "bg-transparent border border-brand-start text-brand-start hover:bg-brand-start/10"
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed grayscale" : "";

  return (
    <button 
      onClick={disabled ? undefined : onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
};