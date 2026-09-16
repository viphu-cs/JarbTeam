import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#7CA5B8]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const variants = {
      primary: 'bg-[#D4E6F1] text-[#0F172A] border border-[#BEE3F8] hover:bg-[#BEE3F8] active:bg-[#A8D3EB]',
      secondary: 'bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#FAF9F6] active:bg-[#F1F5F9]',
      accent: 'bg-[#EDE9FE] text-[#0F172A] border border-[#E0E7FF] hover:bg-[#E0E7FF] active:bg-[#D4C8FA]',
      ghost: 'bg-transparent text-[#475569] hover:bg-[#F1F5F9] active:bg-[#E2E8F0]',
      danger: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] hover:bg-[#FECACA]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
      md: 'text-sm px-4 py-2 rounded-xl gap-2',
      lg: 'text-base px-6 py-3 rounded-2xl gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
