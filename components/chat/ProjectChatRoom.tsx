'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Message, Profile, Project } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { sendMessageAction, markConversationAsReadAction } from '@/actions/chat';
import { ProjectChatHeader } from './ProjectChatHeader';
import { ProjectMemberList, ProjectMemberItem } from './ProjectMemberList';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ProjectChatRoomProps {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  currentUser?: Profile;
  project: Project;
  members: ProjectMemberItem[];
  backHref?: string;
}

export function ProjectChatRoom({
  conversationId,
  initialMessages,
  currentUserId,
  currentUser,
  project,
  members,
  backHref,
}: ProjectChatRoomProps) {
  const [messages, setMessages] = useState<Array<Message & { isOptimistic?: boolean }>>(
    initialMessages
  );
  const [sendError, setSendError] = useState<string | null>(null);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);

  // 1. Mark as read on mount
  useEffect(() => {
    markConversationAsReadAction(conversationId);
  }, [conversationId]);

  // 2. Supabase Realtime Subscription for this project conversation
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          // Find sender profile from members list if not included in payload
          const memberInfo = members.find((m) => m.user_id === newMsg.sender_id);
          if (memberInfo && !newMsg.sender) {
            newMsg.sender = memberInfo.profile;
          } else if (newMsg.sender_id === currentUserId && currentUser && !newMsg.sender) {
            newMsg.sender = currentUser;
          }

          setMessages((prev) => {
            // Deduplicate: If message already exists by ID, ignore
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }

            // Check if there was an optimistic message from current user
            const optimisticIndex = prev.findIndex(
              (m) =>
                m.isOptimistic &&
                m.sender_id === newMsg.sender_id &&
                m.content === newMsg.content
            );

            if (optimisticIndex !== -1) {
              const updated = [...prev];
              updated[optimisticIndex] = newMsg;
              return updated;
            }

            return [...prev, newMsg];
          });

          // Mark as read if received while room is open
          if (newMsg.sender_id !== currentUserId) {
            markConversationAsReadAction(conversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, members, currentUser]);

  // 3. Send message handler with optimistic UI
  const handleSendMessage = useCallback(
    async (content: string) => {
      setSendError(null);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const optimisticMsg: Message & { isOptimistic?: boolean } = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isOptimistic: true,
        sender: currentUser,
      };

      // Add optimistic message immediately
      setMessages((prev) => [...prev, optimisticMsg]);

      const res = await sendMessageAction(conversationId, content);

      if (res.error) {
        setSendError(res.error);
        // Rollback optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else if (res.message) {
        const savedMsg = res.message;
        if (!savedMsg.sender && currentUser) {
          savedMsg.sender = currentUser;
        }
        // Replace optimistic message with actual DB record
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m))
        );
      }
    },
    [conversationId, currentUserId, currentUser]
  );

  return (
    <div className="flex h-full bg-white relative overflow-hidden">
      {/* Main Chat Column */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Project Chat Header */}
        <ProjectChatHeader
          project={project}
          memberCount={members.length}
          onToggleMemberList={() => setIsMemberListOpen((prev) => !prev)}
          isMemberListOpen={isMemberListOpen}
          backHref={backHref}
        />

        {/* Error Alert */}
        {sendError && (
          <div className="px-4 py-2 bg-rose-50 text-rose-700 text-xs font-medium border-b border-rose-200">
            {sendError}
          </div>
        )}

        {/* Messages */}
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isGroupChat={true}
        />

        {/* Input */}
        <MessageInput onSendMessage={handleSendMessage} />
      </div>

      {/* Side Panel for Desktop (collapsible) */}
      <div
        className={`${
          isMemberListOpen ? 'hidden xl:flex w-72' : 'hidden'
        } shrink-0 transition-all`}
      >
        <ProjectMemberList
          members={members}
          currentUserId={currentUserId}
          onClose={() => setIsMemberListOpen(false)}
        />
      </div>

      {/* Mobile & Tablet Drawer for Members List */}
      {isMemberListOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMemberListOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative ml-auto w-full max-w-xs h-full bg-white shadow-2xl z-10 flex flex-col">
            <ProjectMemberList
              members={members}
              currentUserId={currentUserId}
              onClose={() => setIsMemberListOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
