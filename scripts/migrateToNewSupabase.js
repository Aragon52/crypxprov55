import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const NEW_DB_URI = 'postgresql://postgres:ewJuMEWkXxFrbH4l@db.sesvoudoekdsiulcmcdb.supabase.co:5432/postgres';

async function migrate() {
  console.log('🚀 Connecting to New Supabase Database...');
  const client = new Client({
    connectionString: NEW_DB_URI,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected to target Supabase database!');

  // 1. Run consolidated schema
  console.log('📜 Applying schema.sql...');
  const schemaSql = fs.readFileSync('schema.sql', 'utf8');
  await client.query(schemaSql);
  console.log('✅ Applied schema.sql successfully!');

  // 2. Run setup admin auth SQL
  console.log('📜 Applying setup_admin_auth.sql...');
  const authSql = fs.readFileSync('setup_admin_auth.sql', 'utf8');
  await client.query(authSql);
  console.log('✅ Applied setup_admin_auth.sql successfully!');

  // 3. Create Primary Owners and Administrative Accounts
  console.log('🔐 Seeding Primary Admin Accounts into New Supabase...');
  const fullPermissions = JSON.stringify({
    dashboard: true,
    users: true,
    'financial-status': true,
    'deposit-requests': true,
    withdrawals: true,
    futures: true,
    'sample-tokens': true,
    kyc: true,
    wallets: true,
    'customer-service': true,
    support: true,
    administrator: true,
    'database-export': true
  });

  const primaryAdmins = [
    { email: 'arkarnaung009@gmail.com', password: 'AungMoe$357', username: 'Primary Owner', id: 'OWNER-001', role: 'admin' },
    { email: 'heathercarpe34@gmail.com', password: 'AungMoe$357', username: 'Heather Carpe', id: 'OWNER-002', role: 'admin' },
    { email: 'lovelybird33333@gmail.com', password: 'AungMoe$357', username: 'Lovely Bird', id: 'OWNER-003', role: 'admin' },
    { email: 'admin2@crypxpro.com', password: 'AungMoe$357', username: 'Admin 2', id: 'CXPAD-002', role: 'admin' }
  ];

  for (const adm of primaryAdmins) {
    try {
      const res = await client.query(
        'SELECT public.create_custom_admin($1, $2, $3, $4, $5, $6::jsonb);',
        [adm.email, adm.password, adm.username, adm.id, adm.role, fullPermissions]
      );
      console.log(`  └─ Created admin ${adm.email} (ID: ${res.rows[0].create_custom_admin})`);
    } catch (err) {
      console.error(`  └─ Error creating admin ${adm.email}:`, err.message);
    }
  }

  // 4. Verify profiles and custom_accounts tables
  const profRes = await client.query('SELECT id, email, is_admin FROM public.profiles;');
  console.log(`✅ Profiles count in new DB: ${profRes.rows.length}`);

  const customAccRes = await client.query('SELECT custom_id, email, role FROM public.custom_accounts;');
  console.log(`✅ Custom accounts count in new DB: ${customAccRes.rows.length}`);

  await client.end();
  console.log('🎉 Migration script finished successfully!');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
