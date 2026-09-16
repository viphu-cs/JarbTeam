import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreateProjectForm } from '@/components/project/CreateProjectForm';
import { Skill } from '@/types';

export default async function CreateProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectedFrom=/projects/create');
  }

  // Fetch available skills for suggestions
  const { data: skills } = await supabase
    .from('skills')
    .select('id, name')
    .order('name');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
          Create a New Project
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Have an idea? Create a project, define what roles and skills you need, and recruit student teammates.
        </p>
      </div>

      <CreateProjectForm availableSkills={(skills as Skill[]) || []} />
    </div>
  );
}
