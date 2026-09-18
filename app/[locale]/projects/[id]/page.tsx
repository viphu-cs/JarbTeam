import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { calculateMatchScore } from '@/lib/matching';
import { Project, Profile, ProjectMember } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { JoinRequestDialog } from '@/components/project/JoinRequestDialog';
import { getTranslations, getLocale } from 'next-intl/server';
import { formatDate } from '@/lib/utils/format';
import { getProjectTypeLabel, getWorkStyleLabel, getStatusLabel } from '@/lib/utils/labels';
import Image from 'next/image';
import { ProjectPlaceholder } from '@/components/project/ProjectPlaceholder';
import { getInitials } from '@/lib/supabase/storage';
import {
  Users,
  Calendar,
  Clock,
  Laptop,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Inbox,
} from 'lucide-react';

export const revalidate = 0;

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const tDetail = await getTranslations('projectDetail');
  const tCommon = await getTranslations('common');
  const tProjects = await getTranslations('projects');
  const locale = await getLocale();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch Project with owner, skills, and members
  const { data: projectData, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey (*),
      project_skills (
        skills (id, name)
      ),
      project_members (
        id,
        project_id,
        profile_id,
        role,
        joined_at,
        status,
        profile:profiles (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !projectData) {
    notFound();
  }

  // 2. Fetch current user's profile if logged in
  let userProfile: Profile | null = null;
  let isOwner = false;
  let isMember = false;
  let hasPendingRequest = false;

  if (user) {
    isOwner = user.id === projectData.owner_id;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      const { data: uSkills } = await supabase
        .from('profile_skills')
        .select('skills (id, name)')
        .eq('profile_id', user.id);

      const { data: uInterests } = await supabase
        .from('profile_interests')
        .select('interests (id, name)')
        .eq('profile_id', user.id);

      const rawSkills = (uSkills || []) as unknown as Array<{ skills: { id: string; name: string } | null }>;
      const rawInterests = (uInterests || []) as unknown as Array<{ interests: { id: string; name: string } | null }>;

      userProfile = {
        ...profileData,
        skills: rawSkills
          .map((s) => s.skills)
          .filter((s): s is { id: string; name: string } => Boolean(s)),
        interests: rawInterests
          .map((i) => i.interests)
          .filter((i): i is { id: string; name: string } => Boolean(i)),
      };
    }

    // Check membership
    isMember = (projectData.project_members || []).some(
      (m: { profile_id: string }) => m.profile_id === user.id
    );

    // Check pending join request
    const { data: pendingReq } = await supabase
      .from('join_requests')
      .select('id')
      .eq('project_id', id)
      .eq('profile_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    hasPendingRequest = !!pendingReq;
  }

  // Map Project
  const rawProjectSkills = (projectData.project_skills || []) as unknown as Array<{ skills: { id: string; name: string } | null }>;
  const skills = rawProjectSkills
    .map((ps) => ps.skills)
    .filter((s): s is { id: string; name: string } => Boolean(s));

  const rawMembers = (projectData.project_members as unknown as ProjectMember[]) || [];
  const hasOwnerInMembers = rawMembers.some((m) => m.profile_id === projectData.owner_id);
  const members: ProjectMember[] = hasOwnerInMembers
    ? rawMembers
    : [
        {
          id: `owner-${projectData.owner_id}`,
          project_id: projectData.id,
          profile_id: projectData.owner_id,
          role: 'Project Lead',
          joined_at: projectData.created_at,
          status: 'active',
          profile: projectData.owner,
        },
        ...rawMembers,
      ];

  const project: Project = {
    ...projectData,
    skills,
    members,
  };

  // Compute Match Score & Breakdown
  const matchResult = userProfile ? calculateMatchScore(userProfile, project) : null;

  const currentMembersCount = members.length;
  const isFull = currentMembersCount >= project.team_size;
  const isClosed = project.status === 'closed' || project.status === 'completed';

  // Format deadline
  const deadlineText = project.deadline
    ? formatDate(project.deadline, locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : tDetail('notSpecified');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Back Button */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {tDetail('backToExplore')}
      </Link>

      {/* Large Project Cover Image (16:9 / responsive banner) */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-xs bg-[#FAF9F6]">
        {project.image_url ? (
          <Image
            src={project.image_url}
            alt={project.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 896px"
          />
        ) : (
          <ProjectPlaceholder name={project.name} type={project.project_type} className="h-full" />
        )}
      </div>

      {/* Main Project Header Card */}
      <Card className="bg-white border-[#E2E8F0] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="blue">
                {getProjectTypeLabel(tCommon, project.project_type)}
              </Badge>
              <Badge
                variant={
                  project.status === 'open'
                    ? 'green'
                    : project.status === 'in_progress'
                    ? 'yellow'
                    : 'gray'
                }
              >
                {getStatusLabel(tCommon, project.status)}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              {project.name}
            </h1>

            {project.owner && (
              <div className="flex items-center gap-2 pt-1">
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-[#D4E6F1] text-[#0B3B4B] flex items-center justify-center font-bold text-[10px] border border-[#BEE3F8] shrink-0 shadow-xs">
                  {project.owner.avatar_url ? (
                    <Image
                      src={project.owner.avatar_url}
                      alt={project.owner.full_name || 'Project Lead'}
                      fill
                      className="object-cover rounded-full"
                      sizes="24px"
                    />
                  ) : (
                    <span>{getInitials(project.owner.full_name)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <span className="font-medium text-[#0F172A]">
                    {project.owner.full_name}
                  </span>
                  {project.owner.university && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-[#7CA5B8]" />
                        {project.owner.university}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action CTA depending on user state */}
          <div className="shrink-0">
            {isOwner ? (
              <Link href="/join-requests">
                <Button variant="accent" size="sm" className="shadow-xs cursor-pointer">
                  <Inbox className="w-4 h-4 mr-1.5" />
                  {tDetail('manageRequests')}
                </Button>
              </Link>
            ) : isMember ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold border border-[#BBF7D0]">
                <CheckCircle2 className="w-4 h-4" />
                {tDetail('youAreOnTeam')}
              </div>
            ) : hasPendingRequest ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#FEF9C3] text-[#713F12] text-xs font-semibold border border-[#FEF08A]">
                <Clock className="w-4 h-4" />
                {tDetail('requestPending')}
              </div>
            ) : isClosed ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#F1F5F9] text-[#475569] text-xs font-semibold border border-[#E2E8F0]">
                {tDetail('projectClosed')}
              </div>
            ) : isFull ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {tDetail('teamFull', { current: currentMembersCount, total: project.team_size })}
              </div>
            ) : user ? (
              <JoinRequestDialog
                projectId={project.id}
                projectName={project.name}
                requiredRoles={project.required_roles || []}
              />
            ) : (
              <Link href={`/login?redirectedFrom=/projects/${project.id}`}>
                <Button variant="primary" size="md" className="cursor-pointer">
                  {tDetail('loginToJoin')}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Project Key Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-[#F1F5F9] text-xs">
          <div>
            <span className="text-[#64748B] block mb-1">{tDetail('teamCapacity')}</span>
            <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#7CA5B8]" />
              {tDetail('filled', { current: currentMembersCount, total: project.team_size })}
            </span>
          </div>

          <div>
            <span className="text-[#64748B] block mb-1">{tDetail('workStyle')}</span>
            <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-[#A78BFA]" />
              {getWorkStyleLabel(tCommon, project.work_style)}
            </span>
          </div>

          <div>
            <span className="text-[#64748B] block mb-1">{tDetail('duration')}</span>
            <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#F472B6]" />
              {project.duration || tDetail('flexible')}
            </span>
          </div>

          <div>
            <span className="text-[#64748B] block mb-1">{tDetail('applicationDeadline')}</span>
            <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FDE047]" />
              {deadlineText}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="pt-4 space-y-2">
          <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            {tDetail('aboutProject')}
          </h2>
          <p className="text-sm text-[#1E293B] leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>
      </Card>

      {/* "Why This Project Matches You" Section */}
      {userProfile && matchResult && (
        <Card
          variant="lavender"
          className="shadow-xs space-y-3 border-[#E0E7FF]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] text-[#3F1E8C] flex items-center justify-center border border-[#E0E7FF]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  {tDetail('whyMatches')}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {tDetail('whyMatchesSubtitle')}
                </p>
              </div>
            </div>
            <span className="text-base font-bold text-[#3F1E8C] px-3 py-1 bg-white rounded-full border border-[#E0E7FF]">
              {matchResult.totalScore}% {tProjects('match')}
            </span>
          </div>

          {matchResult.reasons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {matchResult.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-2xl border border-[#E0E7FF] text-xs space-y-1"
                >
                  <span className="font-semibold text-[#0F172A] block flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {reason.title}
                  </span>
                  <p className="text-[#64748B] text-[11px] leading-normal">
                    {reason.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#64748B] italic pt-1">
              {tDetail('addMoreSkillsTip')}
            </p>
          )}
        </Card>
      )}

      {/* Skills & Roles Required */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Skills */}
        <Card className="bg-white border-[#E2E8F0] space-y-3">
          <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            {tDetail('requiredSkillsTitle')}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.length > 0 ? (
              skills.map((s) => (
                <Badge key={s.id} variant="blue">
                  {s.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-[#94A3B8] italic">
                {tDetail('noSkillsReq')}
              </span>
            )}
          </div>
        </Card>

        {/* Required Roles */}
        <Card className="bg-white border-[#E2E8F0] space-y-3">
          <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            {tDetail('openRolesTitle')}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {project.required_roles && project.required_roles.length > 0 ? (
              project.required_roles.map((role: string) => (
                <Badge key={role} variant="lavender">
                  {role}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-[#94A3B8] italic">
                {tDetail('openToAllRoles')}
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Team Roster & Project Lead */}
      <Card className="bg-white border-[#E2E8F0] space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2 pb-2 border-b border-[#F1F5F9]">
          <Users className="w-4 h-4 text-[#7CA5B8]" />
          {tDetail('teamRoster')} ({currentMembersCount}/{project.team_size})
        </h2>

        <div className="divide-y divide-[#F1F5F9]">
          {members.map((member) => (
            <div
              key={member.id}
              className="py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#D4E6F1] text-[#0B3B4B] flex items-center justify-center font-bold text-xs border-2 border-[#BEE3F8] shrink-0 shadow-xs">
                  {member.profile?.avatar_url ? (
                    <Image
                      src={member.profile.avatar_url}
                      alt={member.profile?.full_name || 'Member'}
                      fill
                      className="object-cover rounded-full"
                      sizes="40px"
                    />
                  ) : (
                    <span>{getInitials(member.profile?.full_name)}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A]">
                    {member.profile?.full_name || 'Anonymous Student'}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    {member.profile?.university && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-[#7CA5B8]" />
                        {member.profile.university}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Badge
                variant={
                  member.profile_id === project.owner_id ? 'yellow' : 'lavender'
                }
                size="sm"
              >
                {member.profile_id === project.owner_id
                  ? tDetail('leadRole')
                  : (member.role || tDetail('memberRole'))}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
