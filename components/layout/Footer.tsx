import React from 'react';
import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('common');
  return (
    <footer className="w-full border-t border-[#E2E8F0] bg-white py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
        <p>© {new Date().getFullYear()} {t('footer.copyright')}</p>
        <div className="flex items-center gap-6">
          <span>{t('footer.tagline')}</span>
        </div>
      </div>
    </footer>
  );
}
