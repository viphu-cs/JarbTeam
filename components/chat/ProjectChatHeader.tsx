'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { Project } from '@/types';
import { ArrowLeft, Users, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getProjectTypeLabel, CommonTranslationFn } from '@/lib/utils/labels';
import { Button } from '@/components/ui/Button';

interface ProjectChatHeaderProps {
  project: Project;
  memberCount: number;
  onToggleMemberList?: () => void;
  isMemberListOpen?: boolean;
  backHref?: string;
}

export function ProjectChatHeader({
  project,
  memberCount,
  onToggleMemberList,
  isMemberListOpen = false,
  backHref,
}: ProjectChatHeaderProps) {
  const t = useTranslations('chat');
  const tCommon = useTranslations('common');
  const defaultBackHref = backHref || `/projects/${project.id}`;

  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-white border-b border-[#E2E8F0] shadow-xs shrink-0 gap-2">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Back Button */}
        <Link
          href={defaultBackHref}
          className="p-1.5 -ml-1 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors shrink-0"
          title={t('back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Project Cover / Icon */}
        <Link
          href={`/projects/${project.id}`}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 group"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center font-bold text-xs border border-[#D4E6F1] shrink-0 shadow-xs">
            {project.image_url ? (
              <Image
                src={project.image_url}
                alt={project.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <Users className="w-5 h-5 text-[#0B3B4B]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-[#0F172A] group-hover:text-[#3b6475] transition-colors leading-tight truncate">
                {project.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
              <span className="text-[11px] font-medium text-[#0B3B4B] bg-[#E8F1F5] px-1.5 py-0.2 rounded-sm shrink-0">
                {getProjectTypeLabel(tCommon as unknown as CommonTranslationFn, project.project_type)}
              </span>
              <span className="text-[#CBD5E1]">•</span>
              <span className="flex items-center gap-1 text-[11px] text-[#64748B]">
                <Users className="w-3 h-3 text-[#7CA5B8] shrink-0" />
                <span>{t('membersCount', { count: memberCount })}</span>
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* View Project Button */}
        <Link href={`/projects/${project.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex text-xs h-8 px-2.5 text-[#64748B] hover:text-[#0B3B4B] cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" />
            <span>{t('viewProject')}</span>
          </Button>
        </Link>

        {/* Member List Toggle Button */}
        {onToggleMemberList && (
          <button
            onClick={onToggleMemberList}
            className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs ${
              isMemberListOpen
                ? 'bg-[#E8F1F5] text-[#0B3B4B] border-[#D4E6F1]'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] border-transparent'
            }`}
            title={t('projectMembers')}
          >
            <Users className="w-4 h-4" />
            <span className="font-semibold">{memberCount}</span>
          </button>
        )}
      </div>
    </div>
  );
}
