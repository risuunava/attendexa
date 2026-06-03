export type AttendanceStatus =
  | 'on_time'
  | 'late_10'
  | 'late_15'
  | 'late_20'
  | 'late_30plus'
  | 'absent';

export interface XPResult {
  status: AttendanceStatus;
  xp_earned: number;
  minutes_late: number;
}

/**
 * Calculate XP earned based on check-in time vs work start time.
 * Based on PRD Section 4.1 XP Table.
 *
 * @param checkInTime - The actual check-in Date
 * @param workStartTime - The work start time string (e.g. "08:00")
 * @returns XPResult with status, xp, and minutes late
 */
export function calculateXP(
  checkInTime: Date,
  workStartTime: string = '08:00',
  customStartDateTime?: Date
): XPResult {
  let workStart: Date;
  if (customStartDateTime) {
    workStart = customStartDateTime;
  } else {
    const [startHour, startMinute] = workStartTime.split(':').map(Number);
    workStart = new Date(checkInTime);
    workStart.setHours(startHour, startMinute, 0, 0);
  }

  const diffMs = checkInTime.getTime() - workStart.getTime();
  const minutesLate = Math.max(0, Math.floor(diffMs / 60000));

  if (minutesLate === 0) {
    return { status: 'on_time', xp_earned: 15, minutes_late: 0 };
  } else if (minutesLate <= 10) {
    return { status: 'late_10', xp_earned: 10, minutes_late: minutesLate };
  } else if (minutesLate <= 20) {
    return { status: 'late_15', xp_earned: 5, minutes_late: minutesLate };
  } else if (minutesLate <= 30) {
    return { status: 'late_20', xp_earned: 2, minutes_late: minutesLate };
  } else {
    return { status: 'late_30plus', xp_earned: 0, minutes_late: minutesLate };
  }
}

/**
 * Get the display label for an attendance status.
 */
export function getStatusLabel(status: AttendanceStatus): string {
  const labels: Record<AttendanceStatus, string> = {
    on_time: 'Tepat Waktu',
    late_10: 'Terlambat ≤10 menit',
    late_15: 'Terlambat ≤20 menit',
    late_20: 'Terlambat ≤30 menit',
    late_30plus: 'Terlambat >30 menit',
    absent: 'Tidak Hadir',
  };
  return labels[status];
}

/**
 * Get the color class for a status badge.
 */
export function getStatusColor(status: AttendanceStatus): string {
  const colors: Record<AttendanceStatus, string> = {
    on_time: 'bg-emerald-100 text-emerald-700',
    late_10: 'bg-yellow-100 text-yellow-700',
    late_15: 'bg-orange-100 text-orange-700',
    late_20: 'bg-red-100 text-red-700',
    late_30plus: 'bg-red-200 text-red-800',
    absent: 'bg-red-300 text-red-900',
  };
  return colors[status];
}

/**
 * Get the XP tier/level based on total XP.
 */
export interface XPLevel {
  name: string;
  emoji: string;
  minXP: number;
  maxXP: number;
}

export function getXPLevel(totalXP: number): XPLevel {
  if (totalXP >= 5000) return { name: 'Diamond', emoji: '💠', minXP: 5000, maxXP: 99999 };
  if (totalXP >= 3000) return { name: 'Platinum', emoji: '💎', minXP: 3000, maxXP: 4999 };
  if (totalXP >= 1500) return { name: 'Gold', emoji: '🥇', minXP: 1500, maxXP: 2999 };
  if (totalXP >= 500) return { name: 'Silver', emoji: '🥈', minXP: 500, maxXP: 1499 };
  return { name: 'Bronze', emoji: '🥉', minXP: 0, maxXP: 499 };
}
