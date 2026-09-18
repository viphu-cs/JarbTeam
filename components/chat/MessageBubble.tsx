import React from 'react';
import { Message } from '@/types';
import { formatMessageTime } from '@/lib/utils/format';
import { useLocale } from 'next-intl';
import { Clock } from 'lucide-react';

interface MessageBubbleProps {
  message: Message & { isOptimistic?: boolean };
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const locale = useLocale();
  const timeFormatted = formatMessageTime(message.created_at, locale);

  return (
    <div
      className={`flex flex-col ${
        isCurrentUser ? 'items-end' : 'items-start'
      } my-1.5 px-4`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words transition-all shadow-xs ${
          isCurrentUser
            ? 'bg-[#0B3B4B] text-white rounded-br-xs'
            : 'bg-white text-[#0F172A] border border-[#E2E8F0] rounded-bl-xs'
        } ${message.isOptimistic ? 'opacity-70' : 'opacity-100'}`}
      >
        {message.content}
      </div>

      <div
        className={`flex items-center gap-1 mt-1 text-[11px] text-[#94A3B8] px-1 ${
          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
        }`}
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
