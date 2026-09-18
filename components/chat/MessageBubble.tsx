import React from 'react';
import { Message } from '@/types';
import { formatMessageTime } from '@/lib/utils/format';
import { useLocale } from 'next-intl';
import { Clock } from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message & { isOptimistic?: boolean };
  isCurrentUser: boolean;
  showSenderInfo?: boolean;
}

export function MessageBubble({
  message,
  isCurrentUser,
  showSenderInfo = false,
}: MessageBubbleProps) {
  const locale = useLocale();
  const timeFormatted = formatMessageTime(message.created_at, locale);

  const senderName = message.sender?.full_name || 'Member';
  const senderAvatar = message.sender?.avatar_url;
  const initials = senderName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'M';

  return (
    <div
      className={`flex flex-col ${
        isCurrentUser ? 'items-end' : 'items-start'
      } my-1.5 px-4`}
    >
      <div
        className={`flex items-end gap-2 max-w-[88%] sm:max-w-[75%] ${
          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Sender Avatar for Group Chat */}
        {showSenderInfo && !isCurrentUser && (
          <div className="relative w-7 h-7 rounded-full overflow-hidden bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center font-bold text-[11px] border border-[#D4E6F1] shrink-0 mb-1 shadow-2xs">
            {senderAvatar ? (
              <Image
                src={senderAvatar}
                alt={senderName}
                fill
                className="object-cover"
                sizes="28px"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        )}

        <div className="flex flex-col">
          {/* Sender Name for Group Chat */}
          {showSenderInfo && !isCurrentUser && (
            <span className="text-[11px] font-semibold text-[#64748B] mb-1 px-1">
              {senderName}
            </span>
          )}

          {/* Bubble */}
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words transition-all shadow-xs ${
              isCurrentUser
                ? 'bg-[#0B3B4B] text-white rounded-br-xs'
                : 'bg-white text-[#0F172A] border border-[#E2E8F0] rounded-bl-xs'
            } ${message.isOptimistic ? 'opacity-70' : 'opacity-100'}`}
          >
            {message.content}
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-1 mt-1 text-[11px] text-[#94A3B8] px-1 ${
          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
        } ${showSenderInfo && !isCurrentUser ? 'ml-9' : ''}`}
      >
        {message.isOptimistic ? (
          <span className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
            <Clock className="w-2.5 h-2.5 animate-spin" />
            <span>...</span>
          </span>
        ) : (
          <span>{timeFormatted}</span>
        )}
      </div>
    </div>
  );
}

