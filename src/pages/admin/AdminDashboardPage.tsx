import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import PageContainer from '../../components/layout/PageContainer'
import { format, subDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  Users,
  CalendarCheck,
  Clock,
  TrendingUp,
  FileText,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DashboardStats {
  totalEmployees: number
  todayPresent: number
  pendingLeaves: number
  onTimeRate: number
}

interface DailyAttendance {
  date: string
  label: string
  count: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    todayPresent: 0,
    pendingLeaves: 0,
    onTimeRate: 0,
  })
  const [weeklyData, setWeeklyData] = useState<DailyAttendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)

    // Total employees
    const { count: empCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'employee')

    // Today's attendance
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const { count: todayCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .gte('check_in_at', `${todayStr}T00:00:00`)
      .lte('check_in_at', `${todayStr}T23:59:59`)

    // Pending leaves
    const { count: pendingCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // On-time rate (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
    const { data: recentRecords } = await supabase
      .from('attendance_records')
      .select('status')
      .gte('check_in_at', thirtyDaysAgo)

    const totalRecords = recentRecords?.length || 0
    const onTimeRecords = recentRecords?.filter((r) => r.status === 'on_time').length || 0
    const onTimeRate = totalRecords > 0 ? Math.round((onTimeRecords / totalRecords) * 100) : 0

    setStats({
      totalEmployees: empCount || 0,
      todayPresent: todayCount || 0,
      pendingLeaves: pendingCount || 0,
      onTimeRate,
    })

    // Weekly attendance data (last 7 days)
    const weekly: DailyAttendance[] = []
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i)
      const dayStr = format(day, 'yyyy-MM-dd')
      const { count } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_at', `${dayStr}T00:00:00`)
        .lte('check_in_at', `${dayStr}T23:59:59`)

      weekly.push({
        date: dayStr,
        label: format(day, 'EEE', { locale: localeId }),
        count: count || 0,
      })
    }
    setWeeklyData(weekly)

    setLoading(false)
  }

  const statCards = [
    {
      label: 'Karyawan',
      value: stats.totalEmployees,
      icon: Users,
      bg: 'bg-primary',
      textColor: 'text-white',
    },
    {
      label: 'Hadir Hari Ini',
      value: stats.todayPresent,
      icon: CalendarCheck,
      bg: 'bg-success',
      textColor: 'text-white',
    },
    {
      label: 'Izin Pending',
      value: stats.pendingLeaves,
      icon: Clock,
      bg: 'bg-warning',
      textColor: 'text-white',
    },
    {
      label: 'On-Time Rate',
      value: `${stats.onTimeRate}%`,
      icon: TrendingUp,
      bg: 'bg-brutalistPink',
      textColor: 'text-white',
    },
  ]

  const quickLinks = [
    { label: 'Kelola Karyawan', path: '/admin/karyawan', icon: Users, desc: 'Edit data & role karyawan' },
    { label: 'Rekap Absensi', path: '/admin/absensi', icon: CalendarCheck, desc: 'Lihat data kehadiran' },
    { label: 'Kelola Lokasi', path: '/admin/lokasi', icon: MapPin, desc: 'Atur titik lokasi kantor' },
    { label: 'Review Izin', path: '/admin/izin', icon: FileText, desc: 'Approve/reject pengajuan' },
  ]

  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 h-32 animate-pulse bg-white/40" />
            ))}
          </div>
          <div className="glass-card p-6 h-72 animate-pulse bg-white/40" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Brutalist Typography */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-neutral-800 tracking-tight">
            Admin <span className="text-primary italic">Dashboard</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-500 mt-2 font-mono uppercase tracking-widest font-bold">
            Kelola kehadiran dan data karyawan perusahaan
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Top Row Stat Cards (Spans 1 col each) */}
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="glass-card p-5 flex flex-col justify-between hover:bg-neutral-50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-none border-2 border-neutral-800 ${card.bg} shadow-[2px_2px_0px_0px_#1F2937] flex items-center justify-center shrink-0 mb-4`}>
                  <Icon size={24} className={card.textColor} />
                </div>
                <div>
                  <p className="font-mono text-4xl font-bold text-neutral-900 tracking-tighter">{card.value}</p>
                  <p className="font-bold text-neutral-500 uppercase tracking-wider text-xs mt-1">{card.label}</p>
                </div>
              </div>
            )
          })}

          {/* Chart Section (Spans 3 cols) */}
          <div className="md:col-span-3 glass-card p-6">
            <h2 className="font-serif text-2xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
              <TrendingUp size={24} className="text-primary" />
              Kehadiran 7 Hari Terakhir
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#1F2937', fontWeight: 'bold' }}
                  axisLine={{ stroke: '#1F2937', strokeWidth: 2 }}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#1F2937', fontWeight: 'bold' }}
                  axisLine={{ stroke: '#1F2937', strokeWidth: 2 }}
                  tickLine={false}
                  allowDecimals={false}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '2px solid #1F2937',
                    borderRadius: '0',
                    boxShadow: '4px 4px 0px 0px #1F2937',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                  formatter={(value: any) => [`${value} Karyawan`, 'Hadir']}
                />
                <Bar
                  dataKey="count"
                  fill="#1A56DB"
                  stroke="#1F2937"
                  strokeWidth={2}
                  radius={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Links Section (Spans 1 col) */}
          <div className="md:col-span-1 glass-card p-6 bg-brutalistYellow/10">
            <h2 className="font-serif text-2xl font-bold text-neutral-800 mb-4">Menu Cepat</h2>
            <div className="space-y-3 flex flex-col h-[300px]">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="flex-1 flex items-center gap-3 p-3 bg-white border-2 border-neutral-800 shadow-[2px_2px_0px_0px_#1F2937] hover:shadow-[4px_4px_0px_0px_#1F2937] hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="w-10 h-10 border-2 border-neutral-800 bg-brutalistWhite flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-neutral-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-800">{link.label}</p>
                      <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">{link.desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-neutral-800 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  )
}
