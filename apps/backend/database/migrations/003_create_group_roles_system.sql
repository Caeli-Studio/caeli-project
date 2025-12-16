-- =====================================================
-- Group Roles System Migration
-- =====================================================
-- This migration creates the group_roles table and updates memberships
-- to support custom roles with granular permissions

-- Step 1: Create group_roles table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.group_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  importance INTEGER NOT NULL DEFAULT 50 CHECK (importance >= 0 AND importance <= 100),
  permissions JSONB NOT NULL DEFAULT '{
    "can_create_tasks": false,
    "can_assign_tasks": false,
    "can_delete_tasks": false,
    "can_manage_members": false,
    "can_edit_group": false,
    "can_manage_roles": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_roles_group_id ON public.group_roles(group_id);
CREATE INDEX IF NOT EXISTS idx_group_roles_name ON public.group_roles(name);

-- Step 2: Add role_id column to memberships (if not exists)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'memberships'
    AND column_name = 'role_id'
  ) THEN
    ALTER TABLE public.memberships
    ADD COLUMN role_id UUID REFERENCES public.group_roles(id) ON DELETE SET NULL;

    -- Create index for faster lookups
    CREATE INDEX idx_memberships_role_id ON public.memberships(role_id);
  END IF;
END $$;

-- Step 3: Function to create default roles for a group
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_default_group_roles(p_group_id UUID)
RETURNS void AS $$
DECLARE
  v_owner_role_id UUID;
  v_admin_role_id UUID;
  v_member_role_id UUID;
  v_child_role_id UUID;
  v_guest_role_id UUID;
