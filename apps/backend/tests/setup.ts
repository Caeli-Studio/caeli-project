import { createClient } from '@supabase/supabase-js';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Configuration pour les tests - VALEURS EN DUR
const SUPABASE_URL = 'https://iqimcokjruundhupcfyu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxaW1jb2tqcnV1bmRodXBjZnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NjMzMzksImV4cCI6MjA3NTQzOTMzOX0.eR6rKGTSToD1R2LoQKb-xItkO-tzAH4cRvcyoxqwJcU';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxaW1jb2tqcnV1bmRodXBjZnl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg2MzMzOSwiZXhwIjoyMDc1NDM5MzM5fQ.fsbt9QEhUaf6mXke9ZoAbfhogzceyA3Sd9q4XFtW-v4';

// Créer les clients Supabase pour les tests
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Configuration globale avant tous les tests
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);

  // Vérifier la connexion à Supabase
  try {
    const { error } = await supabaseClient
      .from('users')
      .select('count')
      .limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table not found (OK en test)
      console.warn('⚠️  Warning: Supabase connection issue:', error.message);
    } else {
      console.log('✅ Supabase connection OK');
    }
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
  }
});

// Nettoyer après chaque test (optionnel)
afterEach(async () => {
  // Vous pouvez ajouter du nettoyage ici si nécessaire
});

// Nettoyer après tous les tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
});
