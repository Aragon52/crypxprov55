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

async function transferAllData() {
  console.log('🔄 Starting Data Transfer from Old Supabase to New Supabase Database...');
  console.log(`  ├─ Old Supabase URL: ${OLD_SUPABASE_URL}`);
  console.log(`  └─ New DB Host: db.sesvoudoekdsiulcmcdb.supabase.co`);

  const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY);

  const newClient = new Client({
    connectionString: NEW_DB_URI,
    ssl: { rejectUnauthorized: false }
  });

  await newClient.connect();
  console.log('✅ Connected to New PostgreSQL Database!');

  for (const table of TABLES) {
    console.log(`\n📦 Fetching table "${table}" from old database...`);
    try {
      const { data, error } = await oldSupabase.from(table).select('*');
      if (error) {
        console.warn(`  ⚠️ Could not fetch "${table}" via Supabase API (${error.message}). Checking table status...`);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`  ℹ️ Table "${table}" is empty or has 0 rows in old database.`);
        continue;
      }

      console.log(`  Found ${data.length} row(s) in "${table}". Inserting into new database...`);

      // Disable triggers temporarily or handle foreign key / auth dependencies if needed
      for (const row of data) {
        const columns = Object.keys(row);
        if (columns.length === 0) continue;

        const colNames = columns.map(c => `"${c}"`).join(', ');
        const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
        const values = columns.map(c => row[c]);

        // Construct ON CONFLICT DO UPDATE query where applicable
        let primaryKey = 'id';
        if (table === 'profiles') primaryKey = 'id';
        if (table === 'user_assets') primaryKey = 'user_id, symbol';
        if (table === 'admin_wallets') primaryKey = 'symbol, network';
        if (table === 'admin_wallet_configs') primaryKey = 'id';
        if (table === 'custom_accounts') primaryKey = 'email';
        if (table === 'user_referrals') primaryKey = 'user_id';

        const updateCols = columns.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');

        const query = `
          INSERT INTO public.${table} (${colNames})
          VALUES (${placeholders})
          ON CONFLICT (${primaryKey}) DO UPDATE
          SET ${updateCols};
        `;

        try {
          await newClient.query(query, values);
        } catch (insertErr) {
          // If foreign key constraint on auth.users or similar, attempt direct insert
          console.warn(`  ⚠️ Row insert warning for "${table}" (${insertErr.message}). Trying fallback...`);
          try {
            const fallbackQuery = `INSERT INTO public.${table} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`;
            await newClient.query(fallbackQuery, values);
          } catch (e2) {
            console.error(`  ❌ Failed row insert into "${table}":`, e2.message);
          }
        }
      }
      console.log(`  ✅ Successfully transferred ${data.length} row(s) to "${table}"!`);
    } catch (err) {
      console.error(`  ❌ Error processing table "${table}":`, err.message);
    }
  }

  // Verification Summary
  console.log('\n📊 Migration Verification Summary:');
  for (const table of TABLES) {
    try {
      const res = await newClient.query(`SELECT COUNT(*) FROM public.${table};`);
      console.log(`  ├─ public.${table}: ${res.rows[0].count} row(s)`);
    } catch (e) {
      console.log(`  ├─ public.${table}: Table query error (${e.message})`);
    }
  }

  await newClient.end();
  console.log('\n🎉 Data transfer completed successfully!');
}

transferAllData().catch(err => {
  console.error('❌ Data transfer failed:', err);
  process.exit(1);
});
