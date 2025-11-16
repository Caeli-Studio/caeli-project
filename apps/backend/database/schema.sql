-- =====================================================
-- CAELI - Household Task Management Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Group types
CREATE TYPE group_type AS ENUM ('family', 'roommates', 'company', 'other');

-- Task status
CREATE TYPE task_status AS ENUM ('open', 'done', 'cancelled');

-- Transfer status
CREATE TYPE transfer_status AS ENUM ('pending', 'accepted', 'refused', 'cancelled');

-- Notification types
CREATE TYPE notification_type AS ENUM ('task_reminder', 'transfer_request', 'ping', 'task_assigned', 'task_completed', 'role_changed');

-- Calendar providers
CREATE TYPE calendar_provider AS ENUM ('google', 'apple');

-- Calendar visibility
CREATE TYPE calendar_visibility AS ENUM ('full', 'busy', 'hidden');

-- =====================================================
-- PROFILES
-- =====================================================

CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    pseudo TEXT UNIQUE,
    avatar_url TEXT,
    pin_hash TEXT, -- Hashed PIN for hub/monitor access
    locale TEXT DEFAULT 'en' CHECK (locale IN ('en', 'fr')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_profiles_display_name ON profiles(display_name);
CREATE INDEX idx_profiles_pseudo ON profiles(pseudo);

-- =====================================================
-- GROUPS
-- =====================================================

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type group_type DEFAULT 'family',
    shared_calendar_id TEXT, -- Google Calendar ID for shared calendar
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for group searches
CREATE INDEX idx_groups_type ON groups(type);

-- =====================================================
-- MEMBERSHIPS
-- =====================================================

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL DEFAULT 'member',
    importance INT DEFAULT 50 CHECK (importance BETWEEN 0 AND 100),
    custom_permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,

    -- Ensure unique active membership per user per group
    UNIQUE(group_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_memberships_group ON memberships(group_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_active ON memberships(group_id, user_id) WHERE left_at IS NULL;

-- =====================================================
-- TASK TEMPLATES
-- =====================================================

CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    required_count INT DEFAULT 1,
    is_free BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES memberships(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_templates_group ON task_templates(group_id);

-- =====================================================
-- TASKS
-- =====================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_at TIMESTAMPTZ,
    required_count INT DEFAULT 1 CHECK (required_count > 0),
    is_free BOOLEAN DEFAULT FALSE, -- Free task = anyone can take it
    status task_status DEFAULT 'open',
    created_by UUID REFERENCES memberships(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_group ON tasks(group_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_at) WHERE status = 'open';
CREATE INDEX idx_tasks_group_status ON tasks(group_id, status);

-- =====================================================
-- TASK ASSIGNMENTS
-- =====================================================

CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Prevent duplicate assignments
    UNIQUE(task_id, membership_id)
);

-- Indexes
CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_member ON task_assignments(membership_id);
CREATE INDEX idx_task_assignments_pending ON task_assignments(task_id, membership_id) WHERE completed_at IS NULL;

-- =====================================================
-- TASK TRANSFERS
-- =====================================================

CREATE TABLE task_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    from_membership_id UUID NOT NULL REFERENCES memberships(id),
    to_membership_id UUID REFERENCES memberships(id),
    return_task_id UUID REFERENCES tasks(id), -- For task exchanges
    status transfer_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES memberships(id),

    -- Can't transfer to yourself
    CHECK (from_membership_id != to_membership_id)
);

-- Indexes
CREATE INDEX idx_task_transfers_group ON task_transfers(group_id);
CREATE INDEX idx_task_transfers_from ON task_transfers(from_membership_id);
CREATE INDEX idx_task_transfers_to ON task_transfers(to_membership_id);
CREATE INDEX idx_task_transfers_status ON task_transfers(status);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_member ON notifications(membership_id);
CREATE INDEX idx_notifications_unread ON notifications(membership_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- HUB SESSIONS (Shared Monitor/Screen)
-- =====================================================

CREATE TABLE hub_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL, -- Currently connected member
    device_name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- QR code for connection
    expires_at TIMESTAMPTZ NOT NULL,
    connected_at TIMESTAMPTZ,
    disconnected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Only one active session per group
    CONSTRAINT unique_active_hub_session
        EXCLUDE USING gist (group_id WITH =)
        WHERE (disconnected_at IS NULL AND expires_at > NOW())
);

-- Indexes
CREATE INDEX idx_hub_sessions_group ON hub_sessions(group_id);
CREATE INDEX idx_hub_sessions_code ON hub_sessions(code);
CREATE INDEX idx_hub_sessions_active ON hub_sessions(group_id) WHERE disconnected_at IS NULL;

-- =====================================================
-- CALENDAR CONNECTIONS
-- =====================================================

CREATE TABLE calendar_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    provider calendar_provider NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One connection per provider per member
    UNIQUE(membership_id, provider)
);

-- Index
CREATE INDEX idx_calendar_connections_member ON calendar_connections(membership_id);

-- =====================================================
-- MEMBER PREFERENCES
-- =====================================================

CREATE TABLE member_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    work_address JSONB, -- {street, city, postal_code, country, lat, lng}
    school_address JSONB, -- {street, city, postal_code, country, lat, lng}
    brief_hour TIME, -- Preferred time for daily briefing
    calendar_visibility calendar_visibility DEFAULT 'busy',
    preferences JSONB DEFAULT '{}', -- Additional custom preferences

    -- One preference set per membership
    UNIQUE(membership_id, group_id)
);

-- Index
CREATE INDEX idx_member_preferences_membership ON member_preferences(membership_id);

-- =====================================================
-- AUDIT LOG
-- =====================================================

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    actor_membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'transferred', etc.
    subject_type TEXT NOT NULL, -- 'task', 'group', 'membership', etc.
    subject_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_log_group ON audit_log(group_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_membership_id);
CREATE INDEX idx_audit_log_subject ON audit_log(subject_type, subject_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_connections_updated_at BEFORE UPDATE ON calendar_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Groups: Members can view their groups
CREATE POLICY "Members can view their groups" ON groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.group_id = groups.id
            AND memberships.user_id = auth.uid()
            AND memberships.left_at IS NULL
        )
    );

