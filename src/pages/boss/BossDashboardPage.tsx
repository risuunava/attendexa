import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import PageContainer from '../../components/layout/PageContainer'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getXPLevel } from '../../lib/xpCalculator'

interface DashboardStats {
  totalEmployees: number
  avgXP: number
  onTimeRate: number
  activeLocations: number
}

interface MonthlyTrend {
  date: string
  label: string
  present: number
}

interface LeaderboardPreview {
  id: string
  full_name: string
  department: string | null
  total_xp: number
}

export default function BossDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    avgXP: 0,
    onTimeRate: 0,
    activeLocations: 0,
  })
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([])
  const [topEmployees, setTopEmployees] = useState<LeaderboardPreview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)

    // Total employees & avg XP
    const { data: usersData } = await supabase
      .from('users')
      .select('total_xp')
      .eq('role', 'employee')
    
    const empCount = usersData?.length || 0
    const totalXP = usersData?.reduce((acc, curr) => acc + (curr.total_xp || 0), 0) || 0
    const avgXP = empCount > 0 ? Math.round(totalXP / empCount) : 0

    // On-time rate (current month)
    const monthStart = startOfMonth(new Date()).toISOString()
    const monthEnd = endOfMonth(new Date()).toISOString()
    const { data: monthRecords } = await supabase
      .from('attendance_records')
      .select('status')
      .gte('check_in_at', monthStart)
      .lte('check_in_at', monthEnd)

    const totalRecords = monthRecords?.length || 0
    const onTimeRecords = monthRecords?.filter((r) => r.status === 'on_time').length || 0
    const onTimeRate = totalRecords > 0 ? Math.round((onTimeRecords / totalRecords) * 100) : 0

    // Active locations
    const { count: locCount } = await supabase
      .from('location_points')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    setStats({
      totalEmployees: empCount,
      avgXP,
      onTimeRate,
      activeLocations: locCount || 0,
    })

    // Trend data (last 14 days)
    const trend: MonthlyTrend[] = []
    for (let i = 13; i >= 0; i--) {
      const day = subDays(new Date(), i)
      const dayStr = format(day, 'yyyy-MM-dd')
      const { count } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_at', `${dayStr}T00:00:00`)
        .lte('check_in_at', `${dayStr}T23:59:59`)

      trend.push({
        date: dayStr,
        label: format(day, 'dd MMM', { locale: localeId }),
        present: count || 0,
      })
    }
    setTrendData(trend)

    // Top 5 Leaderboard
    const { data: topUsers } = await supabase
      .from('users')
      .select('id, full_name, department, total_xp')
      .eq('role', 'employee')
      .order('total_xp', { ascending: false })
      .limit(5)

    if (topUsers) {
      setTopEmployees(topUsers as LeaderboardPreview[])
    }

    setLoading(false)
  }

  const statCards = [
    {
      label: 'Total Karyawan',
      value: stats.totalEmployees,
      icon: Users,
      bg: 'bg-primary',
      textColor: 'text-white',
    },
    {
      label: 'Rata-rata XP',
      value: stats.avgXP,
      icon: Zap,
      bg: 'bg-brutalistYellow',
      textColor: 'text-neutral-900',
    },
    {
      label: '% On-Time',
      value: `${stats.onTimeRate}%`,
      icon: CalendarCheck,
      bg: 'bg-brutalistCyan',
      textColor: 'text-neutral-900',
    },
    {
      label: 'Lokasi Aktif',
      value: stats.activeLocations,
      icon: TrendingUp,
      bg: 'bg-brutalistPink',
      textColor: 'text-white',
    },
  ]

  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 h-32 animate-pulse bg-white/40" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="glass-card p-6 h-80 lg:col-span-2 animate-pulse bg-white/40" />
            <div className="glass-card p-6 h-80 animate-pulse bg-white/40" />
          </div>
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
            Boss <span className="text-primary italic">Dashboard</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-500 mt-2 font-mono uppercase tracking-widest font-bold">
            Ringkasan performa dan kehadiran karyawan
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

          {/* Trend Chart (Spans 3 cols) */}
          <div className="md:col-span-3 glass-card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-bold text-neutral-800 flex items-center gap-2">
                <TrendingUp size={24} className="text-primary" />
                Trend Kehadiran (14 Hari Terakhir)
              </h2>
              <Link to="/boss/analytics" className="text-sm font-bold border-b-2 border-primary text-primary hover:text-primary-700 hover:border-primary-700 flex items-center transition-colors">
                Detail Analytics <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#1F2937', fontWeight: 'bold' }}
                    axisLine={{ stroke: '#1F2937', strokeWidth: 2 }}
                    tickLine={false}
                    minTickGap={20}
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
                    cursor={{ stroke: '#1F2937', strokeWidth: 2, strokeDasharray: '4 4' }}
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '2px solid #1F2937',
                      borderRadius: '0',
                      boxShadow: '4px 4px 0px 0px #1F2937',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    name="Hadir"
                    stroke="#1A56DB"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leaderboard Preview (Spans 1 col) */}
          <div className="md:col-span-1 glass-card p-6 flex flex-col bg-brutalistPink/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-bold text-neutral-800 flex items-center gap-2">
                <Award size={24} className="text-primary" />
                Top Karyawan
              </h2>
            </div>

            <div className="flex-1 space-y-4">
              {topEmployees.map((emp, idx) => {
                const level = getXPLevel(emp.total_xp)
                return (
                  <div key={emp.id} className="flex items-center gap-3 p-2 hover:bg-white border-2 border-transparent hover:border-neutral-800 hover:shadow-[2px_2px_0px_0px_#1F2937] transition-all group">
                    <div className="w-8 h-8 rounded-none border-2 border-neutral-800 bg-white flex items-center justify-center text-sm font-bold text-neutral-800 shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-neutral-800 text-sm truncate group-hover:text-primary transition-colors">
                        {emp.full_name}
                      </p>
                      <p className="text-xs font-mono font-medium text-neutral-500 truncate">
                        {level.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold font-mono text-neutral-900">
                        {emp.total_xp}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <Link to="/boss/leaderboard" className="mt-6 text-sm font-bold text-center border-2 border-neutral-800 p-3 hover:bg-neutral-800 hover:text-white transition-colors uppercase tracking-widest">
              Lihat Semua Peringkat
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
