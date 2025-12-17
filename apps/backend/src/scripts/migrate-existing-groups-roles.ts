import path from 'path';

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

import { createDefaultRoles, getRoleByName } from '../utils/roleHelpers';

// Load environment variables from backend/.env
config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE key');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error(
    'Keys available:',
    Object.keys(process.env).filter((k) => k.includes('SUPABASE'))
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateExistingGroups() {
  console.log('Starting migration of existing groups...');

  try {
    // Get all groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name');

    if (groupsError) {
      throw groupsError;
    }

    console.log(`Found ${groups?.length || 0} groups to process`);

    for (const group of groups || []) {
      console.log(`\nProcessing group: ${group.name} (${group.id})`);

      // Check if roles already exist for this group
      const { data: existingRoles, error: rolesError } = await supabase
        .from('group_roles')
        .select('id')
        .eq('group_id', group.id)
        .limit(1);

      if (rolesError) {
        console.error(
          `Error checking roles for group ${group.id}:`,
          rolesError
        );
        continue;
      }

      if (existingRoles && existingRoles.length > 0) {
        console.log(`  ✓ Roles already exist for this group, skipping`);
        continue;
      }

      // Create default roles for this group
      try {
        await createDefaultRoles(supabase, group.id);
        console.log(`  ✓ Created default roles`);

        // Update all existing memberships to have role_id
        const { data: memberships, error: membershipsError } = await supabase
          .from('memberships')
          .select('id, role_name')
          .eq('group_id', group.id)
          .is('role_id', null);

        if (membershipsError) {
          console.error(`  Error fetching memberships:`, membershipsError);
          continue;
        }

        console.log(
          `  Found ${memberships?.length || 0} memberships to update`
        );

        for (const membership of memberships || []) {
          const role = await getRoleByName(
            supabase,
            group.id,
            membership.role_name
          );

          if (role) {
            const { error: updateError } = await supabase
              .from('memberships')
              .update({ role_id: role.id })
              .eq('id', membership.id);

            if (updateError) {
              console.error(
                `  Error updating membership ${membership.id}:`,
                updateError
              );
            } else {
              console.log(
                `  ✓ Updated membership with role ${membership.role_name}`
              );
            }
          }
        }

        console.log(`  ✓ Migration completed for group ${group.name}`);
      } catch (error) {
        console.error(`  Error creating roles for group ${group.id}:`, error);
      }
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateExistingGroups();