-- Memberships: Users can view memberships of their groups
CREATE POLICY "Users can view group memberships" ON memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.group_id = memberships.group_id
            AND m.user_id = auth.uid()
            AND m.left_at IS NULL
        )
    );

-- Tasks: Members can view tasks in their groups
CREATE POLICY "Members can view group tasks" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.group_id = tasks.group_id
            AND memberships.user_id = auth.uid()
            AND memberships.left_at IS NULL
        )
    );

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.id = notifications.membership_id
            AND memberships.user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
    p_group_id UUID,
    p_actor_membership_id UUID,
    p_action TEXT,
    p_subject_type TEXT,
    p_subject_id UUID,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_audit_id BIGINT;
BEGIN
    INSERT INTO audit_log (
        group_id,
        actor_membership_id,
        action,
        subject_type,
        subject_id,
        metadata
    ) VALUES (
        p_group_id,
        p_actor_membership_id,
        p_action,
        p_subject_type,
        p_subject_id,
        p_metadata
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active membership for a user in a group
CREATE OR REPLACE FUNCTION get_user_membership(p_user_id UUID, p_group_id UUID)
RETURNS UUID AS $$
DECLARE
    v_membership_id UUID;
BEGIN
    SELECT id INTO v_membership_id
    FROM memberships
    WHERE user_id = p_user_id
    AND group_id = p_group_id
    AND left_at IS NULL
    LIMIT 1;

    RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission in group
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_group_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    SELECT
        (custom_permissions ? p_permission AND (custom_permissions->p_permission)::BOOLEAN = TRUE)
        OR role_name IN ('admin', 'owner')
    INTO v_has_permission
    FROM memberships
    WHERE user_id = p_user_id
    AND group_id = p_group_id
    AND left_at IS NULL;

    RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA / SEED
-- =====================================================

-- Default role templates (can be customized per group)
-- Role names: 'owner', 'admin', 'member', 'child', 'guest'
-- Importance levels: owner=100, admin=80, member=50, child=30, guest=10

COMMENT ON TABLE profiles IS 'User profiles with display name, avatar, and PIN for hub access';
COMMENT ON TABLE groups IS 'Household groups (family, roommates, etc.)';
COMMENT ON TABLE memberships IS 'User membership in groups with roles and permissions';
COMMENT ON TABLE tasks IS 'Tasks to be completed by group members';
COMMENT ON TABLE task_assignments IS 'Assignment of tasks to specific members';
COMMENT ON TABLE task_transfers IS 'Task transfer/exchange requests between members';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE hub_sessions IS 'Sessions for shared monitor/screen access';
COMMENT ON TABLE calendar_connections IS 'OAuth connections to external calendars';
COMMENT ON TABLE member_preferences IS 'Member preferences including addresses and calendar visibility';
COMMENT ON TABLE audit_log IS 'Audit trail of all important actions';
