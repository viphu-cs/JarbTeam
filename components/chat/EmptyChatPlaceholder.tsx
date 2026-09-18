import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function EmptyChatPlaceholder() {
  const t = useTranslations('chat');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF9F6]/40 h-full">
      <div className="w-16 h-16 rounded-3xl bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center mb-4 border border-[#D4E6F1] shadow-xs">
        <MessageSquare className="w-8 h-8 text-[#7CA5B8]" />
      </div>
      <h3 className="text-base font-bold text-[#0F172A]">
        {t('selectConversation')}
      </h3>
      <p className="text-xs text-[#64748B] mt-1.5 max-w-sm leading-relaxed">
        {t('selectConversationDesc')}
      </p>
    </div>
  );
}
