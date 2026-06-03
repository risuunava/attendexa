// ─────────────────────────────────────────────────────────
// lib/workDate.test.ts — Unit tests untuk logika getWorkDate
// Jalankan dengan: npx vitest run src/lib/workDate.test.ts
// ─────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { getWorkDate, formatDateLocal, calculateLatenessStatus } from '././././workDate'
import type { UserShift } from '../types/shift'

// ── Mock Data ─────────────────────────────────────────────

const nightShift: UserShift = {
  id: 'shift-1',
  user_id: 'emp-1',
  shift_id: 'night-1',
  work_date: '2025-06-03',
  created_at: new Date().toISOString(),
  shift: {
    id: 'night-1',
    company_id: 'co-1',
    name: 'Shift Malam',
    start_time: '23:00:00',
    end_time: '07:00:00',
    is_overnight: true,
    grace_early: 30,
    grace_late: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

const dayShift: UserShift = {
  id: 'shift-2',
  user_id: 'emp-1',
  shift_id: 'day-1',
  work_date: '2025-06-03',
  created_at: new Date().toISOString(),
  shift: {
    id: 'day-1',
    company_id: 'co-1',
    name: 'Shift Pagi',
    start_time: '07:00:00',
    end_time: '15:00:00',
    is_overnight: false,
    grace_early: 30,
    grace_late: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// ── Helper: buat Date WIB ─────────────────────────────────
// Date string dalam WIB (UTC+7)
function wib(dateStr: string): Date {
  // "2025-06-04T01:30:00" → interpret as WIB
  return new Date(dateStr + '+07:00')
}

// ─────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────

describe('getWorkDate — Shift Malam (overnight)', () => {

  it('check-in jam 23:30 tgl 3 Juni → work_date = 3 Juni', () => {
    const checkIn = wib('2025-06-03T23:30:00')
    const result = getWorkDate(checkIn, nightShift)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-03')
    expect(result.is_overnight).toBe(true)
  })

  it('check-in jam 00:30 tgl 4 Juni (dini hari) → work_date = 3 Juni (kemarin)', () => {
    // INI KASUS BUG-NYA: tanpa fix, sistem akan return 4 Juni
    const checkIn = wib('2025-06-04T00:30:00')
    const result = getWorkDate(checkIn, nightShift)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-03')  // ← harus kemarin
    expect(result.is_overnight).toBe(true)
  })

  it('check-in jam 06:30 tgl 4 Juni (hampir subuh) → work_date = 3 Juni', () => {
    const checkIn = wib('2025-06-04T06:30:00')
    const result = getWorkDate(checkIn, nightShift)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-03')
  })

  it('check-in jam 11:30 tgl 4 Juni (siang) → work_date = 3 Juni', () => {
    // Masih di bawah threshold 12:00
    const checkIn = wib('2025-06-04T11:30:00')
    const result = getWorkDate(checkIn, nightShift)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-03')
  })

  it('check-in jam 12:00 tgl 4 Juni (tepat tengah hari) → work_date = 4 Juni', () => {
    // Jam 12 ke atas dianggap shift baru
    const checkIn = wib('2025-06-04T12:00:00')
    const result = getWorkDate(checkIn, nightShift)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-04')
  })

})

describe('getWorkDate — Shift Pagi (non-overnight)', () => {

  it('check-in jam 07:00 → work_date = hari ini', () => {
    const checkIn = wib('2025-06-03T07:00:00')
    const result = getWorkDate(checkIn, dayShift)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-03')
    expect(result.is_overnight).toBe(false)
  })

  it('check-in jam 07:30 (terlambat 30 menit) → work_date = hari ini', () => {
    const checkIn = wib('2025-06-03T07:30:00')
    const result = getWorkDate(checkIn, dayShift)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-03')
  })

})

describe('getWorkDate — Tanpa jadwal shift (heuristic fallback)', () => {

  it('check-in jam 08:00 tanpa shift → work_date = hari ini', () => {
    const checkIn = wib('2025-06-03T08:00:00')
    const result = getWorkDate(checkIn, null)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-03')
    expect(result.shift).toBeNull()
  })

  it('check-in jam 02:00 tanpa shift → work_date = kemarin (heuristic)', () => {
    const checkIn = wib('2025-06-04T02:00:00')
    const result = getWorkDate(checkIn, null)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-03')
  })

  it('check-in jam 05:59 tanpa shift → work_date = kemarin', () => {
    const checkIn = wib('2025-06-04T05:59:00')
    const result = getWorkDate(checkIn, null)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-03')
  })

  it('check-in jam 06:00 tanpa shift → work_date = hari ini', () => {
    const checkIn = wib('2025-06-04T06:00:00')
    const result = getWorkDate(checkIn, null)
    expect(formatDateLocal(result.work_date)).toBe('2025-06-04')
  })

})

describe('calculateLatenessStatus', () => {

  it('absen masuk 5 menit sebelum shift → on_time (dalam grace_early)', () => {
    const checkIn = wib('2025-06-03T22:55:00')    // 5 mnt sebelum 23:00
    const workDateResult = getWorkDate(checkIn, nightShift)
    const result = calculateLatenessStatus(checkIn, workDateResult)
    expect(result.status).toBe('on_time')
  })

  it('absen masuk 20 menit terlambat → late', () => {
    const checkIn = wib('2025-06-03T23:20:00')    // 20 mnt setelah 23:00
    const workDateResult = getWorkDate(checkIn, nightShift)
    const result = calculateLatenessStatus(checkIn, workDateResult)
    expect(result.status).toBe('late')
    if (result.status === 'late') {
      expect(result.minutesLate).toBe(20)
    }
  })

  it('absen masuk tepat waktu → on_time', () => {
    const checkIn = wib('2025-06-03T23:00:00')
    const workDateResult = getWorkDate(checkIn, nightShift)
    const result = calculateLatenessStatus(checkIn, workDateResult)
    expect(result.status).toBe('on_time')
  })

})

describe('formatDateLocal', () => {
  it('format date object ke YYYY-MM-DD', () => {
    const date = new Date('2025-06-03T00:00:00')
    expect(formatDateLocal(date)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
