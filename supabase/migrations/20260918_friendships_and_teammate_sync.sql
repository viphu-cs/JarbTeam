-- ==============================================================================
-- Migration: 20260918_friendships_and_teammate_sync.sql
-- Two-Way Student Friendship System & Teammate Direct Chat Synchronization
-- ==============================================================================

-- 1. Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_different_users CHECK (sender_id <> receiver_id)
);

-- Unique pair constraint ensuring only 1 record exists between any two users
CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_pair_unique
    ON public.friendships (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));

CREATE INDEX IF NOT EXISTS idx_friendships_sender_id ON public.friendships(sender_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver_id ON public.friendships(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'friendships'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
    END IF;
END $$;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships"
    ON public.friendships FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create friend requests" ON public.friendships;
CREATE POLICY "Users can create friend requests"
    ON public.friendships FOR INSERT
    WITH CHECK (auth.uid() = sender_id AND sender_id <> receiver_id);

DROP POLICY IF EXISTS "Users can update their received friend requests or cancel sent ones" ON public.friendships;
CREATE POLICY "Users can update their received friend requests or cancel sent ones"
    ON public.friendships FOR UPDATE
    USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships"
    ON public.friendships FOR DELETE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


-- 2. Function to Send Friend Request
CREATE OR REPLACE FUNCTION public.send_friend_request(p_receiver_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_id UUID := auth.uid();
    v_existing_id UUID;
    v_existing_status TEXT;
    v_friendship_id UUID;
BEGIN
    IF v_sender_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    IF v_sender_id = p_receiver_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot add yourself as a friend');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_receiver_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    SELECT id, status INTO v_existing_id, v_existing_status
    FROM public.friendships
    WHERE (sender_id = v_sender_id AND receiver_id = p_receiver_id)
       OR (sender_id = p_receiver_id AND receiver_id = v_sender_id);

    IF v_existing_id IS NOT NULL THEN
        IF v_existing_status = 'accepted' THEN
            RETURN jsonb_build_object('success', false, 'error', 'Already friends');
        ELSIF v_existing_status = 'pending' THEN
            RETURN jsonb_build_object('success', false, 'error', 'Friend request already pending');
        ELSE
            -- Previously declined: allow resending
            UPDATE public.friendships
            SET sender_id = v_sender_id,
                receiver_id = p_receiver_id,
                status = 'pending',
                updated_at = now()
            WHERE id = v_existing_id
            RETURNING id INTO v_friendship_id;

            RETURN jsonb_build_object('success', true, 'id', v_friendship_id);
        END IF;
    END IF;

    INSERT INTO public.friendships (sender_id, receiver_id, status)
    VALUES (v_sender_id, p_receiver_id, 'pending')
    RETURNING id INTO v_friendship_id;

    RETURN jsonb_build_object('success', true, 'id', v_friendship_id);
END;
$$;


-- 3. Function to Respond to Friend Request (Accept / Decline)
CREATE OR REPLACE FUNCTION public.respond_to_friend_request(
    p_request_id UUID,
    p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_sender_id UUID;
    v_receiver_id UUID;
    v_conv_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    IF p_action NOT IN ('accept', 'decline') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
    END IF;

    SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
    FROM public.friendships
    WHERE id = p_request_id AND receiver_id = v_user_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found or unauthorized');
    END IF;

    IF p_action = 'accept' THEN
        UPDATE public.friendships
        SET status = 'accepted', updated_at = now()
        WHERE id = p_request_id;

        -- Automatically create 1-to-1 direct conversation between the two friends
        SELECT public.get_or_create_direct_conversation(v_sender_id, v_receiver_id) INTO v_conv_id;

        RETURN jsonb_build_object('success', true, 'status', 'accepted', 'conversation_id', v_conv_id);
    ELSE
        UPDATE public.friendships
        SET status = 'declined', updated_at = now()
        WHERE id = p_request_id;

        RETURN jsonb_build_object('success', true, 'status', 'declined');
    END IF;
END;
$$;


-- 4. Function to Search Students with Friendship Status & Skills
CREATE OR REPLACE FUNCTION public.search_students(p_query TEXT)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    university TEXT,
    major TEXT,
    avatar_url TEXT,
    friendship_status TEXT,
    friendship_id UUID,
    is_teammate BOOLEAN,
    skills TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_clean_q TEXT := TRIM(COALESCE(p_query, ''));
BEGIN
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH matching_skills AS (
        SELECT ps.profile_id, ARRAY_AGG(s.name) AS skill_names
        FROM public.profile_skills ps
        JOIN public.skills s ON s.id = ps.skill_id
        GROUP BY ps.profile_id
    ),
    my_teammate_ids AS (
        SELECT DISTINCT pm2.profile_id AS teammate_id
        FROM public.project_members pm1
        JOIN public.project_members pm2 ON pm2.project_id = pm1.project_id AND pm2.status = 'active'
        WHERE pm1.profile_id = v_user_id AND pm1.status = 'active' AND pm2.profile_id <> v_user_id
        UNION
        SELECT DISTINCT p.owner_id
        FROM public.project_members pm
        JOIN public.projects p ON p.id = pm.project_id
        WHERE pm.profile_id = v_user_id AND pm.status = 'active' AND p.owner_id <> v_user_id
        UNION
        SELECT DISTINCT pm.profile_id
        FROM public.projects p
        JOIN public.project_members pm ON pm.project_id = p.id AND pm.status = 'active'
        WHERE p.owner_id = v_user_id AND pm.profile_id <> v_user_id
    )
    SELECT
        p.id,
        p.full_name,
        p.university,
        p.major,
        p.avatar_url,
        CASE
            WHEN f.status = 'accepted' THEN 'friends'
            WHEN f.status = 'pending' AND f.sender_id = v_user_id THEN 'pending_sent'
            WHEN f.status = 'pending' AND f.receiver_id = v_user_id THEN 'pending_received'
            ELSE 'none'
        END AS friendship_status,
        f.id AS friendship_id,
        EXISTS (SELECT 1 FROM my_teammate_ids mt WHERE mt.teammate_id = p.id) AS is_teammate,
        COALESCE(ms.skill_names, ARRAY[]::TEXT[]) AS skills
    FROM public.profiles p
    LEFT JOIN matching_skills ms ON ms.profile_id = p.id
    LEFT JOIN public.friendships f ON (
        (f.sender_id = v_user_id AND f.receiver_id = p.id) OR
        (f.sender_id = p.id AND f.receiver_id = v_user_id)
    )
    WHERE p.id <> v_user_id
      AND (
          v_clean_q = '' OR
          p.full_name ILIKE '%' || v_clean_q || '%' OR
          p.university ILIKE '%' || v_clean_q || '%' OR
          p.major ILIKE '%' || v_clean_q || '%' OR
          EXISTS (
              SELECT 1 FROM UNNEST(ms.skill_names) s_name
              WHERE s_name ILIKE '%' || v_clean_q || '%'
          )
      )
    ORDER BY p.full_name ASC
    LIMIT 30;
END;
$$;


-- 5. Updated get_user_all_conversations with Auto-Teammate Direct Chat & Relationship Labels
DROP FUNCTION IF EXISTS public.get_user_all_conversations();

CREATE OR REPLACE FUNCTION public.get_user_all_conversations()
RETURNS TABLE (
    conversation_id UUID,
    type TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    title TEXT,
    subtitle TEXT,
    avatar_url TEXT,
    project_id UUID,
    other_user_id UUID,
    member_count BIGINT,
    last_message_id UUID,
    last_message_content TEXT,
    last_message_sender_id UUID,
    last_message_sender_name TEXT,
    last_message_created_at TIMESTAMPTZ,
    unread_count BIGINT,
    relationship_type TEXT,
    relationship_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    r_teammate RECORD;
    r_friend RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- 1. Auto-initialize project group conversations for projects the user belongs to
    INSERT INTO public.conversations (type, project_id)
    SELECT DISTINCT 'project', p.id
    FROM public.projects p
    LEFT JOIN public.project_members pm ON pm.project_id = p.id AND pm.profile_id = v_user_id AND pm.status = 'active'
    WHERE (p.owner_id = v_user_id OR pm.profile_id = v_user_id)
      AND NOT EXISTS (
          SELECT 1 FROM public.conversations c WHERE c.type = 'project' AND c.project_id = p.id
      );

    -- Sync owner and all active members for project conversations
    INSERT INTO public.conversation_members (conversation_id, user_id)
    SELECT c.id, p.owner_id
    FROM public.conversations c
    JOIN public.projects p ON p.id = c.project_id
    WHERE c.type = 'project'
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    INSERT INTO public.conversation_members (conversation_id, user_id)
    SELECT c.id, pm.profile_id
    FROM public.conversations c
    JOIN public.project_members pm ON pm.project_id = c.project_id
    WHERE c.type = 'project' AND pm.status = 'active'
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    -- 2. AUTO-PROVISION 1-to-1 DIRECT CHATS FOR ALL TEAMMATES IN SHARED PROJECTS
    FOR r_teammate IN (
        -- If current user is project owner: teammates are all active project members
        SELECT DISTINCT pm.profile_id AS teammate_id
        FROM public.projects p
        JOIN public.project_members pm ON pm.project_id = p.id AND pm.status = 'active'
        WHERE p.owner_id = v_user_id AND pm.profile_id <> v_user_id
        UNION
        -- If current user is member: project owner is a teammate
        SELECT DISTINCT p.owner_id AS teammate_id
        FROM public.project_members pm
        JOIN public.projects p ON p.id = pm.project_id
        WHERE pm.profile_id = v_user_id AND pm.status = 'active' AND p.owner_id <> v_user_id
        UNION
        -- Other members of same projects
        SELECT DISTINCT pm2.profile_id AS teammate_id
        FROM public.project_members pm1
        JOIN public.project_members pm2 ON pm2.project_id = pm1.project_id AND pm2.status = 'active'
        WHERE pm1.profile_id = v_user_id AND pm1.status = 'active' AND pm2.profile_id <> v_user_id
    ) LOOP
        IF r_teammate.teammate_id IS NOT NULL THEN
            PERFORM public.get_or_create_direct_conversation(v_user_id, r_teammate.teammate_id);
        END IF;
    END LOOP;

    -- 3. AUTO-PROVISION 1-to-1 DIRECT CHATS FOR ALL ACCEPTED FRIENDS
    FOR r_friend IN (
        SELECT DISTINCT
            CASE WHEN sender_id = v_user_id THEN receiver_id ELSE sender_id END AS friend_id
        FROM public.friendships
        WHERE (sender_id = v_user_id OR receiver_id = v_user_id) AND status = 'accepted'
    ) LOOP
        IF r_friend.friend_id IS NOT NULL THEN
            PERFORM public.get_or_create_direct_conversation(v_user_id, r_friend.friend_id);
        END IF;
    END LOOP;

    -- 4. Return all conversations (direct + project) with relationship metadata
    RETURN QUERY
    WITH my_convs AS (
        SELECT 
            c.id AS c_id,
            c.type AS c_type,
            c.project_id AS c_project_id,
            c.created_at AS c_created_at,
            c.updated_at AS c_updated_at,
            cm.last_read_at AS my_last_read
        FROM public.conversations c
        JOIN public.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = v_user_id
    ),
    conv_members_agg AS (
        SELECT
            cm.conversation_id AS c_id,
            COUNT(cm.id)::BIGINT AS member_count,
            MAX(CASE WHEN cm.user_id <> v_user_id THEN cm.user_id ELSE NULL END) AS other_id
        FROM public.conversation_members cm
        JOIN my_convs mc ON mc.c_id = cm.conversation_id
        GROUP BY cm.conversation_id
    ),
    conv_last_msg AS (
        SELECT DISTINCT ON (m.conversation_id)
            m.conversation_id,
            m.id AS msg_id,
            m.content AS msg_content,
            m.sender_id AS msg_sender_id,
            p.full_name AS sender_name,
            m.created_at AS msg_created_at
        FROM public.messages m
        JOIN my_convs mc ON mc.c_id = m.conversation_id
        LEFT JOIN public.profiles p ON p.id = m.sender_id
        WHERE m.deleted_at IS NULL
        ORDER BY m.conversation_id, m.created_at DESC
    ),
    conv_unread AS (
        SELECT 
            mc.c_id,
            COUNT(m.id)::BIGINT AS unread_cnt
        FROM my_convs mc
        LEFT JOIN public.messages m ON m.conversation_id = mc.c_id
            AND m.sender_id <> v_user_id
            AND m.deleted_at IS NULL
            AND (mc.my_last_read IS NULL OR m.created_at > mc.my_last_read)
        GROUP BY mc.c_id
    ),
    teammate_shared_project AS (
        SELECT DISTINCT ON (t_user.teammate_id)
            t_user.teammate_id,
            t_user.project_name
        FROM (
            SELECT pm.profile_id AS teammate_id, p.name AS project_name
            FROM public.projects p
            JOIN public.project_members pm ON pm.project_id = p.id AND pm.status = 'active'
            WHERE p.owner_id = v_user_id AND pm.profile_id <> v_user_id
            UNION
            SELECT p.owner_id AS teammate_id, p.name AS project_name
            FROM public.project_members pm
            JOIN public.projects p ON p.id = pm.project_id
            WHERE pm.profile_id = v_user_id AND pm.status = 'active' AND p.owner_id <> v_user_id
            UNION
            SELECT pm2.profile_id AS teammate_id, p.name AS project_name
            FROM public.project_members pm1
            JOIN public.project_members pm2 ON pm2.project_id = pm1.project_id AND pm2.status = 'active'
            JOIN public.projects p ON p.id = pm1.project_id
            WHERE pm1.profile_id = v_user_id AND pm1.status = 'active' AND pm2.profile_id <> v_user_id
        ) t_user
    )
    SELECT
        mc.c_id AS conversation_id,
        mc.c_type AS type,
        mc.c_created_at AS created_at,
        mc.c_updated_at AS updated_at,
        CASE 
            WHEN mc.c_type = 'direct' THEN COALESCE(p_other.full_name, 'Unknown User')
            ELSE COALESCE(proj.name, 'Untitled Project')
        END AS title,
        CASE 
            WHEN mc.c_type = 'direct' THEN 
                COALESCE(
                    NULLIF(TRIM(CONCAT_WS(' • ', p_other.university, p_other.major)), ''),
                    'Direct Message'
                )
            ELSE COALESCE(proj.project_type, 'Project Team')
        END AS subtitle,
        CASE 
            WHEN mc.c_type = 'direct' THEN p_other.avatar_url
            ELSE proj.image_url
        END AS avatar_url,
        mc.c_project_id AS project_id,
        cma.other_id AS other_user_id,
        COALESCE(cma.member_count, 1::BIGINT) AS member_count,
        clm.msg_id AS last_message_id,
        clm.msg_content AS last_message_content,
        clm.msg_sender_id AS last_message_sender_id,
        clm.sender_name AS last_message_sender_name,
        clm.msg_created_at AS last_message_created_at,
        COALESCE(cu.unread_cnt, 0::BIGINT) AS unread_count,
        CASE
            WHEN mc.c_type = 'project' THEN 'project'
            WHEN tsp.project_name IS NOT NULL THEN 'teammate'
            WHEN f_rel.status = 'accepted' THEN 'friend'
            ELSE 'none'
        END AS relationship_type,
        CASE
            WHEN mc.c_type = 'project' THEN proj.name
            WHEN tsp.project_name IS NOT NULL THEN tsp.project_name
            WHEN f_rel.status = 'accepted' THEN 'friend'
            ELSE NULL
        END AS relationship_label
    FROM my_convs mc
    LEFT JOIN conv_members_agg cma ON cma.c_id = mc.c_id
    LEFT JOIN public.profiles p_other ON p_other.id = cma.other_id AND mc.c_type = 'direct'
    LEFT JOIN public.projects proj ON proj.id = mc.c_project_id AND mc.c_type = 'project'
    LEFT JOIN conv_last_msg clm ON clm.conversation_id = mc.c_id
    LEFT JOIN conv_unread cu ON cu.c_id = mc.c_id
    LEFT JOIN teammate_shared_project tsp ON tsp.teammate_id = cma.other_id AND mc.c_type = 'direct'
    LEFT JOIN public.friendships f_rel ON (
        (f_rel.sender_id = v_user_id AND f_rel.receiver_id = cma.other_id) OR
        (f_rel.sender_id = cma.other_id AND f_rel.receiver_id = v_user_id)
    ) AND f_rel.status = 'accepted' AND mc.c_type = 'direct'
    ORDER BY COALESCE(clm.msg_created_at, mc.c_created_at) DESC;
END;
$$;
