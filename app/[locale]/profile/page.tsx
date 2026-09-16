import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  GraduationCap,
  MapPin,
  Clock,
  Laptop,
  Edit3,
  BookOpen,
  Sparkles,
  FolderGit2,
} from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import { getProjectTypeLabel, getWorkStyleLabel, getStatusLabel } from '@/lib/utils/labels';

export default async function ProfilePage() {
  const t = await getTranslations('profile');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. Fetch user's skills
  const { data: userSkillsData } = await supabase
    .from('profile_skills')
    .select('skills (id, name)')
    .eq('profile_id', user.id);

  const rawSkills = (userSkillsData || []) as unknown as Array<{ skills: { id: string; name: string } | null }>;
  const skills: string[] = rawSkills
    .map((item) => item.skills?.name)
    .filter((name): name is string => Boolean(name));

  // 3. Fetch user's interests
  const { data: userInterestsData } = await supabase
    .from('profile_interests')
    .select('interests (id, name)')
    .eq('profile_id', user.id);

  const rawInterests = (userInterestsData || []) as unknown as Array<{ interests: { id: string; name: string } | null }>;
  const interests: string[] = rawInterests
    .map((item) => item.interests?.name)
    .filter((name): name is string => Boolean(name));

  // 4. Fetch projects owned
  const { data: ownedProjects } = await supabase
    .from('projects')
    .select('id, name, project_type, status, team_size')
    .eq('owner_id', user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Top Banner Card */}
      <Card className="bg-white border-[#E2E8F0] shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-3xl bg-[#D4E6F1] border border-[#BEE3F8] flex items-center justify-center text-xl font-bold text-[#0B3B4B] shrink-0">
              {profile?.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F172A]">
                  {profile?.full_name || t('studentBadge')}
                </h1>
                <Badge variant="blue" size="sm">
                  {t('studentBadge')}
                </Badge>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">{profile?.email}</p>

              {(profile?.university || profile?.major) && (
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#475569]">
                  {profile?.university && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-[#7CA5B8]" />
                      {profile.university}
                    </span>
                  )}
                  {profile?.major && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#A78BFA]" />
                      {profile.major}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <Link href="/profile/edit">
            <Button variant="secondary" size="sm" className="shadow-xs cursor-pointer">
              <Edit3 className="w-3.5 h-3.5" />
              {t('editProfile')}
            </Button>
          </Link>
        </div>

        {/* Bio */}
        {profile?.bio ? (
          <div className="mt-5 pt-4 border-t border-[#F1F5F9] text-sm text-[#334155] leading-relaxed">
            {profile.bio}
          </div>
        ) : (
          <div className="mt-5 pt-4 border-t border-[#F1F5F9] text-xs text-[#94A3B8] italic">
            {t('noBio')}
          </div>
        )}

        {/* Work style & Availability quick tags */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
          {profile?.work_style && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#FAF9F6] text-[#334155] border border-[#E2E8F0]">
              <Laptop className="w-3.5 h-3.5 text-[#7CA5B8]" />
              <span>{t('workStyle', { style: getWorkStyleLabel(tCommon, profile.work_style) })}</span>
            </div>
          )}

          {profile?.availability && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#FAF9F6] text-[#334155] border border-[#E2E8F0]">
              <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>{t('availability', { time: profile.availability })}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Skills & Preferences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills & Roles Card */}
        <Card className="bg-white border-[#E2E8F0] space-y-5">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7CA5B8]" />
              {t('skills')}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {skills.length > 0 ? (
                skills.map((skill: string) => (
                  <Badge key={skill} variant="blue">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-[#94A3B8] italic">{t('noSkills')}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#A78BFA]" />
              {t('preferredRoles')}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile?.preferred_roles && profile.preferred_roles.length > 0 ? (
                profile.preferred_roles.map((role: string) => (
                  <Badge key={role} variant="lavender">
                    {role}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-[#94A3B8] italic">{t('noRoles')}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Interests & Project Types Card */}
        <Card className="bg-white border-[#E2E8F0] space-y-5">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F472B6]" />
              {t('interests')}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {interests.length > 0 ? (
                interests.map((interest: string) => (
                  <Badge key={interest} variant="pink">
                    {interest}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-[#94A3B8] italic">{t('noInterests')}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-[#FDE047]" />
              {t('preferredTypes')}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile?.preferred_project_types &&
              profile.preferred_project_types.length > 0 ? (
                profile.preferred_project_types.map((type: string) => (
                  <Badge key={type} variant="yellow">
                    {getProjectTypeLabel(tCommon, type)}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-[#94A3B8] italic">
                  {t('noTypes')}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Student Projects */}
      <Card className="bg-white border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[#7CA5B8]" />
            {t('myProjects')} ({ownedProjects?.length || 0})
          </h2>
          <Link href="/projects/create">
            <Button variant="primary" size="sm" className="cursor-pointer">
              {t('createProject')}
            </Button>
          </Link>
        </div>

        {ownedProjects && ownedProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ownedProjects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="p-3.5 rounded-2xl border border-[#E2E8F0] hover:border-[#7CA5B8]/40 hover:bg-[#F0F4F8]/50 transition-all block"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm text-[#0F172A] truncate">
                    {p.name}
                  </h3>
                  <Badge variant="blue" size="sm">
                    {getProjectTypeLabel(tCommon, p.project_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#64748B]">
                  <span>Team size: {p.team_size}</span>
                  <span className="capitalize text-emerald-600 font-medium">
                    {getStatusLabel(tCommon, p.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[#64748B]">
            {t('noProjects')}
          </div>
        )}
      </Card>
    </div>
  );
}