BEGIN
  -- Owner role
  INSERT INTO public.group_roles (group_id, name, display_name, description, is_default, importance, permissions)
  VALUES (
    p_group_id,
    'owner',
    'Maître de foyer',
    'Propriétaire du foyer avec tous les droits',
    true,
    100,
    '{
      "can_create_tasks": true,
      "can_assign_tasks": true,
      "can_delete_tasks": true,
      "can_manage_members": true,
      "can_edit_group": true,
      "can_manage_roles": true
    }'::jsonb
  )
  ON CONFLICT (group_id, name) DO NOTHING
  RETURNING id INTO v_owner_role_id;

  -- Admin role
  INSERT INTO public.group_roles (group_id, name, display_name, description, is_default, importance, permissions)
  VALUES (
    p_group_id,
    'admin',
    'Administrateur',
    'Administrateur avec droits de gestion avancés',
    true,
    80,
    '{
      "can_create_tasks": true,
      "can_assign_tasks": true,
      "can_delete_tasks": true,
      "can_manage_members": true,
      "can_edit_group": true,
      "can_manage_roles": false
    }'::jsonb
  )
  ON CONFLICT (group_id, name) DO NOTHING
  RETURNING id INTO v_admin_role_id;

  -- Member role
  INSERT INTO public.group_roles (group_id, name, display_name, description, is_default, importance, permissions)
  VALUES (
    p_group_id,
    'member',
    'Membre',
    'Membre standard du foyer',
    true,
    50,
    '{
      "can_create_tasks": true,
      "can_assign_tasks": true,
      "can_delete_tasks": false,
      "can_manage_members": false,
      "can_edit_group": false,
      "can_manage_roles": false
    }'::jsonb
  )
  ON CONFLICT (group_id, name) DO NOTHING
  RETURNING id INTO v_member_role_id;

  -- Child role
  INSERT INTO public.group_roles (group_id, name, display_name, description, is_default, importance, permissions)
  VALUES (
    p_group_id,
    'child',
    'Enfant',
    'Enfant avec accès limité',
    true,
    30,
    '{
      "can_create_tasks": false,
      "can_assign_tasks": false,
      "can_delete_tasks": false,
      "can_manage_members": false,
      "can_edit_group": false,
      "can_manage_roles": false
    }'::jsonb
  )
  ON CONFLICT (group_id, name) DO NOTHING
  RETURNING id INTO v_child_role_id;

  -- Guest role
  INSERT INTO public.group_roles (group_id, name, display_name, description, is_default, importance, permissions)
  VALUES (
    p_group_id,
    'guest',
    'Invité',
    'Invité avec accès en lecture seule',
    true,
    10,
    '{
      "can_create_tasks": false,
      "can_assign_tasks": false,
      "can_delete_tasks": false,
      "can_manage_members": false,
      "can_edit_group": false,
      "can_manage_roles": false
    }'::jsonb
  )
  ON CONFLICT (group_id, name) DO NOTHING
  RETURNING id INTO v_guest_role_id;

  RAISE NOTICE 'Created default roles for group %', p_group_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Trigger to auto-create default roles for new groups
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_default_group_roles(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group();

-- Step 5: Create default roles for ALL existing groups
-- =====================================================
DO $$
DECLARE
  v_group RECORD;
  v_role_count INTEGER;
BEGIN
  FOR v_group IN SELECT id, name FROM public.groups
  LOOP
    -- Check if roles already exist
    SELECT COUNT(*) INTO v_role_count
    FROM public.group_roles
    WHERE group_id = v_group.id;

    IF v_role_count = 0 THEN
      PERFORM public.create_default_group_roles(v_group.id);
      RAISE NOTICE 'Created default roles for existing group: % (%)', v_group.name, v_group.id;
    ELSE
      RAISE NOTICE 'Group % already has % roles, skipping', v_group.name, v_role_count;
    END IF;
  END LOOP;
END $$;

-- Step 6: Update existing memberships to link with role_id
-- =====================================================
DO $$
DECLARE
  v_membership RECORD;
  v_role_id UUID;
BEGIN
  FOR v_membership IN
    SELECT id, group_id, role_name
    FROM public.memberships
    WHERE role_id IS NULL
  LOOP
    -- Find the corresponding role_id
    SELECT id INTO v_role_id
    FROM public.group_roles
    WHERE group_id = v_membership.group_id
      AND name = v_membership.role_name
    LIMIT 1;

    IF v_role_id IS NOT NULL THEN
      UPDATE public.memberships
      SET role_id = v_role_id
      WHERE id = v_membership.id;

      RAISE NOTICE 'Updated membership % with role_id %', v_membership.id, v_role_id;
    ELSE
      RAISE WARNING 'Could not find role for membership % (group: %, role_name: %)',
        v_membership.id, v_membership.group_id, v_membership.role_name;
    END IF;
  END LOOP;
END $$;

-- Step 7: Verification
-- =====================================================
DO $$
DECLARE
  v_group_count INTEGER;
  v_role_count INTEGER;
  v_membership_count INTEGER;
  v_membership_with_role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_group_count FROM public.groups;
  SELECT COUNT(*) INTO v_role_count FROM public.group_roles;
  SELECT COUNT(*) INTO v_membership_count FROM public.memberships;
  SELECT COUNT(*) INTO v_membership_with_role_count FROM public.memberships WHERE role_id IS NOT NULL;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Migration Complete!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total groups: %', v_group_count;
  RAISE NOTICE 'Total roles created: %', v_role_count;
  RAISE NOTICE 'Total memberships: %', v_membership_count;
  RAISE NOTICE 'Memberships with role_id: %', v_membership_with_role_count;
  RAISE NOTICE '';

  IF v_group_count * 5 = v_role_count THEN
    RAISE NOTICE '✅ All groups have 5 default roles!';
  ELSE
    RAISE WARNING '⚠️  Expected % roles but found %', v_group_count * 5, v_role_count;
  END IF;

  IF v_membership_count = v_membership_with_role_count THEN
    RAISE NOTICE '✅ All memberships have role_id assigned!';
  ELSE
    RAISE WARNING '⚠️  % memberships still missing role_id', v_membership_count - v_membership_with_role_count;
  END IF;
END $$;

-- Display summary of roles per group
SELECT
  g.name as group_name,
  COUNT(gr.id) as role_count,
  COUNT(m.id) as member_count
FROM public.groups g
LEFT JOIN public.group_roles gr ON gr.group_id = g.id
LEFT JOIN public.memberships m ON m.group_id = g.id AND m.left_at IS NULL
GROUP BY g.id, g.name
ORDER BY g.created_at DESC;
