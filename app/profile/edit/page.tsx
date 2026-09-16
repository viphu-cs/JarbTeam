import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { Profile, Skill, Interest } from '@/types';

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch current user's profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

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

  const profile: Profile = {
    ...(profileData || { id: user.id, full_name: '', email: user.email || '' }),
    skills,
    interests,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Edit Your Student Profile
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Tell other students about your university background, skills, and the kinds of projects you want to build.
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
