import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, helperText, id, rows = 3, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-[#0F172A] tracking-wide">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={`w-full px-3.5 py-2.5 bg-white border text-sm text-[#0F172A] placeholder-[#94A3B8] rounded-xl transition-all duration-150 focus:outline-none focus:border-[#7CA5B8] focus:ring-3 focus:ring-[#D4E6F1] disabled:bg-[#F8FAFC] disabled:cursor-not-allowed resize-y ${
            error ? 'border-rose-300 ring-1 ring-rose-100' : 'border-[#E2E8F0]'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#64748B]">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
