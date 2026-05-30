import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAttendance } from '../../hooks/useAttendance'
import { getXPLevel, getStatusLabel, getStatusColor } from '../../lib/xpCalculator'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
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
  Target,
  LogOut,
  Loader2,
} from 'lucide-react'
import { supabase } from '../../libs/supabase'
import toast from 'react-hot-toast'

interface MonthlyStats {
  total_hadir: number
  total_terlambat: number
  total_absen: number
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { todayRecord, fetchTodayRecord, fetchLocationPoints, locationPoints, submitCheckout, submitting, error: attendanceError } = useAttendance()
  const [stats, setStats] = useState<MonthlyStats>({
    total_hadir: 0,
    total_terlambat: 0,
    total_absen: 0,
  })
  const [checkoutDone, setCheckoutDone] = useState(false)
  const [canCheckout, setCanCheckout] = useState(false)
  const [checkoutTimeStr, setCheckoutTimeStr] = useState('17:00')

  useEffect(() => {
    fetchTodayRecord()
    fetchLocationPoints()
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

  // Check if checkout is possible
  useEffect(() => {
    if (todayRecord && !todayRecord.check_out_at && locationPoints.length > 0) {
      // Find the location point used for check-in
      const locPoint = locationPoints.find(
        (lp: any) => lp.id === (todayRecord as any).location_point_id
      ) || locationPoints[0]

      if (locPoint) {
        const endTime = (locPoint as any).work_end_time || '17:00'
        setCheckoutTimeStr(endTime)
        const [endHour, endMinute] = endTime.split(':').map(Number)
        const now = new Date()
        const workEnd = new Date(now)
        workEnd.setHours(endHour, endMinute, 0, 0)
        setCanCheckout(now >= workEnd)
      }
    }
    if (todayRecord?.check_out_at) {
      setCheckoutDone(true)
    }
  }, [todayRecord, locationPoints])

  // Refresh canCheckout every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (todayRecord && !todayRecord.check_out_at && locationPoints.length > 0) {
        const locPoint = locationPoints.find(
          (lp: any) => lp.id === (todayRecord as any).location_point_id
        ) || locationPoints[0]

        if (locPoint) {
          const endTime = (locPoint as any).work_end_time || '17:00'
          const [endHour, endMinute] = endTime.split(':').map(Number)
          const now = new Date()
          const workEnd = new Date(now)
          workEnd.setHours(endHour, endMinute, 0, 0)
          setCanCheckout(now >= workEnd)
        }
      }
    }, 30000) // check every 30 seconds
    return () => clearInterval(interval)
  }, [todayRecord, locationPoints])

  const handleCheckout = async () => {
    if (!todayRecord || !locationPoints.length) return
    const locPoint = locationPoints.find(
      (lp: any) => lp.id === (todayRecord as any).location_point_id
    ) || locationPoints[0]

    if (!locPoint) return

    const result = await submitCheckout(locPoint as any)
    if (result) {
      setCheckoutDone(true)
      toast.success('Absen pulang berhasil! Selamat beristirahat 👋', { duration: 4000 })
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
  const hasCheckedOut = !!todayRecord?.check_out_at || checkoutDone
  const todayDate = format(now, "EEEE, d MMMM yyyy", { locale: localeId })

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header - Brutalist Typography */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-neutral-800 tracking-tight">
            {greeting}, <span className="text-primary italic">{profile.full_name?.split(' ')[0] || 'User'}</span>.
          </h1>
          <p className="text-sm md:text-base text-neutral-500 mt-2 uppercase tracking-widest font-bold">
            {todayDate}
          </p>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bento Item 1: Main Action (Spans 2 columns on tablet/desktop) */}
          <div className="md:col-span-2">
            <div className={`glass-card p-6 h-full flex flex-col justify-center relative overflow-hidden group ${
              hasCheckedIn ? 'bg-success-light/20 border-success/50' : 'bg-brutalistWhite'
            }`}>
              {hasCheckedIn ? (
                <div className="relative z-10 w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-none border-2 border-neutral-800 bg-success-light shadow-[2px_2px_0px_0px_#1F2937] flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-neutral-800">
                        Sudah Absen Hari Ini
                      </h2>
                      <p className="font-mono text-sm text-neutral-600 mt-1">
                        Pukul {format(new Date(todayRecord.check_in_at), 'HH:mm:ss')} WIB
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <span className={`badge ${getStatusColor(todayRecord.status as any)}`}>
                      {getStatusLabel(todayRecord.status as any)}
                    </span>
                    <span className="badge bg-brutalistYellow text-neutral-900 border-neutral-800 shadow-[2px_2px_0px_0px_#1F2937]">
                      <Zap size={14} className="mr-1 inline" />+{todayRecord.xp_earned} XP
                    </span>
                    {todayRecord.distance_meters !== null && (
                      <span className="badge bg-white text-neutral-800 border-neutral-800">
                        <MapPin size={14} className="mr-1 inline" />{todayRecord.distance_meters}m
                      </span>
                    )}
                  </div>

                  {/* Checkout section */}
                  <div className="mt-6 pt-4 border-t-2 border-neutral-200">
                    {hasCheckedOut ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-none border-2 border-neutral-800 bg-brutalistCyan shadow-[2px_2px_0px_0px_#1F2937] flex items-center justify-center">
                          <LogOut className="w-5 h-5 text-neutral-900" />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-800 text-sm">Sudah Absen Pulang</p>
                          {todayRecord.check_out_at && (
                            <p className="font-mono text-xs text-neutral-500">
                              Pukul {format(new Date(todayRecord.check_out_at), 'HH:mm:ss')} WIB
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-neutral-800 text-sm">Absen Pulang</p>
                          <p className="font-mono text-xs text-neutral-500">
                            Jam pulang: {checkoutTimeStr}
                          </p>
                        </div>
                        <button
                          onClick={handleCheckout}
                          disabled={!canCheckout || submitting}
                          className={`flex items-center gap-2 px-4 py-2 font-bold text-sm border-2 border-neutral-800 transition-all ${
                            canCheckout
                              ? 'bg-brutalistCyan text-neutral-900 hover:shadow-[4px_4px_0px_0px_#1F2937] active:shadow-none'
                              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          }`}
                        >
                          {submitting ? (
                            <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                          ) : canCheckout ? (
                            <><LogOut size={16} /> Absen Pulang</>
                          ) : (
                            <><Clock size={16} /> Belum Waktunya</>
                          )}
                        </button>
                      </div>
                    )}
                    {attendanceError && (
                      <p className="text-danger text-xs font-bold mt-2">{attendanceError}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
                      Belum Absen Hari Ini
                    </h2>
                    <p className="text-neutral-600 font-medium">
                      Jangan sampai terlambat, segera amankan XP kamu hari ini.
                    </p>
                  </div>
                  <Link to="/absen" className="btn-primary whitespace-nowrap text-base px-8 py-4">
                    <Clock className="w-5 h-5" />
                    Absen Sekarang
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Bento Item 2: Streak Card */}
          <div className="glass-card p-6 bg-brutalistYellow/10 flex flex-col justify-center items-center text-center">
            <div className="w-14 h-14 rounded-none border-2 border-neutral-800 bg-brutalistYellow shadow-[4px_4px_0px_0px_#1F2937] flex items-center justify-center mb-4 transform -rotate-3 transition-transform hover:rotate-3">
              <Flame className="w-7 h-7 text-neutral-900" />
            </div>
            <h3 className="font-serif text-xl font-bold text-neutral-800">Streak Harian</h3>
            <div className="flex items-baseline justify-center gap-1.5 mt-2">
              <span className="text-5xl font-bold text-neutral-900 font-tabular tracking-tighter">
                {profile.streak_days}
              </span>
              <span className="font-mono text-sm font-bold text-neutral-600 uppercase">Hari</span>
            </div>
          </div>

          {/* Bento Item 3: Level & XP (Spans 2 columns) */}
          <div className="md:col-span-2 glass-card p-6 flex flex-col justify-center">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-mono text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">
                  Level Saat Ini
                </p>
                <h3 className="font-serif text-3xl font-bold text-neutral-800 flex items-center gap-3">
                  {level.name}
                </h3>
              </div>
              <div className="text-right">
                <p className="font-mono text-3xl font-bold text-primary font-tabular">
                  {profile.total_xp}
                </p>
                <p className="font-mono text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">Total XP</p>
              </div>
            </div>

            <div className="xp-bar mt-2 h-4">
              <div
                className="xp-bar-fill"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-3">
              <span className="font-mono text-xs font-bold text-neutral-500">
                {level.minXP}
              </span>
              <span className="font-serif text-sm font-bold text-neutral-800">
                Next: {nextLevel.name}
              </span>
              <span className="font-mono text-xs font-bold text-neutral-500">
                {level.maxXP === 99999 ? 'MAX' : level.maxXP + 1}
              </span>
            </div>
          </div>

          {/* Bento Item 4: Monthly Target XP */}
          <div className="glass-card p-6 bg-brutalistPink/10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-2 border-neutral-800 bg-brutalistPink flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937]">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-800 uppercase tracking-wider text-sm">XP Bulanan</h3>
                <p className="text-xs text-neutral-500 font-medium">Bulan Ini</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-neutral-900 font-tabular font-mono tracking-tighter">
              {profile.monthly_xp}
            </p>
          </div>

          {/* Bento Item 5: Monthly Stats summary (Spans all 3 cols on desktop) */}
          <div className="md:col-span-3 glass-card p-6 bg-white">
            <h2 className="font-serif text-xl font-bold text-neutral-800 mb-6">
              Statistik Kehadiran Bulan Ini
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="border-2 border-neutral-800 p-4 flex items-center justify-between hover:bg-success-light/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success text-white border-2 border-neutral-800 flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937]">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-neutral-700">Tepat Waktu</p>
                </div>
                <p className="font-mono text-3xl font-bold text-neutral-900">{stats.total_hadir}</p>
              </div>

              <div className="border-2 border-neutral-800 p-4 flex items-center justify-between hover:bg-warning-light/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-warning text-white border-2 border-neutral-800 flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937]">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-neutral-700">Terlambat</p>
                </div>
                <p className="font-mono text-3xl font-bold text-neutral-900">{stats.total_terlambat}</p>
              </div>

              <div className="border-2 border-neutral-800 p-4 flex items-center justify-between hover:bg-danger-light/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-danger text-white border-2 border-neutral-800 flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937]">
                    <CalendarX className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-neutral-700">Absen</p>
                </div>
                <p className="font-mono text-3xl font-bold text-neutral-900">{stats.total_absen}</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
