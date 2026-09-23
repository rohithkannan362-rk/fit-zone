-- Migration: 20260923000005_update_auth_trigger.sql
-- Description: Make email and mobile nullable in profiles and update auth trigger

-- 1. Make email and mobile nullable
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN mobile DROP NOT NULL;

-- 2. Update the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    mobile,
    role,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Unknown User'),
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'mobile'),
    'member',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
