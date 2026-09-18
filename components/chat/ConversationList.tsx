'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/routing';
import { DirectConversationSummary } from '@/types';
import { formatConversationTime } from '@/lib/utils/format';
import { getInitials } from '@/lib/supabase/storage';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Search, MessageSquare, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConversationListProps {
  conversations: DirectConversationSummary[];
  activeConversationId?: string;
}

export function ConversationList({
  conversations,
  activeConversationId,
}: ConversationListProps) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.other_user_name.toLowerCase().includes(q) ||
      (c.other_user_university && c.other_user_university.toLowerCase().includes(q)) ||
      (c.last_message_content && c.last_message_content.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0]">
      {/* Header */}
      <div className="p-4 border-b border-[#F1F5F9] shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
            {t('title')}
          </h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F1F5] text-[#0B3B4B]">
            {conversations.length}
          </span>
        </div>

        {/* Search Filter */}
        {conversations.length > 0 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-[#FAF9F6] border border-[#E2E8F0] focus:outline-none focus:border-[#7CA5B8] focus:ring-1 focus:ring-[#7CA5B8]/30 transition-all text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>
        )}
      </div>

      {/* List / Empty State */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const isActive = conv.conversation_id === activeConversationId;
            const hasUnread = conv.unread_count > 0;
            const timeFormatted = formatConversationTime(
              conv.last_message_created_at || conv.created_at,
              locale
            );

            return (
              <Link
                key={conv.conversation_id}
                href={`/messages/${conv.conversation_id}`}
                className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#E8F1F5]/80 border-l-4 border-l-[#0B3B4B]'
                    : 'hover:bg-[#FAF9F6]'
                }`}
              >
                {/* Avatar */}
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#D4E6F1] text-[#0B3B4B] flex items-center justify-center font-bold text-xs border border-[#BEE3F8] shrink-0 shadow-xs">
                  {conv.other_user_avatar ? (
                    <Image
                      src={conv.other_user_avatar}
                      alt={conv.other_user_name}
                      fill
                      className="object-cover rounded-full"
                      sizes="44px"
                    />
                  ) : (
                    <span>{getInitials(conv.other_user_name)}</span>
                  )}
                  {hasUnread && (
                    <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#F43F5E] ring-2 ring-white" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3
                      className={`text-sm truncate leading-tight ${
                        hasUnread
                          ? 'font-bold text-[#0F172A]'
                          : 'font-semibold text-[#1E293B]'
                      }`}
                    >
                      {conv.other_user_name}
                    </h3>
                    <span
                      className={`text-[11px] shrink-0 ${
                        hasUnread
                          ? 'font-bold text-[#0B3B4B]'
                          : 'text-[#94A3B8]'
                      }`}
                    >
                      {timeFormatted}
                    </span>
                  </div>

                  <p
                    className={`text-xs truncate leading-relaxed ${
                      hasUnread
                        ? 'font-semibold text-[#0F172A]'
                        : 'text-[#64748B]'
                    }`}
                  >
                    {conv.last_message_content || t('startConversation')}
                  </p>

                  {conv.other_user_university && (
                    <span className="text-[10px] text-[#94A3B8] truncate block mt-0.5">
                      {conv.other_user_university}
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-[#7CA5B8]" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              {t('noConversations')}
            </h3>
            <p className="text-xs text-[#64748B] mt-1 mb-4 max-w-xs leading-relaxed">
              {t('noConversationsDesc')}
            </p>
            <Link href="/projects">
              <Button variant="primary" size="sm" className="cursor-pointer">
                <Compass className="w-3.5 h-3.5 mr-1.5" />
                {t('findTeammates')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
