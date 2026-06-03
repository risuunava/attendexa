-- ============================================================
-- Migration: Night Shift Support
-- Fix: Attendance reset at 00:00 breaks cross-midnight shifts
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. TABEL SHIFTS — definisi shift kerja
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shifts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,                  -- "Shift Pagi", "Shift Malam"
  start_time   TIME NOT NULL,                  -- "22:00:00"
  end_time     TIME NOT NULL,                  -- "06:00:00"
  is_overnight BOOLEAN NOT NULL DEFAULT FALSE, -- true jika melewati tengah malam
  grace_early  INT NOT NULL DEFAULT 30,        -- menit toleransi absen lebih awal
  grace_late   INT NOT NULL DEFAULT 15,        -- menit toleransi terlambat
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT shifts_name_company_unique UNIQUE (company_id, name)
);

-- ─────────────────────────────────────────────
-- 2. TABEL USER_SHIFTS — jadwal karyawan
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_shifts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shift_id    UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  work_date   DATE NOT NULL,    -- tanggal mulai shift (bukan tanggal jam 00:00 lewat)
  created_at  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT user_shifts_unique UNIQUE (user_id, work_date)
);

-- ─────────────────────────────────────────────
-- 3. ALTER TABEL ATTENDANCE_RECORDS
--    Tambah kolom work_date & shift_id
-- ─────────────────────────────────────────────

-- work_date: tanggal kerja sebenarnya (anchor ke shift_date, bukan calendar date)
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS work_date  DATE,
  ADD COLUMN IF NOT EXISTS shift_id   UUID REFERENCES public.shifts(id);

-- Backfill work_date untuk data lama dari check_in_at timestamp
-- (semua data lama dianggap non-overnight, jadi work_date = tanggal check_in_at)
UPDATE public.attendance_records
SET work_date = (check_in_at AT TIME ZONE 'Asia/Jakarta')::DATE
WHERE work_date IS NULL AND check_in_at IS NOT NULL;

-- Setelah backfill, set NOT NULL
ALTER TABLE public.attendance_records
  ALTER COLUMN work_date SET NOT NULL;

-- Drop old unique constraint
DROP INDEX IF EXISTS idx_attendance_user_day;

-- Create new unique constraint based on work_date
CREATE UNIQUE INDEX idx_attendance_user_work_date
  ON public.attendance_records(user_id, work_date);

CREATE INDEX IF NOT EXISTS idx_attendance_work_date
  ON public.attendance_records(work_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_shifts_user_date
  ON public.user_shifts(user_id, work_date DESC);

-- ─────────────────────────────────────────────
-- 4. DATABASE FUNCTION: get_work_date()
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_work_date(
  p_user_id UUID,
  p_check_in    TIMESTAMPTZ
)
RETURNS DATE
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_shift_record  RECORD;
  v_check_in_local TIMESTAMPTZ;
  v_check_in_hour  INT;
  v_today          DATE;
  v_yesterday      DATE;
BEGIN
  -- Konversi ke timezone lokal (WIB = UTC+7)
  v_check_in_local := p_check_in AT TIME ZONE 'Asia/Jakarta';
  v_check_in_hour  := EXTRACT(HOUR FROM v_check_in_local);
  v_today          := v_check_in_local::DATE;
  v_yesterday      := v_today - INTERVAL '1 day';

  -- Cek apakah karyawan punya jadwal shift untuk hari ini atau kemarin
  -- Window ±1 hari untuk menangkap shift overnight
  SELECT s.*
  INTO v_shift_record
  FROM public.user_shifts es
  JOIN public.shifts s ON s.id = es.shift_id
  WHERE es.user_id = p_user_id
    AND es.work_date IN (v_today, v_yesterday)
    AND s.is_overnight = TRUE
  ORDER BY es.work_date DESC
  LIMIT 1;

  -- Jika ada shift overnight aktif
  IF FOUND THEN
    -- Shift malam biasanya mulai sore/malam dan berakhir dini hari
    -- Jika check_in_at dilakukan antara 00:00-11:59 → masih bagian shift malam KEMARIN
    IF v_check_in_hour < 12 THEN
      RETURN v_yesterday;
    END IF;
    RETURN v_today;
  END IF;

  -- Fallback: tidak ada jadwal shift terdaftar
  -- Gunakan heuristic: jam 00:00–05:59 = masih bagian malam sebelumnya
  IF v_check_in_hour < 6 THEN
    RETURN v_yesterday;
  END IF;

  RETURN v_today;
END;
$$;

-- ─────────────────────────────────────────────
-- 5. DATABASE FUNCTION: has_checked_in_today()
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_checked_in_today(
  p_user_id UUID,
  p_work_date   DATE
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.attendance_records
    WHERE user_id = p_user_id
      AND work_date = p_work_date
      AND check_out_at IS NULL
  );
$$;

-- ─────────────────────────────────────────────
-- 6. RLS POLICIES
-- ─────────────────────────────────────────────
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shifts ENABLE ROW LEVEL SECURITY;

-- Shifts: hanya admin yang bisa CRUD, semua employee bisa READ
CREATE POLICY "shifts_read_all" ON public.shifts
  FOR SELECT USING (true);

CREATE POLICY "shifts_admin_write" ON public.shifts
  FOR ALL USING ( public.get_my_role() IN ('admin', 'boss') );

-- User shifts: karyawan hanya bisa lihat jadwal miliknya
CREATE POLICY "user_shifts_own" ON public.user_shifts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_shifts_admin_write" ON public.user_shifts
  FOR ALL USING ( public.get_my_role() IN ('admin', 'boss') );
