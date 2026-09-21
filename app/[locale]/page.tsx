import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FolderPlus,
  Compass,
  ArrowRight,
  Users,
  FolderKanban,
  Inbox,
  UserPlus,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getProjectTypeLabel } from '@/lib/utils/labels';
import Image from 'next/image';
import { ProjectPlaceholder } from '@/components/project/ProjectPlaceholder';
import { ProjectType, WorkStyle } from '@/types';

interface OpenProjectItem {
  id: string;
  name: string;
  description: string;
  project_type: ProjectType;
  team_size: number;
  image_url?: string | null;
  work_style?: WorkStyle;
  created_at: string;
  project_skills?: {
    skills: {
      id: string;
      name: string;
    } | null;
  }[];
  project_members?: {
    id: string;
  }[];
}

export const revalidate = 60;

export default async function HomePage() {
  const t = await getTranslations('home');
  const tCommon = await getTranslations('common');
  const supabase = await createClient();

  // 1. Fetch count of open projects
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  // 2. Fetch 3 open projects for Section 1
  const { data: openProjectsData } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      project_type,
      team_size,
      image_url,
      work_style,
      created_at,
      project_skills (
        skills (id, name)
      ),
      project_members (
        id
      )
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(3);

  // 3. User session & User Activity (for Section 3)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myProjectsCount = 0;
  let pendingRequestsCount = 0;
  let invitationsCount = 0;

  if (user) {
    const [{ count: ownedCount }, { count: memberCount }] = await Promise.all([
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id),
      supabase
        .from('project_members')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id),
    ]);
    myProjectsCount = (ownedCount || 0) + (memberCount || 0);

    const { data: myOwned } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', user.id);
    const ownedIds = (myOwned || []).map((p) => p.id);

    const [{ count: incomingPendingCount }, { count: sentPendingCount }] = await Promise.all([
      ownedIds.length > 0
        ? supabase
            .from('join_requests')
            .select('*', { count: 'exact', head: true })
            .in('project_id', ownedIds)
            .eq('status', 'pending')
        : Promise.resolve({ count: 0 }),
      supabase
        .from('join_requests')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .eq('status', 'pending'),
    ]);
    pendingRequestsCount = (incomingPendingCount || 0) + (sentPendingCount || 0);

    const { count: pendingFriendsCount } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'pending');
    invitationsCount = pendingFriendsCount || 0;
  }

  const openProjects: OpenProjectItem[] =
    (openProjectsData as unknown as OpenProjectItem[]) || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 space-y-20 sm:space-y-28">
      {/* ============================================================ */}
      {/* EXISTING HERO — PRESERVED AS THE PRIMARY FOCUS */}
      {/* ============================================================ */}
      <div>
        {/* Minimal Academic Hero */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#0F172A] leading-snug sm:leading-tight">
            {t('titleLine1')}
            <br />
            <span className="text-[#3b6475]">{t('titleLine2')}</span>
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] max-w-lg mx-auto">
            {t('subtitle')}
          </p>

          {projectCount !== null && projectCount > 0 && (
            <p className="text-xs text-[#64748B] pt-1">
              {t('activeProjectsCount', { count: projectCount })}
            </p>
          )}
        </div>

        {/* The Two Major Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto w-full">
          {/* ACTION 1: CREATE PROJECT */}
          <div className="rounded-[28px] p-7 sm:p-8 bg-gradient-to-br from-[#E8F1F5] to-[#D4E6F1] border border-[#BEE3F8] shadow-[0_4px_24px_rgba(124,165,184,0.12)] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/90 text-[#0B3B4B] flex items-center justify-center border border-[#BEE3F8] shadow-xs">
                <FolderPlus className="w-6 h-6 text-[#3b6475]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#3b6475]">
                  {t('createTag')}
                </span>
                <h2 className="text-2xl font-bold text-[#0F172A] mt-1">
                  {t('createTitle')}
                </h2>
              </div>

              <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-line">
                {t('createDesc')}
              </p>
            </div>

            <div className="mt-8 pt-4">
              <Link href="/projects/create" className="block">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="bg-white hover:bg-[#FAF9F6] text-[#0F172A] border-white/80 shadow-xs font-semibold"
                >
                  <span>{t('createButton')}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* ACTION 2: JOIN PROJECT */}
          <div className="rounded-[28px] p-7 sm:p-8 bg-gradient-to-br from-[#EDE9FE] to-[#E0E7FF] border border-[#DDD6FE] shadow-[0_4px_24px_rgba(167,139,250,0.12)] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/90 text-[#3F1E8C] flex items-center justify-center border border-[#DDD6FE] shadow-xs">
                <Compass className="w-6 h-6 text-[#674bb5]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#674bb5]">
                  {t('joinTag')}
                </span>
                <h2 className="text-2xl font-bold text-[#0F172A] mt-1">
                  {t('joinTitle')}
                </h2>
              </div>

              <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-line">
                {t('joinDesc')}
              </p>
            </div>

            <div className="mt-8 pt-4">
              <Link href="/projects" className="block">
                <Button
                  variant="accent"
                  size="lg"
                  fullWidth
                  className="bg-white hover:bg-[#FAF9F6] text-[#0F172A] border-white/80 shadow-xs font-semibold"
                >
                  <span>{t('joinButton')}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1 — OPEN PROJECTS */}
      {/* ============================================================ */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
              {t('openProjectsTitle')}
            </h2>
            <p className="text-sm text-[#64748B] mt-1.5">
              {t('openProjectsSubtitle')}
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B3B4B] hover:text-[#3b6475] transition-colors shrink-0"
          >
            <span>{t('viewAllProjects')}</span>
          </Link>
        </div>

        {openProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {openProjects.map((project) => {
              const skills =
                project.project_skills
                  ?.map((ps) => ps.skills)
                  .filter((s): s is { id: string; name: string } => Boolean(s)) || [];
              const memberCount = project.project_members?.length || 1;
              const availablePositions = Math.max(1, project.team_size - memberCount);

              return (
                <div
                  key={project.id}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#BEE3F8] hover:shadow-[0_4px_20px_rgba(124,165,184,0.1)] transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Project Cover Image */}
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-3.5 border border-[#E2E8F0]/70 bg-[#FAF9F6]">
                      {project.image_url ? (
                        <Image
                          src={project.image_url}
                          alt={project.name}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <ProjectPlaceholder name={project.name} type={project.project_type} />
                      )}
                    </div>

                    {/* Category & Available Positions */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <Badge variant="blue" size="sm">
                        {getProjectTypeLabel(tCommon, project.project_type)}
                      </Badge>
                      <span className="inline-flex items-center text-[11px] font-medium text-[#0B3B4B] bg-[#E8F1F5] px-2.5 py-0.5 rounded-full">
                        {t('positions', { count: availablePositions })}
                      </span>
                    </div>

                    {/* Project Title */}
                    <h3 className="font-bold text-base text-[#0F172A] group-hover:text-[#3b6475] transition-colors line-clamp-1">
                      {project.name}
                    </h3>

                    {/* Short Description */}
                    <p className="text-xs text-[#475569] mt-2 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Required Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3.5">
                        {skills.slice(0, 3).map((skill: { id: string; name: string }) => (
                          <Badge key={skill.id} variant="blue" size="sm">
                            {skill.name}
                          </Badge>
                        ))}
                        {skills.length > 3 && (
                          <span className="text-[11px] text-[#64748B] self-center">
                            +{skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Small "ดูโปรเจกต์" Action */}
                  <div className="mt-5 pt-3.5 border-t border-[#F1F5F9]">
                    <Link href={`/projects/${project.id}`} className="block">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        className="group-hover:bg-[#D4E6F1] group-hover:border-[#BEE3F8] group-hover:text-[#0B3B4B] transition-all"
                      >
                        <span>{t('viewProject')}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl text-xs text-[#64748B]">
            {t('noOpenProjects')}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SECTION 2 — HOW IT WORKS */}
      {/* ============================================================ */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
            {t('howItWorksTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 relative hover:border-[#CBD5E1] transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#7CA5B8] tracking-wider uppercase">01</span>
              <div className="w-10 h-10 rounded-xl bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center border border-[#D4E6F1]">
                <FolderPlus className="w-5 h-5 text-[#3b6475]" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1.5">
              {t('step1Title')}
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {t('step1Desc')}
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 relative hover:border-[#CBD5E1] transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#A78BFA] tracking-wider uppercase">02</span>
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#3F1E8C] flex items-center justify-center border border-[#DDD6FE]">
                <Compass className="w-5 h-5 text-[#674bb5]" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1.5">
              {t('step2Title')}
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {t('step2Desc')}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 relative hover:border-[#CBD5E1] transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#F472B6] tracking-wider uppercase">03</span>
              <div className="w-10 h-10 rounded-xl bg-[#FCE7F3] text-[#831843] flex items-center justify-center border border-[#FBCFE8]">
                <Users className="w-5 h-5 text-[#be185d]" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1.5">
              {t('step3Title')}
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {t('step3Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3 — USER ACTIVITY (ONLY FOR LOGGED-IN USERS) */}
      {/* ============================================================ */}
      {user && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
              {t('userActivityTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* My Projects */}
            <Link
              href="/my-projects"
              className="bg-white border border-[#E2E8F0] hover:border-[#BEE3F8] rounded-2xl p-4.5 flex items-center gap-4 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center shrink-0 border border-[#D4E6F1] group-hover:bg-[#D4E6F1] transition-colors">
                <FolderKanban className="w-5 h-5 text-[#3b6475]" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-medium text-[#64748B]">
                  {t('myProjects')}
                </span>
                <span className="block text-base font-bold text-[#0F172A] tracking-tight truncate">
                  {t('projectsCount', { count: myProjectsCount })}
                </span>
              </div>
            </Link>

            {/* Join Requests */}
            <Link
              href="/join-requests"
              className="bg-white border border-[#E2E8F0] hover:border-[#DDD6FE] rounded-2xl p-4.5 flex items-center gap-4 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#3F1E8C] flex items-center justify-center shrink-0 border border-[#DDD6FE] group-hover:bg-[#DDD6FE] transition-colors">
                <Inbox className="w-5 h-5 text-[#674bb5]" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-medium text-[#64748B]">
                  {t('joinRequests')}
                </span>
                <span className="block text-base font-bold text-[#0F172A] tracking-tight truncate">
                  {t('pendingRequestsCount', { count: pendingRequestsCount })}
                </span>
              </div>
            </Link>

            {/* Invitations */}
            <Link
              href="/messages"
              className="bg-white border border-[#E2E8F0] hover:border-[#FBCFE8] rounded-2xl p-4.5 flex items-center gap-4 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#FCE7F3] text-[#831843] flex items-center justify-center shrink-0 border border-[#FBCFE8] group-hover:bg-[#FBCFE8] transition-colors">
                <UserPlus className="w-5 h-5 text-[#be185d]" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-medium text-[#64748B]">
                  {t('invitations')}
                </span>
                <span className="block text-base font-bold text-[#0F172A] tracking-tight truncate">
                  {invitationsCount > 0
                    ? t('newInvitationsCount', { count: invitationsCount })
                    : t('noNewInvitations')}
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
