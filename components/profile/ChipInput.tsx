'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/Badge';
import { X, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChipInputProps {
  label: string;
  helperText?: string;
  values: string[];
  onChange: (newValues: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  variant?: 'blue' | 'lavender' | 'pink' | 'yellow' | 'green';
}

export function ChipInput({
  label,
  helperText,
  values,
  onChange,
  suggestions = [],
  placeholder,
  variant = 'blue',
}: ChipInputProps) {
  const t = useTranslations('chips');
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      removeChip(values[values.length - 1]);
    }
  };

  const addChip = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...values, trimmed]);
    }
    setInputValue('');
  };

  const removeChip = (item: string) => {
    onChange(values.filter((v) => v.toLowerCase() !== item.toLowerCase()));
  };

  const unselectedSuggestions = suggestions.filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-2 text-left">
      <div>
        <label className="block text-xs font-semibold text-[#0F172A] tracking-wide">
          {label}
        </label>
        {helperText && (
          <p className="text-[11px] text-[#64748B] mt-0.5">{helperText}</p>
        )}
      </div>

      {/* Selected Chips & Input Box */}
      <div className="min-h-[46px] p-2 bg-white border border-[#E2E8F0] rounded-xl flex flex-wrap items-center gap-1.5 focus-within:border-[#7CA5B8] focus-within:ring-3 focus-within:ring-[#D4E6F1] transition-all">
        {values.map((val) => (
          <Badge
            key={val}
            variant={variant}
            className="flex items-center gap-1 cursor-default py-1"
          >
            <span>{val}</span>
            <button
              type="button"
              onClick={() => removeChip(val)}
              className="hover:opacity-75 focus:outline-none p-0.5 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? (placeholder || t('typeAndPressEnter')) : t('addMore')}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none px-1 py-1"
        />
      </div>

      {/* Quick Suggestions */}
      {unselectedSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <span className="text-[11px] font-medium text-[#64748B] mr-1">
            {t('suggestions')}
          </span>
          {unselectedSuggestions.slice(0, 7).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addChip(suggestion)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
