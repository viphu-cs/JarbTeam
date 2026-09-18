'use server';

import { createClient } from '@/lib/supabase/server';
import { Conversation, Message, AttachmentType } from '@/types';

/**
 * Get or create a 1-to-1 direct conversation between the authenticated user and another user.
 * Reuses existing direct conversation and prevents duplicates.
 */
export async function getOrCreateDirectConversationAction(
  otherUserId: string
): Promise<{ conversationId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first.' };
  }

  if (user.id === otherUserId) {
    return { error: 'Cannot create a direct conversation with yourself.' };
  }

  const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
    p_user_a: user.id,
    p_user_b: otherUserId,
  });

  if (error) {
    return { error: error.message };
  }

  return { conversationId: data as string };
}

/**
 * Get or create the unique project group conversation for an authorized project.
 * Automatically synchronizes project members into conversation members.
 */
export async function getOrCreateProjectConversationAction(
  projectId: string
): Promise<{ conversationId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first.' };
  }

  const { data, error } = await supabase.rpc('get_or_create_project_conversation', {
    p_project_id: projectId,
  });

  if (error) {
    return { error: error.message };
  }

  return { conversationId: data as string };
}

/**
 * Send a message into a conversation.
 * Enforces sender authentication, conversation membership, and message content validation.
 */
export async function sendMessageAction(
  conversationId: string,
  content?: string,
  attachmentUrl?: string,
  attachmentType?: AttachmentType
): Promise<{ message?: Message; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first.' };
  }

  const trimmedContent = content?.trim() || null;
  const trimmedUrl = attachmentUrl?.trim() || null;

  if (!trimmedContent && !trimmedUrl) {
    return { error: 'Message cannot be empty. Content or attachment is required.' };
  }

  if (attachmentType && attachmentType !== 'image') {
    return { error: 'Unsupported attachment type.' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmedContent,
      attachment_url: trimmedUrl,
      attachment_type: attachmentType || null,
    })
    .select(`
      *,
      sender:profiles (*)
    `)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { message: data as Message };
}

/**
 * Fetch messages for a conversation that the authenticated user belongs to.
 */
export async function getConversationMessagesAction(
  conversationId: string,
  limit: number = 50
): Promise<{ messages?: Message[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first.' };
  }

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles (*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  return { messages: (data as unknown as Message[]) || [] };
}

/**
 * Fetch all conversations of the authenticated user.
 */
export async function getUserConversationsAction(): Promise<{
  conversations?: Conversation[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first.' };
  }

  const { data, error } = await supabase
    .from('conversation_members')
    .select(`
      conversation:conversations (
        id,
        type,
        project_id,
        created_at,
        updated_at,
        project:projects (id, name, project_type),
        members:conversation_members (
          id,
          user_id,
          joined_at,
          last_read_at,
          profile:profiles (*)
        )
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  const raw = data || [];
  const conversations: Conversation[] = raw
    .map((item) => (item as unknown as { conversation: Conversation }).conversation)
    .filter(Boolean);

  return { conversations };
}

/**
 * Mark a conversation as read up to the current timestamp.
 */
export async function markConversationAsReadAction(
  conversationId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
