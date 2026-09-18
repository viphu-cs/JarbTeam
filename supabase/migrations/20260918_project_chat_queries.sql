-- ==============================================================================
-- Migration: 20260918_project_chat_queries.sql
-- JarbTeam Unified & Project Chat Queries (Phase 3)
-- ==============================================================================

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
    unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- 1. Auto-initialize project conversations for any projects the user is in that don't have one yet
    INSERT INTO public.conversations (type, project_id)
    SELECT DISTINCT 'project', p.id
    FROM public.projects p
    LEFT JOIN public.project_members pm ON pm.project_id = p.id AND pm.profile_id = v_user_id AND pm.status = 'active'
    WHERE (p.owner_id = v_user_id OR pm.profile_id = v_user_id)
      AND NOT EXISTS (
          SELECT 1 FROM public.conversations c WHERE c.type = 'project' AND c.project_id = p.id
      );

    -- 2. Sync owner and all active members for project conversations
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

    -- 3. Return all conversations (direct + project) for current user
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
        COALESCE(cu.unread_cnt, 0::BIGINT) AS unread_count
    FROM my_convs mc
    LEFT JOIN conv_members_agg cma ON cma.c_id = mc.c_id
    LEFT JOIN public.profiles p_other ON p_other.id = cma.other_id AND mc.c_type = 'direct'
    LEFT JOIN public.projects proj ON proj.id = mc.c_project_id AND mc.c_type = 'project'
    LEFT JOIN conv_last_msg clm ON clm.conversation_id = mc.c_id
    LEFT JOIN conv_unread cu ON cu.c_id = mc.c_id
    ORDER BY COALESCE(clm.msg_created_at, mc.c_created_at) DESC;
END;
$$;
