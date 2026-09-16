import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreateProjectForm } from '@/components/project/CreateProjectForm';
import { Skill } from '@/types';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function CreateProjectPage() {
  const t = await getTranslations('createProject');
  const locale = await getLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirectedFrom=/${locale}/projects/create`);
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
          {t('pageTitle')}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {t('pageSubtitle')}
        </p>
      </div>

      <CreateProjectForm availableSkills={(skills as Skill[]) || []} />
    </div>
  );
}
