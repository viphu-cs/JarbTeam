'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const t = useTranslations('chat');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSending || disabled) return;

    setIsSending(true);
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage(trimmed);
    } finally {
      setIsSending(false);
      // Refocus textarea after sending
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = content.trim().length > 0 && !isSending && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 bg-white border-t border-[#E2E8F0] flex items-end gap-2 shrink-0"
    >
      <div className="flex-1 relative rounded-2xl bg-[#FAF9F6] border border-[#E2E8F0] focus-within:border-[#7CA5B8] focus-within:ring-2 focus-within:ring-[#7CA5B8]/20 transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('typeMessage')}
          rows={1}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 resize-none max-h-32 text-[#0F172A] placeholder:text-[#94A3B8] leading-relaxed"
        />
      </div>

      <button
        type="submit"
        disabled={!canSend}
        aria-label={t('send')}
        className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl transition-all shrink-0 cursor-pointer ${
          canSend
            ? 'bg-[#0B3B4B] text-white hover:bg-[#134e62] shadow-xs active:scale-95'
            : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
        }`}
      >
        {isSending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4 -ml-0.5" />
        )}
      </button>
    </form>
  );
}
