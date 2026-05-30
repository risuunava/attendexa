-- ============================================
-- Migration: Allow employees to read other employees
-- for leaderboard functionality
-- Run this in Supabase SQL Editor
-- ============================================

-- Ganti policy lama yang hanya izinkan lihat diri sendiri
-- dengan policy baru yang izinkan semua authenticated user
-- membaca data semua user (untuk leaderboard)

-- Hapus policy lama
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Buat policy baru: semua authenticated user bisa baca semua profil
CREATE POLICY "Authenticated users can view all profiles"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');
