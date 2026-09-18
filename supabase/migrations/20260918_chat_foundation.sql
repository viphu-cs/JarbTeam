-- ==============================================================================
-- Migration: 20260918_chat_foundation.sql
-- JarbTeam Chat Database & Supabase Realtime Foundation (Phase 1)
-- ==============================================================================

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    project_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_conversations_type CHECK (type IN ('direct', 'project')),
    CONSTRAINT chk_conversations_project_rule CHECK (
        (type = 'direct' AND project_id IS NULL) OR
        (type = 'project' AND project_id IS NOT NULL)
    ),
    CONSTRAINT fk_conversations_project FOREIGN KEY (project_id)
        REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Unique constraint for project conversations (only 1 conversation per project)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_project_id_unique
    ON public.conversations (project_id)
    WHERE project_id IS NOT NULL;


-- 2. Create conversation_members table
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at TIMESTAMPTZ NULL,

    -- Constraints
    CONSTRAINT uq_conversation_members_conversation_user UNIQUE (conversation_id, user_id),
    CONSTRAINT fk_conversation_members_conversation FOREIGN KEY (conversation_id)
        REFERENCES public.conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_members_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_members_profile FOREIGN KEY (user_id)
        REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- 3. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NULL,
    attachment_url TEXT NULL,
    attachment_type TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL,

    -- Constraints
    CONSTRAINT chk_messages_content_or_attachment CHECK (
        (content IS NOT NULL AND trim(content) <> '') OR
        (attachment_url IS NOT NULL AND trim(attachment_url) <> '')
    ),
    CONSTRAINT chk_messages_attachment_type CHECK (
        attachment_type IS NULL OR attachment_type IN ('image')
    ),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id)
        REFERENCES public.conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender_profile FOREIGN KEY (sender_id)
        REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
    ON public.messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
    ON public.messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id
    ON public.conversation_members (user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id
    ON public.conversation_members (conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversations_project_id
    ON public.conversations (project_id);


-- 5. Business Logic Triggers & Integrity Guards

-- Guard A: Prevent direct conversations from exceeding 2 members
CREATE OR REPLACE FUNCTION public.check_conversation_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_conv_type TEXT;
    v_member_count INT;
    v_already_member BOOLEAN;
BEGIN
    SELECT type INTO v_conv_type FROM public.conversations WHERE id = NEW.conversation_id;
    IF v_conv_type = 'direct' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_id = NEW.conversation_id AND user_id = NEW.user_id
        ) INTO v_already_member;

        IF NOT v_already_member THEN
            SELECT COUNT(*) INTO v_member_count
            FROM public.conversation_members
            WHERE conversation_id = NEW.conversation_id;

            IF v_member_count >= 2 THEN
                RAISE EXCEPTION 'Direct conversations cannot have more than 2 members.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_conversation_member_limit ON public.conversation_members;
CREATE TRIGGER trg_check_conversation_member_limit
BEFORE INSERT ON public.conversation_members
FOR EACH ROW EXECUTE FUNCTION public.check_conversation_member_limit();


-- Guard B: Prevent duplicate direct conversations between the same two users
CREATE OR REPLACE FUNCTION public.check_duplicate_direct_conversation()
RETURNS TRIGGER AS $$
DECLARE
    v_conv_type TEXT;
    v_other_user_id UUID;
    v_existing_conv UUID;
BEGIN
    SELECT type INTO v_conv_type FROM public.conversations WHERE id = NEW.conversation_id;
    IF v_conv_type = 'direct' THEN
        -- Find if this conversation already has 1 member
        SELECT user_id INTO v_other_user_id
        FROM public.conversation_members
        WHERE conversation_id = NEW.conversation_id
          AND user_id <> NEW.user_id
        LIMIT 1;

        IF v_other_user_id IS NOT NULL THEN
            -- Check if another direct conversation already exists for (NEW.user_id, v_other_user_id)
            SELECT c.id INTO v_existing_conv
            FROM public.conversations c
            JOIN public.conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = NEW.user_id
            JOIN public.conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = v_other_user_id
            WHERE c.type = 'direct' AND c.id <> NEW.conversation_id
            LIMIT 1;

            IF v_existing_conv IS NOT NULL THEN
                RAISE EXCEPTION 'A direct conversation between these two users already exists: %', v_existing_conv;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_duplicate_direct_conversation ON public.conversation_members;
CREATE TRIGGER trg_check_duplicate_direct_conversation
BEFORE INSERT ON public.conversation_members
FOR EACH ROW EXECUTE FUNCTION public.check_duplicate_direct_conversation();


-- Guard C: Sync project membership to conversation_members
CREATE OR REPLACE FUNCTION public.sync_project_member_to_conversation()
RETURNS TRIGGER AS $$
DECLARE
    v_conv_id UUID;
BEGIN
    IF NEW.status = 'active' THEN
        SELECT id INTO v_conv_id
        FROM public.conversations
        WHERE type = 'project' AND project_id = NEW.project_id;

        IF v_conv_id IS NOT NULL THEN
            INSERT INTO public.conversation_members (conversation_id, user_id)
            VALUES (v_conv_id, NEW.profile_id)
            ON CONFLICT (conversation_id, user_id) DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_project_member_to_conversation ON public.project_members;
CREATE TRIGGER trg_sync_project_member_to_conversation
AFTER INSERT OR UPDATE ON public.project_members
FOR EACH ROW EXECUTE FUNCTION public.sync_project_member_to_conversation();


-- Guard D: Remove from conversation_members when removed from project_members
CREATE OR REPLACE FUNCTION public.sync_project_member_removal_from_conversation()
RETURNS TRIGGER AS $$
DECLARE
    v_conv_id UUID;
    v_owner_id UUID;
BEGIN
    SELECT id INTO v_conv_id
    FROM public.conversations
    WHERE type = 'project' AND project_id = OLD.project_id;

    IF v_conv_id IS NOT NULL THEN
        SELECT owner_id INTO v_owner_id FROM public.projects WHERE id = OLD.project_id;
        IF OLD.profile_id <> v_owner_id THEN
            DELETE FROM public.conversation_members
            WHERE conversation_id = v_conv_id AND user_id = OLD.profile_id;
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_project_member_removal ON public.project_members;
CREATE TRIGGER trg_sync_project_member_removal
AFTER DELETE ON public.project_members
FOR EACH ROW EXECUTE FUNCTION public.sync_project_member_removal_from_conversation();


-- 6. Core Database Functions

-- Function 1: Check if user is conversation member
CREATE OR REPLACE FUNCTION public.is_conversation_member(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_conv_type TEXT;
    v_project_id UUID;
    v_is_member BOOLEAN;
BEGIN
    IF p_conversation_id IS NULL OR p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT type, project_id INTO v_conv_type, v_project_id
    FROM public.conversations
    WHERE id = p_conversation_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_conv_type = 'direct' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_id = p_conversation_id AND user_id = p_user_id
        ) INTO v_is_member;
        RETURN v_is_member;
    ELSIF v_conv_type = 'project' THEN
        -- Check project_members as source of truth, project owner, or conversation_members
        SELECT EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = v_project_id
              AND profile_id = p_user_id
              AND status = 'active'
        ) OR EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = v_project_id
              AND owner_id = p_user_id
        ) OR EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_id = p_conversation_id
              AND user_id = p_user_id
        ) INTO v_is_member;
        RETURN v_is_member;
    END IF;

    RETURN FALSE;
