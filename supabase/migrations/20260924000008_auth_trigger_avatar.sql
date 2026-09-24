-- ============================================================
-- Migration: 20260924000008_auth_trigger_avatar.sql
-- Description: Update auth trigger to include avatar_url from OAuth
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    mobile,
    role,
    status,
    avatar_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Unknown User'),
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'mobile'),
    'member',
    'active',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
