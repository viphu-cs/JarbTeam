import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  getAllUserConversationsAction,
  getDirectConversationDetailsAction,
} from '@/actions/chat';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { DirectChatRoom } from '@/components/chat/DirectChatRoom';
import { ProjectChatRoom } from '@/components/chat/ProjectChatRoom';
import { ShieldAlert, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';

export const revalidate = 0;

interface DirectConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function DirectConversationPage({
  params,
}: DirectConversationPageProps) {
  const { conversationId } = await params;
  const locale = await getLocale();
  const t = await getTranslations('chat');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirectedFrom=/${locale}/messages/${conversationId}`);
  }

  // Fetch list of conversations for sidebar
  const { conversations = [] } = await getAllUserConversationsAction();

  // Fetch details & initial messages for the selected conversation
  const details = await getDirectConversationDetailsAction(conversationId);

  // Handle unauthorized/forbidden state
  if (details.forbidden) {
    return (
      <ChatLayout conversations={conversations} activeConversationId={conversationId}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-rose-50/40 h-full">
          <div className="w-14 h-14 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A]">
            {t('noAccess')}
          </h2>
          <p className="text-xs text-[#64748B] mt-1.5 max-w-sm leading-relaxed mb-5">
            {t('noAccessDesc')}
          </p>
          <Link href="/messages">
            <Button variant="secondary" size="sm" className="cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              {t('backToMessages')}
            </Button>
          </Link>
        </div>
      </ChatLayout>
    );
  }

  // Handle not found
  if (details.notFound || !details.conversation) {
    return (
      <ChatLayout conversations={conversations} activeConversationId={conversationId}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF9F6] h-full">
          <div className="w-14 h-14 rounded-3xl bg-[#E8F1F5] text-[#0B3B4B] flex items-center justify-center mb-4 border border-[#D4E6F1]">
            <AlertCircle className="w-7 h-7 text-[#7CA5B8]" />
          </div>
          <h2 className="text-base font-bold text-[#0F172A]">
            {t('conversationNotFound')}
          </h2>
          <p className="text-xs text-[#64748B] mt-1.5 max-w-sm leading-relaxed mb-5">
            {t('conversationNotFoundDesc')}
          </p>
          <Link href="/messages">
            <Button variant="secondary" size="sm" className="cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              {t('backToMessages')}
            </Button>
          </Link>
        </div>
      </ChatLayout>
    );
  }

  if (details.conversationType === 'project' && details.project && details.conversation) {
    return (
      <ChatLayout
        conversations={conversations}
        activeConversationId={conversationId}
        activeProjectId={details.projectId || undefined}
      >
        <ProjectChatRoom
          conversationId={details.conversation.id}
          initialMessages={details.messages || []}
          currentUserId={user.id}
          currentUser={details.currentUser}
          project={details.project}
          members={details.members || []}
          backHref="/messages"
        />
      </ChatLayout>
    );
  }

  return (
    <ChatLayout conversations={conversations} activeConversationId={conversationId}>
      <DirectChatRoom
        conversationId={conversationId}
        initialMessages={details.messages || []}
        currentUserId={user.id}
        otherUser={details.otherUser}
      />
    </ChatLayout>
  );
}