END;
$$;


-- Function 2: Get or Create Direct Conversation
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
    p_user_a UUID,
    p_user_b UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conv_id UUID;
    v_u1 UUID;
    v_u2 UUID;
BEGIN
    IF p_user_a IS NULL OR p_user_b IS NULL THEN
        RAISE EXCEPTION 'Both users must be provided.';
    END IF;

    IF p_user_a = p_user_b THEN
        RAISE EXCEPTION 'Cannot create a direct conversation with yourself.';
    END IF;

    -- Verify authorization: current auth user must be party to the conversation or service role
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_a AND auth.uid() <> p_user_b THEN
        RAISE EXCEPTION 'Unauthorized: You cannot create conversations for other users.';
    END IF;

    -- Sort user IDs deterministically to avoid concurrency deadlocks
    IF p_user_a > p_user_b THEN
        v_u1 := p_user_b;
        v_u2 := p_user_a;
    ELSE
        v_u1 := p_user_a;
        v_u2 := p_user_b;
    END IF;

    -- Acquire transaction advisory lock for this pair
    PERFORM pg_advisory_xact_lock(hashtext('direct:' || v_u1::text || ':' || v_u2::text));

    -- Check if direct conversation already exists
    SELECT c.id INTO v_conv_id
    FROM public.conversations c
    JOIN public.conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = v_u1
    JOIN public.conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = v_u2
    WHERE c.type = 'direct'
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
        RETURN v_conv_id;
    END IF;

    -- Create new direct conversation
    INSERT INTO public.conversations (type, project_id)
    VALUES ('direct', NULL)
    RETURNING id INTO v_conv_id;

    -- Add members
    INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES (v_conv_id, v_u1), (v_conv_id, v_u2);

    RETURN v_conv_id;
