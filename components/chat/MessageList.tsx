'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Message, Profile } from '@/types';
import { MessageBubble } from './MessageBubble';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MessageListProps {
  messages: Array<Message & { isOptimistic?: boolean }>;
  currentUserId: string;
  otherUser?: Profile;
  isGroupChat?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function MessageList({
  messages,
  currentUserId,
  otherUser,
  isGroupChat = false,
  emptyTitle,
  emptyDescription,
}: MessageListProps) {
  const t = useTranslations('chat');
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Auto-scroll logic respecting user scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isInitialLoad) {
      // Immediate scroll to bottom on mount
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      setIsInitialLoad(false);
      return;
    }

    // Check if user was near bottom before the new message
    const threshold = 150;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInitialLoad]);

  if (messages.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center bg-[#FAF9F6]/50"
      >
        <div className="w-14 h-14 rounded-3xl bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center mb-3.5 border border-[#D4E6F1] shadow-xs">
          <MessageSquare className="w-7 h-7 text-[#7CA5B8]" />
        </div>
        <h3 className="text-base font-bold text-[#0F172A]">
          {emptyTitle || (isGroupChat ? t('startProjectConversation') : t('startConversation'))}
        </h3>
        <p className="text-xs text-[#64748B] max-w-xs mt-1.5 leading-relaxed">
          {emptyDescription ||
            (isGroupChat
              ? t('startProjectConversationDesc')
              : t('startConversationDesc'))}
        </p>
        {!isGroupChat && otherUser && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-medium text-[#475569] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{otherUser.full_name || 'Student'}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto py-4 space-y-1 bg-[#FAF9F6]/30"
    >
      {messages.map((message) => {
        const isCurrentUser = message.sender_id === currentUserId;
        return (
          <MessageBubble
            key={message.id}
            message={message}
            isCurrentUser={isCurrentUser}
            showSenderInfo={isGroupChat}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

