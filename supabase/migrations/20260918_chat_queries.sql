-- ==============================================================================
-- Migration: 20260918_chat_queries.sql
-- JarbTeam Direct Chat Queries & Unread Counting Functions (Phase 2)
-- ==============================================================================

-- Function 1: Get all direct conversations for current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_direct_conversations()
RETURNS TABLE (
    conversation_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_avatar TEXT,
    other_user_university TEXT,
    other_user_major TEXT,
    last_message_id UUID,
    last_message_content TEXT,
    last_message_sender_id UUID,
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

    RETURN QUERY
    WITH my_direct_convs AS (
        SELECT 
            c.id AS c_id,
            c.created_at AS c_created_at,
            c.updated_at AS c_updated_at,
            cm.last_read_at AS my_last_read
        FROM public.conversations c
        JOIN public.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = v_user_id
        WHERE c.type = 'direct'
    ),
    conv_other_member AS (
        SELECT 
            mdc.c_id,
            cm_other.user_id AS other_id
        FROM my_direct_convs mdc
        JOIN public.conversation_members cm_other ON cm_other.conversation_id = mdc.c_id AND cm_other.user_id <> v_user_id
    ),
    conv_last_msg AS (
        SELECT DISTINCT ON (m.conversation_id)
            m.conversation_id,
            m.id AS msg_id,
            m.content AS msg_content,
            m.sender_id AS msg_sender_id,
            m.created_at AS msg_created_at
        FROM public.messages m
        JOIN my_direct_convs mdc ON mdc.c_id = m.conversation_id
        WHERE m.deleted_at IS NULL
        ORDER BY m.conversation_id, m.created_at DESC
    ),
    conv_unread AS (
        SELECT 
            mdc.c_id,
            COUNT(m.id) AS unread_cnt
        FROM my_direct_convs mdc
        LEFT JOIN public.messages m ON m.conversation_id = mdc.c_id
            AND m.sender_id <> v_user_id
            AND m.deleted_at IS NULL
            AND (mdc.my_last_read IS NULL OR m.created_at > mdc.my_last_read)
        GROUP BY mdc.c_id
    )
    SELECT
        mdc.c_id AS conversation_id,
        mdc.c_created_at AS created_at,
        mdc.c_updated_at AS updated_at,
        com.other_id AS other_user_id,
        p.full_name AS other_user_name,
        p.avatar_url AS other_user_avatar,
        p.university AS other_user_university,
        p.major AS other_user_major,
        clm.msg_id AS last_message_id,
        clm.msg_content AS last_message_content,
        clm.msg_sender_id AS last_message_sender_id,
        clm.msg_created_at AS last_message_created_at,
        COALESCE(cu.unread_cnt, 0) AS unread_count
    FROM my_direct_convs mdc
    LEFT JOIN conv_other_member com ON com.c_id = mdc.c_id
    LEFT JOIN public.profiles p ON p.id = com.other_id
    LEFT JOIN conv_last_msg clm ON clm.conversation_id = mdc.c_id
    LEFT JOIN conv_unread cu ON cu.c_id = mdc.c_id
    ORDER BY COALESCE(clm.msg_created_at, mdc.c_created_at) DESC;
END;
$$;

-- Function 2: Get total unread direct message count for current authenticated user
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_total BIGINT;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN 0;
    END IF;

    SELECT COUNT(m.id) INTO v_total
    FROM public.conversation_members cm
    JOIN public.messages m ON m.conversation_id = cm.conversation_id
        AND m.sender_id <> v_user_id
        AND m.deleted_at IS NULL
        AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
    WHERE cm.user_id = v_user_id;

    RETURN COALESCE(v_total, 0);
END;
$$;
