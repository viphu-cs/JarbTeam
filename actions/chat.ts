'use server';

import { createClient } from '@/lib/supabase/server';
import {
  Conversation,
  Message,
  AttachmentType,
  DirectConversationSummary,
  ConversationListItem,
  Profile,
  Project,
} from '@/types';

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
    .map((item: any) => (item as unknown as { conversation: Conversation }).conversation)
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

/**
 * Fetch all direct conversations for current user with other user profile and last message preview.
 */
export async function getUserDirectConversationsAction(): Promise<{
  conversations?: DirectConversationSummary[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first.' };
  }

  const { data, error } = await supabase.rpc('get_user_direct_conversations');

  if (error) {
    return { error: error.message };
  }

  return { conversations: (data as unknown as DirectConversationSummary[]) || [] };
}

/**
 * Get total unread direct message count for the current user.
 */
export async function getUnreadMessageCountAction(): Promise<{
  count: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { count: 0 };
  }

  const { data, error } = await supabase.rpc('get_unread_message_count');

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: Number(data || 0) };
}

/**
 * Fetch all conversations (both direct and project) for the current authenticated user.
 */
export async function getAllUserConversationsAction(): Promise<{
  conversations?: ConversationListItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first.' };
  }

  const { data, error } = await supabase.rpc('get_user_all_conversations');

  if (error) {
    return { error: error.message };
  }

  return { conversations: (data as unknown as ConversationListItem[]) || [] };
}

/**
 * Get details of a single direct conversation: verify membership, get other user profile and initial messages.
 */
export async function getDirectConversationDetailsAction(
  conversationId: string
): Promise<{
  conversation?: Conversation;
  otherUser?: Profile;
  currentUser?: Profile;
  messages?: Message[];
  error?: string;
  forbidden?: boolean;
  notFound?: boolean;
  projectId?: string | null;
  conversationType?: 'direct' | 'project';
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', forbidden: true };
  }

  // 1. Fetch current user's profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. Fetch conversation with members and their profiles
  const { data: conversationData, error: convError } = await supabase
    .from('conversations')
    .select(`
      *,
      members:conversation_members (
        id,
        user_id,
        joined_at,
        last_read_at,
        profile:profiles (*)
      )
    `)
    .eq('id', conversationId)
    .single();

  if (convError || !conversationData) {
    return { notFound: true, error: 'Conversation not found.' };
  }

  // If this conversation is a project conversation, return the projectId so the caller can redirect
  if (conversationData.type !== 'direct') {
    return {
      error: 'Not a direct conversation.',
      notFound: false,
      projectId: conversationData.project_id,
      conversationType: 'project',
    };
  }

  // 3. Verify user membership
  const members = (conversationData.members || []) as unknown as Array<{
    user_id: string;
    profile: Profile;
  }>;

  const isMember = members.some((m) => m.user_id === user.id);
  if (!isMember) {
    return { forbidden: true, error: 'Access denied: You are not a member of this conversation.' };
  }

  // 4. Find other user's profile
  const otherMember = members.find((m) => m.user_id !== user.id);
  const otherUser = otherMember?.profile;

  // 5. Fetch initial messages
  const { data: messagesData } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles (*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);

  // 6. Mark conversation as read
  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);

  return {
    conversation: conversationData as unknown as Conversation,
    otherUser,
    currentUser: currentProfile as Profile,
    messages: (messagesData as unknown as Message[]) || [],
    conversationType: 'direct',
  };
}

/**
 * Get details of a project group conversation:
 * - Ensure project conversation exists (auto-created via rpc)
 * - Verify user is owner or active member of the project
 * - Fetch project details, members with profiles, and message history
 * - Mark conversation as read
 */
export async function getProjectConversationDetailsAction(
  projectId: string
): Promise<{
  conversation?: Conversation;
  project?: Project;
  members?: Array<{
    user_id: string;
    role: string;
    profile: Profile;
  }>;
  currentUser?: Profile;
  messages?: Message[];
  isOwner?: boolean;
  error?: string;
  forbidden?: boolean;
  notFound?: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', forbidden: true };
  }

  // 1. Fetch current user profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. Fetch project details with owner and active members
  const { data: projectData, error: projError } = await supabase
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey (*),
      project_members (
        id,
        project_id,
        profile_id,
        role,
        joined_at,
        status,
        profile:profiles (*)
      )
    `)
    .eq('id', projectId)
    .single();

  if (projError || !projectData) {
    return { notFound: true, error: 'Project not found.' };
  }

  const isOwner = user.id === projectData.owner_id;
  const rawMembers = (projectData.project_members || []) as Array<{
    id: string;
    project_id: string;
    profile_id: string;
    role: string;
    joined_at: string;
    status: string;
    profile: Profile;
  }>;

  const activeMembers = rawMembers.filter((m) => m.status === 'active');
  const isMember = isOwner || activeMembers.some((m) => m.profile_id === user.id);

  if (!isMember) {
    return {
      forbidden: true,
      error: 'Access denied: You must be a project member to join this chat.',
    };
  }

  // 3. Ensure project conversation exists and members are synced
  const { data: convId, error: convRpcError } = await supabase.rpc(
    'get_or_create_project_conversation',
    {
      p_project_id: projectId,
    }
  );

  if (convRpcError || !convId) {
    return { error: convRpcError?.message || 'Failed to initialize project conversation.' };
  }

  // 4. Fetch conversation record
  const { data: conversationData, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', convId)
    .single();

  if (convError || !conversationData) {
    return { notFound: true, error: 'Conversation record not found.' };
  }

  // 5. Fetch recent messages
  const { data: messagesData } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles (*)
    `)
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(100);

  // 6. Mark conversation as read for current user
  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', convId)
    .eq('user_id', user.id);

  // Build unified member list (Project Lead + active members)
  const unifiedMembers: Array<{
    user_id: string;
    role: string;
    profile: Profile;
  }> = [];

  // Add owner first
  if (projectData.owner) {
    unifiedMembers.push({
      user_id: projectData.owner_id,
      role: 'Project Lead',
      profile: projectData.owner as Profile,
    });
  }

  // Add active members (excluding owner if already added)
  for (const m of activeMembers) {
    if (m.profile_id !== projectData.owner_id && m.profile) {
      unifiedMembers.push({
        user_id: m.profile_id,
        role: m.role || 'Member',
        profile: m.profile,
      });
    }
  }

  return {
    conversation: conversationData as unknown as Conversation,
    project: projectData as unknown as Project,
    members: unifiedMembers,
    currentUser: currentProfile as Profile,
    messages: (messagesData as unknown as Message[]) || [],
    isOwner,
  };
}


