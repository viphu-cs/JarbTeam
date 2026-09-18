'use server';

import { createClient } from '@/lib/supabase/server';
import {
  StudentSearchResult,
  FriendItem,
  FriendRequestItem,
  StudentFriendshipStatus,
} from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Search students with full text matching on name, university, major, and skills.
 * Returns relative friendship and teammate status.
 */
export async function searchStudentsAction(
  query: string
): Promise<{ students?: StudentSearchResult[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first.' };
  }

  const { data, error } = await supabase.rpc('search_students', {
    p_query: query || '',
  });

  if (error) {
    return { error: error.message };
  }

  return { students: (data as unknown as StudentSearchResult[]) || [] };
}

/**
 * Send a two-way friend request to another student.
 */
export async function sendFriendRequestAction(
  receiverId: string
): Promise<{ success?: boolean; error?: string; friendshipId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first.' };
  }

  const { data, error } = await supabase.rpc('send_friend_request', {
    p_receiver_id: receiverId,
  });

  if (error) {
    return { error: error.message };
  }

  const result = data as { success: boolean; error?: string; id?: string };
  if (!result.success) {
    return { error: result.error || 'Failed to send friend request.' };
  }

  revalidatePath('/[locale]/messages', 'page');
  revalidatePath('/[locale]/profile', 'page');

  return { success: true, friendshipId: result.id };
}

/**
 * Respond to a friend request (Accept or Decline).
 * If accepted, automatically creates a 1-to-1 direct conversation between friends.
 */
export async function respondFriendRequestAction(
  requestId: string,
  action: 'accept' | 'decline'
): Promise<{ success?: boolean; conversationId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized: Please log in first.' };
  }

  const { data, error } = await supabase.rpc('respond_to_friend_request', {
    p_request_id: requestId,
    p_action: action,
  });

  if (error) {
    return { error: error.message };
  }

  const result = data as {
    success: boolean;
    error?: string;
    conversation_id?: string;
  };

  if (!result.success) {
    return { error: result.error || 'Failed to update request.' };
  }

  revalidatePath('/[locale]/messages', 'page');
  revalidatePath('/[locale]/profile', 'page');

  return {
    success: true,
    conversationId: result.conversation_id,
  };
}

/**
 * Cancel an outgoing friend request.
 */
export async function cancelFriendRequestAction(
  requestId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId)
    .eq('sender_id', user.id)
    .eq('status', 'pending');

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/[locale]/messages', 'page');
  return { success: true };
}

/**
 * Get incoming and outgoing friend requests with student profile details.
 */
export async function getFriendRequestsAction(): Promise<{
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
  pendingCount: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { incoming: [], outgoing: [], pendingCount: 0 };
  }

  // 1. Fetch incoming requests
  const { data: incomingData, error: inError } = await supabase
    .from('friendships')
    .select(`
      id,
      sender_id,
      receiver_id,
      created_at,
      profile:profiles!friendships_sender_id_fkey (
        id,
        full_name,
        university,
        major,
        avatar_url
      )
    `)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // 2. Fetch outgoing requests
  const { data: outgoingData, error: outError } = await supabase
    .from('friendships')
    .select(`
      id,
      sender_id,
      receiver_id,
      created_at,
      profile:profiles!friendships_receiver_id_fkey (
        id,
        full_name,
        university,
        major,
        avatar_url
      )
    `)
    .eq('sender_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (inError || outError) {
    return {
      incoming: [],
      outgoing: [],
      pendingCount: 0,
      error: inError?.message || outError?.message,
    };
  }

  const incoming: FriendRequestItem[] = (incomingData || []).map((item: any) => ({
    id: item.id,
    sender_id: item.sender_id,
    receiver_id: item.receiver_id,
    created_at: item.created_at,
    profile: item.profile,
    type: 'incoming',
  }));

  const outgoing: FriendRequestItem[] = (outgoingData || []).map((item: any) => ({
    id: item.id,
    sender_id: item.sender_id,
    receiver_id: item.receiver_id,
    created_at: item.created_at,
    profile: item.profile,
    type: 'outgoing',
  }));

  return {
    incoming,
    outgoing,
    pendingCount: incoming.length,
  };
}

/**
 * Get all accepted friends of the current authenticated user.
 */
export async function getMyFriendsAction(): Promise<{
  friends?: FriendItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      sender_id,
      receiver_id,
      created_at,
      sender:profiles!friendships_sender_id_fkey (
        id,
        full_name,
        university,
        major,
        avatar_url
      ),
      receiver:profiles!friendships_receiver_id_fkey (
        id,
        full_name,
        university,
        major,
        avatar_url
      )
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .order('updated_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  const rawList = data || [];
  const friends: FriendItem[] = rawList.map((item: any) => {
    const isSender = item.sender_id === user.id;
    const friendProfile = isSender ? item.receiver : item.sender;
    return {
      friendship_id: item.id,
      friend_id: friendProfile?.id || (isSender ? item.receiver_id : item.sender_id),
      full_name: friendProfile?.full_name || 'Student',
      university: friendProfile?.university,
      major: friendProfile?.major,
      avatar_url: friendProfile?.avatar_url,
      skills: [],
      created_at: item.created_at,
    };
  });

  return { friends };
}

/**
 * Check friendship status relative to a specific user (for profile view).
 */
export async function getFriendshipStatusAction(
  targetUserId: string
): Promise<{
  status: StudentFriendshipStatus;
  friendshipId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id === targetUserId) {
    return { status: 'none' };
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('id, sender_id, receiver_id, status')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`
    )
    .maybeSingle();

  if (error) {
    return { status: 'none', error: error.message };
  }

  if (!data) {
    return { status: 'none' };
  }

  if (data.status === 'accepted') {
    return { status: 'friends', friendshipId: data.id };
  }

  if (data.status === 'pending') {
    if (data.sender_id === user.id) {
      return { status: 'pending_sent', friendshipId: data.id };
    } else {
      return { status: 'pending_received', friendshipId: data.id };
    }
  }

  return { status: 'none' };
}
