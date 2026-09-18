'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { ConversationListItem, DirectConversationSummary } from '@/types';
import { formatConversationTime } from '@/lib/utils/format';
import { getInitials } from '@/lib/supabase/storage';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Search, MessageSquare, Compass, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FriendsModal } from '@/components/friends/FriendsModal';
import { getFriendRequestsAction } from '@/actions/friends';
import { createClient } from '@/lib/supabase/client';

export type AnyConversationSummary = ConversationListItem | DirectConversationSummary;

function normalizeConversationItem(item: AnyConversationSummary): ConversationListItem {
  if ('title' in item && 'type' in item) {
    return item as ConversationListItem;
  }
  const direct = item as DirectConversationSummary;
  return {
    conversation_id: direct.conversation_id,
    type: 'direct',
    created_at: direct.created_at,
    updated_at: direct.updated_at,
    title: direct.other_user_name,
    subtitle: direct.other_user_university || direct.other_user_major,
    avatar_url: direct.other_user_avatar,
    other_user_id: direct.other_user_id,
    member_count: 2,
    last_message_id: direct.last_message_id,
    last_message_content: direct.last_message_content,
    last_message_sender_id: direct.last_message_sender_id,
    last_message_sender_name: null,
    last_message_created_at: direct.last_message_created_at,
    unread_count: direct.unread_count,
    relationship_type: 'none',
    relationship_label: null,
  };
}

interface ConversationListProps {
  conversations: AnyConversationSummary[];
  activeConversationId?: string;
  activeProjectId?: string;
}

