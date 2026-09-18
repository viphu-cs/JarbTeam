'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getOrCreateDirectConversationAction } from '@/actions/chat';

interface MessageUserButtonProps {
  targetUserId: string;
  className?: string;
}

export function MessageUserButton({
  targetUserId,
  className,
}: MessageUserButtonProps) {
  const t = useTranslations('chat');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const res = await getOrCreateDirectConversationAction(targetUserId);
      if (res.error) {
        setError(res.error);
      } else if (res.conversationId) {
        router.push(`/messages/${res.conversationId}`);
      }
    });
  };

  return (
    <div className="flex flex-col items-end">
      <Button
        variant="primary"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className={`cursor-pointer shadow-xs ${className || ''}`}
      >
        {isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            <span>{t('sending')}</span>
          </>
        ) : (
          <>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('messageButton')}</span>
          </>
        )}
      </Button>
      {error && <span className="text-[11px] text-rose-500 mt-1">{error}</span>}
    </div>
  );
}
