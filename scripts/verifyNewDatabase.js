import pg from 'pg';

const { Client } = pg;
const NEW_DB_URI = 'postgresql://postgres:ewJuMEWkXxFrbH4l@db.sesvoudoekdsiulcmcdb.supabase.co:5432/postgres';

async function verifyDatabaseData() {
  console.log('🔍 Connecting to New Supabase Database for Audit & Verification...\n');
  const client = new Client({
    connectionString: NEW_DB_URI,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('=================================================================');
  console.log('1. USER PROFILES & ACCOUNTS VERIFICATION');
  console.log('=================================================================');
  const profilesRes = await client.query(`
    SELECT id, email, display_name, username, ftid, balance, futures_balance, staked_balance, kyc_status, is_admin, force_win, force_loss, created_at
    FROM public.profiles
    ORDER BY created_at DESC;
  `);

  console.log(`✅ Total Profiles Found: ${profilesRes.rows.length}`);
  console.log('\nSample User Profiles (First 10):');
  profilesRes.rows.slice(0, 10).forEach((p, idx) => {
    console.log(`  [${idx + 1}] ${p.email || 'No Email'} (${p.display_name || p.username || 'Unnamed'}) | FTID: ${p.ftid || 'N/A'}`);
    console.log(`      ├─ Spot Balance: $${Number(p.balance || 0).toLocaleString()} | Futures: $${Number(p.futures_balance || 0).toLocaleString()} | Staked: $${Number(p.staked_balance || 0).toLocaleString()}`);
    console.log(`      └─ KYC: ${p.kyc_status} | Admin: ${p.is_admin} | Override: Win=${p.force_win}, Loss=${p.force_loss}`);
  });

  console.log('\n=================================================================');
  console.log('2. FINANCIAL BALANCES AGGREGATE SUMMARY');
  console.log('=================================================================');
  const balanceAggRes = await client.query(`
    SELECT 
      COUNT(*) as total_users,
      SUM(balance) as total_spot_balance,
      SUM(futures_balance) as total_futures_balance,
      SUM(staked_balance) as total_staked_balance,
      COUNT(CASE WHEN balance > 0 OR futures_balance > 0 OR staked_balance > 0 THEN 1 END) as users_with_funded_accounts
    FROM public.profiles;
  `);

  const agg = balanceAggRes.rows[0];
  console.log(`  ├─ Total Registered Users: ${agg.total_users}`);
  console.log(`  ├─ Accounts with Funded Balances: ${agg.users_with_funded_accounts}`);
  console.log(`  ├─ Aggregate Spot Balances: $${Number(agg.total_spot_balance || 0).toLocaleString()}`);
  console.log(`  ├─ Aggregate Futures Balances: $${Number(agg.total_futures_balance || 0).toLocaleString()}`);
  console.log(`  └─ Aggregate Staked Yield Balances: $${Number(agg.total_staked_balance || 0).toLocaleString()}`);

  console.log('\n=================================================================');
  console.log('3. FUTURES TRADING POSITIONS VERIFICATION');
  console.log('=================================================================');
  const positionsRes = await client.query(`
    SELECT id, user_id, pair, amount, margin, leverage, entry_price, type, status, pnl, created_at
    FROM public.positions
    ORDER BY created_at DESC;
  `);

  console.log(`✅ Total Positions Found: ${positionsRes.rows.length}`);
  if (positionsRes.rows.length > 0) {
    positionsRes.rows.forEach((pos, idx) => {
      console.log(`  [${idx + 1}] Pair: ${pos.pair} | ${pos.type} ${pos.leverage}x | Margin: $${pos.margin} | Status: ${pos.status} | PnL: $${pos.pnl || 0}`);
    });
  } else {
    console.log('  ℹ️ No active/past open positions present in current database state.');
  }

  console.log('\n=================================================================');
  console.log('4. USER CRYPTO ASSET BALANCES (user_assets)');
  console.log('=================================================================');
  const assetsRes = await client.query(`
    SELECT symbol, SUM(amount) as total_amount, COUNT(DISTINCT user_id) as holder_count
    FROM public.user_assets
    GROUP BY symbol;
  `);

  console.log(`✅ Total Asset Categories: ${assetsRes.rows.length}`);
  if (assetsRes.rows.length > 0) {
    assetsRes.rows.forEach((asset) => {
      console.log(`  ├─ ${asset.symbol}: Total Amount ${asset.total_amount} across ${asset.holder_count} user(s)`);
    });
  } else {
    console.log('  ℹ️ User crypto token holdings (user_assets) table is clear / 0 records.');
  }

  console.log('\n=================================================================');
  console.log('5. DEPOSITS & WITHDRAWALS AUDIT');
  console.log('=================================================================');
  const depRes = await client.query(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM public.deposits;`);
  const withRes = await client.query(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM public.withdrawals;`);

  console.log(`  ├─ Deposits: ${depRes.rows[0].count} transaction(s) | Total Amount: $${Number(depRes.rows[0].total).toLocaleString()}`);
  console.log(`  └─ Withdrawals: ${withRes.rows[0].count} transaction(s) | Total Amount: $${Number(withRes.rows[0].total).toLocaleString()}`);

  console.log('\n=================================================================');
  console.log('6. CUSTOM ADMIN ACCOUNTS & PERMISSIONS');
  console.log('=================================================================');
  const adminRes = await client.query(`SELECT custom_id, email, username, role FROM public.custom_accounts;`);
  console.log(`✅ Total Admin Accounts: ${adminRes.rows.length}`);
  adminRes.rows.forEach((a) => {
    console.log(`  ├─ [${a.custom_id}] ${a.email} (${a.username}) - Role: ${a.role}`);
  });

  await client.end();
  console.log('\n✅ Database Audit Completed Successfully!');
}

verifyDatabaseData().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
