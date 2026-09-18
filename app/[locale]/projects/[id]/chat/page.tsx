import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { getProjectConversationDetailsAction } from '@/actions/chat';
import { ProjectChatRoom } from '@/components/chat/ProjectChatRoom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';

export const revalidate = 0;

interface ProjectChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectChatPage({ params }: ProjectChatPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations('chat');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirectedFrom=/${locale}/projects/${id}/chat`);
  }

  // Fetch project conversation details
  const details = await getProjectConversationDetailsAction(id);

  // Handle unauthorized/forbidden state (only owner and accepted members allowed)
  if (details.forbidden) {
    return (
      <div className="max-w-2xl mx-auto my-12 px-4">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-5 border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A]">
            {t('noAccess')}
          </h1>
          <p className="text-sm text-[#64748B] mt-2 mb-6 max-w-md mx-auto leading-relaxed">
            {t('notProjectMember')}
          </p>
          <Link href={`/projects/${id}`}>
            <Button variant="primary" size="md" className="cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('viewProject')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Handle not found
  if (details.notFound || !details.project || !details.conversation) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100dvh-4rem)] sm:h-[calc(100vh-5.5rem)] sm:my-4 sm:px-4 flex flex-col">
      <div className="w-full h-full bg-white sm:rounded-3xl sm:border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
        <ProjectChatRoom
          conversationId={details.conversation.id}
          initialMessages={details.messages || []}
          currentUserId={user.id}
          currentUser={details.currentUser}
          project={details.project}
          members={details.members || []}
          backHref={`/projects/${id}`}
        />
      </div>
    </div>
  );
}
