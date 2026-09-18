import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getAllUserConversationsAction } from '@/actions/chat';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { EmptyChatPlaceholder } from '@/components/chat/EmptyChatPlaceholder';

export const revalidate = 0;

export default async function MessagesPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirectedFrom=/${locale}/messages`);
  }

  const { conversations = [] } = await getAllUserConversationsAction();

  return (
    <ChatLayout conversations={conversations}>
      <EmptyChatPlaceholder />
    </ChatLayout>
  );
}
