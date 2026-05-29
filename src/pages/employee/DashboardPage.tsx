import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAttendance } from '../../hooks/useAttendance'
import { getXPLevel, getStatusLabel, getStatusColor } from '../../lib/xpCalculator'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { motion } from 'framer-motion'
import PageContainer from '../../components/layout/PageContainer'
import {
  Zap,
  Flame,
  Clock,
  CalendarCheck,
  CalendarX,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MapPin,
} from 'lucide-react'
import { supabase } from '../../libs/supabase'

interface MonthlyStats {
  total_hadir: number
  total_terlambat: number
  total_absen: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { todayRecord, fetchTodayRecord } = useAttendance()
  const [stats, setStats] = useState<MonthlyStats>({
    total_hadir: 0,
    total_terlambat: 0,
    total_absen: 0,
  })

  useEffect(() => {
    fetchTodayRecord()
    fetchMonthlyStats()
  }, [fetchTodayRecord])

  const fetchMonthlyStats = async () => {
    if (!profile) return

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const { data } = await supabase
      .from('attendance_records')
      .select('status')
      .eq('user_id', profile.id)
      .gte('check_in_at', startOfMonth)
      .lte('check_in_at', endOfMonth)

    if (data) {
      setStats({
        total_hadir: data.filter((r) => r.status === 'on_time').length,
        total_terlambat: data.filter((r) =>
          ['late_10', 'late_15', 'late_20', 'late_30plus'].includes(r.status)
        ).length,
        total_absen: data.filter((r) => r.status === 'absent').length,
      })
    }
  }

  if (!profile) return null

  const level = getXPLevel(profile.total_xp)
  const nextLevel = getXPLevel(level.maxXP + 1)
  const xpProgress =
    level.maxXP === 99999
      ? 100
      : ((profile.total_xp - level.minXP) / (level.maxXP - level.minXP + 1)) * 100

  const now = new Date()
  const greeting =
    now.getHours() < 12
      ? 'Selamat Pagi'
      : now.getHours() < 17
      ? 'Selamat Siang'
      : 'Selamat Malam'

  const hasCheckedIn = !!todayRecord
  const todayDate = format(now, "EEEE, d MMMM yyyy", { locale: localeId })

  return (
    <PageContainer>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Greeting */}
        <motion.div variants={item}>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">
            {greeting}, <span className="text-gradient">{profile.full_name || 'User'}!</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1 capitalize">{todayDate}</p>
        </motion.div>

        {/* CTA Absen Card */}
        <motion.div variants={item}>
          <div
            className={`glass-card p-6 relative overflow-hidden ${
              hasCheckedIn ? 'border-success/20' : 'border-primary/20'
            }`}
          >
            {/* Decorative gradient */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl" />

            {hasCheckedIn ? (
              /* Already checked in */
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-success-light flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">
                      Sudah Absen Hari Ini
                    </h2>
                    <p className="text-sm text-neutral-500">
                      {format(new Date(todayRecord.check_in_at), 'HH:mm')} WIB
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span
                    className={`badge ${getStatusColor(
                      todayRecord.status as any
                    )}`}
                  >
                    {getStatusLabel(todayRecord.status as any)}
                  </span>
                  <span className="badge bg-primary-50 text-primary">
                    <Zap size={14} />+{todayRecord.xp_earned} XP
                  </span>
                  {todayRecord.distance_meters !== null && (
                    <span className="badge bg-neutral-100 text-neutral-600">
                      <MapPin size={14} />{todayRecord.distance_meters}m
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Not checked in yet */
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-800 mb-1">
                    Belum Absen Hari Ini
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Segera absen untuk mendapatkan XP!
                  </p>
                </div>
                <Link to="/absen">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary text-base px-8 py-4 animate-glow"
                  >
                    <Clock className="w-5 h-5" />
                    Absen Sekarang
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* XP Widget + Streak */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* XP Progress */}
          <motion.div variants={item} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{level.emoji}</span>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800">{level.name}</h3>
                  <p className="text-xs text-neutral-400">Level saat ini</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary font-tabular">
                  {profile.total_xp}
                </p>
                <p className="text-xs text-neutral-400">Total XP</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="xp-bar">
              <motion.div
                className="xp-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-neutral-400 font-tabular">
                {level.minXP} XP
              </span>
              <span className="text-xs text-neutral-400">
                {nextLevel.emoji} {nextLevel.name}
              </span>
              <span className="text-xs text-neutral-400 font-tabular">
                {level.maxXP === 99999 ? '∞' : `${level.maxXP + 1} XP`}
              </span>
            </div>
          </motion.div>

          {/* Streak Counter */}
          <motion.div variants={item} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">Streak</h3>
                <p className="text-xs text-neutral-400">Hari berturut-turut tepat waktu</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <motion.span
                className="text-4xl font-bold text-orange-500 font-tabular"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
              >
                {profile.streak_days}
              </motion.span>
              <span className="text-sm text-neutral-400">hari 🔥</span>
            </div>
            {profile.streak_days >= 5 && (
              <p className="text-xs text-success mt-2 font-medium">
                🎉 {profile.streak_days >= 20
                  ? 'Streak 20 hari! +50 XP Bonus'
                  : profile.streak_days >= 10
                  ? 'Streak 10 hari! +25 XP Bonus'
                  : 'Streak 5 hari! +10 XP Bonus'}
              </p>
            )}
          </motion.div>
        </div>

        {/* Monthly Stats */}
        <motion.div variants={item}>
          <h2 className="text-lg font-semibold text-neutral-800 mb-3">
            Statistik Bulan Ini
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card-sm p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center mx-auto mb-2">
                <CalendarCheck className="w-5 h-5 text-success" />
              </div>
              <p className="text-2xl font-bold text-success font-tabular">
                {stats.total_hadir}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">Tepat Waktu</p>
            </div>

            <div className="glass-card-sm p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-warning-light flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <p className="text-2xl font-bold text-warning font-tabular">
                {stats.total_terlambat}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">Terlambat</p>
            </div>

            <div className="glass-card-sm p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-danger-light flex items-center justify-center mx-auto mb-2">
                <CalendarX className="w-5 h-5 text-danger" />
              </div>
              <p className="text-2xl font-bold text-danger font-tabular">
                {stats.total_absen}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">Absen</p>
            </div>
          </div>
        </motion.div>

        {/* Monthly XP */}
        <motion.div variants={item} className="glass-card-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-light flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800">XP Bulan Ini</p>
              <p className="text-xs text-neutral-400">Reset setiap tanggal 1</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-purple font-tabular">
            {profile.monthly_xp}
          </p>
        </motion.div>
      </motion.div>
    </PageContainer>
  )
}
