import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  FolderKanban,
  Users,
  PlusCircle,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import { Project } from '@/types';
import { getTranslations, getLocale } from 'next-intl/server';
import { getProjectTypeLabel, getStatusLabel } from '@/lib/utils/labels';

interface ProjectWithMembers extends Project {
  project_members?: { id: string; role?: string }[];
  memberRole?: string;
  joinedAt?: string;
}

export const revalidate = 0;

export default async function MyProjectsPage() {
  const t = await getTranslations('myProjects');
  const tCommon = await getTranslations('common');
  const tProjects = await getTranslations('projects');
  const locale = await getLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirectedFrom=/${locale}/my-projects`);
  }

  // 1. Fetch Owned Projects
  const { data: ownedProjectsData } = await supabase
    .from('projects')
    .select(`
      *,
      project_skills (
        skills (id, name)
      ),
      project_members (
        id,
        role
      )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const ownedProjects: ProjectWithMembers[] = (ownedProjectsData as unknown as ProjectWithMembers[]) || [];

  // 2. Fetch Joined Projects (where user is member and not owner)
  const { data: memberRowsData } = await supabase
    .from('project_members')
    .select(`
      id,
      role,
      joined_at,
      project:projects (
        id,
        name,
        description,
        project_type,
        owner_id,
        team_size,
        status,
        project_skills (
          skills (id, name)
        ),
        project_members (id)
      )
    `)
    .eq('profile_id', user.id);

  interface MemberRow {
    id: string;
    role: string;
    joined_at: string;
    project: (Project & { project_members?: { id: string }[] }) | null;
  }

  const memberRows = (memberRowsData as unknown as MemberRow[]) || [];

  // Filter out projects owned by user to avoid duplicate display
  const joinedProjects: ProjectWithMembers[] = memberRows
    .filter((m) => m.project && m.project.owner_id !== user.id)
    .map((m) => ({
      ...m.project!,
      memberRole: m.role,
      joinedAt: m.joined_at,
    }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            {t('pageTitle')}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {t('pageSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/join-requests">
            <Button variant="secondary" size="md">
              <Inbox className="w-4 h-4 mr-1" />
              {t('requestsButton')}
            </Button>
          </Link>
          <Link href="/projects/create">
            <Button variant="primary" size="md" className="shadow-xs">
              <PlusCircle className="w-4 h-4 mr-1" />
              {t('createButton')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Section 1: Projects I Own */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-[#7CA5B8]" />
          <h2 className="text-lg font-bold text-[#0F172A]">
            {t('projectsILead')} ({ownedProjects?.length || 0})
          </h2>
        </div>

        {ownedProjects && ownedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ownedProjects.map((project: ProjectWithMembers) => {
              const currentMembers = project.project_members?.length || 1;
              const isFull = currentMembers >= project.team_size;

              return (
                <Card
                  key={project.id}
                  variant="white"
                  className="flex flex-col justify-between p-5 space-y-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="blue" size="sm">
                        {getProjectTypeLabel(tCommon, project.project_type)}
                      </Badge>
                      <Badge
                        variant={project.status === 'open' ? 'green' : 'gray'}
                        size="sm"
                      >
                        {project.status === 'open'
                          ? tCommon('status.recruiting')
                          : getStatusLabel(tCommon, project.status)}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-base text-[#0F172A]">
                      {project.name}
                    </h3>

                    <p className="text-xs text-[#475569] mt-2 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                    <span className="text-xs text-[#64748B] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#7CA5B8]" />
                      <span>
                        {currentMembers}/{project.team_size} {tProjects('members')}
                        {isFull && (
                          <strong className="text-rose-600 ml-1">({tProjects('full')})</strong>
                        )}
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="secondary" size="sm">
                          {t('view')}
                        </Button>
                      </Link>
                      <Link href="/join-requests">
                        <Button variant="accent" size="sm">
                          {t('requests')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white border-[#E2E8F0] p-8 text-center space-y-3">
            <p className="text-sm text-[#64748B]">
              {t('noOwnedProjects')}
            </p>
            <Link href="/projects/create">
              <Button variant="primary" size="sm">
                {t('createFirst')}
              </Button>
            </Link>
          </Card>
        )}
      </section>

      {/* Section 2: Projects I Joined */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#A78BFA]" />
          <h2 className="text-lg font-bold text-[#0F172A]">
            {t('teamsIJoined')} ({joinedProjects.length})
          </h2>
        </div>

        {joinedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinedProjects.map((project: ProjectWithMembers) => {
              const currentMembers = project.project_members?.length || 1;

              return (
                <Card
                  key={project.id}
                  variant="white"
                  className="flex flex-col justify-between p-5 space-y-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="blue" size="sm">
                        {getProjectTypeLabel(tCommon, project.project_type)}
                      </Badge>
                      <Badge variant="lavender" size="sm">
                        {project.memberRole}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-base text-[#0F172A]">
                      {project.name}
                    </h3>

                    <p className="text-xs text-[#475569] mt-2 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                    <span className="text-xs text-[#64748B] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>
                        {currentMembers}/{project.team_size} {tProjects('members')}
                      </span>
                    </span>

                    <Link href={`/projects/${project.id}`}>
                      <Button variant="secondary" size="sm">
                        <span>{tProjects('viewProject')}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white border-[#E2E8F0] p-8 text-center space-y-3">
            <p className="text-sm text-[#64748B]">
              {t('noJoinedProjects')}
            </p>
            <Link href="/projects">
              <Button variant="secondary" size="sm">
                {t('exploreOpen')}
              </Button>
            </Link>
          </Card>
        )}
      </section>
    </div>
  );
}
