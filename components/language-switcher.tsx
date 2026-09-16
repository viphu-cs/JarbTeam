'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Check, ChevronDown, Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (newLocale: 'th' | 'en') => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);

    startTransition(() => {
      // Preserve search parameters if any
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const targetPath = `${pathname}${search}`;

      router.replace(targetPath, { locale: newLocale });
    });
  };

  const currentLabel = locale === 'th' ? 'ไทย' : 'EN';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FAF9F6] text-[#0F172A] transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7CA5B8]/30"
        aria-label="Change language"
      >
        <Globe className="w-3.5 h-3.5 text-[#7CA5B8]" />
        <span>{currentLabel}</span>
        <ChevronDown className={`w-3 h-3 text-[#64748B] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-32 rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_4px_16px_rgba(15,23,42,0.06)] py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Option: Thai */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('th')}
            className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
              locale === 'th'
                ? 'bg-[#E8F1F5] text-[#0B3B4B] font-semibold'
                : 'text-[#334155] hover:bg-[#FAF9F6]'
            }`}
          >
            <span>ไทย</span>
            {locale === 'th' && <Check className="w-3.5 h-3.5 text-[#0B3B4B]" />}
          </button>

          {/* Option: English */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
              locale === 'en'
                ? 'bg-[#E8F1F5] text-[#0B3B4B] font-semibold'
                : 'text-[#334155] hover:bg-[#FAF9F6]'
            }`}
          >
            <span>English</span>
            {locale === 'en' && <Check className="w-3.5 h-3.5 text-[#0B3B4B]" />}
          </button>
        </div>
      )}
    </div>
  );
}