END;
$$;


-- Function 3: Get or Create Project Conversation
CREATE OR REPLACE FUNCTION public.get_or_create_project_conversation(
    p_project_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conv_id UUID;
    v_owner_id UUID;
    v_is_member BOOLEAN;
BEGIN
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION 'Project ID must be provided.';
    END IF;

    -- Check project existence
    SELECT owner_id INTO v_owner_id
    FROM public.projects
    WHERE id = p_project_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found: %', p_project_id;
    END IF;

    -- Verify authorization: current user must be owner or project member (if authenticated)
    IF auth.uid() IS NOT NULL THEN
        SELECT (
            v_owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.project_members
                WHERE project_id = p_project_id
                  AND profile_id = auth.uid()
                  AND status = 'active'
            )
        ) INTO v_is_member;

        IF NOT v_is_member THEN
            RAISE EXCEPTION 'Unauthorized: User % is not a member of project %', auth.uid(), p_project_id;
        END IF;
    END IF;

    -- Acquire transaction advisory lock for project conversation creation
    PERFORM pg_advisory_xact_lock(hashtext('project:' || p_project_id::text));

    -- Check if project conversation already exists
    SELECT id INTO v_conv_id
    FROM public.conversations
    WHERE type = 'project' AND project_id = p_project_id;

    IF v_conv_id IS NULL THEN
        INSERT INTO public.conversations (type, project_id)
        VALUES ('project', p_project_id)
        RETURNING id INTO v_conv_id;
    END IF;

    -- Sync project owner into conversation_members
    INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES (v_conv_id, v_owner_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    -- Sync all active project members into conversation_members
    INSERT INTO public.conversation_members (conversation_id, user_id)
    SELECT v_conv_id, pm.profile_id
    FROM public.project_members pm
    WHERE pm.project_id = p_project_id AND pm.status = 'active'
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    RETURN v_conv_id;
END;
$$;


-- 7. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations Policies
DROP POLICY IF EXISTS "Users can view conversations they belong to" ON public.conversations;
CREATE POLICY "Users can view conversations they belong to"
    ON public.conversations
    FOR SELECT
    TO authenticated
    USING (
        public.is_conversation_member(id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
    ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (type = 'direct' AND project_id IS NULL) OR
        (type = 'project' AND project_id IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = conversations.project_id AND p.owner_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM public.project_members pm
                WHERE pm.project_id = conversations.project_id AND pm.profile_id = auth.uid() AND pm.status = 'active'
            )
        ))
    );

DROP POLICY IF EXISTS "Users can update conversations they belong to" ON public.conversations;
CREATE POLICY "Users can update conversations they belong to"
    ON public.conversations
    FOR UPDATE
    TO authenticated
    USING (
        public.is_conversation_member(id, auth.uid())
    )
    WITH CHECK (
        public.is_conversation_member(id, auth.uid())
    );

-- Conversation Members Policies
DROP POLICY IF EXISTS "Users can view conversation members of their conversations" ON public.conversation_members;
CREATE POLICY "Users can view conversation members of their conversations"
    ON public.conversation_members
    FOR SELECT
    TO authenticated
    USING (
        public.is_conversation_member(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert their own conversation membership" ON public.conversation_members;
CREATE POLICY "Users can insert their own conversation membership"
    ON public.conversation_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR
        public.is_conversation_member(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own conversation membership" ON public.conversation_members;
CREATE POLICY "Users can update their own conversation membership"
    ON public.conversation_members
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
    )
    WITH CHECK (
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can delete their own conversation membership" ON public.conversation_members;
CREATE POLICY "Users can delete their own conversation membership"
    ON public.conversation_members
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- Messages Policies
DROP POLICY IF EXISTS "Users can view messages in conversations they belong to" ON public.messages;
CREATE POLICY "Users can view messages in conversations they belong to"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        public.is_conversation_member(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert messages into conversations they belong to" ON public.messages;
CREATE POLICY "Users can insert messages into conversations they belong to"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND
        public.is_conversation_member(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = sender_id AND
        public.is_conversation_member(conversation_id, auth.uid())
    )
    WITH CHECK (
        auth.uid() = sender_id AND
        public.is_conversation_member(conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages"
    ON public.messages
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = sender_id AND
        public.is_conversation_member(conversation_id, auth.uid())
    );


-- 8. Enable Supabase Realtime for Messages Table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
