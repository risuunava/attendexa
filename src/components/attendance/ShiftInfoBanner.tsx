import type { WorkDateResult } from '../../types/shift'

interface ShiftInfoBannerProps {
  workDateResult: WorkDateResult | null
  workDateStr: string | null
}

/**
 * Banner yang menampilkan:
 * - Nama shift aktif (Shift Pagi / Siang / Malam)
 * - Tanggal kerja yang benar (work_date)
 * - Peringatan khusus jika ini shift malam yang melewati tengah malam
 *
 * @example
 * // Karyawan shift malam, absen jam 01:30 tgl 4 Juni
 * // Banner akan tampil: "Shift Malam • Tanggal kerja: Selasa, 3 Juni 2025"
 * // Plus peringatan: "Tanggal kerja mengacu pada awal shift (kemarin)"
 */
export function ShiftInfoBanner({ workDateResult, workDateStr }: ShiftInfoBannerProps) {
  if (!workDateStr) return null

  const shift = workDateResult?.shift
  const isOvernightLate = workDateResult?.is_overnight &&
    new Date().getHours() < 12  // Sedang dini hari, kerja shift malam

  const formattedWorkDate = formatWorkDate(workDateStr)
  const todayStr = formatWorkDate(formatTodayLocal())

  const isWorkDateYesterday = workDateStr !== formatTodayLocal()

  return (
    <div className={`p-4 border-2 border-neutral-900 shadow-[4px_4px_0px_0px_#1F2937] mb-6 flex flex-col gap-3 ${
      isOvernightLate ? 'bg-brutalistYellow/20' : 'bg-brutalistWhite'
    }`}>
      {/* Shift name */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 border-2 border-neutral-900 flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937] shrink-0 ${
          isOvernightLate ? 'bg-warning' : 'bg-primary'
        }`}>
          <span className="text-xl leading-none">{shift ? getShiftEmoji(shift.name) : '📅'}</span>
        </div>
        <div>
          <h3 className="font-black text-neutral-900 uppercase tracking-tight text-lg leading-none">
            {shift ? shift.name : 'Shift tidak terdaftar'}
          </h3>
          {shift && (
            <span className="inline-block mt-2 font-mono text-xs font-bold bg-brutalistYellow px-2 py-0.5 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]">
              {formatTimeRange(shift.start_time, shift.end_time, shift.is_overnight)}
            </span>
          )}
        </div>
      </div>

      {/* Work date */}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <span className="font-bold text-neutral-500 uppercase tracking-widest text-xs">Tanggal kerja:</span>
        <span className={`font-mono font-bold text-sm px-2 py-1 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937] ${
          isWorkDateYesterday ? 'bg-warning text-white' : 'bg-white text-neutral-900'
        }`}>
          {formattedWorkDate}
        </span>
      </div>

      {/* Peringatan shift malam */}
      {isWorkDateYesterday && (
        <div className="mt-2 p-3 border-2 border-neutral-900 bg-warning/20 flex items-start gap-3 shadow-[2px_2px_0px_0px_#1F2937]">
          <p className="text-xs font-bold text-neutral-900 leading-relaxed">
            ⚠️ Kalender saat ini menunjukkan <span className="font-black bg-white px-1 border-b-2 border-neutral-900">{todayStr}</span>, tetapi absensi ini masuk ke tanggal <span className="font-black text-warning bg-white px-1 border-b-2 border-warning">{formattedWorkDate}</span> karena kamu sedang dalam Shift Malam.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────

function formatWorkDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTodayLocal(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTimeRange(startTime: string, endTime: string, isOvernight: boolean): string {
  const start = startTime.slice(0, 5)    // "22:00"
  const end = endTime.slice(0, 5)        // "06:00"
  return isOvernight ? `${start} – ${end}+1` : `${start} – ${end}`
}

function getShiftEmoji(shiftName: string): string {
  const name = shiftName.toLowerCase()
  if (name.includes('pagi')) return '🌅'
  if (name.includes('siang')) return '☀️'
  if (name.includes('malam')) return '🌙'
  return '🕐'
}
