import { createClient } from '@/lib/supabase/server';
import { ProjectListClient } from '@/components/project/ProjectListClient';
import { calculateMatchScore } from '@/lib/matching';
import { Project, Profile, Skill, Interest, ProjectMember } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PlusCircle } from 'lucide-react';

export const revalidate = 0; // Fresh data for teammate searches

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch user's profile with skills and interests if logged in
  let userProfile: Profile | null = null;
  if (user) {
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

      const rawSkills = (uSkills || []) as unknown as Array<{ skills: Skill | null }>;
      const rawInterests = (uInterests || []) as unknown as Array<{ interests: Interest | null }>;

      userProfile = {
        ...profileData,
        skills: rawSkills
          .map((s) => s.skills)
          .filter((s): s is Skill => Boolean(s)),
        interests: rawInterests
          .map((i) => i.interests)
          .filter((i): i is Interest => Boolean(i)),
      };
    }
  }

  // 2. Fetch open projects
  const { data: projectsData } = await supabase
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey (*),
      project_skills (
        skills (id, name)
      ),
      project_members (
        id,
        profile_id,
        role,
        status
      )
    `)
    .order('created_at', { ascending: false });

  // 3. Fetch all skills for filter dropdown
  const { data: allSkills } = await supabase
    .from('skills')
    .select('id, name')
    .order('name');

  interface ProjectRow extends Project {
    project_skills?: { skills: Skill | null }[];
    project_members?: { id: string; profile_id: string; role: string; status: string }[];
  }

  // 4. Map & calculate match scores
  const rawProjects = (projectsData as unknown as ProjectRow[]) || [];
  const projects: Project[] = rawProjects.map((p) => {
    const skills = (p.project_skills || [])
      .map((ps) => ps.skills)
      .filter((s): s is Skill => Boolean(s));

    const projectObj: Project = {
      ...p,
      skills,
      members: (p.project_members as unknown as ProjectMember[]) || [],
    };

    if (userProfile) {
      const match = calculateMatchScore(userProfile, projectObj);
      projectObj.matchScore = match.totalScore;
      projectObj.matchReasons = match.reasons;
    }

    return projectObj;
  });

  // Sort by match score if user is logged in
  if (userProfile) {
    projects.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Explore Projects
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Discover student projects looking for teammates across courses, hackathons, and ventures.
          </p>
        </div>

        <Link href="/projects/create">
          <Button variant="primary" size="md" className="shadow-xs">
            <PlusCircle className="w-4 h-4" />
            Create Project
          </Button>
        </Link>
      </div>

      <ProjectListClient
        initialProjects={projects}
        availableSkills={(allSkills as Skill[]) || []}
        hasUser={!!user}
      />
    </div>
  );
}
