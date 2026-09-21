import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/language-switcher';

export async function Footer() {
  const t = await getTranslations('common');

  return (
    <footer className="w-full border-t border-[#E2E8F0] bg-white py-6 sm:py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
            <Link href="/" className="font-bold text-lg text-[#0F172A] tracking-tight">
              Jarb<span className="text-[#3b6475]">Team</span>
            </Link>
            <span className="hidden sm:inline text-[#CBD5E1]">·</span>
            <span className="text-xs text-[#64748B]">{t('footer.tagline')}</span>
          </div>

          {/* Links & Language Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-5 text-xs font-medium text-[#475569]">
            <Link href="/" className="hover:text-[#0F172A] transition-colors py-1">
              {t('footer.home')}
            </Link>
            <Link href="/projects" className="hover:text-[#0F172A] transition-colors py-1">
              {t('footer.projects')}
            </Link>
            <Link href="/projects" className="hover:text-[#0F172A] transition-colors py-1">
              {t('footer.about')}
            </Link>
            <a href="mailto:support@jarbteam.local" className="hover:text-[#0F172A] transition-colors py-1">
              {t('footer.contact')}
            </a>
            <div className="pl-2 border-l border-[#E2E8F0]">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="pt-3 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-[#94A3B8] text-center sm:text-left">
          <p>© {new Date().getFullYear()} {t('footer.copyright')}</p>
          <p>Built for university student collaboration</p>
        </div>
      </div>
    </footer>
  );
}

