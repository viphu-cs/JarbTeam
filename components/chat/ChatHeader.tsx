import React from 'react';
import { Link } from '@/i18n/routing';
import { Profile } from '@/types';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import { getInitials } from '@/lib/supabase/storage';
import { useTranslations } from 'next-intl';

interface ChatHeaderProps {
  otherUser?: Profile;
  backHref?: string;
}

export function ChatHeader({ otherUser, backHref = '/messages' }: ChatHeaderProps) {
  const t = useTranslations('chat');

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E2E8F0] shadow-xs shrink-0">
      <div className="flex items-center gap-3">
        {/* Back Button */}
        <Link
          href={backHref}
          className="p-1.5 -ml-1 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors"
          title={t('back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* User Avatar */}
        <Link
          href={otherUser?.id ? `/profile?id=${otherUser.id}` : '#'}
          className="flex items-center gap-3 group"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#D4E6F1] text-[#0B3B4B] flex items-center justify-center font-bold text-xs border border-[#BEE3F8] shrink-0 shadow-xs">
            {otherUser?.avatar_url ? (
              <Image
                src={otherUser.avatar_url}
                alt={otherUser.full_name || 'User'}
                fill
                className="object-cover rounded-full"
                sizes="40px"
              />
            ) : (
              <span>{getInitials(otherUser?.full_name)}</span>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#3b6475] transition-colors leading-tight line-clamp-1">
              {otherUser?.full_name || 'Student'}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-0.5">
              {otherUser?.university && (
                <span className="flex items-center gap-1 line-clamp-1">
                  <GraduationCap className="w-3 h-3 text-[#7CA5B8] shrink-0" />
                  <span>{otherUser.university}</span>
                </span>
              )}
              {otherUser?.university && otherUser?.major && <span>•</span>}
              {otherUser?.major && <span className="line-clamp-1">{otherUser.major}</span>}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
