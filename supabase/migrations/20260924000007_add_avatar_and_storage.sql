-- ============================================================
-- Migration: 20260924000007_add_avatar_and_storage.sql
-- Description: Add avatar_url to profiles and setup avatars storage bucket
-- ============================================================

-- 1. Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies for 'avatars' bucket
-- Allow public read access to all avatars
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar."
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar."
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
