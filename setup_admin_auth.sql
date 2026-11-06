-- Run this script in your Supabase SQL Editor

-- 1. Function to create a custom admin/staff user directly into Supabase Auth
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
    -- Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
    
    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        v_identity_id := gen_random_uuid();

        -- Insert into auth.users
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

        -- Insert into auth.identities
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
        -- Update existing user's password and repair email_confirmed_at
        UPDATE auth.users
        SET encrypted_password = crypt(p_password, gen_salt('bf', 10)),
            raw_user_meta_data = jsonb_build_object('username', p_username, 'custom_id', p_custom_id, 'role', p_role),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE id = v_user_id;
    END IF;

    -- Add admin role to user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Upsert custom_accounts
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


-- 2. Function to delete a custom admin/staff user
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

-- 3. Function to read custom accounts without RLS blocks during login
CREATE OR REPLACE FUNCTION public.get_all_custom_accounts()
RETURNS SETOF public.custom_accounts AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.custom_accounts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Debug function to inspect auth.users table columns and rows
CREATE OR REPLACE FUNCTION public.debug_inspect_auth_user(p_email text)
RETURNS jsonb AS $$
DECLARE
    v_row jsonb;
BEGIN
    SELECT row_to_json(u)::jsonb INTO v_row FROM auth.users u WHERE email = p_email LIMIT 1;
    RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

