// ─────────────────────────────────────────────────────────
// lib/workDate.ts — Logika utama penentuan work_date
// untuk mengatasi absen shift malam yang melewati jam 00:00
// ─────────────────────────────────────────────────────────

import type { Shift, UserShift, WorkDateResult } from '../types/shift'

// Timezone default: WIB (UTC+7). Sesuaikan jika perusahaan di WITA/WIT.
const DEFAULT_TIMEZONE = 'Asia/Jakarta'

/**
 * Format tanggal ke string "YYYY-MM-DD" tanpa konversi timezone.
 * Aman digunakan untuk perbandingan work_date di database.
 */
export function formatDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parse "HH:MM:SS" atau "HH:MM" ke {hours, minutes, seconds}
 */
function parseTimeString(time: string): { hours: number; minutes: number; seconds: number } {
  const parts = time.split(':').map(Number)
  return {
    hours: parts[0] ?? 0,
    minutes: parts[1] ?? 0,
    seconds: parts[2] ?? 0,
  }
}

/**
 * Buat Date object dari date + time string, dalam timezone lokal.
 * Misalnya: baseDate = "2025-06-03", timeStr = "22:00:00"
 * → Date yang merepresentasikan 2025-06-03 22:00:00 WIB
 */
function buildDateTimeLocal(baseDate: Date, timeStr: string, timezone = DEFAULT_TIMEZONE): Date {
  const { hours, minutes, seconds } = parseTimeString(timeStr)
  // Gunakan Intl untuk mendapatkan komponen tanggal lokal yang benar
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const localDateStr = formatter.format(baseDate) // "2025-06-03"
  return new Date(`${localDateStr}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`)
}

/**
 * Dapatkan jam lokal (0–23) dari sebuah Date dalam timezone tertentu.
 */
function getLocalHour(date: Date, timezone = DEFAULT_TIMEZONE): number {
  return parseInt(
    new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(date),
    10
  )
}

/**
 * Dapatkan tanggal lokal sebagai Date (jam 00:00:00 lokal)
 */
function getLocalDate(date: Date, timezone = DEFAULT_TIMEZONE): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return new Date(formatter.format(date))
}

// ─────────────────────────────────────────────────────────
// FUNGSI UTAMA: getWorkDate
// ─────────────────────────────────────────────────────────

/**
 * Tentukan work_date yang benar untuk absensi, dengan memperhitungkan shift malam.
 *
 * LOGIKA:
 * - Jika karyawan punya shift OVERNIGHT terdaftar → cek apakah check_in masuk
 *   dalam window shift malam kemarin atau shift hari ini.
 * - Jika tidak ada jadwal shift → gunakan heuristic: jam 00:00–05:59 = kemarin.
 *
 * @param checkInTime  - Waktu check-in (Date object, bisa UTC)
 * @param employeeShift - Jadwal shift karyawan (bisa null jika tidak ada)
 * @returns WorkDateResult dengan work_date yang sudah benar
 *
 * @example
 * // Karyawan shift malam (23:00–07:00), absen masuk jam 23:30 tgl 3 Juni
 * getWorkDate(new Date('2025-06-03T23:30:00+07:00'), nightShift)
 * // → { work_date: Date('2025-06-03'), is_overnight: true }
 *
 * @example
 * // Karyawan shift malam (23:00–07:00), absen pulang jam 06:30 tgl 4 Juni
 * getWorkDate(new Date('2025-06-04T06:30:00+07:00'), nightShift)
 * // → { work_date: Date('2025-06-03'), is_overnight: true }  ← masih tgl 3!
 */
