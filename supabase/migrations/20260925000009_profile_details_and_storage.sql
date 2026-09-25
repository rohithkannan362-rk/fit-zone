-- ============================================================
-- Migration: 20260925000009_profile_details_and_storage.sql
-- Description: Add full personal and fitness details to profiles and ensure avatars bucket exists
-- ============================================================

-- 1. Ensure personal details and fitness metric columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fitness_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Set up Storage Policies for 'avatars' bucket safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Avatar images are publicly accessible.'
    ) THEN
        CREATE POLICY "Avatar images are publicly accessible."
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'avatars' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own avatar.'
    ) THEN
        CREATE POLICY "Users can upload their own avatar."
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK ( bucket_id = 'avatars' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own avatar.'
    ) THEN
        CREATE POLICY "Users can update their own avatar."
        ON storage.objects FOR UPDATE
        TO authenticated
        USING ( bucket_id = 'avatars' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own avatar.'
    ) THEN
        CREATE POLICY "Users can delete their own avatar."
        ON storage.objects FOR DELETE
        TO authenticated
        USING ( bucket_id = 'avatars' );
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
