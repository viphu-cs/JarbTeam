import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'blue' | 'lavender' | 'pink' | 'subtle';
  hoverEffect?: boolean;
}

export function Card({
  className = '',
  variant = 'white',
  hoverEffect = false,
  children,
  ...props
}: CardProps) {
  const variants = {
    white: 'bg-white border-[#E2E8F0]',
    blue: 'bg-[#F0F4F8] border-[#D4E6F1]',
    lavender: 'bg-[#F8F7FF] border-[#E0E7FF]',
    pink: 'bg-[#FFF7FA] border-[#FCE7F3]',
    subtle: 'bg-[#FAF9F6] border-[#E2E8F0]',
  };

  const hoverClass = hoverEffect
    ? 'transition-all duration-200 hover:border-[#CBD5E1] hover:shadow-[0_4px_12px_rgba(15,23,42,0.04)]'
    : '';

  return (
    <div
      className={`rounded-[24px] border p-6 text-[#0F172A] ${variants[variant]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
