import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Client } = pg;

const OLD_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ovhbqiapbfnghlwnahiw.supabase.co';
const OLD_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const NEW_DB_URI = 'postgresql://postgres:ewJuMEWkXxFrbH4l@db.sesvoudoekdsiulcmcdb.supabase.co:5432/postgres';

const TABLES = [
  'profiles',
  'user_roles',
  'user_assets',
  'positions',
  'deposits',
  'withdrawals',
  'admin_wallets',
  'admin_wallet_configs',
  'kyc_submissions',
  'support_config',
  'support_messages',
  'notifications',
  'custom_accounts',
  'user_referrals'
];

async function syncAllData() {
  console.log('🔄 Complete Database Transfer Starting...');
  const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY);

  const newClient = new Client({
    connectionString: NEW_DB_URI,
    ssl: { rejectUnauthorized: false }
  });

  await newClient.connect();
  console.log('✅ Connected to target New Supabase DB.');

  async function getTargetColumns(tableName) {
    const res = await newClient.query(
      `SELECT column_name, is_generated 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = $1;`,
      [tableName]
    );
    return new Set(
      res.rows.filter(r => r.is_generated !== 'ALWAYS').map(r => r.column_name)
    );
  }

  for (const table of TABLES) {
    const validColumns = await getTargetColumns(table);
    if (validColumns.size === 0) continue;

    try {
      const { data: rows, error } = await oldSupabase.from(table).select('*');
      if (error || !rows || rows.length === 0) continue;

      console.log(`\n📦 Syncing ${rows.length} row(s) for table "public.${table}"...`);

      let successCount = 0;
      for (const row of rows) {
        if (table === 'profiles' && row.id) {
          const userEmail = (row.email && row.email.trim()) ? row.email.trim() : `user_${row.id}@crypxpro.com`;
          try {
            await newClient.query(`
              INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, is_sso_user)
              VALUES ('00000000-0000-0000-0000-000000000000', $1, $2, 'dummy_hash', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', now(), now(), false)
              ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
            `, [row.id, userEmail]);

            await newClient.query(`
              INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
              VALUES (gen_random_uuid(), $1, jsonb_build_object('sub', $1::text, 'email', $2::text), 'email', $2, now(), now(), now())
              ON CONFLICT DO NOTHING;
            `, [row.id, userEmail]);
          } catch (authErr) {
            // Check if email conflict
            try {
              const fallbackEmail = `user_${row.id.slice(0, 8)}_${Date.now()}@crypxpro.com`;
              await newClient.query(`
                INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, is_sso_user)
                VALUES ('00000000-0000-0000-0000-000000000000', $1, $2, 'dummy_hash', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', now(), now(), false)
                ON CONFLICT (id) DO NOTHING;
              `, [row.id, fallbackEmail]);
            } catch (e2) {
              // Ignore
            }
          }
        }

        const filteredKeys = Object.keys(row).filter(k => validColumns.has(k) && row[k] !== undefined);
        if (filteredKeys.length === 0) continue;

        const colList = filteredKeys.map(k => `"${k}"`).join(', ');
        const valPlaceholders = filteredKeys.map((_, i) => `$${i + 1}`).join(', ');
        const values = filteredKeys.map(k => row[k]);

        let conflictClause = 'ON CONFLICT DO NOTHING';
        if (table === 'profiles') conflictClause = 'ON CONFLICT (id) DO UPDATE SET ' + filteredKeys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
        if (table === 'user_assets') conflictClause = 'ON CONFLICT (user_id, symbol) DO UPDATE SET amount = EXCLUDED.amount';
        if (table === 'admin_wallets') conflictClause = 'ON CONFLICT (symbol, network) DO UPDATE SET address = EXCLUDED.address';
        if (table === 'admin_wallet_configs') conflictClause = 'ON CONFLICT (id) DO UPDATE SET ' + filteredKeys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
        if (table === 'custom_accounts') conflictClause = 'ON CONFLICT (email) DO UPDATE SET ' + filteredKeys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');

        const insertQuery = `
          INSERT INTO public.${table} (${colList})
          VALUES (${valPlaceholders})
          ${conflictClause};
        `;

        try {
          await newClient.query(insertQuery, values);
          successCount++;
        } catch (err) {
          console.error(`  ❌ Failed row insert into "${table}" (ID: ${row.id}):`, err.message);
        }
      }

      console.log(`  ✅ Synced ${successCount}/${rows.length} row(s) into public.${table}`);
    } catch (tableErr) {
      console.error(`  ❌ Error processing table "${table}":`, tableErr.message);
    }
  }

  console.log('\n==================================================');
  console.log('📊 FINAL TARGET DATABASE ROW COUNTS');
  console.log('==================================================');
  for (const table of TABLES) {
    try {
      const res = await newClient.query(`SELECT COUNT(*) FROM public.${table};`);
      console.log(`  ├─ public.${table}: ${res.rows[0].count} row(s)`);
    } catch (e) {
      console.log(`  ├─ public.${table}: Count failed (${e.message})`);
    }
  }

  await newClient.end();
  console.log('\n🎉 Complete Data Migration & Sync Finished!');
}

syncAllData().catch(err => {
  console.error('❌ Data sync failed:', err);
  process.exit(1);
});
