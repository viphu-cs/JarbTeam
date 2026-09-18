'use client';

import React from 'react';
import { Profile } from '@/types';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { getInitials } from '@/lib/supabase/storage';
import { Crown, GraduationCap, X, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ProjectMemberItem {
  user_id: string;
  role: string;
  profile: Profile;
}

interface ProjectMemberListProps {
  members: ProjectMemberItem[];
  currentUserId: string;
  onClose?: () => void;
}

export function ProjectMemberList({
  members,
  currentUserId,
  onClose,
}: ProjectMemberListProps) {
  const t = useTranslations('chat');

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#E2E8F0]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#F1F5F9] shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0B3B4B]" />
          <h3 className="text-sm font-bold text-[#0F172A]">
            {t('projectMembers')}
          </h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F1F5] text-[#0B3B4B]">
            {members.length}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-[#F8FAFC]">
        {members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId;
          const isLead =
            member.role === 'Project Lead' ||
            member.role?.toLowerCase().includes('lead') ||
            member.role?.toLowerCase().includes('owner');

          return (
            <Link
              key={member.user_id}
              href={`/profile?id=${member.user_id}`}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF9F6] transition-colors group cursor-pointer pt-2.5 first:pt-2"
            >
              {/* Avatar */}
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[#D4E6F1] text-[#0B3B4B] flex items-center justify-center font-bold text-xs border border-[#BEE3F8] shrink-0 shadow-2xs">
                {member.profile?.avatar_url ? (
                  <Image
                    src={member.profile.avatar_url}
                    alt={member.profile.full_name || 'Member'}
                    fill
                    className="object-cover rounded-full"
                    sizes="36px"
                  />
                ) : (
                  <span>{getInitials(member.profile?.full_name)}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#3b6475] transition-colors truncate">
                    {member.profile?.full_name || 'Student'}
                  </span>
                  {isCurrentUser && (
                    <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-sm shrink-0">
                      {t('you')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  {isLead ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded-full">
                      <Crown className="w-2.5 h-2.5 shrink-0" />
                      <span>{t('projectLead')}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-[#0369A1] bg-[#E0F2FE] px-1.5 py-0.5 rounded-full truncate">
                      {member.role || t('member')}
                    </span>
                  )}
                </div>

                {member.profile?.university && (
                  <div className="flex items-center gap-1 text-[10px] text-[#94A3B8] mt-1 truncate">
                    <GraduationCap className="w-2.5 h-2.5 shrink-0 text-[#94A3B8]" />
                    <span className="truncate">{member.profile.university}</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
