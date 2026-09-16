import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { Profile, Skill, Interest } from '@/types';
import { getTranslations, getLocale } from 'next-intl/server';

interface ProfileEditPageProps {
  searchParams: Promise<{ onboarding?: string }>;
}

export default async function ProfileEditPage({ searchParams }: ProfileEditPageProps) {
  const t = await getTranslations('profileEdit');
  const locale = await getLocale();

  const { onboarding } = await searchParams;
  const isOnboarding = onboarding === 'true';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Fetch current user's profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Fetch current user's skills
  const { data: userSkillsData } = await supabase
    .from('profile_skills')
    .select('skills (id, name)')
    .eq('profile_id', user.id);

  const rawSkills = (userSkillsData || []) as unknown as Array<{ skills: Skill | null }>;
  const skills: Skill[] = rawSkills
    .map((item) => item.skills)
    .filter((s): s is Skill => Boolean(s));

  // Fetch current user's interests
  const { data: userInterestsData } = await supabase
    .from('profile_interests')
    .select('interests (id, name)')
    .eq('profile_id', user.id);

  const rawInterests = (userInterestsData || []) as unknown as Array<{ interests: Interest | null }>;
  const interests: Interest[] = rawInterests
    .map((item) => item.interests)
    .filter((i): i is Interest => Boolean(i));

  // Fetch all available skills for suggestions
  const { data: allSkills } = await supabase
    .from('skills')
    .select('id, name')
    .order('name');

  // Fetch all available interests for suggestions
  const { data: allInterests } = await supabase
    .from('interests')
    .select('id, name')
    .order('name');

  const googleName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.preferred_username ||
    '';

  const profile: Profile = {
    id: user.id,
    full_name: profileData?.full_name || googleName,
    email: profileData?.email || user.email || '',
    university: profileData?.university || '',
    major: profileData?.major || '',
    bio: profileData?.bio || '',
    avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || '',
    work_style: profileData?.work_style || 'Hybrid',
    availability: profileData?.availability || '',
    preferred_roles: profileData?.preferred_roles || [],
    preferred_project_types: profileData?.preferred_project_types || [],
    skills,
    interests,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {isOnboarding && (
        <div className="mb-6 p-4 rounded-2xl bg-[#E8F1F5] border border-[#BEE3F8] text-[#0B3B4B] flex items-start gap-3 shadow-xs">
          <div className="text-xs space-y-1">
            <h2 className="font-bold text-sm text-[#0F172A]">
              {t('onboardingWelcome')}
            </h2>
            <p className="text-[#334155]">
              {t('onboardingDesc')}
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          {isOnboarding ? t('pageTitleOnboarding') : t('pageTitle')}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {t('pageSubtitle')}
        </p>
      </div>

      <ProfileEditForm
        initialProfile={profile}
        availableSkills={allSkills || []}
        availableInterests={allInterests || []}
      />
    </div>
  );
}
