'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { WorkStyle } from '@/types';

export interface ProfileFormData {
  fullName: string;
  university: string;
  major: string;
  bio: string;
  workStyle: WorkStyle;
  availability: string;
  preferredRoles: string[];
  preferredProjectTypes: string[];
  skillNames: string[];
  interestNames: string[];
}

export async function updateProfileAction(data: ProfileFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update your profile.' };
  }

  // 1. Update or create basic profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email || '',
      full_name: data.fullName,
      university: data.university,
      major: data.major,
      bio: data.bio,
      work_style: data.workStyle,
      availability: data.availability,
      preferred_roles: data.preferredRoles,
      preferred_project_types: data.preferredProjectTypes,
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    return { error: profileError.message };
  }

  // 2. Handle skills
  // Clear existing skills for this profile
  await supabase.from('profile_skills').delete().eq('profile_id', user.id);

  if (data.skillNames && data.skillNames.length > 0) {
    for (const name of data.skillNames) {
      const trimmed = name.trim();
      if (!trimmed) continue;

      // Find or insert skill
      let skillId: string | null = null;
      const { data: existingSkill } = await supabase
        .from('skills')
        .select('id')
        .ilike('name', trimmed)
        .maybeSingle();

      if (existingSkill) {
        skillId = existingSkill.id;
      } else {
        const { data: newSkill } = await supabase
          .from('skills')
          .insert({ name: trimmed })
          .select('id')
          .single();
        if (newSkill) skillId = newSkill.id;
      }

      if (skillId) {
        await supabase.from('profile_skills').insert({
          profile_id: user.id,
          skill_id: skillId,
        });
      }
    }
  }

  // 3. Handle interests
  await supabase.from('profile_interests').delete().eq('profile_id', user.id);

  if (data.interestNames && data.interestNames.length > 0) {
    for (const name of data.interestNames) {
      const trimmed = name.trim();
      if (!trimmed) continue;

      let interestId: string | null = null;
      const { data: existingInterest } = await supabase
        .from('interests')
        .select('id')
        .ilike('name', trimmed)
        .maybeSingle();

      if (existingInterest) {
        interestId = existingInterest.id;
      } else {
        const { data: newInterest } = await supabase
          .from('interests')
          .insert({ name: trimmed })
          .select('id')
          .single();
        if (newInterest) interestId = newInterest.id;
      }

      if (interestId) {
        await supabase.from('profile_interests').insert({
          profile_id: user.id,
          interest_id: interestId,
        });
      }
    }
  }

  revalidatePath('/profile');
  revalidatePath('/profile/edit');
  revalidatePath('/projects');

  redirect('/profile');
}
