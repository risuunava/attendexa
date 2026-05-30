-- ============================================
-- Migration: Add work_end_time to location_points
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE public.location_points
ADD COLUMN work_end_time time NOT NULL DEFAULT '17:00';
