'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ProjectType, WorkStyle, ProjectStatus } from '@/types';

async function getLocale(): Promise<string> {
  const cookieStore = await cookies();
  const loc = cookieStore.get('NEXT_LOCALE')?.value;
  return loc === 'en' || loc === 'th' ? loc : 'th';
}

export interface ProjectFormData {
  name: string;
  projectType: ProjectType;
  description: string;
  teamSize: number;
  workStyle: WorkStyle;
  duration: string;
  deadline?: string;
  requiredSkills: string[];
  requiredRoles: string[];
}

export async function createProjectAction(data: ProjectFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create a project.' };
  }

  if (!data.name || !data.name.trim()) {
    return { error: 'Project name is required.' };
  }

  if (!data.description || !data.description.trim()) {
    return { error: 'Project description is required.' };
  }

  const teamSize = Number(data.teamSize) || 4;

  // 1. Insert Project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      name: data.name.trim(),
      description: data.description.trim(),
      project_type: data.projectType,
      deadline: data.deadline ? data.deadline : null,
      duration: data.duration?.trim() || '',
      team_size: teamSize,
      work_style: data.workStyle,
      required_roles: data.requiredRoles || [],
      status: 'open',
    })
    .select('id')
    .single();

  if (projectError || !project) {
    return { error: projectError?.message || 'Failed to create project.' };
  }

  // 2. Add creator as first member in project_members
  await supabase.from('project_members').insert({
    project_id: project.id,
    profile_id: user.id,
    role: 'Project Lead',
    status: 'active',
  });

  // 3. Connect required skills
  if (data.requiredSkills && data.requiredSkills.length > 0) {
    for (const skillName of data.requiredSkills) {
      const trimmed = skillName.trim();
      if (!trimmed) continue;

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
        await supabase.from('project_skills').insert({
          project_id: project.id,
          skill_id: skillId,
        });
      }
    }
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/projects`);
  revalidatePath(`/${locale}/my-projects`);
  redirect(`/${locale}/projects/${project.id}`);
}

export async function updateProjectStatusAction(
  projectId: string,
  status: ProjectStatus
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('owner_id', user.id);

  if (error) {
    return { error: error.message };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/projects/${projectId}`);
  revalidatePath(`/${locale}/projects`);
  revalidatePath(`/${locale}/my-projects`);
  return { success: true };
}

export async function deleteProjectAction(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('owner_id', user.id);

  if (error) {
    return { error: error.message };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/projects`);
  revalidatePath(`/${locale}/my-projects`);
  redirect(`/${locale}/my-projects`);
}
