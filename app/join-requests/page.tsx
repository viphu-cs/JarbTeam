import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { JoinRequestsManager } from '@/components/project/JoinRequestsManager';
import { JoinRequest } from '@/types';

export const revalidate = 0;

export default async function JoinRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectedFrom=/join-requests');
  }

  // 1. Fetch user's owned projects IDs
  const { data: myProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_id', user.id);

  const myProjectIds = (myProjects || []).map((p) => p.id);

  // 2. Fetch Incoming Requests (requests for my projects)
  let incomingRequests: JoinRequest[] = [];
  if (myProjectIds.length > 0) {
    const { data } = await supabase
      .from('join_requests')
      .select(`
        *,
        profile:profiles (*),
        project:projects (id, name, project_type, team_size)
      `)
      .in('project_id', myProjectIds)
      .order('created_at', { ascending: false });

    incomingRequests = (data as unknown as JoinRequest[]) || [];
  }

  // 3. Fetch Sent Requests (requests made by me)
  const { data: sentData } = await supabase
    .from('join_requests')
    .select(`
      *,
      project:projects (id, name, project_type, team_size)
    `)
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  const sentRequests: JoinRequest[] = (sentData as unknown as JoinRequest[]) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Join Requests & Applications
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Review candidates for your projects and keep track of your own team applications.
        </p>
      </div>

      <JoinRequestsManager
        incomingRequests={incomingRequests}
        sentRequests={sentRequests}
      />
    </div>
  );
}
