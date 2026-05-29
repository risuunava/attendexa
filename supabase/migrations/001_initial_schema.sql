-- ============================================
-- Attendexa — Initial Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create Custom Enum Types
CREATE TYPE user_role AS ENUM ('employee', 'admin', 'boss');

CREATE TYPE attendance_status AS ENUM (
  'on_time',
  'late_10',
  'late_15',
  'late_20',
  'late_30plus',
  'absent'
);

CREATE TYPE leave_type AS ENUM ('sick', 'annual_leave', 'permit', 'wfh');

CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Create `users` table (extends auth.users)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name varchar(100) NOT NULL DEFAULT '',
  employee_id varchar(20) UNIQUE,
  role user_role NOT NULL DEFAULT 'employee',
  department varchar(50),
  avatar_url text,
  total_xp integer NOT NULL DEFAULT 0,
  monthly_xp integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create `location_points` table
CREATE TABLE public.location_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  latitude decimal(10,8) NOT NULL,
  longitude decimal(11,8) NOT NULL,
  radius_meters integer NOT NULL DEFAULT 100,
  work_start_time time NOT NULL DEFAULT '08:00',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create `attendance_records` table
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  photo_url text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  distance_meters integer,
  status attendance_status NOT NULL DEFAULT 'on_time',
  minutes_late integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  location_point_id uuid REFERENCES public.location_points(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent double attendance per user per day
CREATE UNIQUE INDEX idx_attendance_user_day
  ON public.attendance_records (user_id, ((check_in_at AT TIME ZONE 'UTC')::date));

-- 5. Create `leave_requests` table
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  attachment_url text,
  status leave_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.users(id),
  xp_impact integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 6. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Create a function to safely check role without causing infinite recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- --- USERS policies ---
-- Everyone authenticated can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Admin and boss can view all users
CREATE POLICY "Admin/Boss can view all users"
  ON public.users FOR SELECT
  USING ( public.get_my_role() IN ('admin', 'boss') );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can update any user
CREATE POLICY "Admin can update any user"
  ON public.users FOR UPDATE
  USING ( public.get_my_role() = 'admin' );

-- Allow insert for new user trigger
CREATE POLICY "Allow insert for auth trigger"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- --- ATTENDANCE_RECORDS policies ---
-- Employees see own records
CREATE POLICY "Employees view own attendance"
  ON public.attendance_records FOR SELECT
  USING (auth.uid() = user_id);

-- Admin/Boss see all records
CREATE POLICY "Admin/Boss view all attendance"
  ON public.attendance_records FOR SELECT
  USING ( public.get_my_role() IN ('admin', 'boss') );

-- Employees can insert own records
CREATE POLICY "Employees insert own attendance"
  ON public.attendance_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Employees can update own records (for check-out)
CREATE POLICY "Employees update own attendance"
  ON public.attendance_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --- LOCATION_POINTS policies ---
-- Everyone authenticated can read active location points
CREATE POLICY "All authenticated read location_points"
  ON public.location_points FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admin can insert/update/delete location points
CREATE POLICY "Admin manage location_points"
  ON public.location_points FOR ALL
  USING ( public.get_my_role() = 'admin' );

-- --- LEAVE_REQUESTS policies ---
-- Employees see own leave requests
CREATE POLICY "Employees view own leave_requests"
  ON public.leave_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admin/Boss see all leave requests
CREATE POLICY "Admin/Boss view all leave_requests"
  ON public.leave_requests FOR SELECT
  USING ( public.get_my_role() IN ('admin', 'boss') );

-- Employees insert own leave requests
CREATE POLICY "Employees insert own leave_requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can update leave requests (approve/reject)
CREATE POLICY "Admin update leave_requests"
  ON public.leave_requests FOR UPDATE
  USING ( public.get_my_role() = 'admin' );

-- ============================================
-- 7. Auto-create user profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Employee'),
    'employee'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. Create Storage bucket for attendance photos
-- ============================================
-- NOTE: Run this separately or create via Supabase Dashboard:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('attendance-photos', 'attendance-photos', true);

-- ============================================
-- 9. Seed data: sample location point
-- ============================================
INSERT INTO public.location_points (name, latitude, longitude, radius_meters, work_start_time)
VALUES ('Kantor Pusat Jakarta', -6.20000000, 106.84500000, 100, '08:00');
