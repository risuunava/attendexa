-- ============================================
-- Migration: Add RLS Policies for avatars bucket
-- Run this in Supabase SQL Editor
-- ============================================

-- Pastikan bucket "avatars" sudah ada sebelum menjalankan ini.
-- Jika belum ada, Anda bisa membuatnya lewat Dashboard atau menggunakan query berikut:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Beri akses PUBLIK agar siapa saja bisa MELIHAT/MENGUNDUH foto avatar
CREATE POLICY "Avatars Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- 2. Beri akses pada USER YANG LOGIN untuk MENGUNGGAH foto mereka sendiri
CREATE POLICY "Avatars Insert Access" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- 3. Beri akses pada USER YANG LOGIN untuk MEMPERBARUI foto mereka sendiri
CREATE POLICY "Avatars Update Access" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- 4. Beri akses pada USER YANG LOGIN untuk MENGHAPUS foto mereka sendiri
CREATE POLICY "Avatars Delete Access" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);
