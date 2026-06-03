// ─────────────────────────────────────────────────────────
// types/shift.ts — Type definitions untuk night shift support
// ─────────────────────────────────────────────────────────

export interface Shift {
  id: string
  company_id: string
  name: string
  start_time: string      // "22:00:00"
  end_time: string        // "06:00:00"
  is_overnight: boolean
  grace_early: number     // menit toleransi absen lebih awal
  grace_late: number      // menit toleransi terlambat
  created_at: string
  updated_at: string
}

export interface UserShift {
  id: string
  user_id: string
  shift_id: string
  work_date: string       // "2025-06-03" — tanggal MULAI shift
  created_at: string
  shift?: Shift           // joined
}

export interface Attendance {
  id: string
  user_id: string
  work_date: string       // KEY FIELD: tanggal kerja (bukan calendar date)
  shift_id: string | null
  check_in: string        // ISO timestamp
  check_out: string | null
  check_in_photo: string | null
  check_out_photo: string | null
  location_lat: number | null
  location_lng: number | null
  status: AttendanceStatus
  xp_earned: number
  notes: string | null
  created_at: string
}

export type AttendanceStatus = 'on_time' | 'late' | 'early_leave' | 'absent'

export interface WorkDateResult {
  work_date: Date
  is_overnight: boolean       // apakah ini bagian dari shift malam sebelumnya
  shift: Shift | null
  shift_window: {
    start: Date               // waktu mulai shift (adjusted ke hari yang benar)
    end: Date                 // waktu selesai shift
  } | null
}

export interface CheckInPayload {
  user_id: string
  work_date: string           // "YYYY-MM-DD"
  shift_id: string | null
  check_in: string            // ISO timestamp
  check_in_photo: string | null
  location_lat: number | null
  location_lng: number | null
  status: AttendanceStatus
  xp_earned: number
}

export interface CheckOutPayload {
  check_out: string
  check_out_photo: string | null
}