export function getWorkDate(
  checkInTime: Date,
  userShift: UserShift | null,
  timezone = DEFAULT_TIMEZONE
): WorkDateResult {
  const localHour = getLocalHour(checkInTime, timezone)
  const today = getLocalDate(checkInTime, timezone)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // ── Skenario 1: Ada jadwal shift terdaftar ──────────────────
  if (userShift?.shift) {
    const shift = userShift.shift

    if (shift.is_overnight) {
      // Shift overnight: tentukan apakah ini bagian dari shift kemarin
      // Ambang batas = tengah hari (12:00) sebagai pemisah
      // - Absen masuk 23:00+ → work_date = hari ini
      // - Absen masuk 00:00–11:59 → work_date = kemarin (masih lanjutan shift malam)
      const midpointHour = 12

      if (localHour < midpointHour) {
        // Dini hari → bagian dari shift yang dimulai kemarin
        return {
          work_date: yesterday,
          is_overnight: true,
          shift,
          shift_window: buildShiftWindow(yesterday, shift),
        }
      } else {
        // Malam → shift yang dimulai hari ini
        return {
          work_date: today,
          is_overnight: true,
          shift,
          shift_window: buildShiftWindow(today, shift),
        }
      }
    }

    // Shift regular (tidak overnight)
    return {
      work_date: today,
      is_overnight: false,
      shift,
      shift_window: buildShiftWindow(today, shift),
    }
  }

  // ── Skenario 2: Tidak ada jadwal shift (heuristic) ──────────
  // Jam 00:00–05:59 dianggap masih malam sebelumnya
  if (localHour < 6) {
    return {
      work_date: yesterday,
      is_overnight: false,
      shift: null,
      shift_window: null,
    }
  }

  return {
    work_date: today,
    is_overnight: false,
    shift: null,
    shift_window: null,
  }
}

/**
 * Bangun window waktu shift (start–end sebagai Date objects)
 * untuk validasi "absen dalam rentang waktu yang valid"
 */
function buildShiftWindow(
  workDate: Date,
  shift: Shift
): WorkDateResult['shift_window'] {
  const start = buildDateTimeLocal(workDate, shift.start_time)

  let end: Date
  if (shift.is_overnight) {
    // end date = workDate + 1 hari
    const nextDay = new Date(workDate)
    nextDay.setDate(nextDay.getDate() + 1)
    end = buildDateTimeLocal(nextDay, shift.end_time)
  } else {
    end = buildDateTimeLocal(workDate, shift.end_time)
  }

  return { start, end }
}

// ─────────────────────────────────────────────────────────
// HELPER: Tentukan status absensi (tepat waktu / terlambat)
// ─────────────────────────────────────────────────────────

export type LatenessResult =
  | { status: 'on_time'; minutesLate: 0 }
  | { status: 'late'; minutesLate: number }
  | { status: 'early'; minutesEarly: number }
  | { status: 'no_shift'; minutesLate: 0 }

/**
 * Hitung status keterlambatan berdasarkan jadwal shift.
 * Memperhitungkan grace period (toleransi).
 */
export function calculateLatenessStatus(
  checkInTime: Date,
  workDateResult: WorkDateResult
): LatenessResult {
  if (!workDateResult.shift || !workDateResult.shift_window) {
    return { status: 'no_shift', minutesLate: 0 }
  }

  const shift = workDateResult.shift
  const shiftStart = workDateResult.shift_window.start
  const diffMs = checkInTime.getTime() - shiftStart.getTime()
  const diffMinutes = Math.round(diffMs / 60_000)

  if (diffMinutes < -shift.grace_early) {
    // Terlalu awal (lebih dari grace_early menit sebelum shift)
    return { status: 'early', minutesEarly: Math.abs(diffMinutes) }
  }

  if (diffMinutes <= shift.grace_late) {
    // Dalam toleransi → tepat waktu
    return { status: 'on_time', minutesLate: 0 }
  }

  // Terlambat
  return { status: 'late', minutesLate: diffMinutes }
}

/**
 * Hitung XP berdasarkan status absensi.
 * Sesuaikan nilai XP dengan sistem gamifikasi Attendexa.
 */
export function calculateXP(lateness: LatenessResult, hasStreak: boolean): number {
  const BASE_XP: Record<string, number> = {
    on_time: 100,
    late: 40,
    early: 70,   // hadir awal tetap dapat XP, tapi lebih sedikit dari on_time
    no_shift: 80,
  }
  const STREAK_BONUS = 20

  const base = BASE_XP[lateness.status] ?? 50
  const streakBonus = hasStreak && lateness.status === 'on_time' ? STREAK_BONUS : 0
  return base + streakBonus
}
