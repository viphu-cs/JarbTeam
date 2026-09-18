'use client';

import React from 'react';
import { DirectConversationSummary } from '@/types';
import { ConversationList } from './ConversationList';

interface ChatLayoutProps {
  conversations: DirectConversationSummary[];
  activeConversationId?: string;
  children: React.ReactNode;
}

export function ChatLayout({
  conversations,
  activeConversationId,
  children,
}: ChatLayoutProps) {
  const hasActiveConversation = Boolean(activeConversationId);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100dvh-4rem)] sm:h-[calc(100vh-5.5rem)] sm:my-4 sm:px-4 flex flex-col">
      <div className="w-full h-full bg-white sm:rounded-3xl sm:border border-[#E2E8F0] shadow-xs overflow-hidden flex">
        {/* Left Pane: Conversation List */}
        <div
          className={`h-full flex-col ${
            hasActiveConversation ? 'hidden md:flex' : 'flex w-full'
          } md:w-80 lg:w-96 shrink-0`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
          />
        </div>

        {/* Right Pane: Active Chat Room or Placeholder */}
        <div
          className={`h-full flex-col flex-1 min-w-0 ${
            hasActiveConversation ? 'flex' : 'hidden md:flex'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