export function ConversationList({
  conversations: rawConversations,
  activeConversationId,
  activeProjectId,
}: ConversationListProps) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'project'>('all');
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Load pending friend requests count & subscribe to realtime changes
  useEffect(() => {
    const fetchPending = async () => {
      const res = await getFriendRequestsAction();
      setPendingRequestsCount(res.pendingCount || 0);
    };

    fetchPending();

    const supabase = createClient();
    const channel = supabase
      .channel('friendships_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          fetchPending();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const normalizedList = rawConversations.map(normalizeConversationItem);

  const directCount = normalizedList.filter((c) => c.type === 'direct').length;
  const projectCount = normalizedList.filter((c) => c.type === 'project').length;

  const filteredConversations = normalizedList
    .filter((c) => {
      if (activeTab === 'all') return true;
      return c.type === activeTab;
    })
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        (c.last_message_content && c.last_message_content.toLowerCase().includes(q)) ||
        (c.last_message_sender_name && c.last_message_sender_name.toLowerCase().includes(q)) ||
        (c.relationship_label && c.relationship_label.toLowerCase().includes(q))
      );
    });

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0]">
      {/* Header & Tabs */}
      <div className="p-3.5 sm:p-4 border-b border-[#F1F5F9] shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
              {t('title')}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8F1F5] text-[#0B3B4B]">
              {normalizedList.length}
            </span>
          </div>

          {/* Find & Manage Friends button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsFriendsModalOpen(true)}
            className="text-xs h-8 px-2.5 cursor-pointer relative shrink-0 text-[#0B3B4B] hover:bg-[#E8F1F5]"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1 text-[#0B3B4B]" />
            <span>{t('findFriends')}</span>
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F43F5E] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {pendingRequestsCount}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Tabs */}
        {normalizedList.length > 0 && (
          <div className="flex p-1 bg-[#F1F5F9] rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'all'
                  ? 'bg-white text-[#0F172A] shadow-2xs font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {t('all')}
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                activeTab === 'direct'
                  ? 'bg-white text-[#0F172A] shadow-2xs font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <span>{t('direct')}</span>
              {directCount > 0 && (
                <span className="text-[10px] text-[#94A3B8]">({directCount})</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('project')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                activeTab === 'project'
                  ? 'bg-white text-[#0F172A] shadow-2xs font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <span>{t('projects')}</span>
              {projectCount > 0 && (
                <span className="text-[10px] text-[#94A3B8]">({projectCount})</span>
              )}
            </button>
          </div>
        )}

        {/* Search Filter */}
        {normalizedList.length > 0 && (
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
            const isProject = conv.type === 'project';
            const isActive =
              conv.conversation_id === activeConversationId ||
              (isProject && conv.project_id && conv.project_id === activeProjectId);
            const hasUnread = conv.unread_count > 0;
            const timeFormatted = formatConversationTime(
              conv.last_message_created_at || conv.created_at,
              locale
            );

            // Construct link URL
            const itemHref =
              isProject && conv.project_id
                ? `/projects/${conv.project_id}/chat`
                : `/messages/${conv.conversation_id}`;

            // Build preview text: if group chat, prefix with sender's first name
            let previewText = t('startConversation');
            if (conv.last_message_content) {
              if (isProject && conv.last_message_sender_name) {
                const firstName = conv.last_message_sender_name.split(' ')[0];
                previewText = `${firstName}: ${conv.last_message_content}`;
              } else {
                previewText = conv.last_message_content;
              }
            }

            return (
              <Link
                key={conv.conversation_id}
                href={itemHref}
                className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#E8F1F5]/80 border-l-4 border-l-[#0B3B4B]'
                    : 'hover:bg-[#FAF9F6]'
                }`}
              >
                {/* Avatar / Badge */}
                <div className="relative shrink-0">
                  {isProject ? (
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center font-bold text-xs border border-[#D4E6F1] shadow-xs">
                      {conv.avatar_url ? (
                        <Image
                          src={conv.avatar_url}
                          alt={conv.title}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-[#0B3B4B]" />
                      )}
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-[#D4E6F1] text-[#0B3B4B] flex items-center justify-center font-bold text-xs border border-[#BEE3F8] shadow-xs">
                      {conv.avatar_url ? (
                        <Image
                          src={conv.avatar_url}
                          alt={conv.title}
                          fill
                          className="object-cover rounded-full"
                          sizes="44px"
                        />
                      ) : (
                        <span>{getInitials(conv.title)}</span>
                      )}
                    </div>
                  )}

                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#F43F5E] ring-2 ring-white" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <h3
                        className={`text-sm truncate leading-tight ${
                          hasUnread
                            ? 'font-bold text-[#0F172A]'
                            : 'font-semibold text-[#1E293B]'
                        }`}
                      >
                        {conv.title}
                      </h3>

                      {/* Relationship badges */}
                      {isProject ? (
                        <span className="text-[10px] font-semibold text-[#0B3B4B] bg-[#E8F1F5] px-1.5 py-0.2 rounded-sm shrink-0">
                          {t('projects')}
                        </span>
                      ) : conv.relationship_type === 'teammate' ? (
                        <span className="text-[10px] font-semibold text-[#0369A1] bg-[#E0F2FE] border border-[#BAE6FD] px-1.5 py-0.2 rounded-sm shrink-0 truncate max-w-[140px]">
                          {conv.relationship_label
                            ? t('teammateBadge', { project: conv.relationship_label })
                            : 'Teammate'}
                        </span>
                      ) : conv.relationship_type === 'friend' ? (
                        <span className="text-[10px] font-semibold text-[#15803D] bg-[#DCFCE7] border border-[#BBF7D0] px-1.5 py-0.2 rounded-sm shrink-0">
                          {t('friendBadge')}
                        </span>
                      ) : null}
                    </div>

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
                    {previewText}
                  </p>

                  {conv.subtitle && (
                    <span className="text-[10px] text-[#94A3B8] truncate block mt-0.5">
                      {conv.subtitle}
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsFriendsModalOpen(true)}
                className="cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                {t('findFriends')}
              </Button>
              <Link href="/projects">
                <Button variant="secondary" size="sm" className="cursor-pointer">
                  <Compass className="w-3.5 h-3.5 mr-1.5" />
                  {t('findTeammates')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Friends Modal */}
      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
      />
    </div>
  );
}
