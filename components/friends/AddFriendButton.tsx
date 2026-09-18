'use client';

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { StudentFriendshipStatus } from '@/types';
import {
  sendFriendRequestAction,
  respondFriendRequestAction,
  cancelFriendRequestAction,
} from '@/actions/friends';
import { UserPlus, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AddFriendButtonProps {
  targetUserId: string;
  initialStatus: StudentFriendshipStatus;
  friendshipId?: string;
}

export function AddFriendButton({
  targetUserId,
  initialStatus,
  friendshipId: initialFriendshipId,
}: AddFriendButtonProps) {
  const t = useTranslations('friends');
  const [status, setStatus] = useState<StudentFriendshipStatus>(initialStatus);
  const [friendshipId, setFriendshipId] = useState<string | undefined>(initialFriendshipId);
  const [isPending, startTransition] = useTransition();

  const handleSendRequest = () => {
    startTransition(async () => {
      setStatus('pending_sent');
      const res = await sendFriendRequestAction(targetUserId);
      if (res.error) {
        setStatus('none');
      } else if (res.friendshipId) {
        setFriendshipId(res.friendshipId);
      }
    });
  };

  const handleCancelRequest = () => {
    if (!friendshipId) return;
    startTransition(async () => {
      setStatus('none');
      const res = await cancelFriendRequestAction(friendshipId);
      if (res.error) {
        setStatus('pending_sent');
      } else {
        setFriendshipId(undefined);
      }
    });
  };

  const handleAcceptRequest = () => {
    if (!friendshipId) return;
    startTransition(async () => {
      setStatus('friends');
      const res = await respondFriendRequestAction(friendshipId, 'accept');
      if (res.error) {
        setStatus('pending_received');
      }
    });
  };

  if (status === 'friends') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold border border-[#BBF7D0]">
        <Check className="w-3.5 h-3.5 text-[#14532D]" />
        <span>{t('friends')}</span>
      </div>
    );
  }

  if (status === 'pending_sent') {
    return (
      <button
        onClick={handleCancelRequest}
        disabled={isPending}
        title={t('cancel')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF3C7] text-[#B45309] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-semibold border border-[#FDE68A] transition-all cursor-pointer group"
      >
        <Clock className="w-3.5 h-3.5 group-hover:hidden" />
        <span className="group-hover:hidden">{t('pendingSent')}</span>
        <span className="hidden group-hover:inline">{t('cancel')}</span>
      </button>
    );
  }

  if (status === 'pending_received') {
    return (
      <Button
        variant="accent"
        size="sm"
        disabled={isPending}
        onClick={handleAcceptRequest}
        className="cursor-pointer text-xs"
      >
        <Check className="w-3.5 h-3.5 mr-1" />
        <span>{t('accept')}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={handleSendRequest}
      className="cursor-pointer text-xs"
    >
      <UserPlus className="w-3.5 h-3.5 mr-1 text-[#0B3B4B]" />
      <span>{t('addFriend')}</span>
    </Button>
  );
}
