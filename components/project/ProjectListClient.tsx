'use client';

import React, { useState, useMemo } from 'react';
import { Project, ProjectType, WorkStyle, Skill } from '@/types';
import { ProjectCard } from '@/components/project/ProjectCard';
import { Button } from '@/components/ui/Button';
import { Search, Filter, X, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getProjectTypeLabel, getWorkStyleLabel } from '@/lib/utils/labels';

interface ProjectListClientProps {
  initialProjects: Project[];
  availableSkills: Skill[];
  hasUser: boolean;
}

const PROJECT_TYPES: (ProjectType | 'All')[] = [
  'All',
  'Course Project',
  'Competition',
  'Hackathon',
  'Innovation',
  'Startup',
  'Other',
];

const WORK_STYLES: (WorkStyle | 'All')[] = ['All', 'Online', 'On-site', 'Hybrid'];

export function ProjectListClient({
  initialProjects,
  availableSkills,
  hasUser,
}: ProjectListClientProps) {
  const tProjects = useTranslations('projects');
  const tCommon = useTranslations('common');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ProjectType | 'All'>('All');
  const [selectedWorkStyle, setSelectedWorkStyle] = useState<WorkStyle | 'All'>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [sortByRelevance, setSortByRelevance] = useState<boolean>(hasUser);

  const filteredProjects = useMemo(() => {
    let result = [...initialProjects];

    // 1. Text Search (name & description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // 2. Project Type Filter
    if (selectedType !== 'All') {
      result = result.filter((p) => p.project_type === selectedType);
    }

    // 3. Work Style Filter
    if (selectedWorkStyle !== 'All') {
      result = result.filter((p) => p.work_style === selectedWorkStyle);
    }

    // 4. Skill Filter
    if (selectedSkill !== 'All') {
      result = result.filter((p) =>
        p.skills?.some(
          (s) => s.name.toLowerCase() === selectedSkill.toLowerCase()
        )
      );
    }

    // 5. Sorting: Relevance (Match score) vs Newest
    if (sortByRelevance && hasUser) {
      result.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    } else {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [
    initialProjects,
    searchQuery,
    selectedType,
    selectedWorkStyle,
    selectedSkill,
    sortByRelevance,
    hasUser,
  ]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedType !== 'All' ||
    selectedWorkStyle !== 'All' ||
    selectedSkill !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('All');
    setSelectedWorkStyle('All');
    setSelectedSkill('All');
  };

  return (
    <div className="space-y-6">
      {/* Search & Sort Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E2E8F0] space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={tProjects('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F6] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#7CA5B8] focus:ring-3 focus:ring-[#D4E6F1] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {hasUser && (
            <button
              onClick={() => setSortByRelevance(!sortByRelevance)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 cursor-pointer ${
                sortByRelevance
                  ? 'bg-[#D4E6F1] text-[#0B3B4B] border-[#BEE3F8]'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#FAF9F6]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#3b6475]" />
              <span>{tProjects('sortByMatch')}</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
          {/* Project Type Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-[#64748B] shrink-0">
              {tProjects('filterType')}
            </span>
            {PROJECT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                  selectedType === type
                    ? 'bg-[#D4E6F1] text-[#0B3B4B] border-[#BEE3F8]'
                    : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#FAF9F6]'
                }`}
              >
                {type === 'All' ? tProjects('all') : getProjectTypeLabel(tCommon, type)}
              </button>
            ))}
          </div>

          {/* Work Style & Skill Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#64748B]">
                {tProjects('filterWorkStyle')}
              </span>
              <select
                value={selectedWorkStyle}
                onChange={(e) =>
                  setSelectedWorkStyle(e.target.value as WorkStyle | 'All')
                }
                className="px-2.5 py-1 text-xs bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#7CA5B8]"
              >
                {WORK_STYLES.map((ws) => (
                  <option key={ws} value={ws}>
                    {ws === 'All' ? tProjects('all') : getWorkStyleLabel(tCommon, ws)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#64748B]">
                {tProjects('filterSkill')}
              </span>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="px-2.5 py-1 text-xs bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#7CA5B8] max-w-[160px]"
              >
                <option value="All">{tProjects('allSkills')}</option>
                {availableSkills.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 ml-auto cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                {tProjects('resetFilters')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-[#64748B]">
          {tProjects('showingCount', { count: filteredProjects.length })}
        </p>
      </div>

      {/* Grid of Projects */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              hasUser={hasUser}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#E2E8F0]">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#3F1E8C] mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">
            {tProjects('noProjectsFound')}
          </h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            {tProjects('noProjectsFoundDesc')}
          </p>
          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetFilters}
              className="mt-4"
            >
              {tProjects('clearFilters')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
