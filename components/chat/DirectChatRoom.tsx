'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Message, Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { sendMessageAction, markConversationAsReadAction } from '@/actions/chat';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface DirectChatRoomProps {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  otherUser?: Profile;
}

export function DirectChatRoom({
  conversationId,
  initialMessages,
  currentUserId,
  otherUser,
}: DirectChatRoomProps) {
  const [messages, setMessages] = useState<Array<Message & { isOptimistic?: boolean }>>(
    initialMessages
  );
  const [sendError, setSendError] = useState<string | null>(null);

  // 1. Mark as read on mount
  useEffect(() => {
    markConversationAsReadAction(conversationId);
  }, [conversationId]);

  // 2. Supabase Realtime Subscription for this conversation
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

          setMessages((prev) => {
            // Deduplicate: If message already exists by ID, do not add it again
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            // Check if there was an optimistic message from current user with matching content
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

          // Mark as read if received while active
          if (newMsg.sender_id !== currentUserId) {
            markConversationAsReadAction(conversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

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
      };

      // Add optimistic message immediately
      setMessages((prev) => [...prev, optimisticMsg]);

      const res = await sendMessageAction(conversationId, content);

      if (res.error) {
        setSendError(res.error);
        // Remove optimistic message if sending failed
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else if (res.message) {
        const savedMsg = res.message;
        // Replace optimistic message with actual DB record
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m))
        );
      }
    },
    [conversationId, currentUserId]
  );

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Conversation Header */}
      <ChatHeader otherUser={otherUser} />

      {/* Error alert if sending failed */}
      {sendError && (
        <div className="px-4 py-2 bg-rose-50 text-rose-700 text-xs font-medium border-b border-rose-200">
          {sendError}
        </div>
      )}

      {/* Message List */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        otherUser={otherUser}
      />

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}
