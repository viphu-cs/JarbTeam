'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitJoinRequestAction(
  projectId: string,
  requestedRole: string,
  message: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to request joining a project.' };
  }

  // 1. Fetch project details & membership
  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id, team_size, status')
    .eq('id', projectId)
    .single();

  if (!project) {
    return { error: 'Project not found.' };
  }

  if (project.status === 'closed' || project.status === 'completed') {
    return { error: 'This project is no longer accepting new members.' };
  }

  if (project.owner_id === user.id) {
    return { error: 'You are the owner of this project.' };
  }

  // 2. Check if already a member
  const { data: existingMember } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existingMember) {
    return { error: 'You are already a member of this project.' };
  }

  // 3. Check current member capacity
  const { count: memberCount } = await supabase
    .from('project_members')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (memberCount !== null && memberCount >= project.team_size) {
    return { error: 'This project has already reached maximum team capacity.' };
  }

  // 4. Check if pending request already exists
  const { data: pendingReq } = await supabase
    .from('join_requests')
    .select('id')
    .eq('project_id', projectId)
    .eq('profile_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (pendingReq) {
    return { error: 'You already have a pending join request for this project.' };
  }

  // 5. Insert join request
  const { error: insertError } = await supabase.from('join_requests').insert({
    project_id: projectId,
    profile_id: user.id,
    requested_role: requestedRole.trim() || 'Team Member',
    message: message.trim(),
    status: 'pending',
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/join-requests');
  return { success: true };
}

export async function acceptJoinRequestAction(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  // Fetch join request and project
  const { data: request } = await supabase
    .from('join_requests')
    .select('id, project_id, profile_id, requested_role, status, project:projects (id, owner_id, team_size, status)')
    .eq('id', requestId)
    .single();

  if (!request) {
    return { error: 'Join request not found.' };
  }

  const project: any = request.project;
  if (!project || project.owner_id !== user.id) {
    return { error: 'Only the project owner can accept join requests.' };
  }

  // Check capacity
  const { count: memberCount } = await supabase
    .from('project_members')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', project.id);

  if (memberCount !== null && memberCount >= project.team_size) {
    return { error: 'Cannot accept request: project is at maximum capacity.' };
  }

  // Check if member already exists
  const { data: existingMember } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', project.id)
    .eq('profile_id', request.profile_id)
    .maybeSingle();

  if (!existingMember) {
    // Add to project members
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        profile_id: request.profile_id,
        role: request.requested_role || 'Team Member',
        status: 'active',
      });

    if (memberError) {
      return { error: memberError.message };
    }
  }

  // Update request status
  await supabase
    .from('join_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  revalidatePath('/join-requests');
  revalidatePath(`/projects/${project.id}`);
  revalidatePath('/my-projects');
  return { success: true };
}

export async function rejectJoinRequestAction(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  // Fetch join request and project
  const { data: request } = await supabase
    .from('join_requests')
    .select('id, project_id, status, project:projects (id, owner_id)')
    .eq('id', requestId)
    .single();

  if (!request) {
    return { error: 'Join request not found.' };
  }

  const project: any = request.project;
  if (!project || project.owner_id !== user.id) {
    return { error: 'Only the project owner can reject join requests.' };
  }

  await supabase
    .from('join_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);

  revalidatePath('/join-requests');
  revalidatePath(`/projects/${project.id}`);
  return { success: true };
}

export async function cancelJoinRequestAction(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('join_requests')
    .delete()
    .eq('id', requestId)
    .eq('profile_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/join-requests');
  return { success: true };
}
