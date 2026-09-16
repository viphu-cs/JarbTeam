import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'lavender' | 'pink' | 'yellow' | 'green' | 'gray';
  size?: 'sm' | 'md';
}

export function Badge({
  className = '',
  variant = 'blue',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    blue: 'bg-[#E8F1F5] text-[#0B3B4B] border border-[#D4E6F1]',
    lavender: 'bg-[#EDE9FE] text-[#3F1E8C] border border-[#E0E7FF]',
    pink: 'bg-[#FCE7F3] text-[#831843] border border-[#FBCFE8]',
    yellow: 'bg-[#FEF9C3] text-[#713F12] border border-[#FEF08A]',
    green: 'bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0]',
    gray: 'bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 leading-tight font-medium',
    md: 'text-xs px-3 py-1 leading-normal font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
